-- Local worker maintenance: inaccessible to browser roles. Storage bytes are
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
