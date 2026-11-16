# Critical private-beta review — 2026-11-16

**Local security implementation is prepared; hosted migration and beta admission remain unapproved.** Target `jmsntxwkaneluqgnzzim`. No hosted Supabase, Netlify, Resend or GitHub settings changed. No deployment, real invitation, account privilege assignment or hosted data import occurred.

## Changes in the final candidate

The package now contains **20 migrations**: the previously rehearsed 18 plus:

- `20261116000100_message_revocation.sql`: shared authorization for message history, paginated retrieval, conversation list/unread counts and notification RLS. Either direction of a block denies both participants the entire shared conversation while both are accepted/invited; unrelated group members retain access. Removing family or conversation membership denies later retrieval, including existing sessions. Ownership mapping is rechecked. Message bodies are not published through Realtime; only RLS-filtered notification inserts are used by the application.
- `20261116000200_private_beta_admission.sql`: empty UUID-based operator approval registry; no grandfathering. Unapproved/unconfirmed users cannot join networks through invitations or create a network. Admission revocation invalidates membership authorization without deleting accounts/data. New membership writes also require approval. Founder privilege is separate, locked against concurrent use and consumed once. The user must explicitly confirm a new adult self-profile and administrator responsibility. Existing-person claims retain independent review.

The frontend displays an approval gate and explicit founder form, clears failed conversation retrievals, and rechecks active messaging on focus/at 15-second intervals. Already downloaded messages cannot be recalled; server checks govern subsequent retrieval. New admission controls gate family access, not creation of a bare Supabase Auth account: disabling public Auth signup or adding bot protection is a separate hosted setting decision.

## Tests and evidence

| Check | Result/evidence |
| --- | --- |
| Full 20-file atomic apply, injected failure rollback, matching-ledger resume and changed-checksum rejection | 12 rehearsal checks passed, including account/identity and legacy-record preservation; [results](output/hosted-beta/final/rehearsal-results.json) |
| Approval, false self-approval, founder race/replay, independent reviewer, valid-invitation admission/replay | Passed in [11 critical security checks](output/hosted-beta/final/critical-security-results.json) |
| Blocked direct/group history, pagination, chat counts, database privileges/RLS | Passed for both participants; unrelated group member retains history |
| Existing Realtime connection after block, conversation removal and family-membership removal | Denied unauthorized notification delivery; positive unaffected-conversation control delivered |
| Desktop/mobile explicit onboarding | Both passed; [browser results](output/hosted-beta/final/onboarding-browser-results.json) |
| Compilation and no-demo release boundary | Phase 6 build and 8 release-boundary checks passed |
| Independent local split restore | 4 checks passed in the final clean run, including password sign-in, exact function/table permissions, managed owners, all application/legacy data, ledger and private Storage bytes. See [recovery results](output/hosted-beta/final/independent-recovery-results.json) and [supplemental table/legacy verification](output/hosted-beta/final/restored-table-security-results.json) |
| Actual hosted recovery and original-owner sign-in | **Blocked / not performed**; requires authorized backup/access and approved independent destination |

The rehearsal uses synthetic local records only. Original hosted accounts were neither granted admission nor made administrators. Whole Auth/identity records, including credential hashes and confirmation state, were compared in local preservation/recovery tests. Local results do not claim original hosted owners have authenticated or that every historical application test was rerun.

## Explicit operator onboarding, after separate approval

These are API contracts for review, not instructions to execute now. Calls require a server-only service credential and are audited. No browser receives that credential.

1. Independently verify the intended account owner and select the exact Auth UUID. Call `fc_beta_authorize(target, approved=true, allow_found=false, reason)` to admit an ordinary beta participant. Email verification remains required; approval does not change it. A reviewed family invitation is still needed to join a family.
2. If this person is the designated founder, explicitly approve `allow_found=true`. This creates no membership or profile by itself. The owner signs in and submits the new-network form, which calls `fc_beta_start_network(network_name, first_name, last_name, confirm_self=true)`. One transaction creates only that new network, its first administrator and a newly confirmed self-profile; repeated/concurrent calls cannot create a second network.
3. Independently select a reviewer where necessary. `fc_beta_assign_admin(target, network, reason)` explicitly appoints an approved/verified account to the chosen network. It assigns **no person identity**. This permits independent review of the founder's first invitations; the founder cannot approve their own invitation. Never choose either hosted account merely because it already exists.
4. To revoke beta admission, call `fc_beta_authorize(target, approved=false, allow_found=false, reason)`. Records and Auth credentials remain intact. Re-admission is a new operator decision; it does not replenish an already consumed founder permission.

## Final package and approval requirements

[Review manifest](output/hosted-beta/final/review-manifest.json) records all migration, transaction, implementation and evidence SHA-256 values. [Prepared transaction](output/hosted-beta/final/reviewed-transaction.sql) is not an authorized hosted command. It retains the ledger, timeouts, advisory lock and safe handling of the two old standalone transaction wrappers. Do not concatenate raw SQL, reset a database, import test fixtures, or run the unrelated root migration chain.

Before any hosted execution:

1. Complete the [recovery runbook](HOSTED-RECOVERY-RUNBOOK.md) with an authorized source backup and independent destination. Approve measured RPO/RTO and name the operator/custodian.
2. Review the exact hashes, block semantics, admission defaults and legacy-grant quarantine impact. Confirm legacy consumers; compare fresh hosted schema/data/privilege drift and protected account inventory against the rehearsal assumptions.
3. Select the founder and reviewer explicitly; no UUID or email is embedded in SQL. Approve any hosted account admission/role changes separately from schema installation.
4. Approve the migration/maintenance window and reviewed server-side write freeze; then perform before/after account/data/security checks. No hosted runner has been authorized.
5. SMTP/URLs, hosted image/runtime checks, operational owners and controlled deployment acceptance from the existing readiness plan remain required before real beta use. Those hosted configuration tasks were outside this implementation scope and were not changed.

**Exact next owner action:** open Supabase **Database → Backups** and **Connect** for the source, confirm backup availability or access to the existing database credential, and identify an approved independent recovery destination and backup custodian. Return only that non-secret information. If permissions/credentials are unavailable, stop with an authorized administrator; do not reset passwords or alter managed roles to proceed.
