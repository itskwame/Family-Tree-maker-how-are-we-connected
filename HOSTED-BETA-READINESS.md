# Hosted beta readiness

Latest critical-blocker work: [20-migration security review](HOSTED-CRITICAL-BETA-REVIEW.md) and [operator recovery runbook](HOSTED-RECOVERY-RUNBOOK.md). Historical findings below are retained; use the linked review for current local test status. Hosted changes remain unapproved.

2026-10-21. **NO-GO for hosted migration and private beta.** Preparation is ready for review; deployment prerequisites are not satisfied.

| Gate | Status | Evidence / next action |
| --- | --- | --- |
| Fresh inventory | Partial | Catalog/counts/settings captured; complete external-consumer/dependency sign-off pending |
| Original Auth preservation | Partial | Two users/two identities, both unconfirmed; private metadata fingerprints captured. Synthetic preservation/sign-in passed; original hosted sign-in not tested |
| Schema reconciliation | Partial | Legacy tables retained; 35 normalized tables additive; legacy consumers unknown |
| Backup/restoration | Failed / Blocked | No listed backups/PITR; synthetic restore ownership failure |
| Additive migration | Passed locally | 16 exact SQL candidates; atomic apply/failure rollback; durable ledger runner untested |
| RLS/grants/functions/Storage | Partial | Fresh local effective catalog; hosted legacy defects; complete matrix unrun |
| Cross-family/social privacy | Blocked | Historical tests; blocked-history requirement mismatch H6 |
| Business security | Partial | Existing local tests retained; hosted candidate untested |
| No demonstration data | Passed locally | Fresh boundary and clean-start checks; observed hosted legacy/Storage empty; deployed artifact unverified |
| Dependency/config risks | Blocked | Moderate advisories need final applicability/upgrade sign-off; SMTP/URLs/worker outstanding |
| Package review | Awaiting review | Six reports and exact SQL candidates prepared |
| Hosted approval | Not granted | No migration, deployment or real invitations authorized |

## Evidence scope

Fresh additive rehearsal: 10 passing checks; synthetic restore failed. Fresh release-boundary suite: 8 passed. [Clean-start results](output/demo-audit/verification.json) exercise the compiled release against a separate zero-data local Supabase stack. [Demonstration audit](DEMO-DATA-AUDIT.html) contains desktop/mobile evidence; these are not hosted screenshots. No hosted login/email flow was exercised.

[Hosted counts](output/hosted-beta/hosted-counts.json), [settings](output/hosted-beta/hosted-services.json), [effective security](output/hosted-beta/effective-security.json), [rehearsal](output/hosted-beta/rehearsal-results.json), [dependencies](output/hosted-beta/dependency-audit.json).

## Exact next actions

1. In the project dashboard, review Database Backups for `jmsntxwkaneluqgnzzim` and identify an available supported recovery method. Arrange secure backup custody and an independent restore destination. Do not paste credentials/backups into chat or this repository. The API lists no backups and PITR is off; migration remains blocked until recovery is demonstrated.
2. Identify operators/consumers of the three legacy APIs and name a rollback owner. Confirm whether quarantining their API grants is acceptable; no data/account deletion is proposed.
3. Review local gaps H6â€“H8: blocked-message history, hosted image processing and real-family premium export integration. These require scoped implementation/retesting before full beta approval.
4. Choose the beta HTTPS domain and email/moderation owners; complete account ownership verification without automatic privilege assignment.
5. Once gates pass, approve the exact SQL/build/service hashes and maintenance window separately. Migration approval is not requested now because recovery/security blockers remain.

## Deliverables

- [Migration plan](HOSTED-BETA-MIGRATION-PLAN.md)
- [Schema differences](HOSTED-SCHEMA-DIFF.md)
- [Security audit](HOSTED-SECURITY-AUDIT.md)
- [Rehearsal](HOSTED-MIGRATION-REHEARSAL.md)
- [Rollback/recovery](HOSTED-ROLLBACK-PLAN.md)
- [Exact SQL candidate directory](migration-review/hosted-beta/README.md)

Hosted access was limited to read-only SQL and GET configuration endpoints. No hosted roles, records, grants, settings or schema changed. No deployment or real invitation occurred. Existing development fixtures were preserved.

## Local passwordless authentication review — 2026-11-13

Local email authentication passed on desktop and mobile using fictional `@example.test` accounts. Both new-account registration and returning-user sign-in reached local Supabase Auth (`POST /auth/v1/otp`, HTTP 200). Mailpit captured the messages at http://127.0.0.1:55324; verification links authenticated the user and returned to `/phase6.html`. Invitations survived same-tab verification and second-tab verification with continuation in the original invitation tab. Profile claiming still required explicit confirmation. Consumed and invalid tokens were rejected. Seven journey/security checks passed; eight release-boundary checks and the phase6 build passed. Screenshots and results are in `output/passwordless/`.

The first run's returning-user test reloaded before asynchronous sign-out finished; the test now waits for the signed-out screen before reloading. The rerun passed. Docker was stopped at initial inspection and was started for this review. Local emails are captured, never delivered to real inboxes. The passwordless screen now explains this and links to Mailpit. Keep the invitation tab open and use the same browser; cross-browser/device invitation continuation was not tested.

A fresh read-only GET of hosted Auth settings confirmed custom SMTP is absent, `site_url` is `http://localhost:3000`, the redirect allowlist is empty, and the email rate limit is 2/hour. See `output/passwordless/hosted-email-config.json`. Before private beta, configure an approved email provider/sender and domain authentication, set the beta HTTPS site URL and exact callback allowlist, choose suitable sending limits, and test approved-recipient delivery plus registration/sign-in/invitation continuation on the hosted candidate. No hosted settings or accounts were modified and no real-user emails were sent. Existing recovery/security and deployment approval gates remain unresolved.

## Cost-control review - 2026-11-13

The [cost-control plan](COST-CONTROL-PLAN.html) documents current free-tier limits, accumulated storage/bandwidth/email cost assumptions, paid-growth approval points, and remaining provider configuration. No purchase, upgrade, billable service, hosted migration, production email change or real-user email occurred.

Local safeguards now include adaptive server WebP compression (500 KB combined image/thumbnail maximum), 50 MB account photo quota, an 800 MB project reservation ceiling, 20 shared social/business uploads per rolling day, daily content/messaging limits, lazy authorized image loading, and a 60-second Auth resend limit with persistent UI cooldown. Existing pagination, private storage authorization and deletion/consent behavior remain. Rate/quota concurrency tests, direct email 429 test, complete passwordless journey, media/Realtime, social boundary/pagination, business security, and desktop/mobile social regressions passed. Build and release-boundary checks passed; initial sandbox esbuild launch failure was resolved by rerunning the build with the required execution permission. A separate lazy-image test confirmed offscreen images load on scroll; report desktop/mobile layout was inspected.

Local usage alerts are configured at 70%/90% with explicit UNKNOWN/STALE states. These are operator-run CLI alerts, not scheduled remote monitoring. Billing dashboards were inaccessible, so current provider plans, spending-cap/recharge settings and billing notification recipients are unverified. The Supabase integration was suggested but not connected. Do not mark hosted cost control complete until dashboard verification, usable remote alerts, approved SMTP/bot controls, a tested hosted image processor/maintenance job and backup restoration are in place. No paid upgrade is authorized. The appended cost migration extends the old 16-file candidate; repeat the full manifest/rehearsal before hosted approval.

## Cost readiness review - 2026-11-14

[Readiness report](COST-READINESS-REVIEW.html) and [monthly dashboard](MONTHLY-COST-DASHBOARD.html) are available. Netlify image-handler source and an inactive deployment configuration were added and validated locally, including browser preparation of 4-8 MiB selections, independent 4 MB transport enforcement, trusted compression, private authorization, partial failure cleanup and safe 800 MB exhaustion. A durable private reservation ledger closes a cancellation race; missing storage sizes now pause uploads. Existing photos remained accessible during the full-budget test. No hosted migration, deployment, billing/SMTP change or paid activation occurred.

Provider billing settings remain unverified: no authenticated billing dashboard, linked Netlify site or Resend connection was available. A fresh read-only hosted Auth GET confirms SMTP is still absent and localhost redirect settings remain. The selected Netlify baseline at 10,000 registrations / 2,000 MAU is now $54/month; $45 requires the separate Cloudflare-static alternative. All costs remain conditional on workload, compute, recovery and provider verification.

The function bundle, app build, 11 handler-security scenarios, six quota scenarios, image/transport tests, release-boundary checks, dashboard interaction/layout checks and desktop/mobile social journeys passed locally. Hosted Linux Sharp packaging, runtime limits, cleanup scheduling, billing settings/alerts, load testing and existing security/recovery gates still block deployment. The full 18-file migration set needs a new manifest/rehearsal before approval. Dashboard numbers are manual inputs and forecasts, not observed hosted invoices.


## 2026-11-16 backend preparation update

See [current ordered actions and manual settings](HOSTED-BACKEND-NEXT-ACTIONS.md). The complete 18-file set passed 12 isolated rehearsal checks, including actual durable-ledger resume and failure rollback. The two November migrations contain transaction wrappers: use the reviewed transaction generator, never concatenate raw files. Independent restore still fails on managed Auth ownership; hosted changes remain unapproved. A disabled maintenance-function candidate is prepared; no hosted service or active deployment configuration changed.
