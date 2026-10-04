# Metro Eats

Metro Eats is a mobile-first personal recipe book, restaurant journal, and St. Louis / Metro East local food guide.

## Current build
- Large, older-user-friendly restaurant intake and 12-question dining survey
- Progressive nearby restaurant search with name matching and multiple fallbacks
- iPhone safe-area protection across pages and pop-outs
- Restored Metro Eats logo
- Daily local news with food prioritized, plus bars, comedy, and music categories
- Recipes and restaurants stored in browser localStorage
- Location features require browser permission

## Daily news
GitHub Actions runs `update-news.py` daily and updates `news.json` when fresh local stories are found. Food is intentionally prioritized; local bars/nightlife, comedy, and music events are also categorized when available.

- Restaurant name search uses progressive nearby matching with Overpass and a Nominatim fallback.
