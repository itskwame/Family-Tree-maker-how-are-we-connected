-- DRAFT: requires legacy-consumer impact review and separate hosted approval.
-- Additive data preservation; API permissions change intentionally.
-- No rows, roles, Auth identities or account privileges are changed.
revoke all on public.families, public.family_memberships, public.invites from anon, authenticated;
-- Existing policies remain documented for recovery; API roles cannot use them.
-- Never undo this by restoring unrestricted invitation reads or self-membership writes.
