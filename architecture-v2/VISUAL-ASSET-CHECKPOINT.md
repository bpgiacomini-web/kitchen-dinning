# Metro Eats visual asset checkpoint

Updated 2026-10-25. This note applies to the clean architecture rebuild only. The known-good baseline must remain untouched.

## Newly approved visual assets

The user approved two generated designs:
- **Hero logo/photo:** the wide Metro Eats banner with a centered black-and-gold shield, fleur-de-lis, St. Louis skyline and Gateway Arch, with brighter sunset-orange accents.
- **Square app icon:** the centered square Metro Eats emblem with brighter orange/gold rim, fleur-de-lis, “METRO EATS” lettering, fork/knife, and St. Louis skyline.

Prepared PNG exports in the current ChatGPT session:
- `metro-eats-icon-512.png` — 512 × 512
- `metro-eats-icon-180.png` — 180 × 180

The hero image was generated separately as a wide banner. These are approved replacement assets, but approval and local file creation are not the same as committing them to the repository.

## Repository integration status

**Not yet replaced in GitHub.** The binary image files still need to be uploaded to the clean-rebuild branch before changing references. Do not point the app at filenames that do not yet exist in the repository.

When uploaded:
- Replace only the clean rebuild's hero image/reference with the new wide banner.
- Replace root `icon-512.png` and `icon-180.png` on the clean-rebuild branch with the prepared square PNG exports, preserving these filenames because `manifest.json` and the Apple touch-icon reference use them.
- Confirm the manifest and Apple touch-icon links resolve and update cache/version references as appropriate.
- Do not modify the known-good baseline branch or production.
- Do not merge or deploy without explicit user approval.

## Existing canonical references

- Header/brand logo: `/metro-eats-logo.png`
- iOS Home Screen touch icon: `/icon-180.png`
- PWA manifest icons: `/icon-180.png` and `/icon-512.png`, declared in root `/manifest.json`
- Baseline home hero currently uses CSS gradient and fleur-de-lis glyph; it does not currently use a separate hero photo.

## Safety checks before completion

- Verify all asset files exist on the clean-rebuild branch and inspect their dimensions.
- Verify only intended files changed in the clean-rebuild branch.
- Run the available tests and inspect CI.
- Browser/iPhone visual comparison remains pending; do not claim visual parity or a live deployment until verified.

## Checkpoints

- Known-good baseline: `caba131ab2ab8c689f7909618092736b89a5fbc9`
- Clean rebuild initial pin: `d2cec79512870a99f00d88d9e6d87bcc7636afb2`
- Continuing branch: `architecture/metro-eats-clean-rebuild-2026-10-25`
