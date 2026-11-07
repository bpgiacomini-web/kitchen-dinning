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

## Restaurant Preview implementation status
- Private restaurant records support saved-record search, type-ahead lookup via OpenStreetMap, manual details, website/menu links, visit history, a Production-compatible Food Critic review, dish-level ratings and notes across seven categories, calculated food and overall scores, and personal rankings. Each visit has required 1–10 Overall Experience, Service, and Value ratings, Food Quality calculated from rated dishes, optional Menu & Selection, Atmosphere, Cleanliness, Drinks & Bar, Location & Accessibility, and Likelihood to Return ratings, plus visit notes and an order-again choice. Optional dimensions are stored separately from the established score indexes so existing reviews keep their meaning.
- Name and nearby lookups go through the same-origin `/api/restaurant-lookup` route to avoid browser-specific cross-origin failures. Browser location is preferred; Vercel's approximate IP area is used as a fallback, and matches over 200 km away are excluded from name search. Location is not stored. Selecting a result only pre-fills the restaurant form; the user must save it.
- Restaurant photos are deferred until a dedicated image-storage path exists. Base64 photos are not added to the bounded per-account dataset.
- Future parity candidates from Production include automatic official website/menu lookup, review editing, and richer type-specific dish suggestions. Review-history editing should preserve the append-only visit audit unless an explicit versioned correction flow is designed.

## Release gates
Unit tests and static checks pass; primary workflows have browser tests; export/import round trip loses or duplicates no records; API security review is complete; exact preview commit and served assets are verified; user approves the preview. Production remains unchanged until explicitly requested.
