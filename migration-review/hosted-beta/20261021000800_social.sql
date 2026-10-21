-- Phase 7: local-only social baseline. No implicit membership from family consent.
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
