# Metro Eats environments

Released baseline: d77c871d2e2a83fbb2d356f98ebe6275aa585419, live deployment 4Sf2HNWqEBBugHSm9FZeaFfzkVVX.

## Current transition status

Production is live at https://kitchen-dinning.vercel.app/. The architecture Preview alias still shares the owner production resources. Do not use it for test writes until isolated settings are deployed and verified. The old document claiming main is the current production source was stale: main still needs release alignment. News updates and automatic production-domain assignment remain paused.

The new local development branch is metro-eats-isolated-development. It is not pushed until test-resource mapping is safe. Development setup changes do not alter the current immutable production deployment.

## Resource boundaries

| Environment | Database/auth | Photos | Data |
| --- | --- | --- | --- |
| Production | Existing owner branch br-purple-morning-b7ja7rws, historical name metro-eats-preview; ep-proud-wildflower-b70u7a8q | store_Qqch1rwiTtBYtvWr | Existing real journal |
| Preview/Development target | New schema-only metro-eats-development, br-fragrant-heart-b7y41jle; ep-silent-lab-b70m9zcz | Separate private test store, pending | Synthetic/disposable test entries only |

Do not reset or repurpose the owner branch because its name contains preview. Do not use temporary recovery resources as development. The new branch copied schema only; live rows were not requested for the copy. Independent emptiness verification remains pending.

## Local setup gate

1. Finish isolated database/auth/photo provisioning and confirm exact Vercel Preview/Development scopes.
2. Link the checkout to the intended Vercel project before pulling environment configuration.
3. Copy .env.example to .env.local and enter only isolated test values. Vercel Preview/Production Secret values are write-only and cannot be recovered by env pull; do not attempt to pull Production credentials.
4. Run npm run check:dev-env. It rejects the known owner database/auth endpoint and photo store, mismatched photo/accounting IDs, missing values and mixed auth URLs. It prints variable names/errors, never values.
5. Only after linking, credentials and schema are independently verified should a local API-capable server be configured and started. A static file server alone does not implement these Vercel /api routes.

The checker is a setup guard, not a complete runtime access control. Run it explicitly before local work. Hosted environment isolation still requires correct Vercel resource scoping, separate credentials and live tests. No local server is configured or certified yet.

## Development and release workflow

Work on development/* or feature branches with isolated Preview resources. Test with separate test accounts. Review changes before integrating into main. Production deploys are staged and manually promoted after validation and release approval. Never reenable scheduled news on a main branch that contains legacy code with production credentials.

Before declaring separation complete: verify new auth users are empty, app tables empty, test upload goes only to test store, test edits do not change owner data, and the public production site still loads its original journal/photos. Keep monthly Blob operations in mind; local mocked tests cover most iterations without provider calls.

## Provisioning status — November 15

- Created schema-only root branch br-fragrant-heart-b7y41jle (metro-eats-development), endpoint ep-silent-lab-b70m9zcz, database neondb, no expiry, default0.25CU. Independent count of all17 public/neon_auth tables showed zero rows.
- Neon Auth activation initially rejected copied empty neon_auth schema. Removed only its nine empty tables with a transaction that locks each table and aborts if any contains rows. Public app tables preserved. Subsequent activation returns permission denied for database neondb.
- Verified neondb_owner owns the test database; owner/neon_superuser have CREATE. A temporary CREATE grant to test role neon_auth did not resolve managed provisioning and was revoked. No permission changes made on the owner production branch. Auth provisioning remains incomplete; do not connect Preview to this branch yet.
- Created private IAD1 Blob store metro-eats-development: store_KDOPFGyHwpIErI5Q. It is empty and NOT connected to any project. Original production Blob connection remains untouched. Vercel optional2FA reminder dismissed with user's explicit approval; existing sign-in settings unchanged.
- Main alignment, Preview/Development env switching, auth trusted domains, test user creation and end-to-end isolation tests remain pending. No development branch push or Preview deployment performed.
