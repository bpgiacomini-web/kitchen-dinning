# Metro Eats — Architecture Preview

This is the preview implementation, separate from the root app and Production. It uses same-origin Neon Auth and one authenticated `/api/user-data` path for the signed-in user's recipes, restaurant reviews, and frozen-pizza ratings.

## Product scope

- Recipes, restaurant/review records, and frozen-pizza ratings are private to the signed-in account. Recipes can be shared through an explicit revocable read-only link.
- Recipe create, edit, delete, and website/text import are supported. Imports are reviewed before saving and retain their source URL.
- Ingredients and directions are stored as ordered text arrays. Recipe photos and offline synchronization are out of scope.
- Recipe cards can be printed or saved as PDF. An explicit share action creates a read-only link; only the token hash is stored. The owner can revoke the link. Shared pages are marked `noindex`.
- The app keeps up to 10 restore points per account, captured before a dataset write. Restore points include recipes, restaurant reviews, and pizza ratings.
- Restaurant records support create, edit, delete, and separate visit-by-visit reviews. Frozen pizzas support UPC product lookup through Open Food Facts, manual entry, prices, category ratings, and notes. Product matches depend on Open Food Facts coverage; camera scanning is not included, but UPC entry and lookup work in mobile Safari.
- Existing recipe data is deliberately not migrated. The preview migration carries restaurant/review records forward from the legacy per-user preview table when that table exists.

## Persistence and deployment

`api/user-data.js` verifies the Neon Auth JWT and scopes all dataset operations to its subject. It validates recipe and pizza structure, caps request size, and uses a revision compare-and-swap. Recipes and restaurants are indexed as per-user rows; pizzas remain inside the revisioned JSONB dataset snapshot. Restore points are per user and capped at 10. Public recipe shares use random bearer tokens stored as hashes and can be revoked. URL imports are limited to 20 requests per account per hour, and shared recipe reads to 300 per sharing account per hour. Both counters use atomic Neon Postgres updates and return `429` with `Retry-After` when exhausted.

The required migrations are applied to the isolated Neon Preview branch. The second migration is idempotent and copies legacy restaurant/review rows without copying legacy recipes. Do not apply any of them to Production. The root app and its legacy `/api/data` path are unchanged and must not be used as the Architecture Preview persistence path.

## Verification

The local test suite is `npm test` (Node.js 20 or newer). Automated API tests cover account-scoped dataset reads, stale save and restore conflicts, malformed and oversized save rejection, and share-link revocation. Browser verification should cover sign-in/session restoration, recipe create/edit/delete, review preservation, restore, importer review, print/PDF, share-link access/revocation, and account isolation. Production cutover remains out of scope.
