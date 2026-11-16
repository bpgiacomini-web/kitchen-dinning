# Restaurant master profiles

Restaurant profiles retain restaurant information and independently identified visits in the existing account-owned dataset. Every saved restaurant entry point opens the same profile. Visit editing and deletion are available only through its history.

## Summary rules
- Average valid visit overall scores equally; keep the established individual-visit formula.
- Average categories only across visits that answered them. Preserve five-point and ten-question legacy surveys through adapters and a legacy snapshot when editing.
- Order-again percentage uses Yes / (Yes + No), with the answered count visible.
- Sort history by visit date, with creation time and stable ID as tie breakers.
- Compute summaries from visits; the restaurant rating and survey fields remain compatibility mirrors.
- Keep standalone restaurant photos plus all visit photos. Gallery loads twelve thumbnails at a time; collapsed visit photos load when opened. Primary photo is a reference, with a fallback if its visit is removed.
- Deleting the final visit retains the restaurant. Photo objects remain available for restore points; deleting a visit removes its live profile references, not the stored blob.

## Compatibility and duplicates
Legacy visits receive deterministic noncolliding IDs in the read adapter and persist on the next explicit mutation. Distinct history rows survive even if their contents match. Exact survey mirrors are counted once. Unknown fields remain in the records.

New entries check provider place identity or normalized name plus full address. Different chain locations remain separate. Existing duplicates can be combined only after the user selects the source and confirms the two entries refer to the same location. Visits with conflicting IDs are retained under different IDs. Notes and photos are combined; source restaurant metadata is retained in mergedRestaurantSources. The existing revision check and automatic restore points protect saves.

## Scope and limits
No new API route, service, dependency, database schema, or authentication change. Existing account-scoped APIs and Preview/Production resources remain separate. Whole-dataset writes still have a 1.5 MB limit; independently stored and paginated visits are a future scaling step. Menu-history summaries and rating-trend charts are deferred.

## Verification
203 automated tests, including new summary, legacy mirror, ID collision, visit deletion, gallery, legacy survey, duplicate detection, merge preservation, and safe-rendering coverage. Existing account isolation and revision-conflict tests remain in the suite.

Local browser verification used actual API handlers and the isolated development database: existing photo loaded; added a second visit (8.0 -> 7.0, 100% -> 50%); edited it (7.5 aggregate); reloaded and retained data; deleted only that visit (8.0, one visit, 100%); combined a disposable second restaurant and reloaded with one restaurant and both sets of notes retained. Desktop and narrow-screen layouts inspected.

## Cleanup batch — November 16
- Food categories containing saved or draft items are highlighted and show live item counts.
- Around Me restaurant menus offer Want to Try alongside Mark as closed. Save uses the existing account-scoped dataset and reuses an existing profile when matched; no visit is required.
- Restaurant-level travel boolean defaults old records to Home. My Restaurants has Home/Travel/All filters. Travel restaurants retain their data but are excluded from home restaurant insights, the embedded home map, and matched dinner suggestions. Current-location discovery remains independent.
- Home now has a compact Recent Journal Entries disclosure without Your Table or its oversized panel. Removed preview footer wording.
- Badge names/thresholds are still outstanding; no invented milestones were introduced.
- Daily Bite free-only feasibility is documented separately. Static curated content is viable without new APIs, database writes, cron, AI subscriptions, or image storage. Initial researched content remains required; the feature is not enabled in this batch.
