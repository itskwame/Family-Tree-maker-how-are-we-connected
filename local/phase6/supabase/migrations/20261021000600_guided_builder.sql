-- Local-only Phase 6B. Existing mutation security remains the fallback.
alter function public.fc_action(text,jsonb) rename to fc_phase6_action;
alter function public.fc_phase6_action(text,jsonb) set schema familyconnect;
revoke all on function familyconnect.fc_phase6_action(text,jsonb) from public,anon,authenticated;
alter table familyconnect.invitations add column share_inviter_photo boolean not null default false;
alter table familyconnect.proposals add column category text;
create table familyconnect.builder_receipts(user_id uuid references auth.users, request_id uuid, result jsonb not null, fingerprint text not null, primary key(user_id,request_id));
alter table familyconnect.builder_receipts enable row level security;
revoke all on familyconnect.builder_receipts from public,anon,authenticated;

-- Direction-normalized parent/child and symmetric sibling assertions.
create unique index proposals_pending_equivalent on familyconnect.proposals (
 network_id,
 (case when relation='parent' then relative_id when relation='sibling' then least(subject_id,relative_id) else subject_id end),
 (case when relation='parent' then subject_id when relation='sibling' then greatest(subject_id,relative_id) else relative_id end),
 (case when relation in ('parent','child') then 'parentage' else relation end),kind
) where status='pending';

create function public.fc_action(action text,payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); p uuid; n uuid; r uuid; v uuid; result jsonb; previous familyconnect.builder_receipts;
 request uuid:=nullif(payload->>'request_id','')::uuid; fingerprint text;
 rel text:=payload->>'relation'; k text:=payload->>'kind';
begin
 if u is null then raise exception 'Authentication required'; end if;
 if action<>'add_relative' then
  result:=familyconnect.fc_phase6_action(action,payload);
  if action='create_invitation' and coalesce((payload->>'share_inviter_photo')::boolean,false) then
   -- Only the claimed adult owner can opt in, never merely a guardian or admin.
   update familyconnect.invitations i set share_inviter_photo=true where i.id=(result->>'id')::uuid
    and exists(select 1 from familyconnect.person_accounts a where a.person_id=i.inviter_id and a.user_id=u);
  end if;
  return result;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 fingerprint:=encode(extensions.digest((payload-'request_id')::text,'sha256'),'hex');
 if request is not null then
  select * into previous from familyconnect.builder_receipts where user_id=u and request_id=request;
  if found then
   if previous.fingerprint is distinct from fingerprint then raise exception 'Retry identifier belongs to a different request'; end if;
   return previous.result;
  end if;
 end if;
 p:=(payload->>'subject_id')::uuid;
 select network_id into n from familyconnect.people where id=p;
 if n is null or not familyconnect.member(n,array['admin','contributor']) or not familyconnect.controls(p) then raise exception 'Manage your own or guardian-approved branch'; end if;
 perform pg_advisory_xact_lock(hashtextextended(n::text,6));
 if rel is null or rel not in ('parent','child','sibling','other') or k is null or
    (rel in ('parent','child') and k not in ('biological','adoptive','step','unknown')) or
    (rel='sibling' and k not in ('full','half','adoptive','step','unknown')) or
    (rel='other' and k not in ('unknown','partnership')) then raise exception 'Choose a supported relationship type'; end if;
 r:=nullif(payload->>'existing_id','')::uuid;
 if r is null then
  if coalesce(length(trim(payload->>'first')),0) not between 1 and 60 or length(coalesce(payload->>'last',''))>60 then raise exception 'Enter a name of 1 to 60 characters'; end if;
  if exists(select 1 from familyconnect.people x where x.network_id=n and familyconnect.visible(x.id)
    and lower(trim(x.first_name))=lower(trim(payload->>'first')) and lower(trim(x.last_name))=lower(trim(coalesce(payload->>'last',''))))
    and not coalesce((payload->>'different_person')::boolean,false) then raise exception 'Possible existing relative: choose the authorized existing record or confirm this is a different person'; end if;
  insert into familyconnect.people(network_id,first_name,last_name,age_class,created_by)
   values(n,trim(payload->>'first'),trim(coalesce(payload->>'last','')),coalesce(payload->>'age_class','unknown'),u) returning id into r;
 elsif not exists(select 1 from familyconnect.people where id=r and network_id=n and familyconnect.visible(id)) then raise exception 'Relative unavailable'; end if;
 if r=p then raise exception 'Choose another relative'; end if;
 select id into v from familyconnect.proposals x where x.network_id=n and x.status='pending' and x.kind=k and (
  (x.subject_id=p and x.relative_id=r and x.relation=rel) or
  (x.subject_id=r and x.relative_id=p and ((rel='sibling' and x.relation='sibling') or (rel='parent' and x.relation='child') or (rel='child' and x.relation='parent'))));
 if v is null then
  insert into familyconnect.proposals(network_id,subject_id,relative_id,relation,kind,category,created_by)
  values(n,p,r,rel,k,case when rel='other' then left(payload->>'category',40) end,u) returning id into v;
 end if;
 result:=jsonb_build_object('person_id',r,'proposal_id',v);
 insert into familyconnect.audit(actor,action,entity_id) values(u,action,v);
 if request is not null then insert into familyconnect.builder_receipts(user_id,request_id,result,fingerprint) values(u,request,result,fingerprint); end if;
 return result;
end $$;
revoke all on function public.fc_action(text,jsonb) from public,anon;
grant execute on function public.fc_action(text,jsonb) to authenticated;

create or replace function public.fc_invitation_preview(token text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('network',n.name,'inviter',p.first_name,'valid',true,
 'photo',case when i.share_inviter_photo and p.age_class='adult' and p.photo ~ '^/portraits/[a-zA-Z0-9_/-]+\.(jpg|jpeg|png|webp)$' then p.photo else null end)
 from familyconnect.invitations i join familyconnect.networks n on n.id=i.network_id join familyconnect.people p on p.id=i.inviter_id
 where i.token_hash=encode(extensions.digest(token,'sha256'),'hex') and i.approved_by is not null
 and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null),'{}'::jsonb);
$$;

