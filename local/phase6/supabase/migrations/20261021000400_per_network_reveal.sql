create function public.fc_my_reveals() returns jsonb language sql stable security definer set search_path='' as $$
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
