# Hosted image-processing candidate

This directory is inactive: root `netlify.toml` is unchanged. Nothing here has been deployed. See [readiness review](../COST-READINESS-REVIEW.html).

After a separately approved migration/release:

- Use this candidate's function directory, external Sharp dependency, and `/upload` redirect. The build service must install dependencies on its own Linux runtime; do not upload Windows node_modules. Validate Sharp packaging in a deployment preview before live admission.
- Function-scoped secrets/settings: `FC_SUPABASE_URL` (the expected project), `FC_SUPABASE_ANON_KEY` (public key), `FC_SUPABASE_SERVICE_KEY` (server-only), `FC_APP_ORIGIN` (exact HTTPS application origin). `FC_MEDIA_ENABLED=true` is a separate activation decision. Missing/disabled configuration returns 503.
- Set the reviewed frontend `VITE_FC_MEDIA_URL` to the origin serving `/upload`. Never put service credentials in a `VITE_` variable, source file, browser or report.
- Apply and rehearse the complete SQL candidate set first, including durable reservations. Existing functions/RLS must remain intact.
- Require provider billing verification, bot/traffic controls, hosted maintenance and independent restore proof before go-live. Two concurrent jobs is an instance-local limit, not a provider-wide DDoS control.
- Failed/canceled reservations remain conservatively held for up to 24 hours. On new reservations, old ledger entries expire; actual orphan object bytes still count until the authorized maintenance worker removes them. No scheduled maintenance function has been enabled.

Local checks: `node scripts/test-hosted-media.mjs`, `node scripts/test-hosted-transport.mjs`. They use fictional local accounts; they do not call the hosted project.
