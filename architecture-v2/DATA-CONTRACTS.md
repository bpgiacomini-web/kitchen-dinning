# Metro Eats data contracts (architecture v2)

## Canonical persisted collections

The existing application persists two collections:
- **Recipes:** stable `id`, `title`, `category`, `subcategory`, `ingredients[]`, `steps[]`, `servings`, `time`, `favorite`, `photos[]`, `createdAt`, and `updatedAt`. Older/imported records can use alternate title, ingredient, or instruction field names; adapters must normalize them at the boundary without mutating the source.
- **Restaurants:** stable `id`, `name`, `type`, `location`, `website`, `menuUrl`, `notes`, `photos[]`, `survey`, `reviewHistory[]`, `rating`, `createdAt`, and `updatedAt`.

Existing restaurant review history is append-oriented: each visit has its own `createdAt`, score data, order information, and potentially dish-level ratings. A migration must preserve every history item and must not collapse the list to only the latest survey.

## Rules for future writes

1. Keep the current production write path untouched while the parallel implementation is under construction.
2. Validate request structure on the server; browser-side validation is only a usability feature.
3. Require authenticated identity and authorize every operation against the signed-in user's dataset before enabling cloud writes.
4. Use per-user storage paths/records. Do not let a client choose an arbitrary owner ID.
5. Use optimistic concurrency (revision/ETag or equivalent) to prevent a stale device from replacing newer data.
6. Validate field types and bounds; reject malformed payloads rather than silently discarding fields.
7. Preserve unknown legacy fields during read/round-trip migration until explicit, tested conversion rules exist.
8. Treat photos as potentially large binary payloads; define a storage strategy and limits before syncing them through JSON.
9. Backups/restores must be explicit, validated, and recoverable. Never auto-overwrite the only copy of user data.
10. Log operational errors without logging credentials, private data, or full recipe/review payloads.

## Current implementation status

`src/domain/normalize.mjs` now adds display aliases while spreading original dataset, recipe, and restaurant fields forward, so unknown metadata, original `steps`, `survey`, `reviewHistory`, menu/location fields, and other legacy values survive a read/round-trip. `src/data/user-dataset-client.mjs` is connected to the Preview recipe create/edit/delete workflows through the authenticated `/api/user-data` endpoint. The endpoint derives the owner from a verified Neon Auth JWT and uses optimistic revision checks. The shared `/api/data` source remains read-only. Cloud writes remain unavailable until the migration table exists in the isolated Neon Preview branch and the signed-in Preview session can load it. Existing baseline data and browser-local records are not automatically imported into the user dataset.
