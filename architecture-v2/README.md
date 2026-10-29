# Metro Eats — Clean Architecture Preview

This is an isolated, parallel implementation scaffold. It does not replace or modify the existing app entry point, styles, service worker, or data APIs. The existing app remains the reference checkpoint.

## Principles
- Preserve approved product behavior and visual direction; migrate one feature slice at a time.
- Separate domain logic, persistence, UI rendering, and navigation.
- Read existing data defensively; never silently overwrite or migrate user data.
- No production deployment or cutover until parity checks and user testing pass.
- All writes are disabled in this first scaffold. This is not a complete replacement app.

## Run tests
From this directory, run `npm test` with Node.js 20 or newer.

## Current scope
- Read-only home, recipe list, and dining list shell.
- Recipe extraction preview for pasted recipe text, pasted webpage HTML/JSON-LD, or a public recipe URL; review title, ingredients, directions, and metadata before any future save path.
- URL import uses a separate server endpoint with manual redirect validation, pinned public IPv4 DNS results, a timeout, content-type checks, and a streamed 1.5 MB response cap. It does not follow redirects automatically or use a third-party reader proxy.
- Automated tests cover parser behavior and URL validation guardrails.
- Defensive normalization of legacy recipe and restaurant records.
- Read-only data adapter that prefers current local records and can fall back to `/api/data`.
- Automated contract tests for normalization and repository fallback.

## Not yet migrated
Recipe create/edit/delete and saving imported recipes remain disabled. Reviews/survey workflows, photos, sorting/favorites, location search, news, cloud writes, account management, and full offline behavior are not wired into this shell yet. Migrate and test them individually before this can replace the current app.

## Persistence migration — in progress
- Added `migrations/001_user_datasets.sql` as the target schema for a per-user durable dataset in the isolated Neon Preview database.
- The client must never send an authoritative owner ID. Server-side code must derive the owner from a verified Neon Auth session/JWT.
- Updates must include an expected revision and reject stale writes rather than silently overwrite another tab/device's changes.
- Keep browser-local data as a temporary recovery source only; do not automatically overwrite cloud data from stale local storage.
- No production cutover, legacy-data deletion, or automatic migration is allowed until recovery/export, authentication, conflict handling, and restore tests pass.

## Security gate
The current shell does not yet have a complete sign-in flow or authenticated cloud-write path. Do not enable writes until Neon Auth identity is verified server-side and every query is scoped to that user. Never expose database credentials in browser code.

### Persistence implementation status — API groundwork added
- Added `api/user-data.js`: preview-only authenticated per-user GET/PUT using Neon Auth JWT verification and the Neon Preview database. The owner ID comes only from the verified JWT subject.
- Writes use a revision check and return HTTP 409 on a stale save; unauthenticated calls are rejected. The endpoint never reports a save as successful unless the database returns a new revision.
- Added `src/data/user-dataset-client.mjs` and tests for bearer-token handling, required sign-in, revision saves, and conflict handling.
- This is not yet end-to-end persistence: the sign-in UI/session-token provider is not wired into the app, the client adapter is not yet used by recipe save/edit/delete, and the SQL migration has not been confirmed applied to the Preview database. Do not use this as a data backup or claim cross-device sync is live.
