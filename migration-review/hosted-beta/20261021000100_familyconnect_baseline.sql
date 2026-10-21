-- Local Phase 6 baseline only. Never run against the hosted project.
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
