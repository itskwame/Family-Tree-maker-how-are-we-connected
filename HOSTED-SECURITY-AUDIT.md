# Hosted security audit

2026-10-21. **Not ready for private beta.** Fresh hosted metadata, local rehearsal and unexecuted hosted tests are distinguished below.

## Findings

| ID | Severity / scope | Finding and required action |
| --- | --- | --- |
| H1 | High, hosted | Legacy invites SELECT permits every authenticated user; tokens are stored in rows. Empty today but unsafe for new data. Quarantine grants or replace with narrow reviewed access. |
| H2 | High, hosted | Membership INSERT checks only user_id. Broad table ACLs include privileges beyond ordinary row access; RLS does not control TRUNCATE. Remove unused grants after consumer review. Recursive legacy membership policies also need replacement if those APIs remain active. |
| H3 | Release blocker | No listed hosted backups/PITR; synthetic restore failed assigning managed schema ownership. Recovery is unverified. |
| H4 | Release blocker | Both original accounts are unconfirmed. Preserve state; owner verification and hosted authentication continuity remain untested. Never infer person/admin ownership. |
| H5 | Release blocker | Localhost Auth site, empty redirects, absent custom SMTP and low email quota. Configure/test exact beta URLs, delivery, recovery, expiry and rates. CAPTCHA is disabled; review abuse controls. |
| H6 | High, requirement mismatch | social_chat checks accepted membership but not social_blocked. Blocking prevents sending, not history retrieval. The requested beta policy says blocked participants lose access. Define direct/group revocation semantics and test reads, notifications and Realtime before release. No fix applied during this planning task. |
| H7 | Release blocker | Image worker imports local config/service credentials and accepts localhost origins. Hosted authenticated optimization/finalization, trusted origins and scheduled maintenance are not configured. |
| H8 | Release blocker | Fictional studio is correctly excluded from release; real-family premium export integration is not wired/verified. Preserve template code and provide authorized data/photo integration before claiming full beta scope. |
| H9 | Operational gap | Reporting records/throttles exist, but named moderators, incident handling, deletion/retention and alerts are still needed. Revocation must stop new retrieval; already downloaded images cannot be recalled. |
| H10 | Moderate dependencies | Fresh npm audit reports two moderate package entries, zero high/critical. Applicability/sign-off or tested upgrade remains required; do not blindly use audit fix --force. |

## Access matrix

| Actor | Intended access |
| --- | --- |
| Anonymous | Minimal valid invitation preview only; no raw invitations, people, feed, messages or media |
| Authenticated without membership | Own permitted onboarding state; no family access/self-promotion |
| Verified member | Authorized network projection and adult social/business content; no blanket connected-network access |
| Verified profile owner | Own permitted profile controls; independent claim verification |
| Accepted chat member | Authorized conversation only; removed/left/revoked denied; H6 remains for blocks |
| Guardian | Explicit approved authority over specified minor; never inferred from genealogy |
| Network reviewer/admin | Network-scoped review, no automatic person ownership/cross-network powers |
| Business owner/co-owner | Multiple listings with independent authorization and moderation; save/media addition returns listing to review; explicitly define review policy for deletions |
| Server worker | Server-only privileged credentials, authorized reservation/finalization; no browser service key |

Rehearsed catalog: 35 normalized tables enable RLS, 27 application/Storage policies captured and 35 application functions enumerated. Every security-definer function pins search_path; only fc_invitation_preview(text) is anon-executable. [Effective privileges](output/hosted-beta/effective-security.json) and [ACL catalog](output/hosted-beta/rehearsal-catalog.json) support review, not a claim that every branch is correct. Review owner bypass, body authorization, default grants, policy OR-composition and Realtime together.

## Acceptance matrix

All hosted outcomes are **Not Tested**. No real accounts or production records were used for probes.

| Test | Local evidence / remaining requirement | Hosted |
| --- | --- | --- |
| Family A reads Family B | Prior local isolation tests; repeat Auth/RPC/Storage on candidate | Not Tested |
| Ordinary user promotes self | Fresh rehearsal permission denial; legacy defect H2 | Not Tested |
| Accepted invitation replay | Prior Phase 6 tests; repeat with candidate Auth | Not Tested |
| Concurrent claims | Prior local claim tests; repeat simultaneous requests, assert one owner | Not Tested |
| Unverified profile claim | Prior claim-review tests; email must not prove genealogical identity | Not Tested |
| Private minor access | Prior guardian tests; repeat search, paths, counts and photographs | Not Tested |
| Removed member reads older messages | Prior social tests; repeat API and Realtime | Not Tested |
| Blocked participant reads history | Does not meet new requirement; H6 | Not Tested |
| Revoked connection reads shared records | Prior consent tests; repeat graph/media/in-flight requests | Not Tested |
| Unverified business publication | Prior business tests; repeat candidate configuration | Not Tested |
| Unauthorized business ownership change | Prior independent/co-owner checks; repeat on candidate | Not Tested |
| Cross-network private images | Prior Storage/media tests; hosted worker unavailable | Not Tested |
| Release fictional fixture loading | Fresh boundary checks and separate clean-start browser evidence | Not Tested |
| Original Auth users authenticate | Synthetic accounts passed before/after; originals not exercised | Not Tested |
| Interrupted migration recovery | Injected transaction failure passed; backup restoration failed | Not Tested |

Historical local tests in output/phase6, phase6b, phase7 and business are not fresh hosted evidence. The entire matrix must run against actual candidate Auth, policies, Storage and API configuration before admission.

## Dependency review

[Fresh npm audit](output/hosted-beta/dependency-audit.json) reports react-router and dependent react-router-dom, with open-redirect GHSA-wrjc-x8rr-h8h6 and SSR hydration GHSA-337j-9hxr-rhxg. Current release uses a client-rendered Phase 6 entry without the legacy router. Static review suggests affected paths are absent; verify the final bundle module inventory and obtain applicability sign-off or test an upgrade. Legacy dependencies remain installed; the repository is not vulnerability-free.

The maintainers limit the hydration issue to particular SSR/hydration use, excluding declarative mode: [hydration advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg). See also [open-redirect advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6). Patched-version references are 7.18.0; upgrading requires compatibility/regression review, not automatic major replacement.

CORS is not authorization. Verify origins, endpoint exposure, RLS, bearer validation and server-secret isolation independently. Never make private media public to work around an authorization problem.
