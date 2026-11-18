# Hosted manual recovery: database recovery proven

2026-11-16 America/New_York (capture 2026-11-17 UTC). Project `jmsntxwkaneluqgnzzim`, Free plan. The saved credential authenticated successfully using TLS `verify-full`. A real hosted PostgreSQL backup was restored into a fresh, isolated local PostgreSQL 17.6 database. **All 22 verification checks passed across 51 tables.** No hosted database/settings changes, password resets, deployments, invitations, paid services or development-database changes were made.

## Evidence

- Both Auth users and both identities match the source in full-row fingerprints, including stored credential hashes and confirmation state. No user was logged in, recreated, verified or promoted.
- All 51 tables match in row counts and canonical row fingerprints. The three existing public application tables remain empty.
- Source and restored roles, memberships, table/schema owners and grants, default grants, RLS flags/policies, application/Auth/Storage/Vault function definitions and grants, columns, constraints, indexes, triggers, sequences, extension versions and publication membership match.
- Column comparisons preserve live column order while ignoring physical slots left by previously dropped columns. Catalog rendering uses a fixed search path; row hashes use UTC and C collation. These prevent environment-specific false differences.
- Storage: zero buckets and zero objects before and after capture. There are no Storage file bytes to export for this snapshot.
- Seven read-only settings exports succeeded: Auth, API, SSL, network restrictions, function inventory, secret metadata and backup configuration. No deployed Edge Functions; seven managed default secret entries, no custom function secrets. Secret metadata does not contain recoverable plaintext values.
- Restore was repeated from scratch after fixing extension-owned GraphQL wrapper/schema-grant/state omissions in the ordinary archive. Exact source wrapper and permissions are included as protected supplements; no grants were dropped to make restoration pass.
- Final destination used a new Docker volume, network `none`, no published ports and only a local Unix socket. PostgreSQL data directory mode is 0700. No Auth/API/Storage services, email delivery or external job runners were started. All task-created recovery containers were stopped after verification; their volumes are retained.

## Backup custody and hashes

Protected vault: `%LOCALAPPDATA%\FamilyConnect\Recovery\jmsntxwkaneluqgnzzim`.
Capture: `capture-2026-11-17T02-10-14-640Z`; `latest-capture.json` points to it. The directory is outside the repository and OneDrive, with access restricted to the current Windows user and SYSTEM. Database password is Windows CurrentUser DPAPI encrypted. Backup files themselves are access-restricted, not independently encrypted. Docker administrators can access the retained recovery volume.

SHA-256:

| File | SHA-256 |
| --- | --- |
| database.dump | cd4f0d84e5b1a8fd7d358660c19a675153f9b723c7584143b93d195ec801117c |
| roles.sql | 67b091628bb1b818b07c93918576f6c197b2442cd379d4aaf7d3682b41ba3b75 |

The protected `manifest.json` records original archive hashes and commands. `recovery-package-sha256.json` seals 16 archive/supplement/settings/evidence files. `recovery-verification.json` contains the final 22 passing checks. No real backup, settings export, password or Auth rows were copied into GitHub/Netlify inputs.

## Exact repeatable commands

Run from the repository in an authorized PowerShell terminal. Never put a password or password-bearing URL in command arguments or chat.

```powershell
# Only if no credential is saved: masked prompt, no hosted writes.
powershell -NoProfile -File scripts/Set-FamilyConnectRecoveryCredential.ps1

# A new backup creates a new protected capture; verification uses that capture.
powershell -NoProfile -File scripts/Invoke-FamilyConnectHostedRecovery.ps1 -Stage backup
powershell -NoProfile -File scripts/Invoke-FamilyConnectHostedRecovery.ps1 -Stage verify
python scripts/capture-hosted-recovery-settings.py
node scripts/restore-hosted-offline.mjs
node scripts/verify-hosted-recovery.mjs
```

The runner uses `public.ecr.aws/supabase/postgres:17.6.1.075`, the project Session pooler on port 5432, and verified TLS. It passes the decrypted credential through redirected stdin into process memory, never command arguments. Explicit inspection transactions use `BEGIN READ ONLY`; PostgreSQL dump tools perform reads only. The pooler did not honor the read-only startup default, so the inspection scripts explicitly start read-only transactions.

Actual supported backup commands inside that protected runner:

```sh
pg_dump --no-password --format=custom --file=/backup/database.dump
pg_dumpall --no-password --roles-only --no-role-passwords --file=/backup/roles.sql
pg_restore --list /backup/database.dump > /backup/archive-list.txt
pg_restore --schema-only --file=/backup/full-schema.sql /backup/database.dump
```

Restore runner initializes a brand-new offline cluster with bootstrap role `supabase_admin`, restores all other roles and original attributes, and creates `hosted_recovery` from template0 owned by postgres. It removes only the duplicate CREATE statement for the already-existing bootstrap role. It extracts each archive section using `pg_restore --section=pre-data|data|post-data --file=- /backup/database.dump`. The exact captured GraphQL wrapper is inserted before its first ACL statement, and captured extension schema permissions and sequence state follow post-data. Combined SQL is executed with:

```sh
psql -h /tmp -U supabase_admin -d hosted_recovery -X -q \
  -v ON_ERROR_STOP=1 --single-transaction -f -
```

The destination must be empty; the script refuses a destination already containing hosted application schemas. It never targets the development database. Commands and local destination identity are retained in `local-restore-status.json` and `local-destination.json`. To inspect later, start only the named offline container from that destination file, rerun the verifier, then stop that same container. Do not enable networking or application services for this copy.

## Remaining manual steps and limits

1. **Next action for the owner:** put the entire protected capture, its manifests, and the recovery scripts into an encrypted off-machine backup using your approved encrypted drive/vault. Store the decryption recovery key separately and verify the SHA-256 manifest after copying. Current evidence proves local recovery; it does not protect against loss of this computer. Windows DPAPI alone is not a portable credential backup.
2. Before an actual platform disaster restore, use the captured Auth/API settings as a checklist in an authorized replacement project's dashboard. Supply any redacted SMTP/OAuth secrets from their existing custodian and configure replacement service credentials/signing keys. Database-role passwords are deliberately excluded by `--no-role-passwords`; this does **not** exclude the users' Auth credential hashes, which were preserved and verified. Existing provider-managed signing keys and platform infrastructure are not reproduced by this offline database test. No password or signing-key changes were made here.
3. No Storage byte recovery is outstanding for this empty snapshot. Future backups with objects must also export and verify all file bytes through authorized Storage APIs; database metadata alone is insufficient.
4. A full replacement Supabase service, original-user sign-in, email delivery and hosted migration/deployment remain untested and require separate authorization. This task proves database recovery, not automatic platform failover or approval to release private beta. Netlify, Resend and GitHub settings were untouched.

No credential or dashboard-access blocker remains for the database backup and isolated restoration. The remaining owner action is durable encrypted off-machine custody, followed by separate review/approval for any hosted migration.

References: [Supabase manual backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [Supabase SSL enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement). The TLS CA was obtained over HTTPS from the production certificate URL used in Supabase's official dashboard source: `https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt`.
