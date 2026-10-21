-- Isolated Family Business Directory. No legacy global-read policies reused.
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
