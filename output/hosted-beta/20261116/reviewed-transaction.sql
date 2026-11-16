begin; set local lock_timeout='5s'; set local statement_timeout='120s';
select pg_advisory_xact_lock(611162026);
create schema if not exists familyconnect_migrations; revoke all on schema familyconnect_migrations from public,anon,authenticated;
create table if not exists familyconnect_migrations.ledger(version text primary key,sha256 text not null,applied_at timestamptz not null default now()); revoke all on familyconnect_migrations.ledger from public,anon,authenticated;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000000_quarantine_legacy.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000000_quarantine_legacy.sql' and sha256='d07bb6261cdc08da38780a4cb8ea7af831469e4aa5fcc704072f095d9c92dbd3') then raise exception 'Migration checksum mismatch: 20261021000000_quarantine_legacy.sql'; end if;
      else
        execute $fc_ddl$-- DRAFT: requires legacy-consumer impact review and separate hosted approval.
-- Additive data preservation; API permissions change intentionally.
-- No rows, roles, Auth identities or account privileges are changed.
revoke all on public.families, public.family_memberships, public.invites from anon, authenticated;
-- Existing policies remain documented for recovery; API roles cannot use them.
-- Never undo this by restoring unrestricted invitation reads or self-membership writes.
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000000_quarantine_legacy.sql','d07bb6261cdc08da38780a4cb8ea7af831469e4aa5fcc704072f095d9c92dbd3');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000100_familyconnect_baseline.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000100_familyconnect_baseline.sql' and sha256='22e8d5c74d7c6007a2fc77a9f485038ffa4522d0d58e34aae0f08757daf30632') then raise exception 'Migration checksum mismatch: 20261021000100_familyconnect_baseline.sql'; end if;
      else
        execute $fc_ddl$-- Local Phase 6 baseline only. Never run against the hosted project.
create schema familyconnect;
revoke all on schema familyconnect from public, anon;
grant usage on schema familyconnect to authenticated;

create table familyconnect.networks(id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100));
create table familyconnect.memberships(network_id uuid references familyconnect.networks on delete restrict, user_id uuid references auth.users on delete restrict, role text not null check(role in ('admin','contributor','viewer')), primary key(network_id,user_id));
create table familyconnect.people(id uuid primary key default gen_random_uuid(), network_id uuid not null references familyconnect.networks, first_name text not null check(length(first_name) between 1 and 60), last_name text not null default '' check(length(last_name)<=60), gender text not null default 'other' check(gender in ('female','male','other')), age_class text not null check(age_class in ('adult','minor','unknown')), photo text, created_by uuid references auth.users, unique(network_id,id));
create table familyconnect.person_accounts(person_id uuid primary key references familyconnect.people, user_id uuid not null references auth.users, verified_at timestamptz not null default now());
create table familyconnect.guardians(person_id uuid references familyconnect.people, user_id uuid references auth.users, approved_by uuid not null references auth.users, primary key(person_id,user_id));
create table familyconnect.parentages(id uuid primary key default gen_random_uuid(), network_id uuid not null, parent_id uuid not null, child_id uuid not null, kind text not null check(kind in ('biological','adoptive')), foreign key(network_id,parent_id) references familyconnect.people(network_id,id), foreign key(network_id,child_id) references familyconnect.people(network_id,id), check(parent_id<>child_id), unique(parent_id,child_id,kind));
create table familyconnect.partnerships(id uuid primary key default gen_random_uuid(), network_id uuid not null, person_a uuid not null, person_b uuid not null, foreign key(network_id,person_a) references familyconnect.people(network_id,id), foreign key(network_id,person_b) references familyconnect.people(network_id,id), check(person_a<person_b), unique(person_a,person_b));
create table familyconnect.partnership_events(id uuid primary key default gen_random_uuid(), partnership_id uuid not null references familyconnect.partnerships, kind text not null check(kind in ('marriage','separation','divorce','reunion')), occurred_on date);
create table familyconnect.proposals(id uuid primary key default gen_random_uuid(), network_id uuid not null references familyconnect.networks, subject_id uuid not null, relative_id uuid not null, relation text not null check(relation in ('parent','child','sibling','other')), kind text not null check(kind in ('biological','adoptive','full','half','step','unknown','partnership')), status text not null default 'pending' check(status in ('pending','confirmed','rejected')), created_by uuid not null references auth.users, reviewed_by uuid references auth.users, created_at timestamptz not null default now(), foreign key(network_id,subject_id) references familyconnect.people(network_id,id), foreign key(network_id,relative_id) references familyconnect.people(network_id,id), check(subject_id<>relative_id));
create table familyconnect.progress(user_id uuid primary key references auth.users, draft jsonb not null default '{}', version integer not null default 1, updated_at timestamptz not null default now());
create table familyconnect.invitations(id uuid primary key default gen_random_uuid(), token_hash text unique not null, network_id uuid not null references familyconnect.networks, target_id uuid not null references familyconnect.people, inviter_id uuid not null references familyconnect.people, recipient_email text not null, created_by uuid not null references auth.users, expires_at timestamptz not null default now()+interval '7 days', consumed_by uuid references auth.users, consumed_at timestamptz, revoked_at timestamptz, created_at timestamptz not null default now());
create table familyconnect.claims(id uuid primary key default gen_random_uuid(), invitation_id uuid not null unique references familyconnect.invitations, person_id uuid not null references familyconnect.people, user_id uuid not null references auth.users, verified_at timestamptz not null default now());
create table familyconnect.connections(id uuid primary key default gen_random_uuid(), network_a uuid not null references familyconnect.networks, network_b uuid not null references familyconnect.networks, person_a uuid not null, person_b uuid not null, admin_a boolean not null default false, admin_b boolean not null default false, consent_a boolean not null default false, consent_b boolean not null default false, revoked boolean not null default false, created_by uuid not null references auth.users, check(network_a<>network_b), foreign key(network_a,person_a) references familyconnect.people(network_id,id), foreign key(network_b,person_b) references familyconnect.people(network_id,id), unique(person_a,person_b));
create table familyconnect.audit(id bigint generated always as identity primary key, actor uuid references auth.users, action text not null, entity_id uuid, created_at timestamptz not null default now());
create table familyconnect.receipts(user_id uuid references auth.users, request_id uuid, result jsonb not null, primary key(user_id,request_id));

create function familyconnect.member(n uuid, roles text[] default array['admin','contributor','viewer']) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from familyconnect.memberships m where m.network_id=n and m.user_id=auth.uid() and m.role=any(roles)); $$;
create function familyconnect.controls(p uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from familyconnect.person_accounts a where a.person_id=p and a.user_id=auth.uid()) or exists(select 1 from familyconnect.guardians g where g.person_id=p and g.user_id=auth.uid()); $$;
create function familyconnect.visible(p uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.people x where x.id=p and familyconnect.member(x.network_id) and (x.age_class='adult' or familyconnect.controls(p)))
 or exists(select 1 from familyconnect.connections c where not c.revoked and c.admin_a and c.admin_b and c.consent_a and c.consent_b and ((c.person_a=p and familyconnect.member(c.network_b)) or (c.person_b=p and familyconnect.member(c.network_a)))); $$;

do $$ declare t text; begin
 foreach t in array array['networks','memberships','people','person_accounts','guardians','parentages','partnerships','partnership_events','proposals','progress','invitations','claims','connections','audit','receipts'] loop
 execute format('alter table familyconnect.%I enable row level security',t);
 execute format('revoke all on familyconnect.%I from public,anon,authenticated',t);
 end loop;
end $$;
grant select on familyconnect.networks,familyconnect.memberships,familyconnect.people,familyconnect.parentages,familyconnect.partnerships,familyconnect.proposals,familyconnect.progress,familyconnect.connections to authenticated;
create policy network_read on familyconnect.networks for select to authenticated using(familyconnect.member(id));
create policy member_read on familyconnect.memberships for select to authenticated using(user_id=auth.uid());
create policy person_read on familyconnect.people for select to authenticated using(familyconnect.visible(id));
create policy parent_read on familyconnect.parentages for select to authenticated using(familyconnect.member(network_id) and familyconnect.visible(parent_id) and familyconnect.visible(child_id));
create policy partner_read on familyconnect.partnerships for select to authenticated using(familyconnect.member(network_id) and familyconnect.visible(person_a) and familyconnect.visible(person_b));
create policy proposal_read on familyconnect.proposals for select to authenticated using(familyconnect.member(network_id) and (created_by=auth.uid() or familyconnect.member(network_id,array['admin'])) and familyconnect.visible(subject_id) and familyconnect.visible(relative_id));
create policy progress_read on familyconnect.progress for select to authenticated using(user_id=auth.uid());
create policy connection_read on familyconnect.connections for select to authenticated using(familyconnect.member(network_a) or familyconnect.member(network_b));

create function public.fc_invitation_preview(token text) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('network',n.name,'inviter',p.first_name,'valid',true) from familyconnect.invitations i join familyconnect.networks n on n.id=i.network_id join familyconnect.people p on p.id=i.inviter_id where i.token_hash=encode(extensions.digest(token,'sha256'),'hex') and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null),'{}'::jsonb); $$;

create function public.fc_snapshot() returns jsonb language plpgsql security invoker set search_path='' as $$
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
 'progress',(select to_jsonb(p) from familyconnect.progress p where p.user_id=auth.uid()));
end $$;

create function public.fc_action(action text, payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); n uuid; p uuid; r uuid; v uuid; inv familyconnect.invitations; prop familyconnect.proposals; conn familyconnect.connections; result jsonb:='{}'; raw text; mail text; req uuid; a uuid; b uuid;
begin
 if u is null then raise exception 'Authentication required'; end if;
 -- Serialize mutation checks per user; graph promotion additionally locks its network.
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if payload ? 'request_id' then
  req:=(payload->>'request_id')::uuid;
  select x.result into result from familyconnect.receipts x where x.user_id=u and x.request_id=req;
  if found then return result; end if;
 end if;
 result:='{}';
 if action='accept_invitation' then
  select * into inv from familyconnect.invitations where token_hash=encode(extensions.digest(payload->>'token','sha256'),'hex') for update;
  if not found or inv.revoked_at is not null or inv.expires_at<=now() or inv.consumed_at is not null then raise exception 'Invitation unavailable'; end if;
  select lower(email) into mail from auth.users where id=u and email_confirmed_at is not null;
  if mail is null or mail<>lower(inv.recipient_email) then raise exception 'Sign in with the verified invited email address'; end if;
  if exists(select 1 from familyconnect.people where id=inv.target_id and age_class<>'adult') then raise exception 'Adult invitations only'; end if;
  if exists(select 1 from familyconnect.person_accounts where person_id=inv.target_id and user_id<>u) then raise exception 'Profile already claimed'; end if;
  insert into familyconnect.person_accounts values(inv.target_id,u,now()) on conflict do nothing;
  insert into familyconnect.memberships values(inv.network_id,u,'contributor') on conflict do nothing;
  insert into familyconnect.claims(invitation_id,person_id,user_id) values(inv.id,inv.target_id,u);
  update familyconnect.invitations set consumed_at=now(),consumed_by=u where id=inv.id;
  result:=jsonb_build_object('person_id',inv.target_id,'inviter_id',inv.inviter_id,'network_id',inv.network_id);
  insert into familyconnect.progress(user_id,draft) values(u,jsonb_build_object('reveal',result)) on conflict(user_id) do update set draft=familyconnect.progress.draft||excluded.draft,version=familyconnect.progress.version+1,updated_at=now();
 elsif action='save_progress' then
  if pg_column_size(payload->'draft')>20000 then raise exception 'Draft too large'; end if;
  insert into familyconnect.progress(user_id,draft) values(u,coalesce(payload->'draft','{}')) on conflict(user_id) do update set draft=familyconnect.progress.draft||excluded.draft,version=familyconnect.progress.version+1,updated_at=now();
 elsif action='add_relative' then
  p:=(payload->>'subject_id')::uuid;
  select network_id into n from familyconnect.people where id=p;
  if not familyconnect.member(n,array['admin','contributor']) or not familyconnect.controls(p) then raise exception 'Manage your own or guardian-approved branch'; end if;
  r:=nullif(payload->>'existing_id','')::uuid;
  if r is null then
   if exists(select 1 from familyconnect.people x where x.network_id=n and familyconnect.visible(x.id) and lower(x.first_name)=lower(trim(payload->>'first')) and lower(x.last_name)=lower(trim(coalesce(payload->>'last','')))) then raise exception 'Possible existing relative: choose the authorized existing record'; end if;
   insert into familyconnect.people(network_id,first_name,last_name,age_class,created_by) values(n,trim(payload->>'first'),trim(coalesce(payload->>'last','')),payload->>'age_class',u) returning id into r;
   if payload->>'age_class'<>'adult' then
    -- A declaration alone never grants guardianship; this pending record stays private to its creator below.
    null;
   end if;
  elsif not exists(select 1 from familyconnect.people where id=r and network_id=n and familyconnect.visible(id)) then raise exception 'Relative unavailable'; end if;
  insert into familyconnect.proposals(network_id,subject_id,relative_id,relation,kind,created_by) values(n,p,r,payload->>'relation',payload->>'kind',u) returning id into v;
  result:=jsonb_build_object('person_id',r,'proposal_id',v);
 elsif action='review_relationship' then
  select * into prop from familyconnect.proposals where id=(payload->>'id')::uuid for update;
  if not found or not familyconnect.member(prop.network_id,array['admin']) or prop.created_by=u or prop.status<>'pending' then raise exception 'Independent network administrator review required'; end if;
  if not familyconnect.visible(prop.subject_id) or not familyconnect.visible(prop.relative_id) then raise exception 'Private record requires guardian authorization'; end if;
  if payload->>'decision'='reject' then update familyconnect.proposals set status='rejected',reviewed_by=u where id=prop.id;
  else
   if prop.relation not in ('parent','child') or prop.kind not in ('biological','adoptive') then raise exception 'More parentage evidence needed; no inferred ancestry'; end if;
   a:=case when prop.relation='parent' then prop.relative_id else prop.subject_id end;
   b:=case when prop.relation='parent' then prop.subject_id else prop.relative_id end;
   perform pg_advisory_xact_lock(hashtextextended(prop.network_id::text,1));
   if exists(with recursive d(id) as (select b union select e.child_id from familyconnect.parentages e join d on e.parent_id=d.id) select 1 from d where id=a) then raise exception 'Ancestry cycle rejected'; end if;
   insert into familyconnect.parentages(network_id,parent_id,child_id,kind) values(prop.network_id,a,b,prop.kind);
   update familyconnect.proposals set status='confirmed',reviewed_by=u where id=prop.id;
  end if;
 elsif action='create_invitation' then
  p:=(payload->>'target_id')::uuid;
  select network_id into n from familyconnect.people where id=p and age_class='adult';
  if n is null or not familyconnect.member(n,array['admin','contributor']) or not familyconnect.visible(p) then raise exception 'Only authorized adult records may be invited'; end if;
  a:=(payload->>'inviter_id')::uuid;
  if not familyconnect.controls(a) or not exists(select 1 from familyconnect.people where id=a and network_id=n and age_class='adult') then raise exception 'Inviter unavailable'; end if;
  if exists(select 1 from familyconnect.person_accounts where person_id=p) then raise exception 'Profile already claimed'; end if;
  if (select count(*) from familyconnect.invitations where created_by=u and created_at>now()-interval '1 hour')>=10 then raise exception 'Invitation limit reached'; end if;
  mail:=lower(trim(payload->>'email'));
  if mail is null or mail !~ '^[^ @]+@[^ @]+\.[^ @]+$' then raise exception 'Recipient email required'; end if;
  raw:=encode(extensions.gen_random_bytes(32),'hex');
  insert into familyconnect.invitations(token_hash,network_id,target_id,inviter_id,recipient_email,created_by) values(encode(extensions.digest(raw,'sha256'),'hex'),n,p,a,mail,u) returning id into v;
  result:=jsonb_build_object('token',raw,'id',v);
 elsif action='revoke_invitation' then
  update familyconnect.invitations set revoked_at=now() where id=(payload->>'id')::uuid and created_by=u and consumed_at is null;
 elsif action='request_connection' then
  a:=(payload->>'person_a')::uuid; b:=(payload->>'person_b')::uuid;
  -- Link only records independently claimed by the same verified account. No arbitrary cross-network lookup.
  if not exists(select 1 from familyconnect.person_accounts where person_id=a and user_id=u) or not exists(select 1 from familyconnect.person_accounts where person_id=b and user_id=u) then raise exception 'Claim both profiles before requesting identity connection'; end if;
  select network_id into n from familyconnect.people where id=a and age_class='adult';
  select network_id into v from familyconnect.people where id=b and age_class='adult';
  insert into familyconnect.connections(network_a,network_b,person_a,person_b,created_by) values(n,v,a,b,u) returning id into p;
  result:=jsonb_build_object('id',p);
 elsif action='connection_consent' then
  select * into conn from familyconnect.connections where id=(payload->>'id')::uuid for update;
  if not found then raise exception 'Connection unavailable'; end if;
  if payload->>'decision'='revoke' then
   if not familyconnect.controls(conn.person_a) and not familyconnect.controls(conn.person_b) and not familyconnect.member(conn.network_a,array['admin']) and not familyconnect.member(conn.network_b,array['admin']) then raise exception 'Not authorized'; end if;
   update familyconnect.connections set revoked=true where id=conn.id;
  elsif payload->>'scope'='person' then
   if not familyconnect.controls(conn.person_a) and not familyconnect.controls(conn.person_b) then raise exception 'Personal consent required'; end if;
   update familyconnect.connections set consent_a=consent_a or familyconnect.controls(conn.person_a),consent_b=consent_b or familyconnect.controls(conn.person_b) where id=conn.id;
  else
   if not familyconnect.member(conn.network_a,array['admin']) and not familyconnect.member(conn.network_b,array['admin']) then raise exception 'Network administrator required'; end if;
   update familyconnect.connections set admin_a=admin_a or familyconnect.member(conn.network_a,array['admin']),admin_b=admin_b or familyconnect.member(conn.network_b,array['admin']) where id=conn.id;
  end if;
 else raise exception 'Unknown action'; end if;
 insert into familyconnect.audit(actor,action) values(u,action);
 -- Raw invitation tokens must never enter durable receipts/audit.
 if req is not null and action<>'create_invitation' then insert into familyconnect.receipts values(u,req,result); end if;
 return result;
end $$;

-- Private provisional records are visible to their creator; minors never become generally visible.
create or replace function familyconnect.visible(p uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.people x where x.id=p and familyconnect.member(x.network_id) and (x.age_class='adult' or x.created_by=auth.uid() or familyconnect.controls(p)))
 or exists(select 1 from familyconnect.connections c where not c.revoked and c.admin_a and c.admin_b and c.consent_a and c.consent_b and ((c.person_a=p and familyconnect.member(c.network_b)) or (c.person_b=p and familyconnect.member(c.network_a)))); $$;
revoke all on all functions in schema familyconnect from public,anon,authenticated;
grant execute on function familyconnect.member(uuid,text[]),familyconnect.controls(uuid),familyconnect.visible(uuid) to authenticated;
revoke all on function public.fc_invitation_preview(text),public.fc_snapshot(),public.fc_action(text,jsonb) from public,anon,authenticated;
grant execute on function public.fc_invitation_preview(text) to anon,authenticated;
grant execute on function public.fc_snapshot(),public.fc_action(text,jsonb) to authenticated;
alter default privileges in schema familyconnect revoke all on tables from public,anon,authenticated;
alter default privileges in schema familyconnect revoke execute on functions from public,anon,authenticated;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000100_familyconnect_baseline.sql','22e8d5c74d7c6007a2fc77a9f485038ffa4522d0d58e34aae0f08757daf30632');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000200_guardians_and_identity.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000200_guardians_and_identity.sql' and sha256='4472855f524d579cd19adbc339f9768f2e5dc27f463097237cda472411aa287c') then raise exception 'Migration checksum mismatch: 20261021000200_guardians_and_identity.sql'; end if;
      else
        execute $fc_ddl$create table familyconnect.guardian_requests(id uuid primary key default gen_random_uuid(), person_id uuid not null references familyconnect.people, requester uuid not null references auth.users, status text not null default 'pending' check(status in ('pending','approved','rejected')), reviewed_by uuid references auth.users, unique(person_id,requester));
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
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000200_guardians_and_identity.sql','4472855f524d579cd19adbc339f9768f2e5dc27f463097237cda472411aa287c');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000300_claim_review.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000300_claim_review.sql' and sha256='9097e0f2c0782c67f8e747b425e8a7970e5b3f20e7d1d669161453fc80f720fc') then raise exception 'Migration checksum mismatch: 20261021000300_claim_review.sql'; end if;
      else
        execute $fc_ddl$alter table familyconnect.invitations add column approved_by uuid references auth.users;
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
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000300_claim_review.sql','9097e0f2c0782c67f8e747b425e8a7970e5b3f20e7d1d669161453fc80f720fc');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000400_per_network_reveal.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000400_per_network_reveal.sql' and sha256='aa89daa5f670130a95c87428cfa55c19de18925ba2712b5bbac7c6a7670bddc3') then raise exception 'Migration checksum mismatch: 20261021000400_per_network_reveal.sql'; end if;
      else
        execute $fc_ddl$create function public.fc_my_reveals() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(x),'[]') from (select distinct on(i.network_id) i.network_id,i.target_id person_id,i.inviter_id from familyconnect.claims c join familyconnect.invitations i on i.id=c.invitation_id where c.user_id=auth.uid() order by i.network_id,c.verified_at desc) x; $$;
revoke all on function public.fc_my_reveals() from public,anon;
grant execute on function public.fc_my_reveals() to authenticated;
create function familyconnect.one_identity_per_network() returns trigger language plpgsql security definer set search_path='' as $$
declare n uuid;
begin
 select network_id into n from familyconnect.people where id=new.person_id;
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,4));
 if exists(select 1 from familyconnect.person_accounts a join familyconnect.people p on p.id=a.person_id where a.user_id=new.user_id and p.network_id=n and a.person_id<>new.person_id) then raise exception 'An account may claim only one identity in a network; request duplicate review'; end if;
 return new;
end $$;
revoke all on function familyconnect.one_identity_per_network() from public,anon,authenticated;
create trigger identity_uniqueness before insert or update on familyconnect.person_accounts for each row execute function familyconnect.one_identity_per_network();
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000400_per_network_reveal.sql','aa89daa5f670130a95c87428cfa55c19de18925ba2712b5bbac7c6a7670bddc3');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000500_partnership_semantics.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000500_partnership_semantics.sql' and sha256='17500e7945fc35b34b8cca3e4171de2c9a314fd3db4c71d622f50baf092e6dd2') then raise exception 'Migration checksum mismatch: 20261021000500_partnership_semantics.sql'; end if;
      else
        execute $fc_ddl$alter table familyconnect.partnerships add column kind text not null default 'marriage' check(kind in ('marriage','partnership'));
alter table familyconnect.partnerships add column status text not null default 'partnered' check(status in ('partnered','former'));
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000500_partnership_semantics.sql','17500e7945fc35b34b8cca3e4171de2c9a314fd3db4c71d622f50baf092e6dd2');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000600_guided_builder.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000600_guided_builder.sql' and sha256='5c10453b2dd9ed901b6061e7256a1772a9b46469238571ed625d08c032122eb9') then raise exception 'Migration checksum mismatch: 20261021000600_guided_builder.sql'; end if;
      else
        execute $fc_ddl$-- Local-only Phase 6B. Existing mutation security remains the fallback.
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

$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000600_guided_builder.sql','5c10453b2dd9ed901b6061e7256a1772a9b46469238571ed625d08c032122eb9');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000700_invitation_portrait_path.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000700_invitation_portrait_path.sql' and sha256='92f4c86d1017e26be26dfd94b99287dc12108bde770bbc884f2809e5a04b2a27') then raise exception 'Migration checksum mismatch: 20261021000700_invitation_portrait_path.sql'; end if;
      else
        execute $fc_ddl$-- The existing licensed fictional asset directory is /family-portraits/.
create or replace function public.fc_invitation_preview(token text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('network',n.name,'inviter',p.first_name,'valid',true,
 'photo',case when i.share_inviter_photo and p.age_class='adult' and p.photo ~ '^/family-portraits/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$' then p.photo else null end)
 from familyconnect.invitations i join familyconnect.networks n on n.id=i.network_id join familyconnect.people p on p.id=i.inviter_id
 where i.token_hash=encode(extensions.digest(token,'sha256'),'hex') and i.approved_by is not null
 and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null),'{}'::jsonb);
$$;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000700_invitation_portrait_path.sql','92f4c86d1017e26be26dfd94b99287dc12108bde770bbc884f2809e5a04b2a27');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000800_social.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000800_social.sql' and sha256='7a18f4244eecc42e600a24da20e1c41991e30630f9c516371697a782be518aac') then raise exception 'Migration checksum mismatch: 20261021000800_social.sql'; end if;
      else
        execute $fc_ddl$-- Phase 7: local-only social baseline. No implicit membership from family consent.
create table familyconnect.social_profiles (
 person_id uuid primary key references familyconnect.people(id), display_name text not null check(length(display_name) between 1 and 80),
 bio text not null default '' check(length(bio)<=1000), location text not null default '' check(length(location)<=100),
 birthday text not null default '' check(birthday='' or birthday ~ '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'),
 share_bio boolean not null default false, share_location boolean not null default false, share_birthday boolean not null default false, share_photo boolean not null default false
);
create table familyconnect.posts(id uuid primary key default gen_random_uuid(),network_id uuid not null references familyconnect.networks(id),author_id uuid not null references familyconnect.people(id),body text not null default '' check(length(body)<=5000),status text not null default 'draft' check(status in('draft','published')),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index posts_feed on familyconnect.posts(network_id,created_at desc,id);
create table familyconnect.post_media(id uuid primary key default gen_random_uuid(),post_id uuid references familyconnect.posts(id) on delete cascade,person_id uuid references familyconnect.people(id),owner_id uuid not null references auth.users(id),path text not null unique,thumbnail text not null unique,ready boolean not null default false,width int,height int,bytes int,created_at timestamptz not null default now(),check((post_id is null)<>(person_id is null)));
create unique index profile_photo_one on familyconnect.post_media(person_id) where person_id is not null;
create table familyconnect.comments(id uuid primary key default gen_random_uuid(),post_id uuid not null references familyconnect.posts(id) on delete cascade,author_id uuid not null references familyconnect.people(id),body text not null check(length(body) between 1 and 2000),created_at timestamptz not null default now());
create index comments_post on familyconnect.comments(post_id,created_at);
create table familyconnect.reactions(post_id uuid not null references familyconnect.posts(id) on delete cascade,user_id uuid not null references auth.users(id),primary key(post_id,user_id));
create table familyconnect.blocks(user_id uuid not null references auth.users(id),blocked_id uuid not null references auth.users(id),primary key(user_id,blocked_id),check(user_id<>blocked_id));
create table familyconnect.conversations(id uuid primary key default gen_random_uuid(),network_id uuid not null references familyconnect.networks(id),kind text not null check(kind in('direct','group')),name text not null check(length(name) between 1 and 80),creator_id uuid not null references auth.users(id),admins_only_invite boolean not null default true,created_at timestamptz not null default now());
create table familyconnect.conversation_members(conversation_id uuid not null references familyconnect.conversations(id) on delete cascade,user_id uuid not null references auth.users(id),person_id uuid not null references familyconnect.people(id),role text not null check(role in('admin','member')),status text not null check(status in('invited','accepted','left','removed','declined')),last_read timestamptz not null default now(),primary key(conversation_id,user_id));
create index conversation_user on familyconnect.conversation_members(user_id,status);
create table familyconnect.messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references familyconnect.conversations(id) on delete cascade,sender_id uuid not null references auth.users(id),body text not null check(length(body) between 1 and 4000),deleted boolean not null default false,created_at timestamptz not null default now());
create index messages_history on familyconnect.messages(conversation_id,created_at desc,id);
create table familyconnect.reports(id uuid primary key default gen_random_uuid(),reporter_id uuid not null references auth.users(id),conversation_id uuid not null references familyconnect.conversations(id),message_id uuid references familyconnect.messages(id),reason text not null check(length(reason) between 1 and 1000),created_at timestamptz not null default now());
create table familyconnect.notifications(id bigint generated always as identity primary key,user_id uuid not null references auth.users(id),conversation_id uuid not null references familyconnect.conversations(id) on delete cascade,kind text not null check(kind in('invitation','message')),created_at timestamptz not null default now());
create index notifications_user on familyconnect.notifications(user_id,created_at desc);
create table familyconnect.social_limits(user_id uuid not null references auth.users(id),action text not null,created_at timestamptz not null default now());
create index social_limit_lookup on familyconnect.social_limits(user_id,created_at);

create function familyconnect.social_owner(p uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.person_accounts a join familyconnect.people p1 on p1.id=a.person_id where a.person_id=p and a.user_id=auth.uid() and p1.age_class='adult' and familyconnect.member(p1.network_id,array['admin','contributor']));$$;
create function familyconnect.social_adult(p uuid,n uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.person_accounts a join familyconnect.people p1 on p1.id=a.person_id join familyconnect.memberships m on m.user_id=a.user_id and m.network_id=p1.network_id where p1.id=p and p1.network_id=n and p1.age_class='adult');$$;
create function familyconnect.social_blocked(a uuid,b uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.blocks where (user_id=a and blocked_id=b) or (user_id=b and blocked_id=a));$$;
create function familyconnect.social_reader(n uuid) returns boolean language sql stable security definer set search_path='' as $$select familyconnect.member(n) and exists(select 1 from familyconnect.person_accounts a join familyconnect.people p on p.id=a.person_id where a.user_id=auth.uid() and p.network_id=n and p.age_class='adult');$$;
create function familyconnect.social_post(p uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.posts x join familyconnect.person_accounts a on a.person_id=x.author_id where x.id=p and familyconnect.social_reader(x.network_id) and (x.status='published' or a.user_id=auth.uid()) and not familyconnect.social_blocked(auth.uid(),a.user_id));$$;
create function familyconnect.social_chat(c uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.conversations x join familyconnect.conversation_members m on m.conversation_id=x.id where x.id=c and m.user_id=auth.uid() and m.status='accepted' and familyconnect.social_reader(x.network_id) and familyconnect.social_adult(m.person_id,x.network_id));$$;
create function familyconnect.social_asset(asset uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.post_media m left join familyconnect.people p on p.id=m.person_id left join familyconnect.social_profiles s on s.person_id=p.id where m.id=asset and m.ready and ((m.post_id is not null and familyconnect.social_post(m.post_id)) or (m.person_id is not null and familyconnect.social_reader(p.network_id) and p.age_class='adult' and (s.share_photo or familyconnect.social_owner(p.id)))));$$;

do $$declare t text;begin foreach t in array array['social_profiles','posts','post_media','comments','reactions','blocks','conversations','conversation_members','messages','reports','notifications','social_limits'] loop execute format('alter table familyconnect.%I enable row level security',t);execute format('revoke all on familyconnect.%I from anon, authenticated',t);end loop;end$$;
-- Only notifications are subscribed to. Payloads contain no message text or personal fields.
grant select on familyconnect.notifications to authenticated;
create policy own_social_notifications on familyconnect.notifications for select to authenticated using(user_id=auth.uid() and (familyconnect.social_chat(conversation_id) or exists(select 1 from familyconnect.conversation_members m where m.conversation_id=notifications.conversation_id and m.user_id=auth.uid() and m.status='invited')));
-- Security-definer queries below apply the same predicates; no raw sensitive table grants.
create policy readable_posts on familyconnect.posts for select to authenticated using(familyconnect.social_post(id));
create policy readable_media on familyconnect.post_media for select to authenticated using(familyconnect.social_asset(id));
create policy readable_comments on familyconnect.comments for select to authenticated using(familyconnect.social_post(post_id));
create policy readable_reactions on familyconnect.reactions for select to authenticated using(familyconnect.social_post(post_id));
create policy readable_conversations on familyconnect.conversations for select to authenticated using(familyconnect.social_chat(id));
create policy readable_messages on familyconnect.messages for select to authenticated using(familyconnect.social_chat(conversation_id));
create policy own_blocks on familyconnect.blocks for select to authenticated using(user_id=auth.uid());
create policy own_reports on familyconnect.reports for select to authenticated using(reporter_id=auth.uid());
-- Never expose profile rows: each optional field is filtered by the API.
create policy own_profile on familyconnect.social_profiles for select to authenticated using(familyconnect.social_owner(person_id));
create policy own_chat_membership on familyconnect.conversation_members for select to authenticated using(user_id=auth.uid());
alter publication supabase_realtime add table familyconnect.notifications;

create function public.fc_social(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); n uuid:=(payload->>'network')::uuid; p uuid:=(payload->>'person')::uuid; target uuid:=(payload->>'target')::uuid; item uuid:=(payload->>'id')::uuid; other uuid; c familyconnect.conversations; post familyconnect.posts; result jsonb; m familyconnect.conversation_members; count_limit int; asset uuid;
begin
 if u is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,7));
 if action in('save_profile','create_post','publish_post','edit_post','delete_post','like','comment','delete_comment','create_chat','invite_member','accept_chat','decline_chat','send_message','delete_message','leave_chat','remove_member','chat_privacy','block','unblock','report','reserve_media','delete_media') then
  count_limit:=case when action='send_message' then 60 when action='reserve_media' then 30 else 40 end;
  if (select count(*) from familyconnect.social_limits where user_id=u and created_at>now()-interval '1 minute' and social_limits.action=fc_social.action)>=count_limit then raise exception 'Please slow down';end if;
  insert into familyconnect.social_limits(user_id,action) values(u,action);
 end if;
 if action='save_profile' then
  if not familyconnect.social_owner(p) then raise exception 'Verified adult profile required';end if;
  insert into familyconnect.social_profiles values(p,trim(payload->>'name'),coalesce(payload->>'bio',''),coalesce(payload->>'location',''),coalesce(payload->>'birthday',''),coalesce((payload->>'share_bio')::boolean,false),coalesce((payload->>'share_location')::boolean,false),coalesce((payload->>'share_birthday')::boolean,false),coalesce((payload->>'share_photo')::boolean,false)) on conflict(person_id) do update set display_name=excluded.display_name,bio=excluded.bio,location=excluded.location,birthday=excluded.birthday,share_bio=excluded.share_bio,share_location=excluded.share_location,share_birthday=excluded.share_birthday,share_photo=excluded.share_photo;
 elsif action='create_post' then
  if not familyconnect.social_owner(p) or not familyconnect.social_adult(p,n) then raise exception 'Authorized author required';end if;
  insert into familyconnect.posts(network_id,author_id,body) values(n,p,coalesce(payload->>'body','')) returning id into item;
 elsif action in('publish_post','edit_post','delete_post') then
  select * into post from familyconnect.posts where id=item for update;
  if not found or not familyconnect.social_owner(post.author_id) then raise exception 'Post owner required';end if;
  if action='delete_post' then delete from familyconnect.posts where id=item;
  elsif action='edit_post' then update familyconnect.posts set body=trim(payload->>'body'),updated_at=now() where id=item;
  else
   if trim(post.body)='' and not exists(select 1 from familyconnect.post_media where post_id=item and ready) then raise exception 'Write something or add a photo';end if;
   update familyconnect.posts set status='published',updated_at=now() where id=item;
  end if;
 elsif action in('like','comment','delete_comment') then
  if action='delete_comment' then
   select author_id,post_id into p,target from familyconnect.comments where id=item;
   if not familyconnect.social_owner(p) or not familyconnect.social_post(target) then raise exception 'Comment owner required';end if;
   delete from familyconnect.comments where id=item;
  else
   if not familyconnect.social_post(item) or not exists(select 1 from familyconnect.posts where id=item and status='published') then raise exception 'Post unavailable';end if;
   if action='like' then
    if exists(select 1 from familyconnect.reactions where post_id=item and user_id=u) then delete from familyconnect.reactions where post_id=item and user_id=u;else insert into familyconnect.reactions values(item,u);end if;
   else
    select network_id into n from familyconnect.posts where id=item;
    if not familyconnect.social_owner(p) or not familyconnect.social_adult(p,n) then raise exception 'Authorized author required';end if;
    insert into familyconnect.comments(post_id,author_id,body) values(item,p,trim(payload->>'body'));
   end if;
  end if;
 elsif action='create_chat' then
  if not familyconnect.social_owner(p) or not familyconnect.social_adult(p,n) then raise exception 'Verified adult required';end if;
  if payload->>'kind' not in('direct','group') then raise exception 'Invalid conversation';end if;
  if payload->>'kind'='direct' then
   select user_id into other from familyconnect.person_accounts where person_id=target;
   if other is null or other=u or not familyconnect.social_adult(target,n) or familyconnect.social_blocked(u,other) then raise exception 'Recipient unavailable';end if;
  end if;
  insert into familyconnect.conversations(network_id,kind,name,creator_id) values(n,payload->>'kind',trim(payload->>'name'),u) returning id into item;
  insert into familyconnect.conversation_members values(item,u,p,'admin','accepted',now());
  if other is not null then insert into familyconnect.conversation_members values(item,other,target,'member','invited',now());insert into familyconnect.notifications(user_id,conversation_id,kind) values(other,item,'invitation');end if;
 elsif action in('invite_member','accept_chat','decline_chat','send_message','leave_chat','remove_member','chat_privacy','read_chat','report') then
  select * into c from familyconnect.conversations where id=item for update;
  select * into m from familyconnect.conversation_members where conversation_id=item and user_id=u;
  if c.id is null or m.user_id is null or not familyconnect.social_reader(c.network_id) or not familyconnect.social_adult(m.person_id,c.network_id) then raise exception 'Conversation unavailable';end if;
  if action in('accept_chat','decline_chat') then
   if m.status<>'invited' or familyconnect.social_blocked(u,c.creator_id) then raise exception 'Invitation unavailable';end if;
   update familyconnect.conversation_members set status=case when action='accept_chat' then 'accepted' else 'declined' end,last_read=now() where conversation_id=item and user_id=u;
   delete from familyconnect.notifications where user_id=u and conversation_id=item;
  else
   if not familyconnect.social_chat(item) then raise exception 'Accepted membership required';end if;
   if action='invite_member' then
    if c.kind<>'group' or (c.admins_only_invite and m.role<>'admin') then raise exception 'Group administrator required';end if;
    select user_id into other from familyconnect.person_accounts where person_id=target;
    if other is null or other=u or not familyconnect.social_adult(target,c.network_id) or familyconnect.social_blocked(u,other) then raise exception 'Recipient unavailable';end if;
    if (select count(*) from familyconnect.conversation_members where conversation_id=item and status in('accepted','invited'))>=50 then raise exception 'Group size limit reached';end if;
    insert into familyconnect.conversation_members values(item,other,target,'member','invited',now()) on conflict(conversation_id,user_id) do update set status='invited',role='member' where conversation_members.status in('left','removed','declined');
    insert into familyconnect.notifications(user_id,conversation_id,kind) values(other,item,'invitation');
   elsif action='send_message' then
    if exists(select 1 from familyconnect.conversation_members where conversation_id=item and status='accepted' and familyconnect.social_blocked(u,user_id)) then raise exception 'A block prevents sending in this conversation';end if;
    insert into familyconnect.messages(conversation_id,sender_id,body) values(item,u,trim(payload->>'body'));
    insert into familyconnect.notifications(user_id,conversation_id,kind) select user_id,item,'message' from familyconnect.conversation_members where conversation_id=item and status='accepted' and user_id<>u;
   elsif action='read_chat' then update familyconnect.conversation_members set last_read=now() where conversation_id=item and user_id=u;delete from familyconnect.notifications where user_id=u and conversation_id=item;
   elsif action in('leave_chat','remove_member') then
    other:=case when action='leave_chat' then u else target end;
    if action='remove_member' and (c.kind<>'group' or m.role<>'admin' or other=c.creator_id) then raise exception 'Group administrator required';end if;
    if other=u and m.role='admin' and exists(select 1 from familyconnect.conversation_members where conversation_id=item and user_id<>u and status='accepted') and not exists(select 1 from familyconnect.conversation_members where conversation_id=item and user_id<>u and status='accepted' and role='admin') then raise exception 'Remove other members before the last administrator leaves';end if;
    update familyconnect.conversation_members set status=case when action='leave_chat' then 'left' else 'removed' end where conversation_id=item and user_id=other;
    delete from familyconnect.notifications where user_id=other and conversation_id=item;
   elsif action='chat_privacy' then
    if c.kind<>'group' or m.role<>'admin' then raise exception 'Group administrator required';end if;
    update familyconnect.conversations set admins_only_invite=coalesce((payload->>'admins_only')::boolean,true) where id=item;
   elsif action='report' then
    if target is not null and not exists(select 1 from familyconnect.messages where id=target and conversation_id=item) then raise exception 'Message unavailable';end if;
    insert into familyconnect.reports(reporter_id,conversation_id,message_id,reason) values(u,item,target,trim(payload->>'reason'));
   end if;
  end if;
 elsif action='delete_message' then
  select conversation_id,sender_id into target,other from familyconnect.messages where id=item;
  if other is distinct from u or not familyconnect.social_chat(target) then raise exception 'Message owner required';end if;
  update familyconnect.messages set body='Message deleted',deleted=true where id=item;
 elsif action in('block','unblock') then
  select a.user_id into other from familyconnect.person_accounts a join familyconnect.people p1 on p1.id=a.person_id where a.person_id=target and p1.age_class='adult' and familyconnect.social_reader(p1.network_id);
  if other is null or other=u then raise exception 'Recipient unavailable';end if;
  if action='block' then insert into familyconnect.blocks values(u,other) on conflict do nothing;else delete from familyconnect.blocks where user_id=u and blocked_id=other;end if;
 elsif action='reserve_media' then
  if (payload->>'post') is not null then
   select * into post from familyconnect.posts where id=(payload->>'post')::uuid for update;
   if not found or not familyconnect.social_owner(post.author_id) then raise exception 'Post owner required';end if;
   if (select count(*) from familyconnect.post_media where post_id=post.id)>=5 then raise exception 'Five photos maximum';end if;
  elsif not familyconnect.social_owner(p) then raise exception 'Profile owner required';end if;
  asset:=gen_random_uuid();
  insert into familyconnect.post_media(id,post_id,person_id,owner_id,path,thumbnail) values(asset,post.id,case when post.id is null then p end,u,asset::text||'/image.webp',asset::text||'/thumbnail.webp');item:=asset;
 elsif action='delete_media' then
  if not exists(select 1 from familyconnect.post_media where id=item and owner_id=u and (familyconnect.social_owner(person_id) or post_id in(select id from familyconnect.posts where familyconnect.social_owner(author_id)))) then raise exception 'Media owner required';end if;
  delete from familyconnect.post_media where id=item;
 else raise exception 'Unknown social action';end if;
 return jsonb_build_object('id',item,'ok',true);
end$$;

create function public.fc_social_view(network uuid, person uuid default null, conversation uuid default null, before_at timestamptz default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; profile jsonb; feed jsonb; chats jsonb; history jsonb; members jsonb; directory jsonb;
begin
 if auth.uid() is null or not familyconnect.social_reader(network) then raise exception 'Verified adult family membership required';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',coalesce(s.display_name,p.first_name||' '||p.last_name),'mine',a.user_id=auth.uid(),'blocked',exists(select 1 from familyconnect.blocks where user_id=auth.uid() and blocked_id=a.user_id),'photo',(select path from familyconnect.post_media where person_id=p.id and familyconnect.social_asset(id)))),'[]') into directory from familyconnect.people p join familyconnect.person_accounts a on a.person_id=p.id left join familyconnect.social_profiles s on s.person_id=p.id where p.network_id=network and familyconnect.social_adult(p.id,network);
 if person is not null then
  select jsonb_build_object('id',p.id,'name',coalesce(s.display_name,p.first_name||' '||p.last_name),'mine',familyconnect.social_owner(p.id),'bio',case when s.share_bio or familyconnect.social_owner(p.id) then s.bio else '' end,'location',case when s.share_location or familyconnect.social_owner(p.id) then s.location else '' end,'birthday',case when s.share_birthday or familyconnect.social_owner(p.id) then s.birthday else '' end,'share_bio',coalesce(s.share_bio,false),'share_location',coalesce(s.share_location,false),'share_birthday',coalesce(s.share_birthday,false),'share_photo',coalesce(s.share_photo,false),'photo',(select path from familyconnect.post_media where person_id=p.id and familyconnect.social_asset(id))) into profile from familyconnect.people p left join familyconnect.social_profiles s on s.person_id=p.id where p.id=person and p.network_id=network and familyconnect.social_adult(p.id,network);
 end if;
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into feed from (
  select p.*,familyconnect.social_owner(p.author_id) as mine,coalesce(s.display_name,a.first_name||' '||a.last_name) as author,
   (select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'path',m.path,'thumbnail',m.thumbnail,'width',m.width,'height',m.height)),'[]') from familyconnect.post_media m where m.post_id=p.id and m.ready) as media,
   (select count(*) from familyconnect.reactions where post_id=p.id) as likes,exists(select 1 from familyconnect.reactions where post_id=p.id and user_id=auth.uid()) as liked,
   (select coalesce(jsonb_agg(row_to_json(cm)),'[]') from (select c.id,c.body,c.created_at,coalesce(cs.display_name,cp.first_name||' '||cp.last_name) as author,familyconnect.social_owner(c.author_id) as mine from familyconnect.comments c join familyconnect.people cp on cp.id=c.author_id left join familyconnect.social_profiles cs on cs.person_id=cp.id where c.post_id=p.id order by c.created_at desc limit 20) cm) as comments
  from familyconnect.posts p join familyconnect.people a on a.id=p.author_id left join familyconnect.social_profiles s on s.person_id=a.id where p.network_id=network and p.status='published' and familyconnect.social_post(p.id) and (person is null or p.author_id=person) and (before_at is null or p.created_at<before_at) order by p.created_at desc,p.id limit 15
 ) x;
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into chats from (select c.*,m.role,m.status,(select count(*) from familyconnect.messages msg where msg.conversation_id=c.id and msg.created_at>m.last_read and msg.sender_id<>auth.uid()) as unread from familyconnect.conversations c join familyconnect.conversation_members m on m.conversation_id=c.id where c.network_id=network and m.user_id=auth.uid() and m.status in('accepted','invited') and familyconnect.social_adult(m.person_id,network) order by c.created_at desc limit 100) x;
 if conversation is not null then
  if not familyconnect.social_chat(conversation) or not exists(select 1 from familyconnect.conversations where id=conversation and network_id=network) then raise exception 'Accepted conversation membership required';end if;
  select coalesce(jsonb_agg(row_to_json(x)),'[]') into history from (select msg.id,msg.body,msg.deleted,msg.created_at,msg.sender_id=auth.uid() as mine,coalesce(s.display_name,p.first_name||' '||p.last_name) as author from familyconnect.messages msg join familyconnect.conversation_members m on m.conversation_id=msg.conversation_id and m.user_id=msg.sender_id join familyconnect.people p on p.id=m.person_id left join familyconnect.social_profiles s on s.person_id=p.id where msg.conversation_id=conversation and (before_at is null or msg.created_at<before_at) order by msg.created_at desc,msg.id limit 30) x;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'person_id',m.person_id,'name',coalesce(s.display_name,p.first_name||' '||p.last_name),'role',m.role,'status',m.status,'mine',m.user_id=auth.uid())),'[]') into members from familyconnect.conversation_members m join familyconnect.people p on p.id=m.person_id left join familyconnect.social_profiles s on s.person_id=p.id where m.conversation_id=conversation and m.status in('invited','accepted');
 end if;
 return jsonb_build_object('directory',directory,'profile',profile,'posts',feed,'chats',chats,'messages',coalesce(history,'[]'),'members',coalesce(members,'[]'));
end$$;

-- Upload worker alone can finalize sanitized images; client never receives its key.
create function public.fc_media_complete(asset uuid,w int,h int,size_bytes int) returns void language plpgsql security definer set search_path='' as $$begin
 if auth.role()<>'service_role' then raise exception 'Media worker required';end if;
 if w<1 or h<1 or w>1600 or h>1600 or size_bytes<1 or size_bytes>1500000 then raise exception 'Invalid processed image';end if;
 update familyconnect.post_media set ready=true,width=w,height=h,bytes=size_bytes where id=asset;
end$$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('family-private','family-private',false,1500000,array['image/webp']);
create policy social_private_images on storage.objects for select to authenticated using(bucket_id='family-private' and exists(select 1 from familyconnect.post_media m where (m.path=name or m.thumbnail=name) and familyconnect.social_asset(m.id)));
-- Storage policy needs a narrowly filtered view helper, not raw media-table access.
create function familyconnect.social_storage(path text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.post_media m where (m.path=path or m.thumbnail=path) and familyconnect.social_asset(m.id));$$;
drop policy social_private_images on storage.objects;
create policy social_private_images on storage.objects for select to authenticated using(bucket_id='family-private' and familyconnect.social_storage(name));
-- Do not grant newly introduced internal functions by default.
revoke all on function public.fc_social(text,jsonb),public.fc_social_view(uuid,uuid,uuid,timestamptz),public.fc_media_complete(uuid,int,int,int) from public,anon,authenticated;
grant execute on function public.fc_social(text,jsonb),public.fc_social_view(uuid,uuid,uuid,timestamptz) to authenticated;
grant execute on function public.fc_media_complete(uuid,int,int,int) to service_role;
revoke all on function familyconnect.social_owner(uuid),familyconnect.social_adult(uuid,uuid),familyconnect.social_blocked(uuid,uuid),familyconnect.social_reader(uuid),familyconnect.social_post(uuid),familyconnect.social_chat(uuid),familyconnect.social_asset(uuid),familyconnect.social_storage(text) from public,anon,authenticated;
grant execute on function familyconnect.social_storage(text),familyconnect.social_chat(uuid) to authenticated;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000800_social.sql','7a18f4244eecc42e600a24da20e1c41991e30630f9c516371697a782be518aac');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021000900_social_notification_guard.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021000900_social_notification_guard.sql' and sha256='bf65703442ff83ae4424c43b4a5feea11e2a0061740b4eefaca25cf4e1fde7a1') then raise exception 'Migration checksum mismatch: 20261021000900_social_notification_guard.sql'; end if;
      else
        execute $fc_ddl$create function familyconnect.social_notification(c uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.conversation_members m join familyconnect.conversations x on x.id=m.conversation_id where m.conversation_id=c and m.user_id=auth.uid() and m.status in('accepted','invited') and familyconnect.social_reader(x.network_id) and familyconnect.social_adult(m.person_id,x.network_id));$$;
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
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021000900_social_notification_guard.sql','bf65703442ff83ae4424c43b4a5feea11e2a0061740b4eefaca25cf4e1fde7a1');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021001000_social_pagination.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021001000_social_pagination.sql' and sha256='908f7f2f4f31e76bd717c729d054b7d0092b029024b0cef835d0ef75f98c0c34') then raise exception 'Migration checksum mismatch: 20261021001000_social_pagination.sql'; end if;
      else
        execute $fc_ddl$drop function public.fc_social_view(uuid,uuid,uuid,timestamptz);
create function public.fc_social_view(network uuid, person uuid default null, conversation uuid default null, before_at timestamptz default null, before_id uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; profile jsonb; feed jsonb; chats jsonb; history jsonb; members jsonb; directory jsonb;
begin
 if auth.uid() is null or not familyconnect.social_reader(network) then raise exception 'Verified adult family membership required';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',coalesce(s.display_name,p.first_name||' '||p.last_name),'mine',a.user_id=auth.uid(),'blocked',exists(select 1 from familyconnect.blocks where user_id=auth.uid() and blocked_id=a.user_id),'photo',(select path from familyconnect.post_media where person_id=p.id and familyconnect.social_asset(id)))),'[]') into directory from familyconnect.people p join familyconnect.person_accounts a on a.person_id=p.id left join familyconnect.social_profiles s on s.person_id=p.id where p.network_id=network and familyconnect.social_adult(p.id,network);
 if person is not null then
  select jsonb_build_object('id',p.id,'name',coalesce(s.display_name,p.first_name||' '||p.last_name),'mine',familyconnect.social_owner(p.id),'bio',case when s.share_bio or familyconnect.social_owner(p.id) then s.bio else '' end,'location',case when s.share_location or familyconnect.social_owner(p.id) then s.location else '' end,'birthday',case when s.share_birthday or familyconnect.social_owner(p.id) then s.birthday else '' end,'share_bio',coalesce(s.share_bio,false),'share_location',coalesce(s.share_location,false),'share_birthday',coalesce(s.share_birthday,false),'share_photo',coalesce(s.share_photo,false),'photo',(select path from familyconnect.post_media where person_id=p.id and familyconnect.social_asset(id))) into profile from familyconnect.people p left join familyconnect.social_profiles s on s.person_id=p.id where p.id=person and p.network_id=network and familyconnect.social_adult(p.id,network);
 end if;
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into feed from (
  select p.*,familyconnect.social_owner(p.author_id) as mine,coalesce(s.display_name,a.first_name||' '||a.last_name) as author,
   (select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'path',m.path,'thumbnail',m.thumbnail,'width',m.width,'height',m.height)),'[]') from familyconnect.post_media m where m.post_id=p.id and m.ready) as media,
   (select count(*) from familyconnect.reactions where post_id=p.id) as likes,exists(select 1 from familyconnect.reactions where post_id=p.id and user_id=auth.uid()) as liked,
   (select coalesce(jsonb_agg(row_to_json(cm)),'[]') from (select c.id,c.body,c.created_at,coalesce(cs.display_name,cp.first_name||' '||cp.last_name) as author,familyconnect.social_owner(c.author_id) as mine from familyconnect.comments c join familyconnect.people cp on cp.id=c.author_id left join familyconnect.social_profiles cs on cs.person_id=cp.id where c.post_id=p.id order by c.created_at desc limit 20) cm) as comments
  from familyconnect.posts p join familyconnect.people a on a.id=p.author_id left join familyconnect.social_profiles s on s.person_id=a.id where p.network_id=network and p.status='published' and familyconnect.social_post(p.id) and (person is null or p.author_id=person) and (before_at is null or (p.created_at,p.id)<(before_at,coalesce(before_id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))) order by p.created_at desc,p.id desc limit 15
 ) x;
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into chats from (select c.*,m.role,m.status,(select count(*) from familyconnect.messages msg where m.status='accepted' and msg.conversation_id=c.id and msg.created_at>m.last_read and msg.sender_id<>auth.uid()) as unread from familyconnect.conversations c join familyconnect.conversation_members m on m.conversation_id=c.id where c.network_id=network and m.user_id=auth.uid() and m.status in('accepted','invited') and familyconnect.social_adult(m.person_id,network) order by c.created_at desc limit 100) x;
 if conversation is not null then
  if not familyconnect.social_chat(conversation) or not exists(select 1 from familyconnect.conversations where id=conversation and network_id=network) then raise exception 'Accepted conversation membership required';end if;
  select coalesce(jsonb_agg(row_to_json(x)),'[]') into history from (select msg.id,msg.body,msg.deleted,msg.created_at,msg.sender_id=auth.uid() as mine,coalesce(s.display_name,p.first_name||' '||p.last_name) as author from familyconnect.messages msg join familyconnect.conversation_members m on m.conversation_id=msg.conversation_id and m.user_id=msg.sender_id join familyconnect.people p on p.id=m.person_id left join familyconnect.social_profiles s on s.person_id=p.id where msg.conversation_id=conversation and (before_at is null or (msg.created_at,msg.id)<(before_at,coalesce(before_id,'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid))) order by msg.created_at desc,msg.id desc limit 30) x;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'person_id',m.person_id,'name',coalesce(s.display_name,p.first_name||' '||p.last_name),'role',m.role,'status',m.status,'mine',m.user_id=auth.uid())),'[]') into members from familyconnect.conversation_members m join familyconnect.people p on p.id=m.person_id left join familyconnect.social_profiles s on s.person_id=p.id where m.conversation_id=conversation and m.status in('invited','accepted');
 end if;
 return jsonb_build_object('directory',directory,'profile',profile,'posts',feed,'chats',chats,'messages',coalesce(history,'[]'),'members',coalesce(members,'[]'));
end$$;


revoke all on function public.fc_social_view(uuid,uuid,uuid,timestamptz,uuid) from public,anon;
grant execute on function public.fc_social_view(uuid,uuid,uuid,timestamptz,uuid) to authenticated;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021001000_social_pagination.sql','908f7f2f4f31e76bd717c729d054b7d0092b029024b0cef835d0ef75f98c0c34');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021001100_social_retention.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021001100_social_retention.sql' and sha256='fd8f550f74d0181ecfa6793aa5a393b9993364da9095bfcdb819d91fc5d66fd5') then raise exception 'Migration checksum mismatch: 20261021001100_social_retention.sql'; end if;
      else
        execute $fc_ddl$-- Local worker maintenance: inaccessible to browser roles. Storage bytes are
-- removed through the Storage API, never by deleting storage catalog rows.
create function public.fc_social_maintenance() returns jsonb language plpgsql security definer set search_path='' as $$declare paths jsonb;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Worker required';end if;
 delete from familyconnect.social_limits where created_at<now()-interval '1 day';
 delete from familyconnect.notifications where created_at<now()-interval '30 days';
 delete from familyconnect.posts where status='draft' and updated_at<now()-interval '30 days';
 delete from familyconnect.post_media where not ready and created_at<now()-interval '1 day';
 select coalesce(jsonb_agg(name),'[]') into paths from (select o.name from storage.objects o where o.bucket_id='family-private' and o.created_at<now()-interval '1 day' and not exists(select 1 from familyconnect.post_media m where m.path=o.name or m.thumbnail=o.name) order by o.created_at limit 500) candidates;
 return paths;
end$$;
revoke all on function public.fc_social_maintenance() from public,anon,authenticated;
grant execute on function public.fc_social_maintenance() to service_role;
-- Avoid impossible birthdays while deliberately omitting birth year.
alter table familyconnect.social_profiles add constraint valid_birthday check(birthday='' or (substring(birthday,1,2)::int between 1 and 12 and substring(birthday,4,2)::int between 1 and case substring(birthday,1,2)::int when 2 then 29 when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30 else 31 end));
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021001100_social_retention.sql','fd8f550f74d0181ecfa6793aa5a393b9993364da9095bfcdb819d91fc5d66fd5');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021001200_storage_exact_path.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021001200_storage_exact_path.sql' and sha256='63e7cf5388bfb94288039fd8840978ff5624d0c53ede014144b9859612f3e958') then raise exception 'Migration checksum mismatch: 20261021001200_storage_exact_path.sql'; end if;
      else
        execute $fc_ddl$-- SQL arguments must not be shadowed by column names. Authorize the exact
-- requested object, not the existence of any visible asset in the bucket.
create or replace function familyconnect.social_storage(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.post_media m where (m.path=$1 or m.thumbnail=$1) and familyconnect.social_asset(m.id));
$$;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021001200_storage_exact_path.sql','63e7cf5388bfb94288039fd8840978ff5624d0c53ede014144b9859612f3e958');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021001300_media_finalize_and_message_deletion.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021001300_media_finalize_and_message_deletion.sql' and sha256='fd9f51aab9d319aec7632d5534fb34fe060e3b2ce7344a12996a36c2cef9e691') then raise exception 'Migration checksum mismatch: 20261021001300_media_finalize_and_message_deletion.sql'; end if;
      else
        execute $fc_ddl$create or replace function public.fc_media_complete(asset uuid,w int,h int,size_bytes int) returns void language plpgsql security definer set search_path='' as $$begin
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
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021001300_media_finalize_and_message_deletion.sql','fd9f51aab9d319aec7632d5534fb34fe060e3b2ce7344a12996a36c2cef9e691');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021001400_family_businesses.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021001400_family_businesses.sql' and sha256='18c4aff74c5803db25c7b0f4678cc65397dcdc8c06920361954db0da6d2d7509') then raise exception 'Migration checksum mismatch: 20261021001400_family_businesses.sql'; end if;
      else
        execute $fc_ddl$-- Isolated Family Business Directory. No legacy global-read policies reused.
create table familyconnect.businesses(
 id uuid primary key default gen_random_uuid(),network_id uuid not null references familyconnect.networks(id),primary_person_id uuid not null,
 name text not null check(length(trim(name)) between 1 and 100),description text not null default '' check(length(description)<=3000),
 category text not null check(category in('Food & hospitality','Home & garden','Professional services','Arts & crafts','Health & wellbeing','Retail','Education','Technology','Other')),
 services text not null default '' check(length(services)<=1500),service_area text not null default '' check(length(service_area)<=200),
 contact_email text not null default '' check(contact_email='' or contact_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
 contact_phone text not null default '' check(contact_phone='' or contact_phone ~ '^[+0-9() .-]{5,40}$'),share_contacts boolean not null default false,
 offer text not null default '' check(length(offer)<=1000),offer_until date,
 moderation text not null default 'pending' check(moderation in('pending','approved','rejected','suspended')),hidden boolean not null default true,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),revision int not null default 1,
 foreign key(network_id,primary_person_id) references familyconnect.people(network_id,id)
);
create index business_directory on familyconnect.businesses(network_id,moderation,hidden,name,id);
create table familyconnect.business_owners(
 business_id uuid not null references familyconnect.businesses(id) on delete cascade,person_id uuid not null references familyconnect.people(id),
 status text not null check(status in('invited','accepted','verified','declined','removed')),invited_by uuid references auth.users(id),verified_by uuid references auth.users(id),verified_at timestamptz,
 primary key(business_id,person_id)
);
create table familyconnect.business_links(
 id uuid primary key default gen_random_uuid(),business_id uuid not null references familyconnect.businesses(id) on delete cascade,
 label text not null check(length(trim(label)) between 1 and 60),kind text not null check(kind in('website','social','booking','shop','other')),
 url text not null check(length(url)<=1000 and url ~ '^https://[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]{1,5})?([/?#][^[:space:]\\]*)?$'),position int not null
);
create index business_links_parent on familyconnect.business_links(business_id);
create table familyconnect.business_media(
 id uuid primary key default gen_random_uuid(),business_id uuid not null references familyconnect.businesses(id) on delete cascade,owner_id uuid not null references auth.users(id),
 kind text not null check(kind in('logo','photo')),path text not null unique,thumbnail text not null unique,ready boolean not null default false,width int,height int,bytes int,created_at timestamptz not null default now()
);
create unique index business_one_logo on familyconnect.business_media(business_id) where kind='logo';
create table familyconnect.business_reviews(id bigint generated always as identity primary key,business_id uuid not null references familyconnect.businesses(id) on delete cascade,reviewer_id uuid not null references auth.users(id),person_id uuid references familyconnect.people(id),decision text not null,note text not null check(length(note) between 10 and 1000),created_at timestamptz not null default now());
create table familyconnect.business_reports(id uuid primary key default gen_random_uuid(),business_id uuid not null references familyconnect.businesses(id) on delete cascade,reporter_id uuid not null references auth.users(id),reason text not null check(length(trim(reason)) between 10 and 1000),resolved boolean not null default false,resolved_by uuid references auth.users(id),created_at timestamptz not null default now());

create function familyconnect.business_manage(b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.businesses x join familyconnect.business_owners o on o.business_id=x.id where x.id=$1 and familyconnect.social_owner(o.person_id) and familyconnect.social_adult(o.person_id,x.network_id) and (o.status='verified' or (o.person_id=x.primary_person_id and o.status='accepted')));
$$;
create function familyconnect.business_moderator(b uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.businesses x where x.id=$1 and familyconnect.member(x.network_id,array['admin']));$$;
create function familyconnect.business_read(b uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.businesses x where x.id=$1 and familyconnect.member(x.network_id) and ((x.moderation='approved' and not x.hidden and exists(select 1 from familyconnect.business_owners o where o.business_id=x.id and o.status='verified' and familyconnect.social_adult(o.person_id,x.network_id))) or familyconnect.business_manage(x.id) or familyconnect.business_moderator(x.id)));
$$;
create function familyconnect.business_storage(object_path text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from familyconnect.business_media m where (m.path=$1 or m.thumbnail=$1) and m.ready and familyconnect.business_read(m.business_id));$$;
do $$declare t text;begin foreach t in array array['businesses','business_owners','business_links','business_media','business_reviews','business_reports'] loop execute format('alter table familyconnect.%I enable row level security',t);execute format('revoke all on familyconnect.%I from public,anon,authenticated',t);end loop;end$$;
create policy business_read on familyconnect.businesses for select to authenticated using(familyconnect.business_read(id));
create policy business_links_read on familyconnect.business_links for select to authenticated using(familyconnect.business_read(business_id));
create policy business_media_read on familyconnect.business_media for select to authenticated using(familyconnect.business_read(business_id));
-- Owner/review/report tables deliberately have no browser policies or grants.
-- Narrow RPCs expose only appropriate fields, not raw Auth IDs or private notes.
create policy business_private_images on storage.objects for select to authenticated using(bucket_id='family-private' and familyconnect.business_storage(name));
revoke all on function familyconnect.business_manage(uuid),familyconnect.business_moderator(uuid),familyconnect.business_read(uuid),familyconnect.business_storage(text) from public,anon,authenticated;
grant execute on function familyconnect.business_storage(text) to authenticated;

create function public.fc_business(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); item uuid:=(payload->>'id')::uuid; n uuid:=(payload->>'network')::uuid; p uuid:=(payload->>'person')::uuid; b familyconnect.businesses; link jsonb; pos int:=0; asset uuid; decision text:=payload->>'decision';
begin
 if u is null then raise exception 'Sign in required';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,14));
 if (select count(*) from familyconnect.social_limits where user_id=u and social_limits.action='business:'||fc_business.action and created_at>now()-interval '1 minute')>=20 then raise exception 'Please slow down';end if;
 insert into familyconnect.social_limits(user_id,action) values(u,'business:'||action);
 if action='create' then
  if not familyconnect.social_owner(p) or not familyconnect.social_adult(p,n) then raise exception 'Verified adult contributor profile required';end if;
  if not coalesce((payload->>'owner_consent')::boolean,false) then raise exception 'Approve displaying your ownership in this family directory';end if;
  insert into familyconnect.businesses(network_id,primary_person_id,name,category) values(n,p,trim(payload->>'name'),payload->>'category') returning id into item;
  insert into familyconnect.business_owners values(item,p,'accepted',u,null,null);
 else
  select * into b from familyconnect.businesses where id=item for update;
  if b.id is null or not familyconnect.member(b.network_id) then raise exception 'Listing unavailable';end if;
  if action in('save','hide','publish','delete','invite_owner','remove_owner','reserve_media','delete_media') then
   if not familyconnect.business_manage(item) then raise exception 'Authorized business owner required';end if;
   if action='save' then
    if (payload->>'revision')::int is distinct from b.revision then raise exception 'This listing changed. Reload before saving';end if;
    if jsonb_typeof(payload->'links') is distinct from 'array' or jsonb_array_length(payload->'links')>12 then raise exception 'Provide up to twelve links';end if;
    update familyconnect.businesses set name=trim(payload->>'name'),description=coalesce(payload->>'description',''),category=payload->>'category',services=coalesce(payload->>'services',''),service_area=coalesce(payload->>'service_area',''),contact_email=coalesce(payload->>'contact_email',''),contact_phone=coalesce(payload->>'contact_phone',''),share_contacts=coalesce((payload->>'share_contacts')::boolean,false),offer=coalesce(payload->>'offer',''),offer_until=nullif(payload->>'offer_until','')::date,moderation=case when moderation='suspended' then 'suspended' else 'pending' end,hidden=true,revision=revision+1,updated_at=now() where id=item;
    delete from familyconnect.business_links where business_id=item;
    for link in select value from jsonb_array_elements(payload->'links') loop
     insert into familyconnect.business_links(business_id,label,kind,url,position) values(item,trim(link->>'label'),link->>'kind',link->>'url',pos);pos:=pos+1;
    end loop;
   elsif action='hide' then update familyconnect.businesses set hidden=true,revision=revision+1,updated_at=now() where id=item;
   elsif action='publish' then
    if b.moderation<>'approved' then raise exception 'Independent review required before publishing';end if;
    update familyconnect.businesses set hidden=false,revision=revision+1,updated_at=now() where id=item;
   elsif action='delete' then delete from familyconnect.businesses where id=item;
   elsif action='invite_owner' then
    if p=b.primary_person_id or not familyconnect.social_adult(p,b.network_id) then raise exception 'Choose another verified adult in this network';end if;
    insert into familyconnect.business_owners values(item,p,'invited',u,null,null) on conflict(business_id,person_id) do update set status='invited',invited_by=u,verified_by=null,verified_at=null where business_owners.status in('declined','removed');
   elsif action='remove_owner' then
    if p=b.primary_person_id then raise exception 'Primary owner cannot be removed; delete the listing instead';end if;
    update familyconnect.business_owners set status='removed',verified_by=null,verified_at=null where business_id=item and person_id=p;
   elsif action='reserve_media' then
    if payload->>'kind' not in('logo','photo') then raise exception 'Invalid image kind';end if;
    if payload->>'kind'='photo' and (select count(*) from familyconnect.business_media where business_id=item and kind='photo')>=5 then raise exception 'Five photographs maximum';end if;
    asset:=gen_random_uuid();insert into familyconnect.business_media(id,business_id,owner_id,kind,path,thumbnail) values(asset,item,u,payload->>'kind',asset::text||'/image.webp',asset::text||'/thumbnail.webp');
    update familyconnect.businesses set moderation=case when moderation='suspended' then 'suspended' else 'pending' end,hidden=true,revision=revision+1 where id=item;
    return jsonb_build_object('id',asset);
   elsif action='delete_media' then delete from familyconnect.business_media where id=(payload->>'asset')::uuid and business_id=item;end if;
  elsif action in('accept_owner','decline_owner') then
   if not familyconnect.social_owner(p) or not familyconnect.social_adult(p,b.network_id) or not exists(select 1 from familyconnect.business_owners where business_id=item and person_id=p and status='invited') then raise exception 'Personal ownership invitation required';end if;
   if action='accept_owner' and not coalesce((payload->>'owner_consent')::boolean,false) then raise exception 'Ownership display consent required';end if;
   update familyconnect.business_owners set status=case when action='accept_owner' then 'accepted' else 'declined' end where business_id=item and person_id=p;
  elsif action in('review','verify_owner','resolve_report') then
   if not familyconnect.business_moderator(item) then raise exception 'Network moderator required';end if;
   if action='verify_owner' or (action='review' and decision='approve') then
    if exists(select 1 from familyconnect.business_owners o join familyconnect.person_accounts a on a.person_id=o.person_id where o.business_id=item and a.user_id=u and o.status in('invited','accepted','verified')) then raise exception 'An independent moderator must verify ownership';end if;
   end if;
   if length(trim(coalesce(payload->>'note','')))<10 then raise exception 'Record the independent review evidence or moderation reason';end if;
   if action='verify_owner' then
    if not coalesce((payload->>'attested')::boolean,false) or not familyconnect.social_adult(p,b.network_id) then raise exception 'Verify the adult owner independently first';end if;
    update familyconnect.business_owners set status='verified',verified_by=u,verified_at=now() where business_id=item and person_id=p and status='accepted';
    if not found then raise exception 'Accepted ownership claim required';end if;
   elsif action='review' then
    if decision not in('approve','reject','suspend') then raise exception 'Invalid review decision';end if;
    if decision='approve' then
     if not coalesce((payload->>'attested')::boolean,false) or not familyconnect.social_adult(b.primary_person_id,b.network_id) then raise exception 'Verify listing and primary ownership independently first';end if;
     if exists(select 1 from familyconnect.business_media where business_id=item and not ready) then raise exception 'Remove or finish incomplete uploads before approval';end if;
     update familyconnect.business_owners set status='verified',verified_by=u,verified_at=now() where business_id=item and person_id=b.primary_person_id and status in('accepted','verified');
    end if;
    update familyconnect.businesses set moderation=case decision when 'approve' then 'approved' when 'reject' then 'rejected' else 'suspended' end,hidden=true,revision=revision+1,updated_at=now() where id=item;
   else update familyconnect.business_reports set resolved=true,resolved_by=u where business_id=item and id=(payload->>'report')::uuid;end if;
   insert into familyconnect.business_reviews(business_id,reviewer_id,person_id,decision,note) values(item,u,p,coalesce(decision,action),trim(payload->>'note'));
  elsif action='report' then
   if not familyconnect.business_read(item) then raise exception 'Listing unavailable';end if;
   insert into familyconnect.business_reports(business_id,reporter_id,reason) values(item,u,trim(payload->>'reason'));
  else raise exception 'Unknown business action';end if;
 end if;
 return jsonb_build_object('id',item,'ok',true);
end$$;

create function public.fc_business_view(network uuid,listing uuid default null,search text default '',category_filter text default '',after_name text default null,after_id uuid default null,mine boolean default false,review_queue boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare entries jsonb; detail jsonb; identities jsonb; invitations jsonb; choices jsonb; is_mod boolean;
begin
 if auth.uid() is null or not familyconnect.member(network) then raise exception 'Authorized family membership required';end if;
 if length(search)>100 then raise exception 'Search is too long';end if;
 is_mod:=familyconnect.member(network,array['admin']);
 if review_queue and not is_mod then raise exception 'Network moderator required';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name)),'[]') into identities from familyconnect.people p where p.network_id=network and familyconnect.social_owner(p.id);
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name)),'[]') into choices from familyconnect.people p where p.network_id=network and familyconnect.social_adult(p.id,network) and familyconnect.visible(p.id);
 select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'person',o.person_id,'status',o.status)),'[]') into invitations from familyconnect.business_owners o join familyconnect.businesses b on b.id=o.business_id where b.network_id=network and familyconnect.social_owner(o.person_id) and o.status in('invited','accepted');
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into entries from (
  select b.id,b.name,b.category,left(b.description,220) as description,b.service_area,b.moderation,b.hidden,b.revision,familyconnect.business_manage(b.id) as can_manage,
   case when b.offer_until is null or b.offer_until>=current_date then b.offer else '' end as offer,
   (select thumbnail from familyconnect.business_media where business_id=b.id and kind='logo' and ready) as logo,
   (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name)),'[]') from familyconnect.business_owners o join familyconnect.people p on p.id=o.person_id where o.business_id=b.id and o.status='verified' and familyconnect.social_adult(p.id,network) and familyconnect.visible(p.id)) as owners
  from familyconnect.businesses b where b.network_id=network and familyconnect.business_read(b.id)
   and (case when review_queue then b.moderation<>'approved' or exists(select 1 from familyconnect.business_owners where business_id=b.id and status='accepted') or exists(select 1 from familyconnect.business_reports where business_id=b.id and not resolved) when mine then familyconnect.business_manage(b.id) else b.moderation='approved' and not b.hidden end)
   and (category_filter='' or b.category=category_filter) and (search='' or (b.name||' '||b.description||' '||b.services||' '||b.service_area) ilike '%'||search||'%')
   and (after_name is null or (b.name,b.id)>(after_name,coalesce(after_id,'00000000-0000-0000-0000-000000000000'::uuid))) order by b.name,b.id limit 20
 ) x;
 if listing is not null then
  if not exists(select 1 from familyconnect.businesses b where b.id=listing and b.network_id=network and familyconnect.business_read(b.id)) then raise exception 'Listing unavailable';end if;
  select to_jsonb(b)||jsonb_build_object('can_manage',familyconnect.business_manage(b.id),'contact_email',case when b.share_contacts or familyconnect.business_manage(b.id) or is_mod then b.contact_email else '' end,'contact_phone',case when b.share_contacts or familyconnect.business_manage(b.id) or is_mod then b.contact_phone else '' end,'offer',case when b.offer_until is null or b.offer_until>=current_date or familyconnect.business_manage(b.id) then b.offer else '' end,
   'links',(select coalesce(jsonb_agg(to_jsonb(l) order by l.position),'[]') from familyconnect.business_links l where l.business_id=b.id),
   'media',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'kind',m.kind,'path',m.path,'thumbnail',m.thumbnail,'ready',m.ready)),'[]') from familyconnect.business_media m where m.business_id=b.id),
   'owners',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name,'status',o.status,'primary',p.id=b.primary_person_id)),'[]') from familyconnect.business_owners o join familyconnect.people p on p.id=o.person_id where o.business_id=b.id and familyconnect.visible(p.id) and familyconnect.social_adult(p.id,network) and (o.status='verified' or familyconnect.business_manage(b.id) or is_mod)),
   'reports',case when is_mod then (select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'reason',r.reason,'resolved',r.resolved)),'[]') from familyconnect.business_reports r where r.business_id=b.id) else '[]'::jsonb end,
   'reviews',case when is_mod or familyconnect.business_manage(b.id) then (select coalesce(jsonb_agg(jsonb_build_object('decision',r.decision,'note',r.note,'created_at',r.created_at)),'[]') from familyconnect.business_reviews r where r.business_id=b.id) else '[]'::jsonb end
  ) into detail from familyconnect.businesses b where b.id=listing;
 end if;
 return jsonb_build_object('listings',entries,'detail',detail,'my_people',identities,'owner_choices',choices,'invitations',invitations,'moderator',is_mod);
end$$;

create function public.fc_business_media_complete(asset uuid,w int,h int,size_bytes int) returns void language plpgsql security definer set search_path='' as $$declare m familyconnect.business_media;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Media worker required';end if;
 if w<1 or h<1 or w>1600 or h>1600 or size_bytes<1 or size_bytes>1500000 then raise exception 'Invalid processed image';end if;
 select * into m from familyconnect.business_media where id=asset;
 if not exists(select 1 from familyconnect.businesses b join familyconnect.business_owners o on o.business_id=b.id join familyconnect.person_accounts a on a.person_id=o.person_id join familyconnect.people p on p.id=o.person_id join familyconnect.memberships membership on membership.network_id=b.network_id and membership.user_id=a.user_id where b.id=m.business_id and a.user_id=m.owner_id and p.age_class='adult' and membership.role in('admin','contributor') and (o.status='verified' or (o.person_id=b.primary_person_id and o.status='accepted'))) then raise exception 'Upload authority no longer valid';end if;
 update familyconnect.business_media set ready=true,width=w,height=h,bytes=size_bytes where id=asset;
end$$;
revoke all on function public.fc_business(text,jsonb),public.fc_business_view(uuid,uuid,text,text,text,uuid,boolean,boolean),public.fc_business_media_complete(uuid,int,int,int) from public,anon,authenticated;
grant execute on function public.fc_business(text,jsonb),public.fc_business_view(uuid,uuid,text,text,text,uuid,boolean,boolean) to authenticated;
grant execute on function public.fc_business_media_complete(uuid,int,int,int) to service_role;

-- Preserve social retention, and protect all live directory images from GC.
create or replace function public.fc_social_maintenance() returns jsonb language plpgsql security definer set search_path='' as $$declare paths jsonb;begin
 if auth.role() is distinct from 'service_role' then raise exception 'Worker required';end if;
 delete from familyconnect.social_limits where created_at<now()-interval '1 day';
 delete from familyconnect.notifications where created_at<now()-interval '30 days';
 delete from familyconnect.posts where status='draft' and updated_at<now()-interval '30 days';
 delete from familyconnect.post_media where not ready and created_at<now()-interval '1 day';
 delete from familyconnect.business_media where not ready and created_at<now()-interval '1 day';
 select coalesce(jsonb_agg(name),'[]') into paths from (select o.name from storage.objects o where o.bucket_id='family-private' and o.created_at<now()-interval '1 day' and not exists(select 1 from familyconnect.post_media m where m.path=o.name or m.thumbnail=o.name) and not exists(select 1 from familyconnect.business_media m where m.path=o.name or m.thumbnail=o.name) order by o.created_at limit 500) candidates;
 return paths;
end$$;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021001400_family_businesses.sql','18c4aff74c5803db25c7b0f4678cc65397dcdc8c06920361954db0da6d2d7509');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261021001500_business_private_projection.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261021001500_business_private_projection.sql' and sha256='288fac7f19b80ae2e564f229d163dabfff13756d71c08271fa3a4dd1507e3138') then raise exception 'Migration checksum mismatch: 20261021001500_business_private_projection.sql'; end if;
      else
        execute $fc_ddl$-- Keep private owner identifiers out of the directory projection.
create or replace function public.fc_business_view(network uuid,listing uuid default null,search text default '',category_filter text default '',after_name text default null,after_id uuid default null,mine boolean default false,review_queue boolean default false) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare entries jsonb; detail jsonb; identities jsonb; invitations jsonb; choices jsonb; is_mod boolean;
begin
 if auth.uid() is null or not familyconnect.member(network) then raise exception 'Authorized family membership required';end if;
 if length(search)>100 then raise exception 'Search is too long';end if;
 is_mod:=familyconnect.member(network,array['admin']);
 if review_queue and not is_mod then raise exception 'Network moderator required';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name)),'[]') into identities from familyconnect.people p where p.network_id=network and familyconnect.social_owner(p.id);
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name)),'[]') into choices from familyconnect.people p where p.network_id=network and familyconnect.social_adult(p.id,network) and familyconnect.visible(p.id);
 select coalesce(jsonb_agg(jsonb_build_object('id',b.id,'name',b.name,'person',o.person_id,'status',o.status)),'[]') into invitations from familyconnect.business_owners o join familyconnect.businesses b on b.id=o.business_id where b.network_id=network and familyconnect.social_owner(o.person_id) and o.status in('invited','accepted');
 select coalesce(jsonb_agg(row_to_json(x)),'[]') into entries from (
  select b.id,b.name,b.category,left(b.description,220) as description,b.service_area,b.moderation,b.hidden,b.revision,familyconnect.business_manage(b.id) as can_manage,
   case when b.offer_until is null or b.offer_until>=current_date then b.offer else '' end as offer,
   (select thumbnail from familyconnect.business_media where business_id=b.id and kind='logo' and ready) as logo,
   (select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name)),'[]') from familyconnect.business_owners o join familyconnect.people p on p.id=o.person_id where o.business_id=b.id and o.status='verified' and familyconnect.social_adult(p.id,network) and familyconnect.visible(p.id)) as owners
  from familyconnect.businesses b where b.network_id=network and familyconnect.business_read(b.id)
   and (case when review_queue then b.moderation<>'approved' or exists(select 1 from familyconnect.business_owners where business_id=b.id and status='accepted') or exists(select 1 from familyconnect.business_reports where business_id=b.id and not resolved) when mine then familyconnect.business_manage(b.id) else b.moderation='approved' and not b.hidden end)
   and (category_filter='' or b.category=category_filter) and (search='' or (b.name||' '||b.description||' '||b.services||' '||b.service_area) ilike '%'||search||'%')
   and (after_name is null or (b.name,b.id)>(after_name,coalesce(after_id,'00000000-0000-0000-0000-000000000000'::uuid))) order by b.name,b.id limit 20
 ) x;
 if listing is not null then
  if not exists(select 1 from familyconnect.businesses b where b.id=listing and b.network_id=network and familyconnect.business_read(b.id)) then raise exception 'Listing unavailable';end if;
  select (to_jsonb(b)-'primary_person_id')||jsonb_build_object('can_manage',familyconnect.business_manage(b.id),'contact_email',case when b.share_contacts or familyconnect.business_manage(b.id) or is_mod then b.contact_email else '' end,'contact_phone',case when b.share_contacts or familyconnect.business_manage(b.id) or is_mod then b.contact_phone else '' end,'offer',case when b.offer_until is null or b.offer_until>=current_date or familyconnect.business_manage(b.id) then b.offer else '' end,
   'links',(select coalesce(jsonb_agg(to_jsonb(l) order by l.position),'[]') from familyconnect.business_links l where l.business_id=b.id),
   'media',(select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'kind',m.kind,'path',m.path,'thumbnail',m.thumbnail,'ready',m.ready)),'[]') from familyconnect.business_media m where m.business_id=b.id),
   'owners',(select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.first_name||' '||p.last_name,'status',o.status,'primary',p.id=b.primary_person_id)),'[]') from familyconnect.business_owners o join familyconnect.people p on p.id=o.person_id where o.business_id=b.id and familyconnect.visible(p.id) and familyconnect.social_adult(p.id,network) and (o.status='verified' or familyconnect.business_manage(b.id) or is_mod)),
   'reports',case when is_mod then (select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'reason',r.reason,'resolved',r.resolved)),'[]') from familyconnect.business_reports r where r.business_id=b.id) else '[]'::jsonb end,
   'reviews',case when is_mod or familyconnect.business_manage(b.id) then (select coalesce(jsonb_agg(jsonb_build_object('decision',r.decision,'note',r.note,'created_at',r.created_at)),'[]') from familyconnect.business_reviews r where r.business_id=b.id) else '[]'::jsonb end
  ) into detail from familyconnect.businesses b where b.id=listing;
 end if;
 return jsonb_build_object('listings',entries,'detail',detail,'my_people',identities,'owner_choices',choices,'invitations',invitations,'moderator',is_mod);
end$$;

$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261021001500_business_private_projection.sql','288fac7f19b80ae2e564f229d163dabfff13756d71c08271fa3a4dd1507e3138');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261113000100_cost_controls.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261113000100_cost_controls.sql' and sha256='314afc0c9d70938c137d867270fd482adddb54448e56940ff998240a8791e012') then raise exception 'Migration checksum mismatch: 20261113000100_cost_controls.sql'; end if;
      else
        execute $fc_ddl$-- Local implementation and hosted candidate only; no hosted application implied.
-- Preserve existing RLS, narrow RPCs, history, and published photographs.

create index if not exists social_limits_cost_window on familyconnect.social_limits(user_id,created_at,action);
create index if not exists post_media_cost_owner on familyconnect.post_media(owner_id);
create index if not exists business_media_cost_owner on familyconnect.business_media(owner_id);

create function familyconnect.cost_action_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare maximum int; actions text[];
begin
 if new.action in('reserve_media','business:reserve_media') then maximum:=20;actions:=array['reserve_media','business:reserve_media'];
 elsif new.action='send_message' then maximum:=1000;actions:=array[new.action];
 elsif new.action='create_post' then maximum:=50;actions:=array[new.action];
 elsif new.action='comment' then maximum:=200;actions:=array[new.action];
 elsif new.action in('create_chat','business:create') then maximum:=20;actions:=array[new.action];
 else return new;end if;
 -- Shared lock covers both social and business RPCs, including concurrent calls.
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,1311));
 if (select count(*) from familyconnect.social_limits where user_id=new.user_id and action=any(actions) and created_at>now()-interval '24 hours')>=maximum then
  raise exception 'Daily activity limit reached. Please try again later.';
 end if;
 return new;
end$$;
create trigger cost_action_limit before insert on familyconnect.social_limits for each row execute function familyconnect.cost_action_limit();

create function familyconnect.cost_media_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare stored bigint; reserved bigint; owned bigint;
begin
 if tg_op='UPDATE' then
  if new.ready and not old.ready and (new.bytes is null or new.bytes<1 or new.bytes>500000) then raise exception 'Optimized image and thumbnail must fit within 500 KB';end if;
  return new;
 end if;
 -- Global lock serializes reservations, avoiding concurrent quota overshoot.
 perform pg_advisory_xact_lock(131113,1);
 select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0) into stored from storage.objects;
 select coalesce(sum(case when ready then coalesce(bytes,1500000) else 500000 end),0),coalesce(sum(case when not ready then 500000 else 0 end),0)
 into owned,reserved from (select owner_id,ready,bytes from familyconnect.post_media union all select owner_id,ready,bytes from familyconnect.business_media) media
 where owner_id=new.owner_id;
 if owned+500000>50000000 then raise exception 'Your photo storage limit is reached. Remove an unneeded photo before uploading another.';end if;
 select 500000*((select count(*) from familyconnect.post_media where not ready)+(select count(*) from familyconnect.business_media where not ready)) into reserved;
 if stored+reserved+500000>800000000 then raise exception 'Photo storage is nearly full. New uploads are paused until space is available.';end if;
 return new;
end$$;
create trigger cost_media_limit before insert or update on familyconnect.post_media for each row execute function familyconnect.cost_media_limit();
create trigger cost_media_limit before insert or update on familyconnect.business_media for each row execute function familyconnect.cost_media_limit();
revoke all on function familyconnect.cost_action_limit(),familyconnect.cost_media_limit() from public,anon,authenticated;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261113000100_cost_controls.sql','314afc0c9d70938c137d867270fd482adddb54448e56940ff998240a8791e012');
      end if;
    end $fc_apply$;
do $fc_apply$ begin
      if exists(select 1 from familyconnect_migrations.ledger where version='20261114000100_durable_media_reservations.sql') then
        if not exists(select 1 from familyconnect_migrations.ledger where version='20261114000100_durable_media_reservations.sql' and sha256='e18fd2341f7626fbf3f75cfc594b89dab760deb585168f4fe773135f50eea8c1') then raise exception 'Migration checksum mismatch: 20261114000100_durable_media_reservations.sql'; end if;
      else
        execute $fc_ddl$
-- Separate from deletable content: canceling a post cannot release in-flight capacity.
create table familyconnect.media_cost_reservations(asset uuid primary key,owner_id uuid not null,reserved_bytes int not null default 500000 check(reserved_bytes=500000),created_at timestamptz not null default now());
alter table familyconnect.media_cost_reservations enable row level security;
revoke all on familyconnect.media_cost_reservations from public,anon,authenticated;
create index media_cost_reservations_owner on familyconnect.media_cost_reservations(owner_id);
insert into familyconnect.media_cost_reservations(asset,owner_id,created_at)
 select id,owner_id,created_at from familyconnect.post_media where not ready
 union all select id,owner_id,created_at from familyconnect.business_media where not ready;
create or replace function familyconnect.cost_media_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare stored bigint; reserved bigint; owned bigint;
begin
 perform pg_advisory_xact_lock(131113,1);
 if tg_op='UPDATE' then
  if new.ready and not old.ready then
   if new.bytes is null or new.bytes<1 or new.bytes>500000 then raise exception 'Optimized image and thumbnail must fit within 500 KB';end if;
   delete from familyconnect.media_cost_reservations where asset=new.id;
  end if;
  return new;
 end if;
 -- Provider invocations are bounded to <=60s; a full day is conservative recovery time.
 -- Actual orphan bytes remain counted even after a reservation expires.
 delete from familyconnect.media_cost_reservations where created_at<now()-interval '1 day';
 if exists(select 1 from storage.objects where coalesce(metadata->>'size','') !~ '^[0-9]+$') then raise exception 'Storage accounting unavailable. New uploads are paused.';end if;
 select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0) into stored from storage.objects;
 select coalesce(sum(coalesce(bytes,1500000)),0) into owned from (select owner_id,ready,bytes from familyconnect.post_media union all select owner_id,ready,bytes from familyconnect.business_media) media where ready and owner_id=new.owner_id;
 select coalesce(sum(reserved_bytes),0) into reserved from familyconnect.media_cost_reservations where owner_id=new.owner_id;
 if owned+reserved+500000>50000000 then raise exception 'Your photo storage limit is reached. Remove an unneeded photo before uploading another.';end if;
 select coalesce(sum(reserved_bytes),0) into reserved from familyconnect.media_cost_reservations;
 if stored+reserved+500000>800000000 then raise exception 'Photo storage is nearly full. New uploads are paused until space is available.';end if;
 insert into familyconnect.media_cost_reservations(asset,owner_id) values(new.id,new.owner_id);
 return new;
end$$;
$fc_ddl$;
        insert into familyconnect_migrations.ledger(version,sha256) values('20261114000100_durable_media_reservations.sql','e18fd2341f7626fbf3f75cfc594b89dab760deb585168f4fe773135f50eea8c1');
      end if;
    end $fc_apply$;
commit;
