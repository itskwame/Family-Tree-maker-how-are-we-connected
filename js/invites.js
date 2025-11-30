import { supabase } from './supabase-config.js';

export async function generateInviteLink(familyMemberId = null, message = null) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('invitations')
            .insert({
                sender_id: user.id,
                family_member_id: familyMemberId,
                message: message
            })
            .select()
            .single();

        if (error) throw error;

        const inviteUrl = `${window.location.origin}/auth/signup.html?invite=${data.invite_code}`;
        return { success: true, inviteUrl, inviteCode: data.invite_code };
    } catch (error) {
        console.error('Error generating invite:', error);
        return { success: false, error: error.message };
    }
}

export async function sendEmailInvite(email, familyMemberId = null, message = null) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('invitations')
            .insert({
                sender_id: user.id,
                recipient_email: email,
                family_member_id: familyMemberId,
                message: message
            })
            .select()
            .single();

        if (error) throw error;

        const inviteUrl = `${window.location.origin}/auth/signup.html?invite=${data.invite_code}`;

        return {
            success: true,
            inviteUrl,
            inviteCode: data.invite_code,
            message: 'Invite created! Share this link with your family member.'
        };
    } catch (error) {
        console.error('Error sending invite:', error);
        return { success: false, error: error.message };
    }
}

export async function acceptInvite(inviteCode) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: invitation, error: fetchError } = await supabase
            .from('invitations')
            .select('*')
            .eq('invite_code', inviteCode)
            .eq('status', 'pending')
            .single();

        if (fetchError) throw fetchError;
        if (!invitation) throw new Error('Invalid or expired invitation');

        if (new Date(invitation.expires_at) < new Date()) {
            throw new Error('This invitation has expired');
        }

        const { error: updateError } = await supabase
            .from('invitations')
            .update({
                status: 'accepted',
                accepted_at: new Date().toISOString()
            })
            .eq('id', invitation.id);

        if (updateError) throw updateError;

        if (invitation.family_member_id) {
            const { error: linkError } = await supabase
                .from('family_members')
                .update({ user_id: user.id })
                .eq('id', invitation.family_member_id);

            if (linkError) console.error('Error linking family member:', linkError);
        }

        await createNotification(
            invitation.sender_id,
            user.id,
            'invitation_accepted',
            'Invitation Accepted',
            'Someone accepted your family tree invitation!'
        );

        return { success: true, invitation };
    } catch (error) {
        console.error('Error accepting invite:', error);
        return { success: false, error: error.message };
    }
}

export async function createNotification(userId, actorId, type, title, message, link = null) {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                actor_id: actorId,
                type: type,
                title: title,
                message: message,
                link: link
            });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
}

export async function getUnreadNotifications() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: true, notifications: [], count: 0 };

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return { success: true, notifications: data || [], count: data?.length || 0 };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: error.message };
    }
}

export async function markNotificationAsRead(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error: error.message };
    }
}
