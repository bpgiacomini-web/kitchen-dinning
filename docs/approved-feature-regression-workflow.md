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
- The latest preview deployment is READY, but navigation/tap behavior has not been verified as working. The user reports that the tab features do not work.
- Do not merge PR #25 or promote PR #24 based on deployment status alone.
- Immediate next action: debug why the preview's Home / Recipes / Dining tab controls do not work, then repair the browser test's fixture/key assumptions and make the test pass without weakening it.

## Resume checklist for the next session
1. Read this document and the latest project checkpoint before changes.
2. Check PR #25 and the latest GitHub Actions run.
3. Reproduce and debug the reported tab/navigation failure in the exact preview deployment.
4. Fix and test navigation before proceeding to restaurant tap testing.
5. Continue adding automated tests and populate a feature-by-feature approval matrix only from actual evidence.
