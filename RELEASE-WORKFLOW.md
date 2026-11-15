# Metro Eats development and release workflow

Create feature branches from aligned main (until alignment merges, use metro-eats-isolated-development). Push a branch to create a Preview with test-only database, sign-in and photos. Register its exact origin in test auth when needed. Use disposable accounts; never test against historical Preview URLs.

Run `node --test architecture-v2/tests/*.test.mjs` and `node scripts/build-journal-validation.mjs --check`. CI also checks database accounting and account isolation using ephemeral test databases. Verify current Preview login, saving/reloading and photo persistence for changes affecting those paths.

## Review and integration

Open a pull request into main and review CI and Preview behavior. The alignment branch preserves main's latest news.json while incorporating the released rebuilt app and development safeguards.

Keep automatic Production domain assignment OFF. A main push may create a staged Production deployment with Production settings; the public domain stays on its existing release. A main merge is not approval to promote a release.

## Release

1. Confirm exact main commit, team, project and staged Production deployment. Production builds use Production credentials, so Preview validation alone is insufficient.
2. Check routing, retired endpoints and unauthenticated access controls without owner writes. Use the owner's sign-in flow for acceptance checks when necessary.
3. Obtain release approval for that concrete deployment, then promote the staged Production deployment. Promoting a test Preview requires a rebuild with different settings.
4. Record deployment ID, commit and prior rollback target. Retain private recovery archives.

## News

The hourly Update Metro Eats local news workflow is disabled in GitHub. It updates news.json on main. Reenable only after main contains the reviewed rebuilt app. Keep automatic Production domain assignment OFF unless automatic releases are explicitly chosen later; news pushes can stage builds without replacing the public release.

Historical deployments retain old resource mappings. Local CLI setup and main integration require separate verification checkpoints. Do not declare the entire transition complete until those checks pass.
