# Metro Eats — Working Checkpoint (2026-10-09)

## Do not disturb production
- Production remains on `main`; production URL: https://kitchen-dinning.vercel.app
- Do not merge the cloud-storage feature branch or change Production environment variables without explicit review.
- All cloud-storage work is isolated on `feature/cloud-storage-foundation`.

## Current Preview
- Latest branch commit: `47d5af91df7e3e011838290876a763209509297c` — “Fail closed until authenticated cloud storage is ready”.
- Latest Preview deployment reported READY: `dpl_6KvSTjd9ZdBYNBq4ALYQ3SWtSce5`.
- Preview URL: https://kitchen-dinning-d4t1s1rbw-usdrinkingclub-8582.vercel.app
- API check completed: GET `/api/data` returns HTTP 503 with `CLOUD_STORAGE_NOT_READY`. This is intentional and safer than exposing or writing a shared legacy Blob. It is not evidence that cloud persistence works.

## Current architecture / blocker
- `app.js` still stores the app's main data in browser localStorage keys `metro_eats_v2` (with `metro_eats_v1` fallback).
- The UI's `save()` / `parseData()` boundary has not been connected to an authenticated cloud store.
- `api/data.js` deliberately rejects GET and PUT with HTTP 503 until per-user authorization and persistence are implemented.
- `package.json` currently only lists `@vercel/blob`; Neon integration has been created in Vercel/Neon but no working app-level auth or SQL query path has been verified.
- Initial SQL migration `migrations/001_initial_schema.sql` is committed for review but has NOT been applied to any database. It defines profiles, categories, recipes, restaurants, visits, reviews and media metadata, plus RLS policies and same-owner relational constraints. These constraints have not been executed against Postgres yet.

## Neon setup status
- Neon project: `metro-eats-db`, region AWS US East 2 (Ohio), with production branch and a Preview branch created.
- The user successfully created a Preview database branch from the Neon/Vercel integration flow. A connection details panel showed a Preview branch expiring on Oct 9, 2026 at 11:59 PM CDT; verify whether that temporary branch still exists before using it.
- User got stuck on mobile while trying to select the `production` branch / connect the integration. Do not ask them to repeat those dropdown steps tonight.
- Do not copy, reveal, or place database connection strings or passwords in source code, chat, browser bundles, or Git commits.
- Neon MCP connection was suggested but is not confirmed connected.

## Next engineering steps
1. Discover whether the Neon connector is now connected and whether a safe, scoped SQL/query tool is available. Prefer Preview-only access.
2. Confirm the actual Neon Auth provider available to this project. Do not assume `auth.user_id()` exists unless the selected provider and query path supply it. The Neon project UI showed “Better Auth”, while earlier Vercel setup screens mentioned Neon Auth; resolve this mismatch before relying on the RLS policies.
3. Validate the SQL migration against the actual Neon Postgres Preview branch. Do not apply it to production.
4. Implement a server-side authenticated session and ownership enforcement, then a database adapter behind existing `save()` / `parseData()` behavior. Never send privileged database credentials to the browser.
5. Add tests for save/reload, ownership isolation between users, review visibility, import/export/restore, offline/local fallback, and image handling.
6. Test only on Preview. Keep local data and backups intact; do not automatically overwrite/migrate local data. Do not claim cross-device persistence until tested with a second session/device.
7. Only after Preview passes, review a PR and discuss production rollout. No production rollout is authorized yet.

## User's preference / handoff
The user is exhausted and has stopped for the night. In the morning, resume from this checkpoint without asking them to repeat the setup. Make progress autonomously where possible, explain only the next essential action if their interaction is truly required, and always give the exact URL when asking them to test. Do not change production or risk existing local data.
