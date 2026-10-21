-- SQL arguments must not be shadowed by column names. Authorize the exact
-- requested object, not the existence of any visible asset in the bucket.
create or replace function familyconnect.social_storage(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from familyconnect.post_media m where (m.path=$1 or m.thumbnail=$1) and familyconnect.social_asset(m.id));
$$;
