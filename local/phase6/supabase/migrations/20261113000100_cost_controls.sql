-- Local implementation and hosted candidate only; no hosted application implied.
-- Preserve existing RLS, narrow RPCs, history, and published photographs.
begin;
create index if not exists social_limits_cost_window on familyconnect.social_limits(user_id,created_at,action);
create index if not exists post_media_cost_owner on familyconnect.post_media(owner_id);
create index if not exists business_media_cost_owner on familyconnect.business_media(owner_id);

create function familyconnect.cost_action_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare maximum int; actions text[];
begin
 if new.action in('reserve_media','business:reserve_media') then maximum:=20;actions:=array['reserve_media','business:reserve_media'];
 elsif new.action='send_message' then maximum:=1000;actions:=array[new.action];
 elsif new.action='create_post' then maximum:=50;actions:=array[new.action];
 elsif new.action='comment' then maximum:=200;actions:=array[new.action];
 elsif new.action in('create_chat','business:create') then maximum:=20;actions:=array[new.action];
 else return new;end if;
 -- Shared lock covers both social and business RPCs, including concurrent calls.
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,1311));
 if (select count(*) from familyconnect.social_limits where user_id=new.user_id and action=any(actions) and created_at>now()-interval '24 hours')>=maximum then
  raise exception 'Daily activity limit reached. Please try again later.';
 end if;
 return new;
end$$;
create trigger cost_action_limit before insert on familyconnect.social_limits for each row execute function familyconnect.cost_action_limit();

create function familyconnect.cost_media_limit() returns trigger language plpgsql security definer set search_path='' as $$
declare stored bigint; reserved bigint; owned bigint;
begin
 if tg_op='UPDATE' then
  if new.ready and not old.ready and (new.bytes is null or new.bytes<1 or new.bytes>500000) then raise exception 'Optimized image and thumbnail must fit within 500 KB';end if;
  return new;
 end if;
 -- Global lock serializes reservations, avoiding concurrent quota overshoot.
 perform pg_advisory_xact_lock(131113,1);
 select coalesce(sum(case when metadata->>'size' ~ '^[0-9]+$' then (metadata->>'size')::bigint else 0 end),0) into stored from storage.objects;
 select coalesce(sum(case when ready then coalesce(bytes,1500000) else 500000 end),0),coalesce(sum(case when not ready then 500000 else 0 end),0)
 into owned,reserved from (select owner_id,ready,bytes from familyconnect.post_media union all select owner_id,ready,bytes from familyconnect.business_media) media
 where owner_id=new.owner_id;
 if owned+500000>50000000 then raise exception 'Your photo storage limit is reached. Remove an unneeded photo before uploading another.';end if;
 select 500000*((select count(*) from familyconnect.post_media where not ready)+(select count(*) from familyconnect.business_media where not ready)) into reserved;
 if stored+reserved+500000>800000000 then raise exception 'Photo storage is nearly full. New uploads are paused until space is available.';end if;
 return new;
end$$;
create trigger cost_media_limit before insert or update on familyconnect.post_media for each row execute function familyconnect.cost_media_limit();
create trigger cost_media_limit before insert or update on familyconnect.business_media for each row execute function familyconnect.cost_media_limit();
revoke all on function familyconnect.cost_action_limit(),familyconnect.cost_media_limit() from public,anon,authenticated;
commit;
