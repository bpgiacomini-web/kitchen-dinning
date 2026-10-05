# Metro Eats 2.0 — AGENTS.md

## 1. Role and Product Identity

Metro Eats is the user's personal food journal and recipe app.

Current focus:
- Personal restaurant journal/reviews.
- Personal recipes and recipe organization.
- Local St. Louis / Metro East food information.
- Personal food insights and history.

Current audience:
- Primarily the owner/user.
- Designed for foodies and people who enjoy restaurants and cooking.

Current geography:
- St. Louis metropolitan area and Metro East Illinois.
- Local food/news coverage should generally use approximately a 50-mile radius around the St. Louis area.
- Do not turn the current product into a statewide Missouri/Illinois service.

Future architecture:
- Personal-first today.
- Architecture should allow future geographic configuration, additional users, and synchronization without requiring a complete rebuild.

The product should feel like a premium personal food journal, not a restaurant database, generic review site, social network, or dashboard.

---

## 2. Development and Delivery Rules

The user is nontechnical and primarily uses an iPhone.

- Use simple, direct, one-step-at-a-time instructions when user action is required.
- First understand and summarize requested changes.
- Never publish, deploy, push, or claim a live update unless the user explicitly approves deployment.
- When a group of changes is approved, implement the approved group together.
- Prefer one complete replacement ZIP when practical because the user manually uploads it to GitHub.
- Do not provide patches unless specifically requested.
- Never claim a file, ZIP, repository, commit, or live site was updated unless it was actually verified.
- Preserve a checkpoint/backup before risky or major changes.
- Maintain clear checkpoints so work can continue across chat sessions.

Current reference repository:
- GitHub: `bpgiaomini-web/kitchen-dinning`
- GitHub Pages: `https://bpgiacomini-web.github.io/kitchen-dinning/`

Metro Eats 2.0 is a clean rebuild. Treat the existing app as the **Reference Build** for useful behavior and visual ideas, not as the architecture that must be preserved.

Do not deploy the new build until the user explicitly approves deployment.

---

## 3. Product Principles

1. Personal journal first.
2. User data is authoritative.
3. External information never changes personal scores.
4. The app does the work; the user makes the decisions.
5. Fast entry beats exhaustive forms.
6. Depth should be available without cluttering the primary UI.
7. Everything is private by default.
8. Never silently guess or invent user data.
9. Use background automation when it improves accuracy or efficiency.
10. No traditional recommendation engine.
11. AI may quietly assist with extraction, cleanup, classification, and insights.
12. Accessibility is baseline design, not a separate mode.
13. Do not overbuild V1.
14. Historical personal data must be preserved unless the user explicitly deletes it.
15. New reviews must not be biased by previous ratings or history.

---

## 4. Navigation

Primary navigation:

- Home
- My Restaurants
- My Recipes
- My Insights

Secondary/header access:
- Universal Search
- Settings

Use personal wording:
- My Restaurants
- My Visits
- What I've Had
- My Favorites
- My Data
- My Recipes
- My Insights

Avoid impersonal labels such as:
- User Reviews
- Restaurant Database
- Recipe Repository

The product should feel like opening the user's own food journal.

---

## 5. Visual and Brand Direction

### Overall style

Metro Eats 2.0 should feel like:
- A modern premium app + editorial food publication.
- More like a premium app than a magazine website.
- Clean, fast, contemporary, polished.
- Strong typography.
- Strong black/white contrast.
- Subtle slick details.
- Personal character.
- St. Louis / Metro East identity.
- Editorial touches without becoming a news-site layout.
- Data-rich underneath but visually calm.

### Color

Use one visual version only:
- No light/dark mode in V1.
- White/near-white surfaces.
- Black/charcoal text.
- Strong contrast.
- Restrained accents.
- Logo supplies much of the personality.

### Logo

Use the approved/reference Metro Eats logo:
- Graphic/ornate treatment.
- Fleur-de-lis / St. Louis visual elements.
- Strong METRO EATS typography.

Do not invent a replacement logo when an approved/reference asset is available. If the approved asset is unavailable or ambiguous, ask rather than silently substituting another logo.

### Icons

- Prefer clean minimalist line-art icons.
- Use icons meaningfully.
- Avoid emoji/clip-art as the primary visual language.

### Photography

- Photos are optional and secondary.
- The product must look excellent without photos.
- Do not use generic food-image boxes simply to fill space.

---

## 5A. Approved Logo Asset Lock

The current repository contains the approved/reference Metro Eats logo asset:

- File: `metro-eats-logo.png`
- Repository: `bpgiacomini-web/kitchen-dinning`
- Current `main` blob SHA: `d03f67d51272680217e82efbb7eb568125e1caa4`
- Current file size: 491,897 bytes

Metro Eats 2.0 must use this existing logo asset as the reference/starting asset.

Rules:
- Do not redraw, regenerate, reinterpret, or replace the logo.
- Do not substitute a newly generated logo simply because it is easier to implement.
- Preserve the approved logo artwork and proportions.
- The logo may be resized responsively and placed appropriately for different surfaces.
- If a different logo asset is proposed, it requires explicit user approval before use.
- If the approved asset is unavailable in a new build environment, stop and resolve the asset issue rather than inventing a replacement.

The existing logo asset is the source of truth for Metro Eats branding unless the user explicitly approves a new version.

---

## 6. Global UI, Mobile, and Accessibility Rules

- Mobile-first, with iPhone as the highest priority.
- Responsive on iPad and desktop browsers.
- Protect every page, form, modal, sticky header, and bottom action area from the iPhone Dynamic Island/status bar and home indicator.
- Use CSS safe-area handling such as `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- Handle portrait and landscape sensibly.
- Never solve safe-area issues with huge blank margins.
- Use large readable typography by default.
- Respect device accessibility/text scaling where practical.
- Strong contrast.
- Large touch targets.
- Clear labels.
- Never communicate meaning by color alone.
- Comfortable spacing.
- Simple navigation.
- Buttons must be obvious and easy to tap.
- Avoid redundant explanatory text underneath search boxes, filters, dropdowns, and controls.
- Keep only concise labels/hints when genuinely necessary.
- The interface should be comfortable for older users, including users who may need larger text.

Do not restore:
- Home-page counts for recipes/reviews/restaurants.
- Generic BBQ / Pizza / Metro East dashboard boxes.
- Large empty margins used to compensate for safe-area problems.

---

## 7. Home

Home is a **launchpad**, not a dashboard.

Priorities:
1. Metro Eats identity / prominent logo.
2. Local food news.
3. Easy access to recipes.
4. Easy access to restaurant activity.
5. Small recent personal activity.
6. Local awards/recognition where supported by reliable data.

Do not invent fake history or build future concepts such as “Your Dining Story” unless separately approved.

### Recent Visits

A small Recent Visits section is approved.

Each card should remain minimal:
- Restaurant name.
- Overall visit score.
- Up/down/same indicator versus the previous relevant score.

Do not put meal/item details on the Home card.

---

## 8. Local Food News

Current V1 Home news is **food-only**.

Section:
**Around the Metro — St. Louis & Metro East Food News**

Coverage:
- St. Louis metro + Metro East Illinois.
- Approximately 50-mile radius.
- Missouri + Metro East Illinois.
- Not statewide.

Rules:
- Maximum 10 stories on Home.
- Daily refresh.
- Use reputable local/regional sources.
- Use multiple reputable sources when available.
- Never fabricate stories, awards, claims, dates, or source information.
- Do not copy full articles.

Each story:
- Headline.
- Short 1–2 sentence summary.
- Publication/source.
- Date.
- “Read Full Story” link to the original.

Infrastructure:
- Prefer GitHub Actions + `news.json` / update script rather than relying only on client-side scraping.
- Use reputable fallback sources if a preferred source cannot reliably provide data.
- Never show fabricated filler simply to make the section look full.

Note: the original project instructions support local Bars/Nightlife, Comedy, and Music/Live Events, but the user's latest V1 decision narrowed the Home news area to food-only. The latest decision controls V1.

---

## 9. Restaurant Discovery

### Current-location flow

Conceptual flow:

`Restaurants Around Me → Use My Location → identify restaurant → select restaurant → Rate This Restaurant`

Never silently select the first result.

User-facing address:
- Street
- City
- State

Never display:
- ZIP
- County
- Country
- Coordinates
- Other unnecessary address/geolocation details

### Restaurant name search

Search should:
- Update as the user types with debounce.
- Search nearby first when location is available.
- Progressively expand approximately:
  - 2 miles
  - 5 miles
  - 15 miles
  - 30 miles
- Work without location.
- Support exact and partial names.
- Normalize punctuation/apostrophes.
- Support multi-word names.
- Support alternate names/brands.
- Use reliable fallbacks when a source fails.
- Rank strong name matches before distance.

Result cards:
- Restaurant name.
- Distance.
- Address.
- Type.

User selects the result.

Selection should populate, where reliably available:
- Restaurant name.
- Street.
- City.
- State.
- Internal coordinates.
- Official website.

---

## 10. Restaurant Data and Menus

Automatically collect reliable public restaurant information when accuracy is sufficient.

Potential fields:
- Name.
- Address.
- Phone.
- Website.
- Cuisine/type.
- Hours.
- Official menu.
- Official link.
- Public ratings.
- Awards/recognition.
- Other verified public information.

Accuracy is more important than filling every field.

If uncertain:
- Ask for quick confirmation when materially important.
- Otherwise leave blank.
- Never silently guess.

Restaurant information refresh:
- Refresh restaurant information when the restaurant is opened.
- Menu data may refresh automatically in the background.
- Menu updates must never rewrite or delete historical menu items recorded in the user's personal history.

### Official menu

- Prefer official restaurant menus.
- If the official menu cannot be confidently verified/imported, show “View Official Menu” or “Find Official Menu”.
- Never present a third-party menu as official.

Restaurant entries may contain website/menu links and photos.

### Restaurant type

Use a dropdown with the established values:

American; Bar & Grill; BBQ; Burgers; Breakfast & Brunch; Cafés & Coffee; Chinese; Deli; Fast Food; Fine Dining; French; Indian; Italian; Japanese; Korean; Mediterranean; Mexican; Middle Eastern; Pizza; Seafood; Southern / Soul Food; Steakhouse; Thai; Vietnamese; Vegetarian / Vegan; Food Truck; Bakery; Dessert / Ice Cream; Brewery / Brewpub; Gastropub; Sports Bar; Other.

---

## 11. Places I Want to Visit

Separate from My Restaurants.

When saving:
- Store restaurant name.
- Do not require a meal choice.
- Keep the visual list simple.

Automatically enrich with genuinely notable, verified facts when available:
- Diners, Drive-Ins and Dives.
- Awards.
- Best-of recognition.
- James Beard or other major recognition.
- Local/regional awards.
- Historic significance.
- Notable chefs/owners.
- Notable dishes/specialties.
- Interesting local stories.

Award facts should include award, organization, and year when available.

Keep list cards minimal. Deeper facts can appear on tap.

When visited:
- Tap “I Went”.
- Confirm restaurant information.
- Start the review flow.
- Keep the restaurant in its original list position.
- Mark it Visited.

Removing a place requires confirmation.

---

## 12. Restaurant Visits and Reviews

A restaurant and a restaurant visit are separate but connected records.

A restaurant represents the place.
A visit represents one dining experience at that place.

### Review-entry principles

- Fast.
- One-screen hybrid where practical.
- Overall Experience is the only required rating.
- Everything else is optional.
- Essentials first.
- Optional details expandable.
- Favor taps, 1–10 controls, dropdowns, and yes/no.
- Minimize typing.
- Save Review is available once the required overall rating exists.

### Starting a review

Support:
- I'm Here Now.
- I Was Here Earlier.
- Find a Restaurant.

Automatic suggestion when location strongly indicates a restaurant:

> You're at [Restaurant] — Review this visit?

Controls:
- Confirm.
- Choose Another.

Never silently select.

Retrospective reviews:
- Actual visit date/time may be entered.
- If not supplied, default to review creation date/time.
- Once set, visit date/time cannot be edited.

### Review survey/data model

The approved 12-question survey remains the reference data model:

1. Overall Experience — 1–10
2. Food Quality — 1–10
3. Menu & Selection — 1–10
4. Service — 1–10
5. Atmosphere — 1–10
6. Cleanliness — 1–10
7. Value for Money — 1–10
8. Drinks & Bar — 1–10
9. Location & Accessibility — 1–10
10. Would You Return? — 1–10
11. What Did You Order? — free text
12. Would You Order It Again? — Yes/No

However, the V1 UI should remain fast and should use structured item entry rather than forcing a long survey.

---

## 13. Restaurant Visit Data

A visit can contain:
- Date/time.
- Meal type.
- Food/items ordered.
- Individual item ratings.
- Item Would Order Again?
- Price/cost.
- Drinks.
- Service details.
- Server name.
- Seating/location.
- Special occasion.
- Private visit Notes.
- Photos.
- Receipt / receipt photo.
- Overall experience.
- Would Return?
- Would Recommend?

Not every field is required.

### Notes

- Notes exist only at the overall restaurant-visit level.
- Notes are always private.
- There are no individual item notes.
- Notes are never shared.

---

## 14. Restaurant Scoring

### Scale

All restaurant/category/item scores use a 1–10 scale.

### Overall score

- Overall visit score is calculated from category scores.
- V1 category weighting is equal.
- Overall restaurant score is the aggregate of accumulated visits.
- Individual category scores remain visible so the user can understand the score.

### Item scoring

- Every food item eaten can receive its own 1–10 score.
- Items are not weighted against each other.
- Item scores remain separate from restaurant category scores.
- Item history is preserved over time.

### Drinks

- Drinks are separate from food item scoring.
- Individual drinks may be rated.
- Drinks & Bar is optional.
- If no drinks are recorded, no drinks rating is required.

### Return/recommend

- Would Return? is optional.
- Would Recommend? is separate and optional.
- Item Would Order Again? is separate from restaurant-level return.

### New-review integrity

When recording a new review:
- Do not display previous ratings/history that could influence the new score.
- Previous item scores, comments, Would Order Again, and visit details remain hidden during new entry.
- After saving, the user can explore history and compare.

---

## 15. Review Save and Results

Sequence:

`Record → Save → Immediately see results`

Results should show:
- New visit score.
- Updated restaurant score.
- Category scores.
- Item scores.
- Change in restaurant score.
- Useful visual summary.
- Access to history/details.

The user can explore results.

Returning Home is the natural next destination.
No extra confirmation is required.

---

## 16. Restaurant Page

Structure:

1. Restaurant identity + Your Score
2. Your category breakdown
3. Recent visits
4. What you've ordered
5. Item history
6. Your notes/photos
7. Small outside-rating comparison
8. Other verified restaurant information

The user's score is the dominant visual focus.

Show both good and bad history.

Useful personal patterns are allowed, such as:
- “You've ordered this before — rated 9/10.”
- “Your Favorites Across Metro Eats.”

These are observations from user data, not recommendations.

---

## 17. External Ratings and Public Information

External information is strictly separated from personal scoring.

Examples:
- Google rating.
- Other reputable public rating sources.
- Awards/recognition.

Display minimally:
- Rating.
- Review count when available.
- Small source attribution.

Do not allow external ratings, awards, reviews, or AI to influence:
- Personal visit scores.
- Restaurant aggregate scores.
- Item scores.

Use clear separation such as:
- Your Score.
- What Others Say.

---

## 18. Editing and Deletion

Everything is editable except the original visit date/time once set.

Editable:
- Visit fields.
- Scores.
- Items.
- Recipes.
- Recipe categories.
- Photos.
- Notes.
- Other appropriate personal fields.

Changes automatically recalculate affected aggregates.

### Deletion

Every meaningful deletion requires confirmation:
- Restaurant visits.
- Meal/item records.
- Scores.
- Recipes.
- Restaurants.
- Places to Visit.
- Other meaningful personal data.

There is no Undo after deletion.

Deleting a restaurant deletes its historical personal data.

Deleting an individual visit does not require deleting the restaurant.

---

## 19. Search

Universal Search should be powerful but lightweight.

Possible filters:
- Everything.
- My Restaurants.
- My Visits.
- What I've Had.
- My Recipes.
- My Notes.
- Other relevant types.

Search must remain fast.

### Recipe search

V1 recipe search is intentionally narrower:
- Recipe names only.
- Live search as the user types.
- No ingredient/directions/notes search.

---

## 20. My Insights

Dedicated My Insights area.

Sections:
- Overview.
- Restaurants.
- Food.
- Trends.

No dedicated Spending section.

Insights should be:
- Summary-first.
- Easy to scan.
- Visually useful.
- Based primarily on the user's own data.
- Descriptive rather than directive.

Possible data:
- Highest-rated restaurants.
- Highest-rated meals/items.
- Favorites.
- Most visited.
- Cuisine averages.
- Food-type averages.
- Restaurant score changes.
- Item score history.
- Repeat orders.
- Would Order Again.
- Best meals.
- Visit frequency.
- Consistency/improvement/decline.
- Comparisons to external ratings.

Use simple visualizations.

Do not create an overwhelming analytics dashboard.

---

## 21. Cuisine and Food-Type Data

Cuisine and food-type classification is an important data point.

Use it for:
- Average score by cuisine.
- Favorite cuisines.
- Visits.
- Meals.
- Individual food types across restaurants.

Prefer automatic/inferred classification from reliable restaurant/menu data to reduce manual entry.

---

## 22. Recipes

Recipes are personal living documents.

Every saved recipe is always editable.

### Standard editor

Use one standard editor for:
- Manual recipes.
- Pasted recipes.
- URL-imported recipes.
- Browser/share-sheet imports.

Fields, in this order:

1. Recipe Name
2. Category / Subcategory
3. Servings
4. Prep / Cook / Total Time
5. Ingredients
6. Directions
7. Notes
8. Photo
9. Source — imported recipes only

No voice entry in V1.

### Saving

- Recipe changes save only when the user taps Save.
- No automatic saving.
- Leaving with unsaved changes prompts:
  - Save
  - Discard
  - Cancel

### Deleting

- Always confirm before deleting.
- No Undo.

---

## 23. Recipe Categories

Categories are user-controlled.

User can:
- Create.
- Rename.
- Reorder.
- Remove.

Subcategories follow the same principle.

Primary organization is based on meal/use, with categories such as:
- Breakfast
- Lunch
- Dinner
- Appetizer
- Side
- Dessert
- Snack
- Sauce/Condiment
- Other

### Removing categories

If a category contains recipes:
- Ask where the recipes should be moved.
- After moving them, leave the now-empty category in place.
- User must manually remove the empty category if desired.

Category ordering may be interpreted contextually in different parts of the app.

### My Recipes

- Use the user's category structure.
- Within a category, default to most recently added/edited.
- Optional alphabetical sort.
- Simple list, not a visual grid.
- Each row shows recipe name + category.
- No photo required in list rows.

---

## 24. Recipe Import

Supported V1 methods:
- Paste recipe URL.
- Paste recipe text.
- Browser/share-sheet “Save to Metro Eats”.

### URL/share-sheet flow

1. Extract pertinent recipe information.
2. Open the normal Metro Eats recipe editor.
3. User reviews/edits.
4. User explicitly saves.

### Extraction rules

Automatically remove non-recipe clutter:
- Article introductions.
- Personal stories.
- Advertisements.
- Jump-to-recipe text.
- Marketing content.
- Related-recipe links.
- Comments.

Preserve only:
- Recipe name.
- Ingredients.
- Measurements/units.
- Directions.
- Servings.
- Prep/cook/total time when available.

If extraction is uncertain:
- Leave the field blank.
- Clearly flag it for review.
- Never silently invent information.

### Source

- Retain the original source privately.
- Imported recipes show a small `From [Website Name]` line near the recipe title.
- Tapping the source opens the original recipe webpage.
- User can manually remove the source attribution.
- Removing it offers:
  - Remove attribution only.
  - Remove attribution + stored original URL.
- No second confirmation after that choice.
- If attribution is removed but URL retained, keep “View Original Source” available.
- Manually created recipes have no source line.

---

## 25. Recipe Directions and Ingredients

Directions should be cleaned into clear numbered steps.

The user reviews/edits before saving.

Ingredients use a consistent structure:
- Ingredient.
- Amount.
- Unit.

Natural typing is allowed; Metro Eats may automatically structure the entry.

No serving scaling in V1.
Show original servings.

---

## 26. Recipe Notes and Photos

### Notes

- Optional.
- Always private.
- Never shareable.

### Photos

- Optional.
- One primary recipe photo.
- Secondary to recipe content.
- Recipe UI must work perfectly without a photo.

---

## 27. Recipe Shopping List

Shopping lists are recipe-specific.

- Generate from one recipe.
- No persistent global combined shopping list.
- Duplicate ingredients should be combined reliably.
- Group items by grocery-store section.
- The list may persist temporarily.
- Checking an item marks it completed.
- Completed items do not move to another section.

No serving scaling in V1.

---

## 28. Recipe Sharing

**Recipe sharing is removed from V1.**

Recipes remain private.

Do not build:
- Recipe share links.
- Recipe public pages.
- Recipe social sharing.
- Recipe share previews.
- Recipe Share Sheet workflow.
- Recipe public snapshots.

Recipe source information remains private.

---

## 29. Restaurant Review Sharing

Restaurant review sharing is the only sharing feature in V1.

The goal is simple sharing, not a complicated publishing system.

### Shared content

A shared review is a polished standalone Metro Eats review page/card for **one specific restaurant visit**.

It does not expose the restaurant's accumulated history.

Sharing controls:
- Overall visit score — included.
- Category score breakdown — included by default; can be turned off as a group.
- What I Ordered — excluded by default; can be turned on as a group.
- One selected restaurant photo — excluded by default; can be turned on.
- Would Return? — included by default; can be turned off.

Everything else remains private.

### Never share

- Visit date/time.
- Restaurant address.
- Price/cost.
- Server name.
- Seating/location.
- Special occasion.
- Receipt or receipt photo.
- Private visit notes/comments.
- Individual item scores.
- Item Would Order Again?
- Drinks.
- Drinks & Bar score in the shared category breakdown.
- External ratings.
- Other restaurant information not explicitly approved.

General rule:

**Any restaurant-visit data not explicitly included in the approved sharing format is private and never shared.**

### Shared review layout

1. Prominent Metro Eats logo/branding.
2. Restaurant name.
3. Specific visit score.
4. Category score breakdown.
5. Would Return?
6. What I Ordered, if enabled.
7. Photo, if enabled.

Use the same Metro Eats visual score treatment as the private app.

Include a subtle:
**A personal review from Metro Eats**

The shared page is a focused review card/page, not a copy of the full restaurant page.

### Sharing flow

- Tap Share.
- Immediately open the normal iPhone Share Sheet.
- Share a polished Metro Eats review page/link.
- Recipient does not need a Metro Eats account.
- Links are public-but-unlisted.
- Shared pages are not intended to be indexed by search engines.
- Use non-guessable share identifiers.
- Shared page should include polished social-preview metadata.
- Preview image: selected review photo when one exists; otherwise Metro Eats branding.
- Social title:
  `My Metro Eats Review: [Restaurant Name] — [Score]/10`

### Shared review updates

Shared restaurant reviews mirror the current underlying review:
- Edited score updates.
- Edited category scores update.
- Edited Would Return? updates.
- Edited What I Ordered updates.
- Replaced/removed selected photo updates.
- Deleted review disables the shared link.
- Deleted restaurant disables associated shared links.

### Revoking

- `Stop Sharing` is available.
- It immediately disables the shared link.
- No confirmation is required.
- The old link shows:
  `This review is no longer available`
- Shared links remain active indefinitely until revoked or until the underlying review/restaurant is deleted.

Do not over-engineer V1 with:
- Share-version history.
- Recipe sharing infrastructure.
- Complicated link-management dashboards.
- Passwords.
- Expiration settings.
- Follower systems.

---

## 30. Privacy

Everything is private by default.

This includes:
- Restaurants.
- Visits.
- Scores.
- Meals.
- Items.
- Item ratings.
- Drinks.
- Spending.
- Notes.
- Photos.
- Receipts.
- Recipes.
- Recipe sources.
- Insights.
- Personal history.
- Backup/export data.

Nothing becomes public unless the user explicitly chooses to share an approved restaurant review.

The product should be privacy-first even if expanded later.

Basic security is sufficient for V1.
Do not add a separate PIN/Face ID layer unless separately approved.

---

## 31. Offline and Recovery

Metro Eats should be offline-capable for essential personal use.

When offline:
- Allow the user to capture necessary review information.
- Save personal data locally.
- Do not block core review entry because external restaurant data is unavailable.

When online again:
- Retrieve missing external restaurant/menu/public information where reliable.
- Allow the user to review/edit autofilled fields.
- Never change personal scores because external information arrived later.

Principle:
**Capture what matters now; complete external information later.**

---

## 32. Backup and Migration

Backup/recovery is important but must not slow normal use.

Preferred direction:
- Automatic background backup where practical.
- Manual export.
- Normal device/iCloud backup remains useful.
- Metro Eats provides its own transferable export/backup.
- New iPhone migration must preserve:
  - Restaurants.
  - Visits.
  - Scores.
  - Meals/items.
  - Recipes.
  - Notes.
  - Photos.
  - Other personal data.

V1 is device-first.
Active cross-device synchronization is deferred.

Architecture should allow future sync without a complete rebuild.

Free/low-cost infrastructure is preferred for V1. Do not introduce recurring developer costs without explicit approval.

---

## 33. Resume / Interrupted Work

Normally open to Home.

If there is an unfinished:
- Restaurant review.
- Recipe edit.
- Other meaningful task.

offer:
**Resume Where You Left Off**

Do not interrupt the normal Home experience when there is no unfinished task.

---

## 34. Notifications

No notifications in V1.

Do not add:
- Push reminders.
- Nagging.
- Marketing notifications.
- Review reminders.

---

## 35. AI and Intelligent Assistance

AI is allowed but should be quiet and useful.

Good uses:
- Recipe extraction/cleanup.
- Restaurant data cleanup.
- Cuisine/category classification.
- Insights.
- Background data organization.
- Occasional highly relevant contextual suggestions based on the user's own history.

Do not build:
- Constant AI chat.
- AI pop-ups.
- Generic recommendation feeds.
- Traditional recommendation engines.
- AI that changes scores.

Principle:
**AI should work in the background and get out of the way.**

Recommendations must be:
- Subtle.
- Clearly grounded in user data.
- Optional.
- Never allowed to influence the user's recorded score.

---

## 36. Data Integrity

User-entered personal data is authoritative.

Never:
- Invent scores.
- Guess user notes.
- Fabricate menu items.
- Silently change historical records.
- Replace old personal item history because a menu changed.
- Let outside ratings alter personal scores.
- Let awards alter personal scores.
- Let AI alter personal scores.

When uncertain:
- Ask if materially important.
- Otherwise leave blank.
- Allow later correction.

---

## 37. V1 Scope

### Core V1

- Home.
- My Restaurants.
- My Recipes.
- My Insights.
- Universal search.
- Restaurant location/name discovery.
- Restaurant data enrichment.
- Restaurant visit journal.
- Fast review entry.
- 1–10 scoring.
- Item scoring.
- Drink scoring.
- Restaurant history.
- Places I Want to Visit.
- External rating comparison.
- Local food news.
- Recipe creation/editing.
- Recipe URL/text/share-sheet import.
- Recipe cleanup.
- Recipe source tracking.
- Recipe shopping lists.
- Insights.
- Offline capture.
- Backup/export.
- Restaurant review sharing only.

### Explicitly out of V1

- Recipe sharing.
- Active cross-device sync.
- Voice entry.
- Push notifications.
- Separate PIN/Face ID lock.
- Serving scaling.
- Persistent global shopping list.
- Traditional recommendation engine.
- Public profiles/followers.
- Public restaurant database/community reviews.
- Complex sharing/version-history infrastructure.

---

## 38. Open Technical Decisions

Do not invent answers where the product specification intentionally leaves implementation choices open.

Examples:
- Exact technical stack.
- Exact local storage/database implementation.
- Exact backup/export format.
- Exact external restaurant-data providers.
- Exact news-source implementation.
- Exact score visualization graphics.
- Exact animation/microinteraction details.
- Exact category-inference algorithm.
- Exact responsive desktop layout.

Resolve these during technical design based on:
- Reliability.
- Cost.
- Performance.
- Privacy.
- Maintainability.
- Ease of deployment.
- Compatibility with the user's workflow.

---

## 39. Quality / Verification Before Delivery

Before delivering a replacement ZIP, verify at minimum:

1. Home loads correctly.
2. iPhone safe-area behavior works.
3. Add/edit/save recipe.
4. Recipe category/subcategory selection.
5. Paste recipe.
6. Website recipe import.
7. Restaurant name search.
8. Current-location restaurant search.
9. Restaurant selection/autofill.
10. Review entry and review summary.
11. Menu/website links.
12. Local news section.
13. Places I Want to Visit.
14. Restaurant sharing.
15. Offline capture where implemented.
16. Backup/export where implemented.
17. Delete confirmations.
18. Shared-review privacy boundaries.

Fix errors instead of hiding them.

Do not add features merely because they seem useful.
Keep approved scope.

Preserve working features when making unrelated changes.

When replacing files, make sure the ZIP contains the complete app, not only changed files.

---

## 40. Final Product Test

Before considering a feature complete, ask:

1. Does this make the user's food journal easier to use?
2. Does it reduce manual work?
3. Does it protect personal data by default?
4. Does it keep new reviews unbiased?
5. Does it avoid unnecessary UI clutter?
6. Does it work well on an iPhone?
7. Does it preserve accessibility and readability?
8. Does it respect historical personal data?
9. Does it avoid inventing uncertain information?
10. Does it feel like a premium personal Metro Eats journal rather than a generic restaurant app?

If not, simplify the feature before adding more complexity.


---

## 41. Modular Architecture and Regression Safety

Metro Eats 2.0 must be built as a deliberately compartmentalized application.

### Module boundaries

Core areas should be separated into independently maintainable modules/features wherever practical, including:

- Home
- Restaurant discovery/search
- Restaurant data
- Restaurant visits/reviews
- Items and drinks
- Places I Want to Visit
- Recipes
- Recipe importing/extraction
- Recipe shopping lists
- Insights
- Local news
- Restaurant review sharing
- Settings
- Local storage/data layer
- External data services
- Backup/export

A change to one module should not require changes to unrelated modules unless there is a genuine shared dependency.

### Separation of concerns

Where practical, keep these concerns separate:

- UI/presentation.
- Feature/business logic.
- Data models.
- Local persistence/storage.
- External API/data providers.
- Shared utilities.
- Shared UI components.

Do not create a tightly coupled application where a small feature change requires editing a large number of unrelated files.

Avoid a single monolithic application file. Prefer small, clearly named, independently testable modules.

Shared components and utilities should be centralized intentionally rather than duplicated throughout the application.

### Minimize blast radius

Every implementation should aim for the smallest reasonable blast radius.

Before changing a shared component, determine:
- Which features use it.
- Whether the proposed change is truly shared.
- Whether a feature-specific component would be safer.

Do not modify shared behavior simply to solve a problem that belongs to one feature.

---

## 42. Mandatory Fix → Diagnose → Regression Workflow

Every meaningful bug fix or functional change must go through a verification cycle before it is presented for user review.

Required workflow:

**Fix → Build → Diagnose → Test affected area → Run regression checks → Review**

A change is not considered complete merely because the original problem appears fixed.

### Step 1 — Fix

Implement the smallest appropriate change.

Avoid unrelated cleanup or refactoring during a focused bug fix unless it is necessary for the fix.

### Step 2 — Build

Run the appropriate build/validation process.

Confirm:
- The application builds successfully.
- Required assets/modules resolve.
- No new build errors are introduced.

### Step 3 — Diagnose

Run a technical diagnosis after the fix.

Check for:
- JavaScript/runtime errors.
- Console errors.
- Unhandled exceptions.
- Failed imports.
- Broken dependencies.
- Failed network/API requests.
- Data/storage errors.
- Routing/navigation errors.
- Broken event handlers.
- CSS/layout errors.
- iPhone safe-area regressions.
- Unexpected warnings that indicate a real functional problem.

Do not simply suppress or hide errors to make a diagnosis appear clean.

### Step 4 — Test the affected area

Exercise the feature that was changed.

Verify the complete relevant flow rather than only the individual button/control that was modified.

### Step 5 — Run regression checks

Check adjacent functionality and then the appropriate broader application regression suite.

At minimum, verify that the change has not broken:
- Home.
- Navigation.
- Data persistence.
- Restaurant flows.
- Recipe flows.
- Insights.
- Sharing.
- Search.
- Mobile layout.

For a change touching shared infrastructure, navigation, storage, global CSS, or shared components, run the **full application regression suite**.

### Step 6 — Review

Only after the diagnosis and regression checks pass should the change be presented to the user for review.

The user should not be asked to discover obvious regressions that could have been caught by the development process.

---

## 43. Regression Severity and Scope

Not every change requires identical testing depth.

### Feature-local change

Example:
- Recipe editor layout change.

Required:
- Full recipe-editor flow.
- Recipe save/load/edit.
- Relevant mobile layout checks.
- Adjacent recipe functionality.
- Basic Home/navigation smoke test.

### Shared-component change

Example:
- Global modal.
- Shared score component.
- Shared navigation.
- Shared data model.

Required:
- Full application regression suite.

### Infrastructure/data/storage change

Example:
- Local database migration.
- Persistence layer.
- Backup/export format.
- Shared API/data service.

Required:
- Full application regression suite.
- Existing-data compatibility checks.
- Save/load/edit/delete verification.
- Recovery/backup checks where applicable.

### Global visual/CSS change

Required:
- Full application regression suite.
- iPhone portrait.
- iPhone landscape where practical.
- Safe-area checks.
- Major forms/modals.
- Home.
- Restaurant flows.
- Recipe flows.
- Insights.
- Shared review page.

---

## 44. Regression Checklist

Maintain a repeatable regression checklist for Metro Eats 2.0.

At minimum:

### Core
- [ ] App starts.
- [ ] Home loads.
- [ ] Navigation works.
- [ ] Universal Search works.
- [ ] Settings opens.

### Restaurants
- [ ] Current-location search.
- [ ] Restaurant name search.
- [ ] Progressive search expansion.
- [ ] Restaurant selection.
- [ ] Restaurant data autofill.
- [ ] Official website/menu link.
- [ ] Restaurant page.
- [ ] New visit.
- [ ] Review save.
- [ ] Review results.
- [ ] Review edit.
- [ ] Review delete.
- [ ] Restaurant aggregate recalculation.
- [ ] Item ratings.
- [ ] Drink handling.
- [ ] Places I Want to Visit.
- [ ] External rating separation.

### Recipes
- [ ] Recipe list.
- [ ] Category/subcategory.
- [ ] Manual recipe.
- [ ] Paste recipe.
- [ ] URL import.
- [ ] Share-sheet import where implemented.
- [ ] Ingredient cleanup.
- [ ] Directions cleanup.
- [ ] Recipe edit.
- [ ] Recipe save.
- [ ] Unsaved-change protection.
- [ ] Recipe delete.
- [ ] Recipe photo.
- [ ] Source attribution.
- [ ] Shopping list.

### Insights
- [ ] Overview.
- [ ] Restaurants.
- [ ] Food.
- [ ] Trends.
- [ ] Score calculations.
- [ ] Historical data.
- [ ] Visualizations.

### Sharing
- [ ] Share a restaurant review.
- [ ] Correct visit-specific score.
- [ ] Correct category breakdown.
- [ ] What I Ordered toggle.
- [ ] Photo toggle.
- [ ] Would Return toggle.
- [ ] Privacy exclusions.
- [ ] Shared page opens without account.
- [ ] Social preview metadata.
- [ ] Edit underlying review updates shared page.
- [ ] Stop Sharing disables link.
- [ ] Deleted review disables link.

### Home / News
- [ ] Food news loads.
- [ ] Maximum 10 stories.
- [ ] Source links work.
- [ ] No fabricated fallback content.
- [ ] Recent visits display correctly.

### Mobile
- [ ] Dynamic Island/status-bar safe area.
- [ ] Home indicator safe area.
- [ ] No excessive blank margins.
- [ ] Touch targets.
- [ ] Text readability.
- [ ] Accessibility scaling.
- [ ] No color-only information.

### Offline / Data
- [ ] Essential review capture offline.
- [ ] Local save.
- [ ] Reopening preserves data.
- [ ] External information can arrive later.
- [ ] External information cannot overwrite personal scores.
- [ ] Export.
- [ ] Import/recovery where implemented.

---

## 45. Change Discipline

When implementing an approved change:

1. Identify the owning module.
2. Identify dependencies.
3. Make the smallest reasonable change.
4. Avoid unrelated refactoring.
5. Build.
6. Diagnose.
7. Test the affected flow.
8. Run the required regression scope.
9. Record the verified result in the checkpoint.
10. Only then present the result for user review.

If a change unexpectedly requires modifying many unrelated modules, stop and reassess the architecture rather than continuing to spread the change.

If repeated fixes to one feature routinely break another feature, treat that as an architectural defect to be corrected rather than normal development behavior.

---

## 46. Checkpoint Requirements

After meaningful development milestones, record:

- Current approved build/state.
- Git commit/hash.
- ZIP/backup location when applicable.
- What was completed.
- What remains.
- Known issues.
- Last regression diagnosis result.
- Any intentionally deferred problems.

Never claim a checkpoint is current unless the underlying files/build/commit were actually verified.

The checkpoint should make it possible to resume development in a new chat without reconstructing the project's history from memory.