# Final hosted migration approval package

Prepared 2026-11-17, America/New_York. Target **jmsntxwkaneluqgnzzim**. Preparation only: no hosted queries, writes, migrations, deployments, emails or paid features in this review. Historical readiness documents contain superseded recovery blockers; this package and HOSTED-MANUAL-BACKUP-STATUS.md give the current recovery status.

## Decision and immediate next action

The frozen 20-migration candidate matches its successful rehearsal exactly. Database recovery is proven. **Do not execute yet:** off-machine custody, fresh hosted drift checks, legacy-consumer confirmation, and a reviewed server-side write-freeze procedure remain cutover gates. The earlier migration/rollback plans explicitly identify that freeze as unfinished. A Netlify publishing lock is not a database/Auth write freeze. Do not invent a freeze by changing managed roles or restoring permissive legacy grants.

Owner next: copy and verify the protected capture below; then provide only (a) confirmation the encrypted copy verified, (b) chosen HTTPS beta origin (the existing Netlify subdomain is sufficient), (c) existing verified sender domain/address, (d) whether anything still uses the three legacy tables, and (e) migration/rollback operator. Do not send credentials. Select founder/reviewer accounts explicitly through a protected UUID inventory before later admission; neither is assumed from account existence.

## Exact recovery package and safe copy verification

Copy this **entire folder**, with its existing contents and subdirectories, into an already-encrypted external drive or approved encrypted backup vault:

`%LOCALAPPDATA%\FamilyConnect\Recovery\jmsntxwkaneluqgnzzim\capture-2026-11-17T02-10-14-640Z`

It contains the full database archive, roles, source inventory/fingerprints, exact extension supplements, settings exports, restore commands/results and manifests. Its 16 sealed package files were rehashed today: all match. Also copy `HOSTED-MANUAL-BACKUP-STATUS.md` and these repository scripts into a separate companion folder: `restore-hosted-offline.mjs`, `verify-hosted-recovery.mjs`, `hosted-recovery-inventory.sql`, `hosted-recovery-runner.mjs`, `Invoke-FamilyConnectHostedRecovery.ps1`, `Set-FamilyConnectRecoveryCredential.ps1`, and `Verify-FamilyConnectRecoveryCopy.ps1`. Keep the original relative script paths when using them later.

Do not upload the capture to GitHub, Netlify, chat or an unencrypted sync folder. Copy directly to the encrypted destination; do not make a plaintext staging ZIP. Keep its recovery key separately in your password manager. The parent DPAPI password file is tied to this Windows profile and is not needed to restore the archive; keep the existing DB password separately in your authorized password manager. On another machine, place the capture in that machine's protected recovery vault and create its non-secret `latest-capture.json` pointer with `stage: "backup"`; do not copy a stale absolute pointer blindly.

After copying, unlock/mount the encrypted destination locally and run (replace only the destination path):

```powershell
powershell -NoProfile -File scripts/Verify-FamilyConnectRecoveryCopy.ps1 -Destination 'E:\EncryptedRecovery\capture-2026-11-17T02-10-14-640Z'
```

This reads both trees, compares every file's SHA-256 and file count, and prints only a pass/count or generic failure. It changes neither copy and prints no credentials. `E:` is an example, not a claim that this device exists or is encrypted. The copy has **not** been made or verified by this preparation task.

Known archive SHA-256: `cd4f0d84e5b1a8fd7d358660c19a675153f9b723c7584143b93d195ec801117c`.
Roles SHA-256: `67b091628bb1b818b07c93918576f6c197b2442cd379d4aaf7d3682b41ba3b75`.

## Integrity and account preservation

All **39 review-manifest files** match; all **20 migration hashes and their order** match `rehearsal-results.json`; regenerating SQL with the reviewed generator produces the exact existing transaction. The candidate-manifest alone has 19 entries: quarantine is deliberately prepended by the rehearsed generator. Do not mistake it for the complete 20-file package.

Transaction: `output/hosted-beta/final/reviewed-transaction.sql`
SHA-256: `a165f5b51208d64fc61b761505af2f8b09603fad26aac3ae4f3c539d5a6b4390`.
Fresh evidence: `output/hosted-beta/final/approval-integrity-20261117.json`; original evidence remains unchanged. Twelve migration, eleven critical security, two onboarding-browser and four synthetic recovery checks previously passed. Today checked integrity rather than rerunning synthetic tests. Actual hosted-backup recovery separately passed 22 checks across 51 tables.

Both hosted Auth accounts/identities, hashed credentials, UUIDs and verification state are preserved by the reviewed design and preservation rehearsal; real hosted migration preservation must still be verified immediately before/after execution. Neither account gains admission, founder permission, family membership, person ownership or administrator privilege automatically. **Privileges are not entirely unchanged:** quarantine revokes anon/authenticated access to `public.families`, `public.family_memberships`, `public.invites`, while retaining their rows and policies. Approval must explicitly accept that impact. New family access requires verified email plus operator admission; founding/admin appointment is a separate explicit approval.

## Cutover procedure ? execute only after explicit approval

1. Name operator, rollback owner/window, acceptable recovery-point loss and outage. Confirm legacy consumers and approve quarantine. Complete/rehearse the smallest server-side control that stops Auth signup, application/legacy writes and background writers for this project's actual consumers. Record how to reopen safely. This control is not included in the frozen SQL; if SQL changes, regenerate hashes and rehearse again.
2. Read-only preflight against the fixed project using the saved credential: compare hosted schema, grants, policies, extensions, current migrations, users/identities and legacy data to reviewed assumptions. Stop on drift, missing permissions, unexpected ledger entries or account changes. Refresh the protected backup and independent recovery if the source has changed; copy/verify that newest package too. Capture full Auth/identity and existing-data fingerprints immediately before apply under quiescence. Never print these private records.
3. Recheck all 20 hashes, transaction hash and target. Use a PostgreSQL 17 client, Session pooler `aws-1-us-east-1.pooler.supabase.com:5432`, database `postgres`, user `postgres.jmsntxwkaneluqgnzzim`, TLS verify-full and the protected Supabase CA. Do not use root migration directories, db push/reset, test fixtures, or raw source concatenation.
4. The authorized operator runs the exact transaction with fail-on-error. Example using installed Docker and a masked interactive PostgreSQL password prompt (only after approval):

```powershell
$fcSql=(Resolve-Path 'output/hosted-beta/final/reviewed-transaction.sql').Path
$fcCa=Join-Path $env:LOCALAPPDATA 'FamilyConnect\Recovery\jmsntxwkaneluqgnzzim\supabase-ca.crt'
if((Get-FileHash -LiteralPath $fcSql -Algorithm SHA256).Hash.ToLower() -ne 'a165f5b51208d64fc61b761505af2f8b09603fad26aac3ae4f3c539d5a6b4390'){throw 'Transaction changed'}
docker run --rm -it --mount "type=bind,source=$fcSql,target=/reviewed.sql,readonly" --mount "type=bind,source=$fcCa,target=/ca.crt,readonly" -e PGSSLMODE=verify-full -e PGSSLROOTCERT=/ca.crt --entrypoint psql public.ecr.aws/supabase/postgres:17.6.1.075 -h aws-1-us-east-1.pooler.supabase.com -p 5432 -U postgres.jmsntxwkaneluqgnzzim -d postgres -W -X -v ON_ERROR_STOP=1 -f /reviewed.sql
```

Do not type a password in command arguments or chat. This is a future interactive operator command, not executed here. The transaction itself has BEGIN/COMMIT, advisory lock, timeouts and a checksum ledger. On error stop; do not retry through the error, remove grants, or reset anything. Connection loss requires checking the ledger before deciding whether committed; matching-ledger resume was rehearsed.

5. While writes remain closed, run `output/hosted-beta/final/post-migration-readonly.sql` using the same verified target (mount it instead of `/reviewed.sql`). Require exact 20-entry ledger hashes, preserved two users/two identities, empty admissions/memberships/person mappings, all family RLS enabled, legacy API access false, private `family-private` bucket with WebP/1,500,000-byte settings, and only intended notifications membership in Realtime. This new inspection SQL is prepared, not yet run against migrated hosted state.
6. Counts alone are insufficient: compare protected before/after whole Auth/identity rows, all pre-existing row fingerprints, managed owners/role attributes, and expected grants/functions/policies against the rehearsed catalog. Compare original data only; the new migrations legitimately add schema/storage metadata. Validate anonymous RPC access only to invitation preview, denial of browser direct writes and service-only operator/media/maintenance RPCs. No synthetic rows may be imported.
7. Record pass/fail with protected diagnostics. Keep admission closed until acceptance. If transaction failed, verify rollback and account/data continuity. If it committed but acceptance fails, keep the app closed and prepare a reviewed fix or independent restore/reconciliation; no automatic down migration or overwrite of hosted data is authorized.

## Manual configuration after separate approval

| Service | Exact action |
| --- | --- |
| Supabase Auth | Set Site URL to chosen HTTPS `BETA_ORIGIN`; exact redirect `BETA_ORIGIN/phase6.html`. Keep confirmations on and anonymous sign-ins off. For initial two-account testing, disable new signup; existing-account OTP must be tested (client currently sets shouldCreateUser=true). Do not manually mark users confirmed. Keep 60-second resend minimum; set conservative email limits within current provider allowance. CAPTCHA requires frontend integration before enabling. |
| Supabase API/Storage/Realtime | Expose `public,graphql_public`, not `familyconnect`; search path `public,extensions`. SQL creates private bucket and notifications publication membership; validate, do not manually broaden policies or publish messages. |
| Resend SMTP | Use an already-owned, verified sender domain and From address. Verify required DNS records in Resend. Supabase Auth ? Email ? SMTP: host `smtp.resend.com`, port `465`, username `resend`, password the Resend API key entered only in the dashboard, sender name FamilyConnect. Stay on existing free allowance; no new domain purchase or paid upgrade. No test mail until expressly approved. |
| Netlify initial app | Keep auto-publishing locked. Build `npm run build:release`, publish `dist-release`, Node >=22. Build variables: `FAMILYCONNECT_RELEASE_TARGET=private-beta`, `VITE_FC_URL=https://jmsntxwkaneluqgnzzim.supabase.co`, `VITE_FC_ANON_KEY` public key. No demo flags or secrets in VITE variables. Initially omit media URL and leave media disabled. Build/review then separately approve a controlled deployment to the chosen exact origin; deploying a preview also requires approval. |
| Hosted media later | Review/activate candidate `deployment/netlify/netlify.toml` explicitly (root config currently has no functions). Functions directory `deployment/netlify/functions`, esbuild, external dependency sharp, `/upload` rewrite before SPA fallback. Install/build on Linux; do not copy Windows node_modules. |
| Media function secrets | Netlify Functions scope: `FC_SUPABASE_URL` fixed project URL, `FC_SUPABASE_ANON_KEY` public key, `FC_SUPABASE_SERVICE_KEY` server-only key, `FC_APP_ORIGIN=BETA_ORIGIN`. Build scope `VITE_FC_MEDIA_URL=BETA_ORIGIN`. Keep `FC_MEDIA_ENABLED` and `FC_MAINTENANCE_ENABLED` false initially. A new deploy is needed for function environment changes. |
| Media acceptance | Separately approve enabling media; test actual Linux sharp runtime, origin/JWT checks, membership/block/minor/private-media access, oversized/invalid file rejection, output sizes/quotas, reservations/finalization, signed URL access and failure cleanup. Worker input <=4,000,000 bytes and combined output <=500,000 bytes. Test retention manually before approving hourly cleanup schedule; keep maintenance disabled until bounded runtime/deletion scope pass. |

Use existing free tiers, existing Netlify subdomain and owned sender domain. Confirm current account allowances and usage alerts in dashboards; this review does not guarantee all functionality fits unknown quotas. Media/cleanup runtime acceptance is still open, but can be deferred for a clearly bounded text-only owner test. Premium print and paid features stay out of that test.

Official settings references checked today: [Supabase Auth redirects](https://supabase.com/docs/guides/auth/redirect-urls), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Resend Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp), [Netlify function environment](https://docs.netlify.com/build/functions/environment-variables/).

## Earliest safe controlled online test

After cutover validation, approved Auth/SMTP configuration and a separately approved no-demo deployment: authorize sending login links only to your two existing accounts. First verify normal login and denial of family access while unapproved. Then explicitly approve chosen UUIDs for beta admission; grant founder permission only to the selected owner. The owner confirms the new adult self-profile and administrator responsibility in the onboarding form. Assign any second reviewer/admin only by separate explicit instruction, never infer it. Use only real owner data.

Test network creation once/replay denial, pending/denied admission, independent invitation review as applicable, family isolation and message blocking/revocation through RPC/database/Realtime using a real controlled conversation. Already downloaded messages cannot be recalled. Hosted email/sign-in and these runtime checks remain unproven until that authorized test. Media can remain disabled throughout. Admit nobody else until acceptance passes.

Approval boundaries: (1) complete cutover gates and approve the exact transaction/quarantine, (2) approve configuration and deployment, (3) approve named-account admission/founder/admin actions and login emails, (4) approve media activation/scheduling later. This document grants none of those approvals.

## Frozen migration SHA-256 values

| Ordered file | SHA-256 |
| --- | --- |
| 20261021000000_quarantine_legacy.sql | `d07bb6261cdc08da38780a4cb8ea7af831469e4aa5fcc704072f095d9c92dbd3` |
| 20261021000100_familyconnect_baseline.sql | `22e8d5c74d7c6007a2fc77a9f485038ffa4522d0d58e34aae0f08757daf30632` |
| 20261021000200_guardians_and_identity.sql | `4472855f524d579cd19adbc339f9768f2e5dc27f463097237cda472411aa287c` |
| 20261021000300_claim_review.sql | `9097e0f2c0782c67f8e747b425e8a7970e5b3f20e7d1d669161453fc80f720fc` |
| 20261021000400_per_network_reveal.sql | `aa89daa5f670130a95c87428cfa55c19de18925ba2712b5bbac7c6a7670bddc3` |
| 20261021000500_partnership_semantics.sql | `17500e7945fc35b34b8cca3e4171de2c9a314fd3db4c71d622f50baf092e6dd2` |
| 20261021000600_guided_builder.sql | `5c10453b2dd9ed901b6061e7256a1772a9b46469238571ed625d08c032122eb9` |
| 20261021000700_invitation_portrait_path.sql | `92f4c86d1017e26be26dfd94b99287dc12108bde770bbc884f2809e5a04b2a27` |
| 20261021000800_social.sql | `7a18f4244eecc42e600a24da20e1c41991e30630f9c516371697a782be518aac` |
| 20261021000900_social_notification_guard.sql | `bf65703442ff83ae4424c43b4a5feea11e2a0061740b4eefaca25cf4e1fde7a1` |
| 20261021001000_social_pagination.sql | `908f7f2f4f31e76bd717c729d054b7d0092b029024b0cef835d0ef75f98c0c34` |
| 20261021001100_social_retention.sql | `fd8f550f74d0181ecfa6793aa5a393b9993364da9095bfcdb819d91fc5d66fd5` |
| 20261021001200_storage_exact_path.sql | `63e7cf5388bfb94288039fd8840978ff5624d0c53ede014144b9859612f3e958` |
| 20261021001300_media_finalize_and_message_deletion.sql | `fd9f51aab9d319aec7632d5534fb34fe060e3b2ce7344a12996a36c2cef9e691` |
| 20261021001400_family_businesses.sql | `18c4aff74c5803db25c7b0f4678cc65397dcdc8c06920361954db0da6d2d7509` |
| 20261021001500_business_private_projection.sql | `288fac7f19b80ae2e564f229d163dabfff13756d71c08271fa3a4dd1507e3138` |
| 20261113000100_cost_controls.sql | `314afc0c9d70938c137d867270fd482adddb54448e56940ff998240a8791e012` |
| 20261114000100_durable_media_reservations.sql | `e18fd2341f7626fbf3f75cfc594b89dab760deb585168f4fe773135f50eea8c1` |
| 20261116000100_message_revocation.sql | `a378fe95e81bbcd5de455bf35ae8f35561951020abed1715fb0bc0b62f3c33e0` |
| 20261116000200_private_beta_admission.sql | `e9cb37a6bfa30ba15f12e9addcddaa0bceb38dc6fa6e496bb4485738863ace12` |
