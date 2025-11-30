import { supabase } from './supabase-config.js';

let notificationInterval = null;

export async function initNotifications() {
    await updateNotificationBell();

    notificationInterval = setInterval(async () => {
        await updateNotificationBell();
    }, 30000);
}

export async function updateNotificationBell() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const bellElement = document.getElementById('notificationBell');
        const badgeElement = document.getElementById('notificationBadge');

        if (bellElement && badgeElement) {
            const count = data?.length || 0;
            if (count > 0) {
                badgeElement.textContent = count > 9 ? '9+' : count;
                badgeElement.style.display = 'flex';
            } else {
                badgeElement.style.display = 'none';
            }
        }

        return { success: true, count: data?.length || 0, notifications: data };
    } catch (error) {
        console.error('Error updating notifications:', error);
        return { success: false, error: error.message };
    }
}

export async function showNotificationPanel() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: notifications } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        const panel = document.getElementById('notificationPanel');
        const list = document.getElementById('notificationList');

        if (!notifications || notifications.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 32px; color: #718096;">No notifications</div>';
        } else {
            list.innerHTML = notifications.map(notif => `
                <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="handleNotificationClick('${notif.id}', '${notif.link || ''}')">
                    <div class="notification-icon">
                        <i class="fas ${getNotificationIcon(notif.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notif.title}</div>
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${formatTime(notif.created_at)}</div>
                    </div>
                    ${!notif.read ? '<div class="notification-dot"></div>' : ''}
                </div>
            `).join('');
        }

        panel.classList.add('active');
    } catch (error) {
        console.error('Error showing notifications:', error);
    }
}

export async function markAsRead(notificationId) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        await updateNotificationBell();
        return { success: true };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: error.message };
    }
}

export async function markAllAsRead() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);

        if (error) throw error;
        await updateNotificationBell();
        await showNotificationPanel();
        return { success: true };
    } catch (error) {
        console.error('Error marking all as read:', error);
        return { success: false, error: error.message };
    }
}

function getNotificationIcon(type) {
    const icons = {
        'new_member': 'fa-user-plus',
        'photo_added': 'fa-image',
        'event_created': 'fa-calendar-plus',
        'event_updated': 'fa-calendar-check',
        'rsvp_update': 'fa-check-circle',
        'business_added': 'fa-store',
        'post_created': 'fa-file-alt',
        'comment_added': 'fa-comment',
        'profile_update': 'fa-user-edit',
        'invitation_sent': 'fa-paper-plane',
        'invitation_accepted': 'fa-user-check',
        'connection_found': 'fa-link'
    };
    return icons[type] || 'fa-bell';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

window.handleNotificationClick = async (notificationId, link) => {
    await markAsRead(notificationId);
    if (link) {
        window.location.href = link;
    }
};

window.toggleNotificationPanel = () => {
    const panel = document.getElementById('notificationPanel');
    if (panel.classList.contains('active')) {
        panel.classList.remove('active');
    } else {
        showNotificationPanel();
    }
};

window.markAllNotificationsRead = async () => {
    await markAllAsRead();
};

export function cleanupNotifications() {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
}
