alter table familyconnect.invitations add column approved_by uuid references auth.users;
alter function public.fc_action(text,jsonb) set schema familyconnect;
alter function familyconnect.fc_action(text,jsonb) rename to mutate;
revoke all on function familyconnect.mutate(text,jsonb) from public,anon,authenticated;
create function public.fc_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare i familyconnect.invitations; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 if action='approve_invitation' then
  select * into i from familyconnect.invitations where id=(payload->>'id')::uuid for update;
  if not found or not familyconnect.member(i.network_id,array['admin']) or i.created_by=u then raise exception 'Independent administrator verification required'; end if;
  update familyconnect.invitations set approved_by=u where id=i.id and consumed_at is null and revoked_at is null;
  insert into familyconnect.audit(actor,action,entity_id) values(u,action,i.id);
  return '{}';
 elsif action='accept_invitation' then
  select * into i from familyconnect.invitations where token_hash=encode(extensions.digest(payload->>'token','sha256'),'hex');
  if i.approved_by is null then raise exception 'Invitation awaits independent identity approval'; end if;
 end if;
 return familyconnect.mutate(action,payload);
end $$;
revoke all on function public.fc_action(text,jsonb) from public,anon;
grant execute on function public.fc_action(text,jsonb) to authenticated;
create or replace function public.fc_invitation_preview(token text) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('network',n.name,'inviter',p.first_name,'valid',i.approved_by is not null) from familyconnect.invitations i join familyconnect.networks n on n.id=i.network_id join familyconnect.people p on p.id=i.inviter_id where i.token_hash=encode(extensions.digest(token,'sha256'),'hex') and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null),'{}'::jsonb); $$;
create function familyconnect.admin_for_person(p uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from familyconnect.people x where x.id=p and familyconnect.member(x.network_id,array['admin'])); $$;
revoke all on function familyconnect.admin_for_person(uuid) from public,anon;
grant execute on function familyconnect.admin_for_person(uuid) to authenticated;
drop policy guardian_request_read on familyconnect.guardian_requests;
create policy guardian_request_read on familyconnect.guardian_requests for select to authenticated using(requester=auth.uid() or familyconnect.admin_for_person(person_id));
create function public.fc_review_queue() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'target_id',i.target_id,'network_id',i.network_id)), '[]') from familyconnect.invitations i where familyconnect.member(i.network_id,array['admin']) and i.created_by<>auth.uid() and i.approved_by is null and i.consumed_at is null and i.revoked_at is null and i.expires_at>now(); $$;
revoke all on function public.fc_review_queue() from public,anon;
grant execute on function public.fc_review_queue() to authenticated;
