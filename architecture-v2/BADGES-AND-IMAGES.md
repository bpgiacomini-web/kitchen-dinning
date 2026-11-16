# Badges and restaurant website images

Preview-only extension of restaurant-profile work; no production promotion authorized.

## Badge definitions

User could not recover the original definitions and explicitly authorized suggested thresholds.

| Category | Milestone | Badge |
| --- | ---: | --- |
| Account | Sign in | Welcome to the Table |
| Recipes saved | 1 | Recipe Keeper |
| Recipes saved | 10 | Home Cook |
| Recipes saved | 25 | Recipe Collector |
| Recipes saved | 50 | Kitchen Curator |
| Distinct restaurants reviewed | 1 | First Bite |
| Distinct restaurants reviewed | 5 | Local Explorer |
| Distinct restaurants reviewed | 10 | Table Regular |
| Distinct restaurants reviewed | 25 | Super Diner |
| Distinct restaurants reviewed | 50 | Dining Legend |

My Badges is reached through Account & Settings. It shows earned and locked badges and the next recipe/place milestones. Existing records count immediately. Repeat visits do not inflate the place count; Home and Travel count. Restaurants are deduplicated by placeId or normalized name/address. New awards trigger an accessible, dismissible celebration with View My Badges. Awards are retained in the existing account-isolated journal's achievements map during ordinary saves; no new database table or background writes. Previously earned badges are carried forward even when a record is deleted. Restoring an older journal snapshot restores that snapshot's achievement history. Client-side personal achievements are not anti-cheat credentials or public competition results.

## Website images

Use the restaurant website's declared Open Graph/Twitter image or structured-data logo, with a fallback for explicitly logo-marked images. Do not harvest arbitrary inline pictures. A metadata lookup is performed on restaurant detail save when missing/changed (unless hidden), or from the profile's Refresh website image button. A review save can enrich a restaurant without a personal photo. No scraping occurs on ordinary profile/list opens. Existing restaurants can use Refresh; no bulk crawl or migration.

Reuse authenticated POST /api/restaurant-lookup mode website-image, account rate limit20/hour and existing DNS-pinned public-page fetcher (redirect checks, response byte cap, timeout and blocked private networks). Check the image hostname too. Only HTTPS image references are accepted. Returned image metadata is saved on its restaurant record, never in visit photos or the personal gallery. Your primary/personal photo takes priority; otherwise show the declared website image, then a restaurant icon. An image may be hidden through Edit Restaurant Information. Existing Add Photo and gallery Use as primary allow personal replacements.

Website images are referenced directly with no referrer and source metadata retained internally. The restaurant website link remains in Restaurant information; image captions are omitted. Photos fill their thumbnail; detected logos remain fully visible. Image bytes are not copied into Blob, proxied or archived. This is not a claim of ownership or a reusable image license; a website's removal or refusal is honored through the fallback. Broken images fall back without interrupting the journal. No paid image service, AI call, dependency, schema migration or extra Vercel function.

## Verification

218 automated tests passed, including badge thresholds/deduplication/retention, metadata extraction, missing/unsafe URLs, authentication and rejected image DNS. Existing journal validator passes. Local actual isolated Development API/account checks: My Badges and mobile collection; live Fast Eddie website image saved without a visit; hide/unhide save; list/profile image and attribution; first disposable recipe save generated Recipe Keeper celebration; awards/progress survived reload. Test data only, original visit/photo preserved. Hosted Preview checks are required after publication.
