# Hosted private beta migration plan

2026-10-21. **Planning and isolated rehearsal only. Not approved for hosted execution.** Target: `jmsntxwkaneluqgnzzim`.

Use additive installation of `familyconnect`, its public RPCs, private Storage policies and Realtime notification publication. Preserve `public.families`, `public.family_memberships`, `public.invites`, all Auth users and identities. Never reset, replace, merge accounts or import development records. Fresh hosted counts: two users, two identities, no legacy rows or Storage objects. Neither user currently has an email-confirmation timestamp. Recheck immediately before any eventual migration.

## Exact package and ordering

Exact SQL candidates are in [migration-review/hosted-beta](migration-review/hosted-beta/README.md). [Rehearsal results](output/hosted-beta/rehearsal-results.json) contain SHA-256 hashes of all 16 files actually tested. The 15 normalized files are byte-for-byte copies of the current local migrations; their local-only headers remain deliberately intact. These are review candidates, not an approved deployment artifact.

1. `20261021000000`: proposed legacy API quarantine, revoking anon/authenticated table grants while preserving rows, policies and accounts. Requires legacy-consumer confirmation and explicit approval of this access change. It changes API-role grants, not either Auth account's metadata or assigned privileges. If consumers exist, design their secure replacement first.
2. `20261021000100`: normalized networks, people, relationships, invitations, claims, progress, consent RPCs and RLS.
3. `00200`–`00700` under the same date prefix: guardian/identity rules, claim review, network-scoped reveal, partnership semantics, builder and invitation portraits, in filename order.
4. `00800`–`01300`: social profiles, posts/comments/reactions, messaging, private media, notifications, pagination, retention and finalization guards.
5. `01400`–`01500`: business ownership, moderation, links/media and private owner projection.

Use full filenames from the manifest. Do not execute the unrelated root `supabase/migrations` chain or mark it applied: it expects another model. Hosted migration history is currently empty.

The rehearsal applied all candidates in one fail-on-error transaction. Production execution still needs reviewed timeouts, lock impact and a durable ledger recording committed versions/checksums atomically. Raw SQL replay is not idempotent. Resume must verify committed hashes, skip matching files and refuse mismatches. The rehearsal simulated ledger skip; a durable deployment runner is not validated.

## Stages and gates

| Stage | Status | Required exit condition |
| --- | --- | --- |
| A: read-only audit | Partial | Metadata/counts/config captured; external consumers and complete dependency review signed off |
| B: recovery | Blocked | Recoverable hosted backup, independent restore and named rollback owner |
| C: rehearsal | Partial | Additive/failure rollback passed; restoration failed; full security matrix and durable resume required |
| D: security approval | Blocked | Findings resolved; exact SQL/build/configuration hashes approved |
| E: private beta | Not authorized | Hosted-change approval, post-change checks and explicit real-user access approval |

## Preserve the complete platform

Retain graph/layout/relationship engines, invitation-first passwordless onboarding, claims, optional builder/autosave, profiles, Family Home, private/group messaging, businesses, connected networks and templates. Database installation alone does not deliver all hosted features. The image worker is local-only; a secured hosted worker and cleanup scheduling are required. Release correctly excludes the fictional print studio, but a real-family print entry point and authorized portrait-export integration are not verified. Do not silently remove templates or re-enable fictional fixtures to satisfy scope.

## Original account preservation

Keep IDs, identity associations, credentials, verification state and privileges unchanged. No migration creates person-account links or administrators automatically. Private metadata fingerprints of current account IDs/creation/confirmation/role and identity associations were captured without exporting credentials. Fingerprints do not prove account ownership.

Confirm ownership through owner-driven verification; initial network administrator provisioning must be separately reviewed and audited. Email verification alone is not genealogical identity proof. Compare protected per-account inventories and fingerprints before/after. Both owners must authenticate through the actual hosted flow after deployment; do not request passwords or administratively mark emails verified. Hosted sign-in was not attempted here.

## Future execution procedure — blocked, not executed

1. Freeze the commit, SQL hashes, dependency evidence, infrastructure settings and consumer-impact decision. Re-audit drift and recount data immediately before the maintenance window.
2. Verify encrypted backup, Storage manifest and independent restore; assign incident owner and approve measured RPO/RTO.
3. Gate registration, invitations and application writes through reviewed server-side maintenance controls. Hiding UI controls is insufficient.
4. After explicit approval, apply only approved SQL through a guarded target check and transaction/ledger runner. Never use indiscriminate `db push` on historical migrations.
5. Configure exact HTTPS Auth URLs, SMTP/rates, API schemas, worker origins, server-only credentials, private Storage limits and Realtime. Do not expose `familyconnect` directly merely for convenience; the current design uses public RPCs.
6. Build with explicit `FAMILYCONNECT_RELEASE_TARGET=private-beta`, reviewed `VITE_FC_URL`, public `VITE_FC_ANON_KEY` and hosted `VITE_FC_MEDIA_URL`. Publish only `dist-release`. Exclude fixture scripts, dumps, private evidence, stock assets and service keys.
7. Run actual hosted security/functional acceptance, original-account continuity and no-demo checks before enabling invitations. Fail closed on critical defects.
8. Admit real participants only after separate approval. Never automatically publish businesses or assign identities.

See [security audit](HOSTED-SECURITY-AUDIT.md), [rollback](HOSTED-ROLLBACK-PLAN.md) and [readiness](HOSTED-BETA-READINESS.md).
