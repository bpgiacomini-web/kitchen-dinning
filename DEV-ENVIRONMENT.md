# Metro Eats environments

Production: https://kitchen-dinning.vercel.app/ . Released commit d77c871, deployment 4Sf2HNWqEBBugHSm9FZeaFfzkVVX. This setup does not promote a deployment or replace the public domain.

Test Preview: https://kitchen-dinning-git-metro-eats-isola-ac80c8-usdrinkingclub-8582.vercel.app/architecture-v2/ . Branch metro-eats-isolated-development. November 15 verified separate test signup, empty initial journal, saved restaurant/review and synthetic photo after reload. Deployment CVBPZcPnvWzL4KuKw39cErVdHEFv used 621d736.

## Resource boundaries

| Environment | Database and sign-in | Private photos |
| --- | --- | --- |
| Production | br-purple-morning-b7ja7rws, ep-proud-wildflower-b70u7a8q; historical branch name metro-eats-preview | store_Qqch1rwiTtBYtvWr |
| Preview and Development | br-fragrant-heart-b7y41jle, ep-silent-lab-b70m9zcz; metro-eats-development | store_KDOPFGyHwpIErI5Q |

The test database was created schema-only. All 17 copied app/auth tables were independently empty before setup; no owner rows copied. Test Neon Auth is separately provisioned, with test-only managed-service permission repairs. Disposable data now exists in its test journal.

The old Neon automatic Preview connection was removed. Explicit default Preview DATABASE_URL, auth base/JWKS/client URLs, photo accounting store and environment marker now identify the shared test resources. Production entries remain separate. Both Blob connections use OIDC scoped to their respective environments; no static Blob token is required.

The old architecture branch overrides also identify test resources for future builds. Existing deployments retain their original settings: do not use historical deployment URLs or the old architecture alias for test writes, since it may target the released Production deployment.

## Local setup

1. Install the official Vercel CLI and sign in with `vercel login`. Install the declared application packages with `pnpm install` before starting the local API server.
2. From this checkout, run `vercel link --yes --scope usdrinkingclub-8582 --project kitchen-dinning` and `vercel project inspect --non-interactive`. Confirm project prj_lxfy0zZNVbB6mT6FSV8xG2qkKcgE and team team_IeUCXxDoAFPT7NhMb2OmP3qE.
3. Pull Development only: `vercel env pull .env.local --environment=development`. If the test DATABASE_URL Secret is omitted, obtain it directly from metro-eats-development. Never pull or copy Production credentials.
4. Run `node scripts/check-development-environment.mjs .env.local`. It rejects known owner DB/auth/photo resources, missing values and inconsistent test mappings, without printing values.
5. Set METRO_VERCEL_CLI in the local environment to the installed official CLI JavaScript entry point. If the CLI uses a custom configuration directory, set METRO_VERCEL_GLOBAL_CONFIG to that directory. On Windows, set NODE_USE_SYSTEM_CA=1 when the CLI needs the Windows trust store. Run `node scripts/start-development.mjs` (or `pnpm run dev:local`). It repeats resource checks, verifies the exact project/team link, and starts only `vercel dev --listen 127.0.0.1:3000`.
6. Open http://localhost:3000/architecture-v2/ using a test account. Test localhost auth allows local sign-in. Verify sign-in and save/reload, and synthetic photo upload when needed. A static frontend server does not verify API behavior.

Local bootstrap remains incomplete until CLI sign-in, linking, environment pull and live checks are recorded. The startup command stops when setup is missing; do not bypass it to run with owner credentials. This checker is a setup guard, not a provider authorization boundary. Test Blob OIDC also requires valid local Vercel sign-in.

## Feature branches

New feature branches inherit shared test resources. Add their exact Preview origins to test Neon Auth trusted domains when required; do not widen the Production auth domain list. Use synthetic accounts and disposable entries. Pushes create unique Preview deployments.

See RELEASE-WORKFLOW.md for review and release. Main still needs integration of the rebuilt app. News automation remains disabled and automatic Production domain assignment OFF until integration is reviewed. Promotion is a separate release action.
