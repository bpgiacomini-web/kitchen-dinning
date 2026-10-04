METRO EATS — ENHANCEMENTS 1–3
================================

Baseline:
72f0b85776c58d418e2b1129bc2fc82dc084d6ad

This package contains the updated index.html for the current Metro Eats baseline.

IMPORTANT:
This is intentionally an INDEX-ONLY replacement package. Keep the existing
Metro Eats logo, icons, manifest, news.json, and other assets in the GitHub
repository. Replace the existing index.html with the one in this ZIP.

Requested changes included:
1. Website recipe importing is now inside the Create Recipe workflow.
   - Create Recipe opens the normal recipe editor.
   - An "Import Website" control is inside that editor.
   - Imported title, ingredients, and directions are placed into the Create
     Recipe form for review before saving.
   - Paste Recipe Text is also available from the Create Recipe workflow.

2. Recipe category filtering is now a drop-down.
   - The previous row of category buttons is removed.
   - "All Categories" plus the existing recipe categories are available in
     one selector.

3. Dates and timestamps are recorded and displayed.
   - Recipes receive an Added date/time when created.
   - Edited recipes receive a Last updated date/time.
   - Restaurants receive an Added date/time when created.
   - Restaurant written/edited entries receive a Last written/updated date/time.
   - Every completed 12-question restaurant review receives its own Reviewed
     date/time.
   - Review history is retained so later reviews do not overwrite the
     historical review record.

No GitHub deployment is performed by this package.
