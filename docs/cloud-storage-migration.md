# Metro Eats Cloud Storage Migration Plan

## Goal

Move Metro Eats from browser-only `localStorage` to cloud-backed accounts and storage without replacing or removing existing recipe, restaurant, review, import, backup, navigation, or news features.

## Current implementation

- `app.js` stores the full application data object under `metro_eats_v2` in browser `localStorage`, with a legacy fallback to `metro_eats_v1`.
- Recipe and restaurant data are currently loaded into one in-memory `db` object.
- Restaurant photos may be stored as data URLs inside that local data object.
- The existing JSON backup and restore feature operates on local data.
- A deployment alone does not synchronize browser storage between Safari, the iPhone Home Screen app, or other devices.

## Proposed low-cost foundation

Evaluate the native Neon integration for the existing Vercel project, beginning on a free tier. Neon currently advertises PostgreSQL, managed authentication, and object storage in its free offering. Confirm the exact available features and limits in the account before relying on them. Do not enable paid billing or upgrade plans without explicit owner approval.

Use:
- PostgreSQL as the authoritative data store for account-owned recipes, categories, restaurant records, personal visit notes, and reviews.
- Managed authentication for sign-up, sign-in, sessions, and account identity.
- Object storage for uploaded images; avoid storing large image data URLs in database rows.
- Browser local storage as a cache/offline convenience only, never as the sole authoritative copy after cloud sync is enabled.
- Exportable backups and a tested restore process.

## Data-sharing rules

1. Recipes, saved categories, personal visit notes, and private collections are owned by a user and private by default.
2. Restaurant reviews/ratings are private drafts until the author explicitly chooses to publish them.
3. Published restaurant reviews and ratings can be read by the community.
4. Only the author can edit or delete their private content or published review. A moderation/admin path, if added later, must be explicit and auditable.
5. Restaurant directory details should be modeled separately from each user's visit and review so users do not overwrite one another's notes.
6. Every private read/write must be authorized on the server/database, not merely hidden in the UI.

## Migration phases

### Phase 1 — Foundation (no production behavior changes)
- Verify integration availability, pricing, project scope, and region.
- Define the schema and access policies.
- Keep this work on a feature branch until reviewed.
- Do not change `main` or production environment variables.

### Phase 2 — Backend and access control
- Configure managed authentication.
- Create tables for profiles, recipes, recipe categories, restaurant directory entries, user visits, restaurant reviews, and image metadata.
- Enforce ownership and public-review visibility at the database/server layer.
- Keep all privileged credentials server-side; never ship a database secret or admin key to browser JavaScript.

### Phase 3 — Compatibility adapter
- Introduce a storage adapter behind the existing `save()` / `parseData()` boundary.
- Preserve existing rendering and recipe/restaurant workflows wherever possible.
- Do not silently replace or delete the local dataset. Keep local backup/restore available.
- Treat local data as unsynced until a user explicitly imports it or a tested migration flow confirms the destination and merge behavior.

### Phase 4 — Test in preview
Verify sign-up/sign-in/sign-out, create/edit/delete recipe, category relationships, restaurant visit and review, publish/unpublish review, image upload, reload, second browser/device, offline behavior, backup/export, restore, and cross-user access denial. Include tests proving User A cannot read or mutate User B's private records.

### Phase 5 — Controlled release
- Review the preview deployment and tests before merging.
- Add production environment variables only after the backend is verified.
- Keep a rollback path and document the exact production URL for any user testing.
- Never claim persistence is fixed until cross-device tests confirm it.

## Acceptance criteria

- Existing app features remain available and visually intact.
- A saved cloud record survives refresh, sign-out/sign-in, and a different device.
- Private records are inaccessible to other users.
- Only explicitly published reviews appear in the community view.
- Local backup/restore continues to work.
- No paid plan or billable resource is enabled without explicit approval.
- Production is not changed by this planning branch.
