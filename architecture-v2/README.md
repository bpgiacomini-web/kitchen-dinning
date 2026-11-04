# Metro Eats — Architecture Preview

This is the preview implementation, separate from the root app and Production. It uses same-origin Neon Auth and one authenticated `/api/user-data` path for the signed-in user's recipe and restaurant collections.

## Product scope

- Recipes and restaurant/review records are private to the signed-in account.
- Recipe create, edit, delete, and website/text import are supported. Imports are reviewed before saving and retain their source URL.
- Ingredients and directions are stored as ordered text arrays. Recipe photos and offline synchronization are out of scope.
- Recipe cards can be printed or saved as PDF. An explicit share action creates a read-only link; only the token hash is stored. The owner can revoke the link. Shared pages are marked `noindex`.
- The app keeps up to 10 restore points per account, captured before a dataset write. Restore points include recipes and restaurant reviews.
- Existing recipe data is deliberately not migrated. The preview migration carries restaurant/review records forward from the legacy per-user preview table when that table exists.

## Persistence and deployment

`api/user-data.js` verifies the Neon Auth JWT and scopes all dataset operations to its subject. It validates recipe structure, caps request size, and uses a revision compare-and-swap. Recipes and restaurants are indexed as per-user rows; a JSONB envelope remains the revisioned snapshot boundary. Restore points are per user and capped at 10. Public recipe shares use random bearer tokens stored as hashes and can be revoked.

Before deploying this code, apply `migrations/001_user_datasets.sql` and `migrations/002_private_recipe_storage.sql` only to the isolated Neon Preview branch. The second migration is idempotent and copies legacy restaurant/review rows without copying legacy recipes. Do not apply it to Production. The root app and its legacy `/api/data` path are unchanged and must not be used as the Architecture Preview persistence path.

## Verification

The local test suite is `npm test` (Node.js 20 or newer). Before any preview deployment, verify sign-in/session restoration, recipe create/edit/delete and conflicts, review preservation, restore, importer review, print/PDF, share link access/revocation, and account isolation. Production cutover remains out of scope.
