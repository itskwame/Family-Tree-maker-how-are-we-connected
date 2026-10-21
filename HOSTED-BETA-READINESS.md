# Hosted beta readiness

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
3. Review local gaps H6–H8: blocked-message history, hosted image processing and real-family premium export integration. These require scoped implementation/retesting before full beta approval.
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
