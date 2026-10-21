# Hosted schema differences

2026-10-21 fresh read-only inspection. The Management API `/database/query/read-only` used `supabase_read_only_user`; the server reported `transaction_read_only=on`. No general write-capable SQL endpoint or role change was used.

## Evidence

[Public metadata](output/hosted-beta/hosted-public-metadata.json), [counts](output/hosted-beta/hosted-counts.json), [services](output/hosted-beta/hosted-services.json), [local effective permissions](output/hosted-beta/effective-security.json), [local catalog](output/hosted-beta/rehearsal-catalog.json). Full managed metadata and account fingerprints remain in ignored private files; reports contain no credentials or account identifiers.

The complete catalog capture covered 9 schemas, 52 relations, 504 columns, 156 indexes, 156 constraints, 34 foreign keys, 9 policies, 144 triggers, 103 functions, 3 views, roles/memberships/default ACLs and database/sequence ACLs. Most objects are platform-managed. `information_schema` grants are inspector-visible only; catalog ACLs and effective privileges must also be reviewed. These counts do not certify every platform object.

| Area | Fresh hosted state | Normalized candidate / reconciliation |
| --- | --- | --- |
| Auth | 2 users, 2 identities, 0 email-confirmed users | Preserve unchanged; no inferred links/promotions |
| Public application | families, family_memberships, invites; zero rows; RLS enabled | Retain; proposed API quarantine requires consumer review |
| familyconnect | Absent | Add 35 tables with RLS; no sample data |
| Public custom functions | None found | Add versioned fc_* RPCs; anon limited to invitation preview |
| Legacy constraints | Auth/network FKs, role checks, unique membership/token | Preserve; target_person_id is not a verified normalized identity mapping |
| Invitation read | Authenticated SELECT USING true | Quarantine access; never reuse this policy |
| Membership insertion | Only checks user_id=auth.uid() | Does not establish authority for requested family/role |
| Triggers/functions | Managed definitions captured; public triggers are internal FKs | Do not replay platform internals wholesale; verify version compatibility |
| Storage | 0 buckets/objects; 50 MiB global limit | Add private family-private bucket and exact-path authorization; worker enforces smaller limits |
| Migration ledger | Empty | New reviewed history; do not mark unrelated root files applied |
| REST | public,graphql_public; search path public,extensions | Keep normalized access behind RPC/RLS; review every executable RPC |
| Auth services | localhost:3000; empty redirects; no custom SMTP; 2 emails/hour | Configure/test approved HTTPS origins and delivery |
| Backups | None listed; PITR false | Recovery blocker |

## Repository drift and data reconciliation

Five historical root `supabase/migrations` files reference `profiles`, `family_members`, `invitations`, events and other objects absent from the observed three-table application. They are neither the deployed baseline nor the current normalized chain. Do not execute them or fake their migration history.

The current fifteen migrations live in `local/phase6/supabase/migrations`; exact copies are in the review package. Current hosted legacy counts are zero, so no transformation is proposed. If preflight finds new records, stop: establish ownership and explicit network/membership mappings, preserve original IDs in a mapping ledger, and review invitations individually. Never infer profile ownership from email or silently convert legacy invitations into authorized claims.

The extended dependency query found 79 dependencies on the three legacy tables, principally constraints, types, indexes and policies. No custom public function/view consumer appeared. This does not identify external applications, scheduled jobs or dynamically constructed SQL. Operator confirmation and operational consumer review remain required before quarantine; the complete-difference gate is not passed.

The local rehearsal reconstructs observed public definitions, constraints, non-unique indexes, grants and policies. Auth/Storage internals come from the local Supabase version, not an exact hosted platform clone. Local success does not certify managed schema/version compatibility.
