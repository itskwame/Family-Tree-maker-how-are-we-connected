# FamilyConnect Launch Readiness

Last assessed: 2026-10-21 (America/New_York). Phase 6B historical evidence remains linked below.

Phase 7 local evidence is now available in [PHASE-7-REPORT.html](PHASE-7-REPORT.html). Hosted and real-user gates remain unchanged.

The **Family Business Directory is included in the first private beta**, as requested. Its isolated implementation and evidence are in [BUSINESS-DIRECTORY-REPORT.html](BUSINESS-DIRECTORY-REPORT.html). This is required beta scope, not an optional monetization feature. No hosted changes or real-user access are authorized by its local completion.

This is the release-gate record, not a feature wish list. **No hosted migration, public deployment, or invitation to real relatives is authorized by this checklist.** Preserve the two existing hosted Auth accounts. Current implementation and tests use fictional data in isolated local Supabase.

## How to maintain this file

- **Passed**: the stated scope has observed test/review evidence. Code presence and a successful build alone are insufficient.
- **Failed**: inspection or a test demonstrates a requirement is not met. Include the defect and next action.
- **Blocked**: a necessary dependency, review, or explicit authorization is missing. Name it.
- **Not Tested**: sufficient evidence has not been collected; do not infer success or failure.
- Every implementation/release review must update affected rows, evidence links, environment, and date. Preserve historical findings when superseded. Rerun relevant checks after behavior, permissions, deployment, or schema changes.
- A local pass is **not** a hosted pass. Do not include credentials, invitation tokens, personal data, or raw private audit output in this file. Link sanitized findings instead.
- Before a release, record the candidate commit, migration versions, environment, reviewer, unresolved defects, accepted scope exclusions, rollback owner, and explicit go/no-go decision. No release-candidate commit or real-user approval is recorded yet.

## Release gates

| Milestone | Required outcome | Status | Evidence / remaining gate |
| --- | --- | --- | --- |
| Phase 6 completion — local demonstrated scope | Local onboarding, security, and family-building tests pass | **Passed** | [Phase 6 report](PHASE-6-REPORT.html), 29 database checks, 12 consent checks, 3 adapter checks, desktop/mobile first-time journeys, and inspected screenshots. This records the demonstrated local scope, not complete coverage of every checklist item. Final user visual acceptance is not recorded. |
| Phase 6B — local UX refinement | Local guided onboarding and security regressions pass; visual evidence ready | **Passed** | [Phase 6B report](PHASE-6B-REPORT.html): 27 browser journey checks, 17 new security checks, 29 existing security + 12 consent + 3 adapter checks, 53 engine + 16 legacy browser checks. Final Phase 6B user visual review is pending. |
| Private family beta | Critical security/privacy checks pass on the reviewed hosted candidate; real-user access explicitly approved | **Blocked** | Hosted invitation/membership defects remain; hosted migration, deployment/security review, recovery verification, beta scope, and real-user approval are outstanding. See blockers below. |
| Phase 7 — local social experience | Family Home, profiles, private media/messages and invitation-only groups tested locally; actual visuals inspected | **Passed** | [Phase 7 report](PHASE-7-REPORT.html): 32 database/media/Realtime scenarios, 22 desktop/mobile browser scenarios, 14 screenshots and existing regressions. Final user visual/security approval is pending. Local pass only. |
| Family Business Directory — local beta scope | Optional multi-business directory, consented ownership, moderation, private media and network isolation | **Passed** | [Directory report](BUSINESS-DIRECTORY-REPORT.html): 27 database/security scenarios, 29 browser journeys, inspected desktop/mobile screenshots, 189 existing regression checks. User review and hosted certification remain pending. |
| Public launch | Beta findings addressed, operational controls working, no unresolved critical defects | **Blocked** | Private beta has not begun; public operations and legal/privacy readiness are unverified. |
| Monetization | Payment experience and commercial demand validated | **Not Tested** | Premium design feasibility exists; demand, pricing, payments and subscriptions are unvalidated. Not a private-beta or free-public-launch prerequisite. |

## What blocks the first private beta

| ID | Blocker | Status | Required resolution / evidence |
| --- | --- | --- | --- |
| B1 | Hosted unrestricted invitation SELECT, membership/admin assignment gap, recursive policies and broad grants | **Failed** | [Hosted audit](PHASE-6-READONLY-AUDIT.html). Prepare an additive migration and least-privilege plan; obtain separate hosted-change approval; test the actual deployed permissions with multiple accounts. A secure new schema does not fix exposed legacy objects. |
| B2 | Hosted schema transition and account preservation are not rehearsed | **Blocked** | [Reconciliation](PHASE-6-RECONCILIATION.html). Re-count before cutover, preserve both Auth accounts and any new records, validate migration/rollback against an isolated copy. Do not apply the old incomplete migration chain. |
| B3 | Backup restoration, deployment rollback and minimal operational error monitoring lack evidence | **Not Tested** | Demonstrate a recoverable backup, restore rehearsal and rollback; establish a named operator and a usable error/support channel. Elaborate observability is not required for a small beta. |
| B4 | Beta privacy/consent, correction/removal and deletion procedures are not established | **Not Tested** | Publish understandable beta privacy/terms and a reachable request channel; document who handles correction, dispute, removal and deletion requests. A verified manual process can suffice; a full self-service portal is not required. |
| B5 | Invitation decline and real delivery/recovery/device validation are incomplete | **Failed** | Expiry/revocation pass locally, but no explicit decline action exists. Add/test decline, then verify actual email delivery/recovery and representative real iPhone/Android journeys on the approved candidate. |
| B6 | Real-user access and exact beta scope are not approved | **Blocked** | Obtain explicit approval after the above evidence is reviewed. Recommended first scope: 10–20 trusted adults, conservative visibility, no arbitrary branch sharing. Adult testers do not remove privacy duties for minors or other people they add. Disable unvalidated capabilities server-side if excluded; document and approve exclusions. |
| B7 | Directory hosted permissions and ownership/moderation operations are unreviewed | **Blocked** | Include the directory in the first beta. Review its local evidence, assign an independent ownership verifier and report handler, verify actual hosted network/media boundaries and storage limits, and close any legacy unrestricted business-read policy. No hosted migration is authorized. |

Do not hold this beta for payments, subscriptions, additional decorative styles, broad social features, sophisticated growth analytics, or arbitrary cross-network branch merging. Any scope reduction must be explicit, enforceable and reviewed; it is not a waiver of critical privacy/security defects.

## 1. Core Family Tree

| ID | Requirement | Status | Evidence and scope / next action |
| --- | --- | --- | --- |
| C1 | Automatically display 25, 100 and 300 relatives | **Passed** | Fictional fixtures: [Phase 2](PHASE-2.md), [Phase 3](PHASE-3.md), [Phase 4](PHASE-4.html); [300-person desktop](output/phase4/01-complete-desktop.png). Hosted multi-user scale is separate. |
| C2 | Accurately show parents, siblings, children, partners and extended relatives | **Passed** | Existing 53 engine/geometry checks summarized in [Phase 6 report](PHASE-6-REPORT.html); [local graph-adapter checks](output/phase6/adapter-tests.json). Applies to supported, verified fixture relationships. |
| C3 | Support complex structures and unknown relationships | **Passed** | [Phase 4](PHASE-4.html): remarriages, half-siblings, adoption, unknown parentage and multiple ancestry paths. Unsupported assertions remain pending; absence of data is not proof of a relationship. |
| C4 | Show paths without inventing connections | **Passed** | [Database tests](output/phase6/database-tests.json), [consent tests](output/phase6/consent-tests.json), [highlighted reveal](output/phase6/screenshots/02-desktop-connection.png). |
| C5 | Search, zoom, branch navigation and mobile views | **Passed** | Existing 11 browser regressions; [mobile tree](output/phase6/screenshots/05-mobile-connection.png), [Phase 4 browser results](output/phase4/browser-results.json). Browser emulation is not real-device certification. |
| C6 | Preserve accurate SVG/PDF exports | **Passed** | [Phase 4 export results](output/phase4/export-results.json), [Phase 5 export results](output/phase5/export-results.json), independent PDF-render images in both reports. Existing templates/fixtures; newly onboarded database trees are not yet connected to personalized export. |

## 2. Onboarding and Viral Invitations

| ID | Requirement | Status | Evidence and scope / next action |
| --- | --- | --- | --- |
| O1 | Personalized invitations without installing an app | **Passed** | [Browser journey](output/phase6/browser-results.json), [invitation screenshot](output/phase6/screenshots/01-desktop-invitation.png). Local web links only. |
| O2 | Secure sign-up, sign-in and invitation continuation | **Passed** | Real local Auth and Mailpit: [desktop first-time](output/phase6/first-time-results.json), [mobile first-time](output/phase6/first-time-mobile-results.json). Cross-device/new-browser continuation not established. |
| O3 | Confirm identity or safely claim an existing profile | **Passed** | [Database tests](output/phase6/database-tests.json): verified-email binding, independent review, atomic claim, replay rejection and one identity per account/network. Human review is an attestation, not external identity-document verification. Hosted approval remains blocked. |
| O4 | Reveal a supported family connection promptly | **Passed** | [Phase 6B browser measurements](output/phase6b/browser-tests.json): desktop 4.35 s / mobile 2.79 s automated invitation-to-reveal including capture overhead. Human onboarding and 30–60 s builder targets remain **Not Tested**. |
| O5 | Skip the Guided Family Builder | **Passed** | Invitation goes directly to reveal; [browser results](output/phase6/browser-results.json) and [reveal screenshot](output/phase6/screenshots/07-first-time-verified-reveal.png). No builder completion required. |
| O6 | Add parents, siblings, children and other relatives | **Passed** | [Phase 6B desktop/mobile journeys](output/phase6b/browser-tests.json): adoptive parent, half-sibling, biological child and uncertain cousin; pending status and protected-child invitation suppression verified. This is representative flow coverage, not every combination of roles and types. |
| O7 | Autosave family-building progress | **Passed** | Reload/new-login persistence in [database](output/phase6/database-tests.json) and [browser](output/phase6/browser-results.json) tests. Concurrent tabs use last-write behavior; conflict-resolution UI is absent. |
| O8 | Suggest existing relatives before creating duplicates | **Passed** | [Phase 6B browser](output/phase6b/browser-tests.json) and [database](output/phase6b/database-tests.json): authorized suggestions, same-name distinction, private-profile exclusion, double-clicks, concurrent retries and equivalent assertions. No automatic name merging. |
| O9 | Voluntary SMS, email, WhatsApp and copy-link invitations | **Not Tested** | Phase 6B link creation, clipboard and URI checks pass; all external OS/native handlers and delivery remain untested. Nothing sent automatically. |
| O10 | Expired, declined and revoked invitations | **Failed** | Expired/revoked rejection passes in [consent tests](output/phase6/consent-tests.json). Explicit decline is missing from the [UI](src/phase6/main.jsx) and local mutation API. Add decline and acceptance-after-decline tests. |

## 3. Database and Security

| ID | Requirement | Status | Evidence and scope / next action |
| --- | --- | --- | --- |
| S1 | Validate normalized schema and local migrations | **Passed** | Thirteen [local migrations](local/phase6/supabase/migrations) applied. Phase 7 adds isolated social records, guarded mutations, private storage, notification authorization, cursor pagination and retention controls. [Report](PHASE-7-REPORT.html). Hosted transition still unapproved. |
| S2 | Verify RLS with multiple test accounts | **Passed** | [29 local checks](output/phase6/database-tests.json), [12 additional checks](output/phase6/consent-tests.json). Anonymous, unrelated account, contributor, administrator, reviewer and guardian roles exercised. |
| S3 | Remove unrestricted invitation access | **Failed** | Local access is restricted; hosted `invites` SELECT remains unrestricted to authenticated users. [Hosted audit](PHASE-6-READONLY-AUDIT.html), blocker B1. |
| S4 | Prevent unauthorized membership and role changes | **Failed** | Local escalation checks pass. Hosted self-enrollment/admin-role gap remains unremediated: [audit](PHASE-6-READONLY-AUDIT.html). |
| S5 | Secure, expiring invitation tokens | **Passed** | Local random 256-bit tokens, hash-only storage, expiry/revocation/replay/concurrency tests: [database](output/phase6/database-tests.json), [consent](output/phase6/consent-tests.json). Hosted token handling has not been replaced. |
| S6 | Protect claims against impersonation | **Passed** | Local wrong-email, independent reviewer, duplicate identity and atomic acceptance checks in [database results](output/phase6/database-tests.json). Verify the actual human-review procedure before beta. |
| S7 | Cross-family access and consent revocation | **Passed** | [Consent results](output/phase6/consent-tests.json): both administrators plus person consent; profile-only sharing; revocation removes visibility. Does not certify arbitrary branch sharing. |
| S8 | Minor profiles and guardian permissions | **Passed** | Local invite prohibition, restricted visibility, independent guardian approval and revocation: [database results](output/phase6/database-tests.json). Real-world age/guardian policy and enforcement review remain outstanding under P7. |
| S9 | Preserve the two hosted Auth accounts | **Passed** | [Read-only counts and preservation assessment](PHASE-6-RECONCILIATION.html); implementation operated only on local Supabase. This records no hosted changes, not post-migration preservation. Reverify at any future cutover. |
| S10 | Security review before real-user access | **Blocked** | Hosted B1/B2 unresolved; no approved hosted candidate or final security sign-off. Local tests do not grant beta approval. |

## 4. Privacy and Trust

| ID | Requirement | Status | Evidence and scope / next action |
| --- | --- | --- | --- |
| P1 | Understandable profile visibility settings | **Passed** | Local optional biography/location/month-day birthday/photo sharing defaults private; owner edits and other-account field suppression tested. [Database evidence](output/phase7/database-tests.json), [profile screenshot](output/phase7/screenshots/mobile-04-profile.png). Human comprehension and hosted enforcement remain untested. |
| P2 | Pending relationships separate from verified facts | **Passed** | [Database tests](output/phase6/database-tests.json), [builder screenshot](output/phase6/screenshots/03-desktop-builder.png). Unsupported sibling/step assertions do not enter confirmed ancestry. |
| P3 | Corrections, disputes and removal requests | **Not Tested** | No verified end-to-end request/response process. Establish a reachable manual beta process and ownership; self-service automation can follow. |
| P4 | Protect private photos, children and living relatives | **Passed** | Local adult social discovery, per-field privacy and private processed uploads tested; cross-network originals/thumbnails/signed-URL creation denied even when both users own valid photos. [Media tests](output/phase7/media-realtime-tests.json). Hosted photo access and real-world consent/age procedures remain beta blockers. Previously downloaded data cannot be recalled. |
| P5 | Accessible privacy policy and terms | **Not Tested** | No reviewed policy/terms evidence for the current product and beta scope. Obtain appropriate review; do not infer legal compliance from this checklist. |
| P6 | Account and personal-data deletion procedures | **Not Tested** | Document and rehearse request verification, retention, relational impacts and backup treatment using fictional data. Do not delete hosted accounts during preparation. |
| P7 | Appropriate age restrictions and guardian rules | **Not Tested** | Technical local controls pass, but age assertion, guardian-review procedure and applicable policy requirements have not been validated. Adult testers can still add information about minors. |

## 5. Reliability and Performance

| ID | Requirement | Status | Evidence and scope / next action |
| --- | --- | --- | --- |
| R1 | Verified backups and restoration | **Not Tested** | Phase 6B source + fictional database checkpoint exists; [archive catalog check](output/phase6b/checkpoint-validation.json) passed. No restore rehearsal or production backup validation performed. |
| R2 | Application/database error monitoring | **Not Tested** | Local test errors were captured; no operational alerts, response ownership or hosted monitoring evidence. Minimal actionable monitoring is required for beta. |
| R3 | Real iPhone and Android tests | **Not Tested** | Chrome mobile emulation passed. Test actual devices, keyboards, browser resume, sharing and verification links. |
| R4 | Email delivery and account recovery | **Not Tested** | Local verification mail passed; production deliverability, spam handling, password reset and recovery are untested. |
| R5 | Simultaneous users and large networks | **Not Tested** | 300-person graph performance and concurrent token consumption pass. Sustained multi-user hosted database/API behavior is not tested. Use a bounded beta-sized test first; public-scale load testing is a later gate. |
| R6 | Broken/missing photos fail gracefully | **Passed** | Existing browser and premium fallback tests; [Phase 5 report](PHASE-5.html), [Phase 6 regression summary](PHASE-6-REPORT.html). Applies to existing portrait rendering. |
| R7 | Deployment configuration and rollback | **Blocked** | No approved hosted candidate. Validate configuration, Auth redirects, least privilege, feature rollback and data-preserving recovery before beta deployment approval. |

## 6. Real Family Beta

These are beta execution/exit activities, not a reason to demand public-launch features before inviting the first approved adults.

| ID | Requirement | Status | Evidence / next action |
| --- | --- | --- | --- |
| BETA1 | Invite 10–20 trusted adults after security approval | **Blocked** | Real-user access not authorized; B1–B6 must be resolved or explicitly scoped with safe controls. |
| BETA2 | Observe onboarding without instructions | **Blocked** | Await approved beta participants; no human usability observations recorded. |
| BETA3 | Measure time to first meaningful connection | **Blocked** | Await beta. Report human time and email wait separately; automation is not a substitute. |
| BETA4 | Measure invitations sent and accepted | **Blocked** | Await beta and privacy-conscious event definitions. Manual aggregate tracking is acceptable initially; exclude tokens/contact details. |
| BETA5 | Real-world relationship accuracy | **Blocked** | Await consented real data and approved beta. Fictional accuracy tests already pass. |
| BETA6 | Feedback and critical-defect resolution | **Blocked** | Await beta; define severity, owner and closure evidence. Public launch requires no unresolved critical defects. |
| BETA7 | Return and continue building | **Blocked** | Local persistence passes; real-user return behavior remains unobserved until beta. |

## 7. Public Launch Operations

| ID | Requirement | Status | Evidence / next action |
| --- | --- | --- | --- |
| L1 | Production deployment and security review | **Blocked** | No deployment approval; private beta and hosted security remediation must precede public launch. |
| L2 | Support contact and issue-reporting process | **Not Tested** | Establish a lightweight beta contact first; validate public support handling before public launch. |
| L3 | Backups, monitoring, alerts and recovery | **Not Tested** | See R1/R2/R7. Public launch needs demonstrated ongoing operation, not just configuration. |
| L4 | Cost monitoring and spending limits | **Not Tested** | Establish accountable budget/alerts and provider limits. Broader growth cost controls are a public-launch gate. |
| L5 | Privacy, legal and retention requirements | **Not Tested** | Scope-specific professional review and implemented procedures needed; do not treat copied policies as evidence. |
| L6 | Growth across independent networks | **Not Tested** | Local scoped identity sharing passes. Multi-network growth, permission isolation at scale and operational load are untested. |
| L7 | Clear rollback criteria | **Not Tested** | Define triggers such as unauthorized disclosure, claim/role escalation, data loss, failed migrations and severe onboarding outages; name decision owner and test the rollback procedure. |

## 8. Optional Monetization

| ID | Requirement | Status | Evidence / next action |
| --- | --- | --- | --- |
| M1 | Demand for premium downloads | **Not Tested** | No customer-demand evidence. Can be researched after core beta without adding payments. |
| M2 | Designer-template quality across family sizes | **Passed** | User-approved Phase 5 feasibility; [11/15/25/40-person report](PHASE-5.html), independent PDF examples and five premium browser checks. Not proof of purchase demand. |
| M3 | Prices and willingness to pay | **Not Tested** | No pricing research or paid experiments authorized/completed. |
| M4 | Secure payment processing when justified | **Not Tested** | Not implemented or authorized. Gate only monetization, not the first family beta. |
| M5 | Decide whether subscriptions are necessary | **Not Tested** | Make a commercial decision from usage, costs and demand; do not assume recurring billing is required. |

## Next readiness review

### Phase 7 local social review

| Requirement | Status | Evidence / limits |
| --- | --- | --- |
| Returning-user Family Home; first invitation still reveals connection first | **Passed** | [22 social browser checks](output/phase7/browser-tests.json), [27 onboarding checks](output/phase6b/browser-tests.json), [5 passwordless checks](output/passwordless/results.json). |
| Posts, photographs, own edits/deletion, likes and comments | **Passed** | [Database checks](output/phase7/database-tests.json), desktop/mobile rendered evidence in [report](PHASE-7-REPORT.html). Comment display currently capped at 20 recent comments per post. |
| Adult private conversations, blocking/reporting, unread indicators and Realtime | **Passed** | [Boundary tests](output/phase7/boundary-tests.json), [Realtime isolation/deletion](output/phase7/media-realtime-tests.json), [browser tests](output/phase7/browser-tests.json). Reports are recorded; staffed moderation is not implemented. |
| Invitation-only groups, administrator delegation, privacy settings, leave/remove | **Passed** | Database tests reject family-admin bypass, unaccepted access, role escalation and access after removal/revocation. Group size cap 50; list cap 100 conversations. |
| Image processing, metadata removal, private exact-path storage and upload limits | **Passed** | Exact-path parameter-shadowing defect found and corrected in migration 012; strengthened two-network test passes. Finalization rechecks current authority in migration 013. |
| Dependency security review | **Failed** | High/critical findings remediated; [audit](output/phase7/dependency-audit.json) retains two moderate legacy React Router entries outside the Phase 6/7 entry point. Review or remove the legacy route surface before a hosted candidate. |
| Human moderation/support, deletion procedures and operational recovery | **Not Tested** | Existing B3/B4/P6 remain open. Secure report storage is not a staffed response process; the local checkpoint is not a restore rehearsal. |
| Phase 7 visual and security approval | **Blocked** | Await user review of [14 screenshots and report](PHASE-7-REPORT.html). No hosted deployment or real-user invitation is authorized. |

Existing regression evidence: [summary](output/phase7/regression-summary.json). All 11 tree browser scenarios passed across the final full run and targeted retry. Earlier cold-start and OneDrive screenshot-write failures are recorded; they were not silently treated as clean first-run passes. Five premium browser and 53 engine/geometry checks passed. All current tests use fictional local data.

### 21 October audit and local authentication update

- [Family Home / Timeline inventory](FAMILY-HOME-TIMELINE-AUDIT.html) records recoverable legacy feed/profile/event/chronology code, disconnected routes, missing social schema and privacy defects. No social feature was restored, and this inventory does not add every future social feature to the first-beta gate.
- Optional local passwordless email authentication: **Passed** for the five [recorded browser/token checks](output/passwordless/results.json), with 29 existing security regressions and password-login/draft/template smoke checks passing. Same-browser second-tab and same-tab invitation continuation were exercised. Production delivery, real devices, human timing and new-device continuation remain **Not Tested**.
- Hosted inspection was not repeated; prior hosted findings remain historical, and both hosted Auth accounts were untouched. All hosted-change and deployment gates remain blocked.

1. Review Phase 6B visuals. Builder variants and duplicate UX now have local evidence; explicit decline, real-device/native handler testing and human timings remain open.
2. Propose a clearly scoped adult private beta and minimal privacy/support procedures; identify disabled capabilities explicitly.
3. Prepare hosted migration/security, backup/restore and deployment/rollback evidence for **separate approval**. Do not execute hosted changes merely because this file lists them.
4. After the actual hosted candidate passes critical checks, request explicit approval for real-user invitations. Record the approving decision here before sending any.

## 9. Family Business Directory — required for first private beta

| ID | Requirement | Status | Evidence / remaining scope |
| --- | --- | --- | --- |
| D1 | Audit legacy directory and reuse suitable code securely | **Passed** | [Inventory](BUSINESS-DIRECTORY-REPORT.html): legacy form/card structure retained conceptually; global-read policy and unsafe HTML rejected; existing private media and relationship engine reused. |
| D2 | All authorized members can browse; listings optional; owners can manage multiple businesses | **Passed** | [Security tests](output/business/security-tests.json), [desktop/mobile journeys](output/business/browser-tests.json). Viewer/minor browsing and adult-only ownership tested. No registration/onboarding business fields. |
| D3 | Name, logo, description, category, services, photos, general area, approved contacts, multiple links and optional offers | **Passed** | Four fictional listings; private contact default, expiry, 12-link and image limits tested; [actual detail screenshot](output/business/screenshots/desktop-02-business-detail.png). |
| D4 | Search/filter/detail, edit/hide/delete and optional owner relationship paths | **Passed** | 29 browser scenarios plus pagination/security checks. Confirmed graph reused; unknown relationships not invented. Detail views follow current state-based routing. |
| D5 | Ownership verification, co-owner consent and appropriate moderation | **Passed** | [Co-owner/moderation browser evidence](output/business/collaboration-browser-tests.json); independent approval enforced in SQL, including for owner-admins. Human verification only. Assign real operators before beta. |
| D6 | Network boundaries, profile privacy and private image authorization | **Passed** | [Boundary tests](output/business/boundary-tests.json): connected identities do not expose businesses; revoked membership/ownership and changed minor eligibility tested. Local scope only. |
| D7 | Low-cost images; no video or commercial placement | **Passed** | Existing worker reused; six images/listing maximum, WebP + thumbnails, 106,606 measured demo bytes. [Cost assumptions and limits](BUSINESS-DIRECTORY-REPORT.html). Hosted budgets and alerts remain unverified. |
| D8 | Preserve Phase 7, onboarding, family engine and templates | **Passed** | [Current regression evidence](output/business/test-summary.json): 189 existing scenarios pass. No hosted deployment. |
| D9 | Hosted directory/security review, real ownership checks, device validation and operational readiness | **Blocked** | User visual review, approved hosted candidate, independent moderators, privacy/retention decisions, physical-device tests and explicit real-user authorization required. See B1–B7. |

### Update log

| Date | Change | Evidence basis |
| --- | --- | --- |
| 2026-10-20 local | Initial evidence-backed checklist; separated local success, hosted blockers, beta activities, public operations and optional monetization | Existing Phase 2–6 reports, local JSON test artifacts, screenshots, read-only hosted audit and reconciliation. This update did not rerun tests or change hosted data. |
| 2026-10-20 local / 2026-10-21 UTC | Phase 6B guided UX, duplicate safeguards, consented invitation portrait and same-tab invitation continuation verified; hosted gates unchanged | [Phase 6B report](PHASE-6B-REPORT.html), current JSON checks and inspected desktop/mobile screenshots. |
| 2026-10-21 local | Included Family Business Directory in first-beta scope; completed isolated implementation, security/browser testing, visual inspection and cost measurements | [Directory report](BUSINESS-DIRECTORY-REPORT.html), 27 new security + 29 browser + 189 regression scenarios. Hosted and real-user gates unchanged; stopped for review. |


## 10. Demonstration data release boundary

| Requirement | Status | Evidence / remaining scope |
| --- | --- | --- |
| Inventory fictional records, stock portraits, fixture writers, local storage and generated evidence | **Passed** | [Audit](DEMO-DATA-AUDIT.html), [file and aggregate-count inventory](output/demo-audit/inventory.json). Local repository and isolated database only. |
| Release excludes demos, legacy fixture imports and public stock assets; no automatic seeds | **Passed** | [8 boundary checks](output/demo-audit/release-boundary-tests.json); explicit release configuration, separate session keys and dist-only publishing. |
| Clean application starts without fictional users, posts, businesses or conversations | **Passed** | [12 clean-start checks](output/demo-audit/verification.json), real fresh local Supabase with 15 migrations and compiled release app; zero application records before and after disposable probe. |
| Desktop/mobile empty states, initials and explicit isolated demo | **Passed** | [Screenshots and 3 opt-in checks](DEMO-DATA-AUDIT.html); no demo assets requested by release application. |
| Hosted candidate contains no unintended demonstration data; deployment and real-user access approved | **Blocked** | Hosted data was not inspected or changed. Schema-only migration, asset provenance and candidate environment verification remain required before separate explicit deployment approval. Preserve both existing hosted Auth accounts. |


## 11. Hosted private beta preparation - 2026-10-21

| Requirement | Status | Evidence / limit |
| --- | --- | --- |
| Fresh read-only hosted catalog/count/config capture | **Passed** | [Schema diff](HOSTED-SCHEMA-DIFF.md): two Auth users/two identities, zero legacy rows/buckets/objects. Complete dependency/consumer sign-off remains blocked. |
| Additive migration and synthetic account preservation | **Passed** locally | [10-check rehearsal](HOSTED-MIGRATION-REHEARSAL.md); actual local Auth before/after, injected failure, unchanged legacy records. Hosted continuity Not Tested. |
| Backup restoration | **Failed** locally / **Blocked** hosted | Restore cannot assign managed schema owner; no listed hosted backups/PITR. No escalation workaround attempted. |
| Hosted security acceptance | **Blocked** | [Findings](HOSTED-SECURITY-AUDIT.md): legacy access, blocked-history mismatch, hosted media, real-family print workflow and service settings outstanding. |
| Hosted deployment / admission | **Blocked** | [Readiness](HOSTED-BETA-READINESS.md). No explicit hosted approval; prior boundaries unchanged. |
