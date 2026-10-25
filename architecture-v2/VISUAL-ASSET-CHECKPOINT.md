# Metro Eats visual asset checkpoint

Recorded 2026-10-25. This is a reference note for the clean architecture rebuild; it does not modify the known-good baseline or any image files.

## Canonical assets from the known-good baseline

- **Header/brand logo:** `/metro-eats-logo.png`
- **iOS Home Screen touch icon:** `/icon-180.png`
- **PWA manifest icon:** `/icon-180.png` and `/icon-512.png`, declared in root `/manifest.json`
- **App display name:** `Metro Eats`
- **Visual style:** reuse the baseline `/styles.css` (dark charcoal background, warm gold accents, teal dining accents, existing typography/spacing and safe-area behavior).
- **Home hero:** the baseline CSS defines a dark warm-to-teal gradient background, not a separate hero photo. The fleur-de-lis is rendered as a text glyph in the hero content.

## Clean rebuild requirements

- Continue referencing the exact existing logo file with `../metro-eats-logo.png`; do not redraw, replace, crop, or recolor it.
- Continue reusing the baseline stylesheet and existing PWA icon/manifest assets.
- Do not create duplicate copies of the logo or app icons unless a later verified requirement makes that necessary.
- Any future visual adjustment must be isolated to `architecture-v2/` and checked against these canonical asset paths before changing anything.
- Do not change the known-good baseline or production as part of visual cleanup.
- No visual file bytes were changed by this checkpoint note. Pixel-level browser comparison is still pending; matching asset paths is not proof of exact rendering parity.

## References

- Baseline checkpoint: `caba131ab2ab8c689f7909618092736b89a5fbc9`
- Clean rebuild checkpoint at time of initial pin: `d2cec79512870a99f00d88d9e6d87bcc7636afb2`
