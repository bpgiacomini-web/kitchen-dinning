# Architecture and migration plan

## Target layers
1. UI — accessible pages and components; no direct persistence calls.
2. Application workflows — explicit use cases such as save recipe, start review, add visit, and import URL.
3. Domain — normalized recipe, restaurant, visit, survey, and validation rules.
4. Repositories — data contracts, local cache, authenticated cloud adapter, and conflict policy.
5. External services — Vercel API/storage, recipe extraction, location providers, and news sources.

## Data safety rules
- Existing storage keys and record shapes remain readable during migration.
- New code must not silently delete or replace legacy records.
- Every write must return a verifiable result and preserve review history.
- Backups are versioned and restorable; destructive migrations require export and explicit confirmation.
- User identity and ownership are enforced on the server, not by hiding browser controls.
- Conflicts are handled deliberately; no silent last-write-wins behavior.

## Migration stages
- Stage 0: preserve the approved checkpoint; create this parallel read-only shell.
- Stage 1: test legacy data normalization and storage fallback.
- Stage 2: add authenticated per-user data contracts and server-side validation before enabling writes.
- Stage 3: migrate recipes and favorites, then recipe import, with parity tests.
- Stage 4: migrate restaurant list, review/survey history, photos, and editing workflows.
- Stage 5: migrate location search, news, sorting, offline behavior, and service-worker strategy.
- Stage 6: browser end-to-end tests, iPhone standalone test, accessibility pass, and backup/restore rehearsal.
- Stage 7: side-by-side user acceptance. Only after explicit approval should a separate release process switch users over.

## Release gates
Unit tests and static checks pass; primary workflows have browser tests; export/import round trip loses or duplicates no records; API security review is complete; exact preview commit and served assets are verified; user approves the preview. Production remains unchanged until explicitly requested.
