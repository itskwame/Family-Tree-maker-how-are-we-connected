create table familyconnect.guardian_requests(id uuid primary key default gen_random_uuid(), person_id uuid not null references familyconnect.people, requester uuid not null references auth.users, status text not null default 'pending' check(status in ('pending','approved','rejected')), reviewed_by uuid references auth.users, unique(person_id,requester));
alter table familyconnect.guardian_requests enable row level security;
revoke all on familyconnect.guardian_requests from public,anon,authenticated;
grant select on familyconnect.guardian_requests,familyconnect.person_accounts,familyconnect.guardians to authenticated;
create policy own_claims on familyconnect.person_accounts for select to authenticated using(user_id=auth.uid());
create policy own_guardians on familyconnect.guardians for select to authenticated using(user_id=auth.uid());
create policy guardian_request_read on familyconnect.guardian_requests for select to authenticated using(requester=auth.uid() or exists(select 1 from familyconnect.people p where p.id=person_id and familyconnect.member(p.network_id,array['admin'])));
-- Return no child names to an administrator simply because a request exists.
create function public.fc_guardian(action text, person uuid, requester uuid default null) returns void language plpgsql security definer set search_path='' as $$
declare n uuid; u uuid:=auth.uid();
begin
 if u is null then raise exception 'Authentication required'; end if;
 select network_id into n from familyconnect.people where id=person and age_class<>'adult';
 if n is null or not familyconnect.member(n) then raise exception 'Protected profile unavailable'; end if;
 if action='request' then
  if not exists(select 1 from familyconnect.people where id=person and created_by=u) then raise exception 'Request unavailable'; end if;
  insert into familyconnect.guardian_requests(person_id,requester) values(person,u) on conflict do nothing;
 elsif action='approve' then
  if not familyconnect.member(n,array['admin']) or requester=u then raise exception 'Independent administrator verification required'; end if;
  update familyconnect.guardian_requests set status='approved',reviewed_by=u where person_id=person and guardian_requests.requester=fc_guardian.requester and status='pending';
  if not found then raise exception 'Pending request required'; end if;
  insert into familyconnect.guardians values(person,requester,u) on conflict do nothing;
 elsif action='revoke' then
  if not familyconnect.member(n,array['admin']) and not familyconnect.controls(person) then raise exception 'Not authorized'; end if;
  delete from familyconnect.guardians where person_id=person and user_id=requester;
  update familyconnect.guardian_requests set status='rejected',reviewed_by=u where person_id=person and guardian_requests.requester=fc_guardian.requester;
 else raise exception 'Unknown action'; end if;
 insert into familyconnect.audit(actor,action,entity_id) values(u,'guardian_'||action,person);
end $$;
revoke all on function public.fc_guardian(text,uuid,uuid) from public,anon;
grant execute on function public.fc_guardian(text,uuid,uuid) to authenticated;
create or replace function public.fc_snapshot() returns jsonb language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 return jsonb_build_object(
 'networks',(select coalesce(jsonb_agg(to_jsonb(n)),'[]') from familyconnect.networks n),
 'memberships',(select coalesce(jsonb_agg(to_jsonb(m)),'[]') from familyconnect.memberships m),
 'people',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from familyconnect.people p),
 'parentages',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from familyconnect.parentages p),
 'partnerships',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from familyconnect.partnerships p),
 'proposals',(select coalesce(jsonb_agg(to_jsonb(p)),'[]') from familyconnect.proposals p),
 'connections',(select coalesce(jsonb_agg(to_jsonb(c)),'[]') from familyconnect.connections c),
 'my_people',(select coalesce(jsonb_agg(person_id),'[]') from (select person_id from familyconnect.person_accounts union select person_id from familyconnect.guardians) own),
 'guardian_requests',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from familyconnect.guardian_requests g),
 'progress',(select to_jsonb(p) from familyconnect.progress p where p.user_id=auth.uid()));
end $$;
