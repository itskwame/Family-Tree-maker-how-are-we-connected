create function familyconnect.social_notification(c uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.conversation_members m join familyconnect.conversations x on x.id=m.conversation_id where m.conversation_id=c and m.user_id=auth.uid() and m.status in('accepted','invited') and familyconnect.social_reader(x.network_id) and familyconnect.social_adult(m.person_id,x.network_id));$$;
revoke all on function familyconnect.social_notification(uuid) from public,anon;
grant execute on function familyconnect.social_notification(uuid) to authenticated;
drop policy own_social_notifications on familyconnect.notifications;
create policy own_social_notifications on familyconnect.notifications for select to authenticated using(user_id=auth.uid() and familyconnect.social_notification(conversation_id));
create function public.fc_group_admin(conversation uuid,person uuid,promote boolean) returns void language plpgsql security definer set search_path='' as $$declare recipient uuid;begin
 if not familyconnect.social_chat(conversation) or not exists(select 1 from familyconnect.conversation_members where conversation_id=conversation and user_id=auth.uid() and role='admin' and status='accepted') or not exists(select 1 from familyconnect.conversations where id=conversation and kind='group') then raise exception 'Group administrator required';end if;
 perform 1 from familyconnect.conversations where id=conversation for update;
 select user_id into recipient from familyconnect.conversation_members where conversation_id=conversation and person_id=person and status='accepted';
 if recipient is null or recipient=auth.uid() or exists(select 1 from familyconnect.conversations where id=conversation and creator_id=recipient) then raise exception 'Select another accepted member';end if;
 update familyconnect.conversation_members set role=case when promote then 'admin' else 'member' end where conversation_id=conversation and user_id=recipient;
end$$;
revoke all on function public.fc_group_admin(uuid,uuid,boolean) from public,anon;
grant execute on function public.fc_group_admin(uuid,uuid,boolean) to authenticated;
