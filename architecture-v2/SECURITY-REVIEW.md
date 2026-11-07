# Architecture Preview security notes

## Implemented in the preview branch

- API data access requires a verified Neon Auth JWT; ownership derives from `sub`, never from request input.
- Responses are non-cacheable and vary by Authorization.
- Dataset payloads are size-limited and recipe rows require stable IDs, titles, non-empty ordered ingredient/direction arrays, unique IDs, and collection caps.
- Recipe URL import requires a verified session, is server-side, manually follows a bounded number of redirects, revalidates public DNS/IP destinations, and caps response size.
- Share links use high-entropy random tokens. Only SHA-256 token hashes are persisted. Link access is read-only, revocable, and marked `noindex`.
- Restore points are scoped to the authenticated owner and limited to the newest ten.
- Recipe URL imports are limited to 20 requests per authenticated account per hour. Public shared-recipe reads are limited to 300 requests per owning account per hour. The atomic counters are stored as hashes in the Preview database and return HTTP 429 with `Retry-After` when exhausted.

## Verification status

- All three SQL migrations are applied to the isolated Neon Preview branch; none were applied to Production.
- Verify that the legacy Preview table contains the restaurant/review records to carry forward. Migration copies them with `ON CONFLICT DO NOTHING`; it does not copy old recipes.
- Automated handler tests cover account-scoped dataset access, owner-scoped restore lookup, stale dataset and restore conflicts, malformed and oversized dataset rejection, and share-link revocation using in-memory fixtures.
- A Preview browser smoke check confirmed session restoration and that the deployed URL importer reaches Neon rate-limit storage without saving an invalid page as a recipe.
- Remaining browser checks: recipe create/edit/delete and conflicts, review preservation, restore, importer review, print/PDF, share link access/revocation, and account isolation.
- The existing root app's `/api/import-recipe` is still a legacy path. It remains outside this Architecture Preview and should be retired before any production cutover.
