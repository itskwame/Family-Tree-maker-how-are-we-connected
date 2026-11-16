-- SYNTHETIC REHEARSAL ONLY. Reconstructed public application metadata, not hosted data.
set search_path=public,extensions;
create table public."families"("id" uuid default gen_random_uuid() not null,"name" text not null,"created_by" uuid not null,"created_at" timestamp with time zone default now() not null);
create table public."family_memberships"("id" uuid default gen_random_uuid() not null,"family_id" uuid not null,"user_id" uuid not null,"role" text default 'contributor'::text not null,"joined_at" timestamp with time zone default now() not null);
create table public."invites"("id" uuid default gen_random_uuid() not null,"family_id" uuid not null,"token" text not null,"type" text not null,"target_person_id" uuid,"role_default" text default 'contributor'::text not null,"created_by" uuid not null,"created_at" timestamp with time zone default now() not null,"expires_at" timestamp with time zone);
alter table public."families" add constraint "families_pkey" PRIMARY KEY (id);
alter table public."family_memberships" add constraint "family_memberships_pkey" PRIMARY KEY (id);
alter table public."invites" add constraint "invites_pkey" PRIMARY KEY (id);
alter table public."family_memberships" add constraint "family_memberships_family_id_user_id_key" UNIQUE (family_id, user_id);
alter table public."invites" add constraint "invites_token_key" UNIQUE (token);
alter table public."families" add constraint "families_name_check" CHECK (char_length(TRIM(BOTH FROM name)) > 0);
alter table public."family_memberships" add constraint "family_memberships_role_check" CHECK (role = ANY (ARRAY['admin'::text, 'contributor'::text, 'viewer'::text]));
alter table public."invites" add constraint "invites_type_check" CHECK (type = ANY (ARRAY['join'::text, 'claim'::text, 'branch'::text]));
alter table public."invites" add constraint "invites_role_default_check" CHECK (role_default = ANY (ARRAY['contributor'::text, 'viewer'::text]));
alter table public."families" add constraint "families_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."family_memberships" add constraint "family_memberships_family_id_fkey" FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
alter table public."family_memberships" add constraint "family_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."invites" add constraint "invites_family_id_fkey" FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;
alter table public."invites" add constraint "invites_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX family_memberships_user_id_idx ON public.family_memberships USING btree (user_id);
CREATE INDEX invites_family_id_idx ON public.invites USING btree (family_id);
alter table public."families" enable row level security;
grant all on public."families" to anon,authenticated,service_role;
alter table public."family_memberships" enable row level security;
grant all on public."family_memberships" to anon,authenticated,service_role;
alter table public."invites" enable row level security;
grant all on public."invites" to anon,authenticated,service_role;
create policy "families_update_for_admins" on public."families" as PERMISSIVE for UPDATE to "authenticated" using ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = families.id) AND (fm.user_id = auth.uid()) AND (fm.role = 'admin'::text))))) with check ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = families.id) AND (fm.user_id = auth.uid()) AND (fm.role = 'admin'::text)))));
create policy "families_insert_for_authenticated_users" on public."families" as PERMISSIVE for INSERT to "authenticated" with check ((created_by = auth.uid()));
create policy "families_select_for_members" on public."families" as PERMISSIVE for SELECT to "authenticated" using ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = families.id) AND (fm.user_id = auth.uid())))));
create policy "memberships_update_admins" on public."family_memberships" as PERMISSIVE for UPDATE to "authenticated" using ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = family_memberships.family_id) AND (fm.user_id = auth.uid()) AND (fm.role = 'admin'::text))))) with check ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = family_memberships.family_id) AND (fm.user_id = auth.uid()) AND (fm.role = 'admin'::text)))));
create policy "memberships_insert_self" on public."family_memberships" as PERMISSIVE for INSERT to "authenticated" with check ((user_id = auth.uid()));
create policy "memberships_select_own_or_same_family" on public."family_memberships" as PERMISSIVE for SELECT to "authenticated" using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = family_memberships.family_id) AND (fm.user_id = auth.uid()))))));
create policy "invites_update_for_admins" on public."invites" as PERMISSIVE for UPDATE to "authenticated" using ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = invites.family_id) AND (fm.user_id = auth.uid()) AND (fm.role = 'admin'::text))))) with check ((EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = invites.family_id) AND (fm.user_id = auth.uid()) AND (fm.role = 'admin'::text)))));
create policy "invites_insert_for_members" on public."invites" as PERMISSIVE for INSERT to "authenticated" with check (((created_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM family_memberships fm
  WHERE ((fm.family_id = invites.family_id) AND (fm.user_id = auth.uid()))))));
create policy "invites_select_for_authenticated_users" on public."invites" as PERMISSIVE for SELECT to "authenticated" using (true);
