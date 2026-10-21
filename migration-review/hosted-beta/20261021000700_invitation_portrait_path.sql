-- The existing licensed fictional asset directory is /family-portraits/.
create or replace function public.fc_invitation_preview(token text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce((select jsonb_build_object('network',n.name,'inviter',p.first_name,'valid',true,
 'photo',case when i.share_inviter_photo and p.age_class='adult' and p.photo ~ '^/family-portraits/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$' then p.photo else null end)
 from familyconnect.invitations i join familyconnect.networks n on n.id=i.network_id join familyconnect.people p on p.id=i.inviter_id
 where i.token_hash=encode(extensions.digest(token,'sha256'),'hex') and i.approved_by is not null
 and i.expires_at>now() and i.revoked_at is null and i.consumed_at is null),'{}'::jsonb);
$$;
