-- Keep private owner identifiers out of the directory projection.
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

