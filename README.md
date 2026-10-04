# Metro Eats — Restoration Build

This is a complete replacement build based on the current Metro Eats site, with the requested restoration work applied.

## Included restorations
- Recipe tap-to-expand / tap-to-collapse restored.
- Recipe search, category/subcategory filters, favorites, edit and delete preserved.
- Recipe photo field added, with iPhone-friendly image compression and saved recipe photos.
- Manual recipe entry, Website import and Paste Recipe all finish in the standard recipe editor before saving.
- Website recipe import now prefers Recipe JSON-LD (`recipeIngredient` / `recipeInstructions`) and falls back to tightly bounded recipe sections.
- Dining review history remains the primary Dining view, with individual visits preserved and ranked by Overall Experience/date.
- Review migration broadened to recover older restaurant/review data structures stored on the same site origin.
- Restaurant name-search feature work was intentionally left alone, per request.
- News continues to use only an actual `image` supplied by a story. If no usable image exists, no image is attempted or shown.
- Broken/missing news artwork references were removed.
- Existing localStorage data is preserved/migrated; this build does not intentionally clear it.

## Important
Nothing has been pushed or deployed to GitHub from this build.

To install manually: upload/replace the files in your GitHub Pages repository with the contents of this ZIP, then allow GitHub Pages/Actions to publish normally.
