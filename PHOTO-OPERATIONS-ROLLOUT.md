# Photo-operation fix: Preview rollout

The tested change is applied to the architecture Preview checkout. Preview migration 004 and branch-only PHOTO_STORAGE_STORE_ID configuration have been prepared; deployment verification is pending. No owner journal records or photo files were modified. Production remains on hold.

## Behavior

- One complete initial inventory, paginated in batches of 1,000, with a ten-page safety budget. Additional pages beyond that budget stop initialization for administrator review.
- A PostgreSQL row retains the conservative byte total across workers and restarts. Cached storage checks do not list Blob or consume the application's inventory quota.
- Uploads atomically reserve bytes before writing. Capacity cannot be exceeded by simultaneous cooperating uploads. Failed or uncertain writes keep their reservation; counters never automatically decrease.
- Private photo paths, owner checks, upload validation and existing photo references remain intact. No photo bytes are moved or deleted.
- Inventory leases have fencing tokens so a superseded worker cannot overwrite a newer total. Each actual listing page consumes the existing inventory quota.
- Photo quotas and accounting use one designated database, separate from journal database selection. No new provider or runtime dependency is introduced.

## Required configuration and deployment gates

1. Refresh Vercel account-wide Blob advanced-operation usage and reset window. The previous 88.05% observation is historical. The Windows helper currently reads Chrome text but cannot perform the dashboard tab click (`coordinate input geometry is unavailable`), including after window recovery. No authenticated CLI/connector is available in this workspace.
2. Identify the exact physical Blob store and EVERY writer: Preview, old production, other projects, direct tools and retained deployment URLs. All writers must use the same counter before uploads resume. A writer using old code or another database would bypass accounting. Dashboard uploads and external writes must remain paused or trigger a controlled re-inventory.
3. Use the existing database chosen specifically for shared photo accounting. The handler defaults to existing `DATABASE_URL`; this is sufficient for the current architecture Preview branch, using metro-eats-preview. No duplicate credential is needed. If future environments use different journal databases with this same Blob store, set optional server-only `PHOTO_STORAGE_DATABASE_URL` to the SAME accounting database for every writer before enabling them. `PHOTO_STORAGE_STORE_ID` is the physical store's stable identifier, identical for every writer. Verify it matches the SDK's actual Blob connection. Do not put credentials into public variables or this document.
4. On that database, apply migrations `003_durable_rate_limits.sql` (if absent) and `004_photo_usage.sql`. These are additive tables; do not modify or migrate journal tables. The existing comment on migration 003 describes the original Preview-only setup: do not apply it to production's journal database as a shortcut.
5. Pause all uploads, including old deployed endpoints, while inventory initializes. Deploy this reviewed candidate only after configuration and schema exist. Missing configuration fails uploads/storage checks closed; private photo reading remains on its existing owner-checked path. Initialize through one authenticated Photo Storage check, then verify stored byte total against the inventory. Check photos still read and designated test uploads save/reload before resuming uploads.
6. Existing application quota counts must not silently reset: if the chosen database differs from the current counter database, reconcile the remaining monthly allowance first. Database-backed fixed-window quotas do not represent the provider's rolling account-wide allowance. SDK retries, other projects and dashboard use can consume additional operations.

## Recovery and rollback

- Ambiguous uploads conservatively consume capacity until a controlled reconciliation. A growing overestimate may eventually block uploads early; it must never be fixed by blindly zeroing the row.
- Reconciliation requires pausing every writer and waiting for in-flight requests/provider writes to settle, then counting every page and recording an audited corrected total. No automatic decrement or photo deletion is included in this change.
- Keep the additive accounting row/tables on code rollback. Rolling back to code that bypasses reservations invalidates accounting: pause uploads and re-inventory before using this candidate again.
- No production cutover, credential changes or paid resources have been performed. Preview schema preparation is recorded below.

Update, November 13: live dashboard access recovered through screenshot coordinates/direct address navigation. The detailed 30-day store usage showed 1,763 advanced operations; store size remains 2.09 MB. Blob store store_Qqch1rwiTtBYtvWr is private and connected to kitchen-dinning in Production/Preview/Development. Project database/auth variables are Preview-scoped; no shared variables are linked. Neon project sweet-rain-81760036 has metro-eats-preview branch br-purple-morning-b7ja7rws and main branch br-snowy-bird-b7f3h4yt. On metro-eats-preview/neondb, the read-only query confirmed rate_limits exists and photo_usage was absent; migration 004 was then executed successfully. No accounting row has been initialized. Current Preview usage: 6.63 CU-hrs, 33.9 MB storage, 2.02 MB history, 45.7 MB transfer; provider history retention is six hours.

## Validation

Passed: 176 unit/API tests, including configuration/authentication checks: `node --test tests/*.test.mjs` from architecture-v2. Eight additional local PostgreSQL tests passed. `git apply --check` succeeded against the original checkout.

Real local PostgreSQL checks use PGlite 0.5.16, a test-only dependency:

```
npm install --prefix test-tools --ignore-scripts --no-package-lock --no-audit --no-fund
node scripts/test-photo-usage-postgres.mjs
```

The SQL tests cover repeatable migration, >1,000-photo pagination, cold starts, simultaneous capacity reservations, initialization contention/retry, stale-worker fencing, bad pagination, quota failure, ambiguous upload outcomes, private upload references and shared durable rate-limit SQL. PGlite verifies PostgreSQL statements locally; it does not certify live Neon connections or simultaneous independent database sessions.

Validator generation and syntax checks also pass. CI is updated to run the PostgreSQL checks using the pinned test dependency. No end-to-end claim is made for live Blob/Neon or physical iPhone behavior.

## Files to apply

Use the accompanying `photo-operations.patch` from the parent workspace against the original repository after reviewing these gates. Do not upload the whole candidate directory: it includes locally downloaded test-engine files. The patch contains only source, tests, migration, CI and this rollout document.
