# Architecture Preview security notes

## Implemented in the preview branch

- API data access requires a verified Neon Auth JWT; ownership derives from `sub`, never from request input.
- Responses are non-cacheable and vary by Authorization.
- Dataset payloads are size-limited and recipe rows require stable IDs, titles, non-empty ordered ingredient/direction arrays, unique IDs, and collection caps.
- Recipe URL import requires a verified session, is server-side, manually follows a bounded number of redirects, revalidates public DNS/IP destinations, and caps response size.
- Share links use high-entropy random tokens. Only SHA-256 token hashes are persisted. Link access is read-only, revocable, and marked `noindex`.
- Restore points are scoped to the authenticated owner and limited to the newest ten.
- Recipe URL imports are limited to 20 requests per authenticated account per hour. Public shared-recipe reads are limited to 300 requests per owning account per hour. The atomic counters are stored as hashes in the Preview database and return HTTP 429 with `Retry-After` when exhausted.

## Before preview deployment

- Apply all three SQL migrations only to the isolated Neon Preview branch; the new API endpoints depend on those tables.
- Verify that the legacy Preview table contains the restaurant/review records to carry forward. Migration copies them with `ON CONFLICT DO NOTHING`; it does not copy old recipes.
- Exercise cross-account denial, stale revision conflicts, restore conflict handling, shared-link revocation, and malformed/oversized payload rejection.
- Apply `migrations/003_durable_rate_limits.sql` to the isolated Neon Preview branch before deploying code that uses the new request quotas.
- The existing root app's `/api/import-recipe` is still a legacy path. It remains outside this Architecture Preview and should be retired before any production cutover.
