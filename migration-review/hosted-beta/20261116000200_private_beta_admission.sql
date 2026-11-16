-- Approval-only candidate. Empty admission table: no account is grandfathered.
create table familyconnect.beta_admissions(
 user_id uuid primary key references auth.users(id), active boolean not null default false,
 can_found boolean not null default false, founded_network uuid references familyconnect.networks(id),
 reason text not null check(length(trim(reason)) between 1 and 1000), updated_at timestamptz not null default now()
);
alter table familyconnect.beta_admissions enable row level security;
revoke all on familyconnect.beta_admissions from public,anon,authenticated;
create table familyconnect.beta_operator_audit(
 id bigint generated always as identity primary key, user_id uuid not null references auth.users(id),
 action text not null, reason text not null, network_id uuid references familyconnect.networks(id), created_at timestamptz not null default now()
);
alter table familyconnect.beta_operator_audit enable row level security;
revoke all on familyconnect.beta_operator_audit from public,anon,authenticated;

create function familyconnect.beta_active(u uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.beta_admissions b join auth.users a on a.id=b.user_id where b.user_id=u and b.active and a.email_confirmed_at is not null);
$$;
revoke all on function familyconnect.beta_active(uuid) from public,anon,authenticated;
create or replace function familyconnect.member(n uuid,roles text[] default array['admin','contributor','viewer']) returns boolean language sql stable security definer set search_path='' as $$
 select familyconnect.beta_active(auth.uid()) and exists(select 1 from familyconnect.memberships m where m.network_id=n and m.user_id=auth.uid() and m.role=any(roles));
$$;

-- The operator uses a server-only service credential after separately verifying
-- the exact Auth UUID. User metadata, email matching and signup grant nothing.
create function public.fc_beta_authorize(target uuid,approved boolean,allow_found boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Operator required';end if;
 if target is null or approved is null or allow_found is null or length(trim(reason)) not between 1 and 1000 then raise exception 'Explicit approval and reason required';end if;
 perform pg_advisory_xact_lock(hashtextextended(target::text,116));
 insert into familyconnect.beta_admissions(user_id,active,can_found,reason) values(target,approved,allow_found,reason)
 on conflict(user_id) do update set active=excluded.active,can_found=excluded.can_found,reason=excluded.reason,updated_at=now();
 insert into familyconnect.beta_operator_audit(user_id,action,reason) values(target,case when approved then 'admit' else 'revoke' end,reason);
end$$;
revoke all on function public.fc_beta_authorize(uuid,boolean,boolean,text) from public,anon,authenticated;
grant execute on function public.fc_beta_authorize(uuid,boolean,boolean,text) to service_role;

create function public.fc_beta_status() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('approved',familyconnect.beta_active(auth.uid()),'can_found',coalesce((select active and can_found and founded_network is null and familyconnect.beta_active(user_id) from familyconnect.beta_admissions where user_id=auth.uid()),false));
$$;
revoke all on function public.fc_beta_status() from public,anon;
grant execute on function public.fc_beta_status() to authenticated;

create function familyconnect.beta_membership_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not familyconnect.beta_active(new.user_id) then raise exception 'Private beta approval required';end if;
 return new;
end$$;
revoke all on function familyconnect.beta_membership_guard() from public,anon,authenticated;
create trigger beta_membership_guard before insert or update on familyconnect.memberships for each row execute function familyconnect.beta_membership_guard();

-- Preserve existing functions behind inaccessible internal implementations.
alter function public.fc_action(text,jsonb) set schema familyconnect;
alter function familyconnect.fc_action(text,jsonb) rename to beta_action_impl;
revoke all on function familyconnect.beta_action_impl(text,jsonb) from public,anon,authenticated,service_role;
create function public.fc_action(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,116));
 if not familyconnect.beta_active(auth.uid()) then raise exception 'Private beta approval required';end if;
 return familyconnect.beta_action_impl(action,payload);
end$$;
revoke all on function public.fc_action(text,jsonb) from public,anon;
grant execute on function public.fc_action(text,jsonb) to authenticated;

alter function public.fc_social(text,jsonb) set schema familyconnect;
alter function familyconnect.fc_social(text,jsonb) rename to beta_social_impl;
-- Preserve the function-qualified parameter reference after renaming.
do $$begin execute replace(pg_get_functiondef('familyconnect.beta_social_impl(text,jsonb)'::regprocedure),'fc_social.action','beta_social_impl.action');end$$;
revoke all on function familyconnect.beta_social_impl(text,jsonb) from public,anon,authenticated,service_role;
create function public.fc_social(action text,payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required';end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,116));
 if not familyconnect.beta_active(auth.uid()) then raise exception 'Private beta approval required';end if;
 if action='accept_chat' and not familyconnect.social_notification((payload->>'id')::uuid) then raise exception 'Conversation unavailable';end if;
 return familyconnect.beta_social_impl(action,payload);
end$$;
revoke all on function public.fc_social(text,jsonb) from public,anon;
grant execute on function public.fc_social(text,jsonb) to authenticated;

-- A founder approval authorizes one new network, never ownership of an existing
-- person's record. The user explicitly creates a new adult self-profile.
create function public.fc_beta_start_network(network_name text,first_name text,last_name text,confirm_self boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid();n uuid;p uuid;b familyconnect.beta_admissions;
begin
 if u is null or confirm_self is distinct from true then raise exception 'Explicit adult self-profile confirmation required';end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,116));
 select * into b from familyconnect.beta_admissions where user_id=u for update;
 if not familyconnect.beta_active(u) or not coalesce(b.can_found,false) or b.founded_network is not null then raise exception 'Unused founder approval required';end if;
 insert into familyconnect.networks(name) values(trim(network_name)) returning id into n;
 insert into familyconnect.memberships values(n,u,'admin');
 insert into familyconnect.people(network_id,first_name,last_name,age_class,created_by) values(n,trim(first_name),trim(last_name),'adult',u) returning id into p;
 insert into familyconnect.person_accounts(person_id,user_id) values(p,u);
 update familyconnect.beta_admissions set founded_network=n,can_found=false,updated_at=now() where user_id=u;
 insert into familyconnect.audit(actor,action,entity_id) values(u,'explicit_founder_onboarding',n);
 return jsonb_build_object('network_id',n,'person_id',p);
end$$;
revoke all on function public.fc_beta_start_network(text,text,text,boolean) from public,anon;
grant execute on function public.fc_beta_start_network(text,text,text,boolean) to authenticated;

-- An independent invitation reviewer can be explicitly appointed without
-- claiming any person. This avoids a first-admin self-approval loophole.
create function public.fc_beta_assign_admin(target uuid,network uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Operator required';end if;
 if target is null or network is null or reason is null or length(trim(reason)) not between 1 and 1000 then raise exception 'Explicit target, network and reason required';end if;
 perform pg_advisory_xact_lock(hashtextextended(target::text,116));
 if not familyconnect.beta_active(target) then raise exception 'Approved verified account required';end if;
 insert into familyconnect.memberships values(network,target,'admin') on conflict(network_id,user_id) do update set role='admin';
 insert into familyconnect.beta_operator_audit(user_id,action,reason,network_id) values(target,'assign_admin',reason,network);
end$$;
revoke all on function public.fc_beta_assign_admin(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.fc_beta_assign_admin(uuid,uuid,text) to service_role;

-- RLS also protects old sessions after admission is revoked.
create function familyconnect.beta_self() returns boolean language sql stable security definer set search_path='' as $$select familyconnect.beta_active(auth.uid());$$;
revoke all on function familyconnect.beta_self() from public,anon;
grant execute on function familyconnect.beta_self() to authenticated;
create policy beta_memberships on familyconnect.memberships as restrictive for select to authenticated using(familyconnect.beta_self());
create policy beta_people on familyconnect.people as restrictive for select to authenticated using(familyconnect.beta_self());
create policy beta_claims on familyconnect.person_accounts as restrictive for select to authenticated using(familyconnect.beta_self());
create policy beta_guardians on familyconnect.guardians as restrictive for select to authenticated using(familyconnect.beta_self());
