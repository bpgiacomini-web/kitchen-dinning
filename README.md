# Metro Eats

Personal recipes, restaurant reviews, dining history, and St. Louis / Metro East food news.

## GitHub Pages

This is a static GitHub Pages app. Upload the contents of this package to the repository root.

## Daily local news

`.github/workflows/daily-news.yml` runs the news updater daily and can also be run manually from GitHub Actions. It updates `news.json` when new local food stories are found.

## Important

- Recipes and restaurant data are stored in the browser's localStorage on the device being used.
- The app does not use a server-side database.
- Restaurant search and current-location features require browser location permission.
