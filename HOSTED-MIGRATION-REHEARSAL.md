# Migration rehearsal

2026-10-21. **Partial success; recovery failed.** No hosted writes.

## Environment

Disposable local Supabase `familyconnect-hosted-rehearsal`, API 127.0.0.1:57321, database 57322, separate from development and clean-start stacks. Initialized without seeds. [Observed legacy DDL](output/hosted-beta/observed-legacy-baseline.sql) reconstructs public metadata; it is not a hosted migration.

Two fictional pre-existing accounts were created through actual local Auth, with one legacy family/membership/invite sentinel. Passwords existed only in memory. No hosted accounts, credentials or personal records were copied. Complete synthetic Auth rows and identities were compared by in-memory fingerprints.

## Ten passing checks

[Results and exact SQL hashes](output/hosted-beta/rehearsal-results.json):

1. Both synthetic accounts authenticate before migration through local Auth.
2. An injected division-by-zero after all DDL rolls back the transaction without original-record loss or a remaining normalized schema.
3. All 16 candidate files apply atomically over the observed legacy structure.
4. Auth users/identities and legacy sentinels remain equivalent; no person ownership/membership is inferred.
5. Raw duplicate replay fails safely without original-record loss.
6. Simulated checksum-ledger resume skips matching candidates. This is not a production runner test.
7. All normalized tables enable RLS and begin without people.
8. Both synthetic accounts still authenticate afterward.
9. Actual local REST requests cannot read quarantined legacy invitations.
10. Ordinary authenticated SQL role cannot insert an administrator membership.

## Restore failure

A synthetic custom-format pg_dump was restored into `fc_synthetic_restore`, a separate database in the disposable cluster. pg_restore failed assigning auth schema ownership: `must be able to SET ROLE supabase_admin`. No role was altered and no higher-privilege account was used to bypass this. The partial destination contains synthetic data only and is retained for diagnosis.

This does **not** establish recoverability. Even successful same-cluster restoration would not prove independent hosted recovery, managed ownership/ACL portability, email delivery or Storage recovery. Use a supported method and independent destination. Do not omit owners/ACLs and claim equivalence.

## Reproduction and limits

`scripts/prepare-hosted-rehearsal.py` prepares metadata DDL and candidate copies. `scripts/rehearse-hosted-beta.mjs` is hard-guarded to this local project/API and requires empty Auth. It refuses replay against the populated stack. For another full rehearsal, prepare a new isolated project/ports and review guard changes; never reset existing fixtures. Logs and the synthetic dump remain ignored in output/hosted-beta/private.

No external consumer discovery, exact managed-platform clone, hosted account sign-in, durable ledger recovery, full candidate security matrix or successful restoration is claimed. No hosted migration or rollback was attempted.
