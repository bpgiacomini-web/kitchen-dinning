# Metro Eats visual asset checkpoint

Updated 2026-10-25. This note applies to the clean architecture rebuild only. The known-good baseline must remain untouched.

## Approved visual assets

The user approved the Metro Eats brand direction:
- Wide banner: black-and-gold shield, fleur-de-lis, St. Louis skyline and Gateway Arch, sunset-orange accents.
- Square app icon: matching shield/fleur-de-lis, “METRO EATS” lettering, fork/knife, skyline, orange/gold rim.
- A taller vertical logo variant was also approved for the app's top/header area.

## Repository integration status

The continuing clean-rebuild branch contains:
- `metro-eats-logo.png` — canonical header logo asset replaced on the rebuild branch.
- `icon-180.png` and `icon-512.png` — canonical app icon filenames, preserved for existing manifest/touch-icon references.
- `metro-eats-vertical-logo.PNG` — uploaded vertical logo variant.
- A duplicate upload named `metro-eats-vertical-logo.png.PNG` was removed from this branch.

The manifest continues to refer to `icon-180.png` and `icon-512.png`. The known-good baseline branch and production were not changed by this cleanup.

## Deployment and verification status

- The Vercel preview had a READY deployment for an earlier branch commit.
- The cleanup commit is newer than that deployment. The latest deployment list did not yet show a deployment for the cleanup commit.
- The Vercel CI check reported a build-rate-limit failure. Therefore, do not describe the newest cleanup as deployed or visually verified yet.
- Automated repository tests had passed on an earlier architecture commit; the newest commit needs a fresh CI/deployment check.
- Browser/iPhone visual comparison remains pending.

## Safety checks before completion

- Verify the canonical image assets exist on the continuing clean-rebuild branch and inspect dimensions.
- Verify the manifest and Apple touch-icon links resolve.
- Re-run available tests and inspect CI once Vercel build limits allow.
- Do not claim visual parity or a live deployment until verified.
- Do not merge the draft PR or deploy production without explicit user approval.

## Checkpoints

- Known-good baseline: `caba131ab2ab8c689f7909618092736b89a5fbc9`
- Clean rebuild initial pin: `d2cec79512870a99f00d88d9e6d87bcc7636afb2`
- Continuing branch: `architecture/metro-eats-clean-rebuild-2026-10-25`
