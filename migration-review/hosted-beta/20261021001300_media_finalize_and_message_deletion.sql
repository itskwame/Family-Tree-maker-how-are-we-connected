create or replace function public.fc_media_complete(asset uuid,w int,h int,size_bytes int) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.role() is distinct from 'service_role' then raise exception 'Media worker required';end if;
 if w<1 or h<1 or w>1600 or h>1600 or size_bytes<1 or size_bytes>1500000 then raise exception 'Invalid processed image';end if;
 if not exists(select 1 from familyconnect.post_media m left join familyconnect.posts post on post.id=m.post_id join familyconnect.people p on p.id=coalesce(m.person_id,post.author_id) join familyconnect.person_accounts a on a.person_id=p.id and a.user_id=m.owner_id join familyconnect.memberships membership on membership.network_id=p.network_id and membership.user_id=a.user_id where m.id=asset and p.age_class='adult' and membership.role in('admin','contributor')) then raise exception 'Upload authority no longer valid';end if;
 update familyconnect.post_media set ready=true,width=w,height=h,bytes=size_bytes where id=asset;
end$$;
create function familyconnect.notify_message_deletion() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.deleted and not old.deleted then
  insert into familyconnect.notifications(user_id,conversation_id,kind) select m.user_id,new.conversation_id,'message' from familyconnect.conversation_members m where m.conversation_id=new.conversation_id and m.status='accepted' and m.user_id<>auth.uid();
 end if;return new;
end$$;
revoke all on function familyconnect.notify_message_deletion() from public,anon,authenticated;
create trigger message_deletion_notification after update of deleted on familyconnect.messages for each row execute function familyconnect.notify_message_deletion();
