# Metro Eats: Approved-Feature Regression Workflow

## Purpose
Every enhancement must preserve features that have already been tested and signed off. A successful deployment/build is not proof that app behavior works.

## Required workflow for every change
1. **Start from the latest checkpoint.** Read this document, the approved-feature matrix, the current pull request, and the latest CI results before editing.
2. **Protect production and data.** Work on a feature/guardrail branch and preview deployment. Do not promote or merge to production without explicit user approval. Never use real user data as a test fixture.
3. **Define the change and blast radius.** Identify code paths, shared functions, duplicate declarations, persistence keys, API calls, service-worker caches, and UI elements that the change could affect.
4. **Run baseline checks before editing.** Record current branch/commit, CI result, and relevant existing behavior.
5. **Make the smallest isolated change.** Avoid unrelated refactors. Inspect duplicate functions and scope before renaming/removing anything.
6. **Run automated regression checks.** At minimum: JavaScript syntax validation and Playwright browser tests. Tests must use isolated fixture data and must not require live user records. Add/extend tests for each changed behavior.
7. **Run affected feature tests and the full suite.** A previously approved feature is not considered preserved until its test still passes after the change.
8. **Verify the actual preview.** Check that the exact commit is deployed, then test the preview in a browser. Deployment status READY alone is insufficient. Include iPhone/Safari and Home Screen/PWA checks for changes that can affect them.
9. **Review failures honestly.** Do not skip, weaken, or delete a failing test merely to obtain a green run. Fix the product or correct a demonstrably invalid test, with the reason documented.
10. **Release gate.** Do not call a change ready for production while relevant checks fail or are unverified. Report passing, failing, skipped, and not-yet-tested items separately. Do not claim CI blocks merging unless branch protection/required checks have been verified.
11. **After sign-off.** Update the regression matrix with the test evidence, commit/PR, preview URL, device/browser tested, and date. Preserve the next-step checkpoint.

## Source-to-preview integrity gate

Required for every preview and release, especially after a reported failed fix.

1. Fetch the actual preview HTML and every relevant served asset (JavaScript, CSS, JSON, and service worker). Compare them with the files at the intended Git commit. A READY status or matching commit label is not enough.
2. Confirm the HTML references the intended script/style versions. If served HTML references an older asset version than the Git source, mark the preview FAILED and stop. Do not ask the user to test it.
3. Inspect service-worker precache/runtime caches and cache-versioning behavior. Correct the root cause; do not rely only on query-string changes or extra click handlers.
4. Confirm the intended fix is present in the actual downloaded asset. Record preview URL, deployment ID, commit SHA, asset URL/version, and content comparison/hash where available.
5. Run browser acceptance tests against that exact preview. For restaurant editing, use isolated synthetic data, open Dining, click/tap the restaurant name, and assert the correct information/review editor opens. Test Edit as well. Source inspection, HTTP 200, syntax checks, and READY status do not prove the behavior works.
6. Where relevant, verify fresh browser context and iPhone Safari/Home Screen PWA cache/update behavior.
7. A user-reported failed preview is a failed acceptance test. Do not send another preview until the root cause is addressed and the exact preview passes the relevant browser test.
8. Report source integrity, deployment state, browser behavior, and device/PWA checks separately as PASS, FAIL, or NOT RUN. If browser automation is unavailable, say so and never claim behavioral verification.

## Core regression areas
- App loads; Home, Recipes, and Dining navigation works.
- Restaurant names and spotlight open the intended restaurant information/review experience.
- Restaurant creation, editing, review submission, review history, favorites, sorting, and sort-preference persistence.
- Recipe list, categories, favorites, editing/deletion, and sort-preference persistence.
- Recipe import from a webpage URL and pasted text extracts only recipe-specific title, ingredients, directions, and relevant metadata.
- Cloud backup/restore, local fallback, and persistence across refreshes; test with synthetic fixtures.
- News feed renders current food-related St. Louis and Metro East stories with working article links.
- Responsive layout, iPhone/Safari top padding, and Home Screen/PWA cache and saved-data behavior.
- Backup, restore, and data recovery behavior.

## Current status at creation
- The guardrail workflow and initial Playwright test are a foundation, not a complete suite.
- CI is currently failing because the restaurant fixture is not appearing in the Dining list; this is an open issue, not a passing check.
- Restaurant-name tap is still a user-reported failure. Preview `496bca9` served HTML referencing `app.js?v=20261019-recipe-import-validation-30`, while the intended GitHub `index.html` referenced `app.js?v=20261025-restaurant-editor-direct-open-2`. Treat this preview as failed due to source-to-preview mismatch; do not ask the user to retest until integrity and browser behavior both pass.
- Do not merge PR #25 or promote PR #24 based on deployment status alone.
- Immediate next action: debug why the preview's Home / Recipes / Dining tab controls do not work, then repair the browser test's fixture/key assumptions and make the test pass without weakening it.

## Resume checklist for the next session
1. Read this document and the latest project checkpoint before changes.
2. Check PR #25 and the latest GitHub Actions run.
3. Reproduce and debug the reported tab/navigation failure in the exact preview deployment.
4. Fix and test navigation before proceeding to restaurant tap testing.
5. Continue adding automated tests and populate a feature-by-feature approval matrix only from actual evidence.
