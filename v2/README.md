# Metro Eats 2.0 Foundation

This is the clean, compartmentalized Metro Eats 2.0 foundation. The existing root application remains untouched.

## Boundaries

- index.html — application shell only
- styles.css — shared visual system and responsive/safe-area rules
- src/app.js — navigation and feature orchestration
- src/store.js — local persistence/data boundary

The approved existing metro-eats-logo.png is reused directly. It is not recreated.

## Current working foundation

- Home
- My Restaurants
- My Recipes
- My Insights
- Restaurant review capture with the approved 1–10 scoring structure
- Recipe creation/editing
- Local persistence
- Mobile-first safe-area layout
- Search/settings entry points ready for isolated feature modules

## Regression rule

Every meaningful change follows:

Fix → Build → Diagnose → Test affected area → Regression checks → Review

Shared store, global CSS, navigation, or other infrastructure changes require broader regression checks.

This branch is a development build. It does not change the live GitHub Pages site until explicitly approved for deployment.