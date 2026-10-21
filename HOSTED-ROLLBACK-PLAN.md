# Backup, rollback and disaster recovery

2026-10-21. **Blocked: no verified hosted recovery path.** The read-only backup API lists no backups and PITR is disabled. External backups might exist, but none has been supplied/tested. Synthetic restoration failed on managed schema ownership.

## Before hosted approval

Name the migration operator, rollback decision-maker, backup custodian and incident contact. These are unassigned; Codex is not an accountable on-call owner. Approve RTO/RPO using an actual timed restoration, not assumed values.

Use available Supabase dashboard recovery or a supported logical export through an already-authorized read connection. Do not modify CLI login roles or request elevated privileges simply to bypass the earlier error. A schema-only export is not a backup.

Capture application data/schema, relevant Auth users/identities/credentials/state, roles/ACLs/default grants, migration ledger, extensions and service configuration. Production backups must be encrypted, access-controlled and stored outside this repository and OneDrive workspace. Record time, checksums, custodian, retention and recovery destination without publishing secrets. Necessary secrets/configuration require separate secure custody.

Database backups exclude Storage object bytes. Back up files separately with bucket settings, ownership metadata and checksums. Hosted object count is currently zero but must be rechecked at cutover. See [Supabase backup guidance](https://supabase.com/docs/guides/platform/backups) and [restore-to-new-project scope](https://supabase.com/docs/guides/platform/clone-project).

## Required restoration rehearsal

1. Restore to an independent disposable destination using a supported managed method. Suppress outbound email, webhooks and scheduled jobs until reviewed.
2. Preserve managed owners/ACLs and compare schemas, constraints, indexes, grants, policies, functions, triggers and history.
3. Verify original identities/privileges privately and account continuity through an owner-authorized process. Never recreate users or force email confirmation.
4. Compare counts/protected digests; restore Storage bytes and check object hashes and private retrieval/revocation.
5. Exercise application security/functionality; record duration, errors, losses and sign-off. An available file alone does not pass.

The synthetic restore failed assigning auth ownership to supabase_admin. No escalation was attempted. That dump is not a hosted backup and must never enter beta.

## Failure response

1. Activate reviewed server-side controls to stop registrations, invitations, writes and background writers; record the incident window. These controls still need implementation/rehearsal. Hiding buttons is insufficient.
2. Disable affected functions; preserve logs, accounts and new records. Restore a previously approved application artifact only where compatible. The old local/legacy UI is not automatically a safe hosted fallback.
3. Prefer additive corrective SQL after diagnosis. Never drop familyconnect tables as rollback or reinstate unrestricted legacy invitation/membership access.
4. Treat code rollback separately from security-policy/grant corrections. Apply reviewed least-privilege fixes independently.
5. If recovery is necessary, restore to another destination first. Reconcile legitimate post-backup writes, including Auth, objects, memberships and consent changes. Do not overwrite live state before reconciliation and recovery approval.
6. Revalidate identity continuity, security and no-demo conditions before reopening writes/invitations under the named incident owner's decision.

## Approval boundary

Hosted changes require verified recovery evidence, exact SQL/build/config hashes, named operators, maintenance/rollback procedures and explicit approval. Real-user admission is separate. This plan does not authorize any hosted backup restore, configuration change or deployment.
