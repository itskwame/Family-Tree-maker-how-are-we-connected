begin;
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
commit;
