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
- Local recipe extraction preview for pasted recipe text or pasted webpage HTML/JSON-LD, with ingredient/direction review and no save path.
- Defensive normalization of legacy recipe and restaurant records.
- Read-only data adapter that prefers current local records and can fall back to `/api/data`.
- Automated contract tests for normalization and repository fallback.

## Not yet migrated
Recipe create/edit/delete, recipe import, reviews/survey workflows, photos, sorting/favorites, location search, news, cloud writes, account management, and full offline behavior are intentionally not wired into this shell yet. Migrate and test them individually before this can replace the current app.

## Security gate
The existing shared-data endpoint needs authenticated identity, per-user authorization, and conflict-safe writes before multi-user use. Do not expose secrets in browser code.
