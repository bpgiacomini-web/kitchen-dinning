# Metro Eats Safety Checkpoint — 2026-10-24

## Purpose
This checkpoint is a regression history and recovery reference. Before making future changes, compare the current behavior with the known-good behavior below, inspect the specific files and commits that caused the latest regression, and avoid repeating the same blind edits. Do not treat a deployment as verified merely because Vercel reports READY.

## Latest known state
- Repository: `bpgiacomini-web/kitchen-dinning`
- Working branch: `fix/recipe-import-extraction-2026-10-23`
- Latest preview deployment inspected: `https://kitchen-dinning-oocwt5owp-usdrinkingclub-8582.vercel.app/`
- Latest deployment source commit: `cdabe5f24322acb5329cad12b442875aec511cd7`
- JavaScript syntax repair commit: `ffcf9c7c49afc87d299d6064747c9c44c3f46984`
- Production was not changed during this incident.
- User reported the cloud connection appears to be working again. Do not assume all features are verified until tested.

## What was working / expected behavior
- Metro Eats loads its dark-themed UI, logo, and Home / Recipes / Dining navigation.
- The cloud data API responds with recipe and restaurant data.
- The Recipes screen must actually render the returned recipe records; a green/verified cloud banner alone is not sufficient proof that the app is working.
- The cloud banner must report a real check result, not get stuck on “connecting” and not show a false timeout.
- User's recent preview showed “Cloud connection verified • 20 recipes • 6 restaurants.”

## Regression incident and mistakes to remember
1. The first attempted edit changed `index.html`, but the live app entry page was `index-persistence.html`. The edit did not affect the page the user was opening. Always identify the actual deployed entry point before changing code.
2. The deployed page had a blind 65-second timer that changed the banner to “CLOUD STATUS CHECK TIMED OUT — YOUR DEVICE DATA HAS NOT BEEN CONFIRMED BACKED UP.” Removing the blind timer stopped the false warning, but initially left the banner at “Cloud backup: connecting to verify saved data…” because no independent status update had been added yet.
3. An independent, read-only request to `/api/data` was added to `index-persistence.html`. It verifies that the response contains recipe and restaurant arrays, then updates the banner. This is a connection/data-response check, not proof that every write is backed up.
4. The Recipes screen then showed a blank list even though the cloud banner reported 20 recipes. Investigation found malformed JavaScript in `app.js`: a literal backslash-n sequence appeared between statements in the title-to-category mapping logic, causing the whole script to fail parsing. A targeted fix replaced that malformed sequence with a real newline and the full script passed `new Function(...)` syntax validation.
5. The HTML script query version was bumped to `app.js?v=20261024-cloud-status-entry-fix-3` to force clients to load the repaired script.
6. Do not hide errors cosmetically. Fix the cause, test the actual deployed URL, and verify both cloud status and the rendered Recipes/Dining screens.

## Files changed on the working branch during this incident
- `index.html`: a diagnostic comment was added in an earlier ineffective change. It did not fix the live entry-page issue.
- `index-persistence.html`: removed the blind timeout banner replacement; added an independent read-only cloud API check; bumped the app.js query version.
- `app.js`: repaired the malformed newline sequence that prevented JavaScript from parsing.

## Guardrails for future work
- Work on the development branch and preview; do not change production without explicit approval.
- Before edits, inspect the latest checkpoint, actual entry point, deployed commit SHA, and relevant code.
- Make the smallest targeted change possible. Run JavaScript syntax validation and relevant regression checks before deployment.
- After deployment, fetch the exact preview HTML and JS and confirm the deployed SHA/version actually matches the intended change.
- Test at minimum: Home renders; Recipes list renders and can be opened; Dining/reviews render; cloud status resolves; API returns records; backup/export and save behavior are checked before declaring data safety.
- A successful `GET /api/data` proves only that reads work. It does not prove writes persist, backups are complete, or device data is synchronized.
- Do not test destructive actions (delete/overwrite) until a recoverable backup is confirmed.
- Preserve the existing recipe-import work checkpoint; the longer-term focus remains recipe URL/pasted-text extraction into title, ingredients, directions, and relevant metadata.

## Exact next step
Open the latest preview URL above and verify the Recipes list is populated after the JavaScript syntax fix. Then test Dining/reviews and the backup/export path without deleting or overwriting existing records. Only after these pass should the branch be considered a candidate for production. Keep production unchanged until the user explicitly approves promotion.
