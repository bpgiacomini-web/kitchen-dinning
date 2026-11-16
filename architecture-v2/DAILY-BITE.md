# The Daily Bite — free preview foundation

Checkpoint: feature/restaurant-master-profiles, building on d4d3508.
The user approved a smaller verified Preview collection first, followed by expansion toward 90 entries. Production requires a separate approval.

## Delivery

- Shared, read-only JSON at `content/daily-bites.json`; 14 original sourced stories scheduled November 16–29, 2026.
- Home card between Dinner Pick and Local Food News; expandable body and direct source attribution.
- Archive with date ordering, keyword search and category filtering. Only approved entries whose regional date has arrived appear.
- Region configuration includes an identifier and IANA time zone. Initial region: Greater St. Louis / Metro East, America/Chicago.
- Date selection and an active-page midnight timer respect daylight saving time; visibility/focus checks catch suspended devices. Clock uses the device's current time, interpreted in the configured regional zone.
- Expired reserve displays the latest actual story and its original date, labeled Latest bite. Empty/failed content never blocks the rest of Home; failure offers Retry.
- No journal, authentication, storage or database changes. No AI API, image downloads, cron, paid service, new dependency or paid-plan upgrade.

## Editorial workflow

Research credible sources, write an original summary/body, record source name and URL, set verifiedAt, normalized primarySubject, subjectTags and a unique claimKey, then approve and schedule a date. Keep published entries permanently; correct them in place rather than recycling their date or identifier. Disputed history must be described as disputed. Brand histories are attributed to the company. This starter collection uses text only.

Run `node scripts/check-daily-bites.mjs` before publishing. CI runs it too. It rejects repeated IDs, region/date slots, fact keys, exact content and primary subjects scheduled within 90 days (unless an explicit editorial repeat approval is recorded). A free token-similarity screen warns about possible paraphrases. This assists manual review; it does not provide full semantic verification. Editors must also compare the actual factual claims across the permanent catalog. No external embedding service is used.

The validator reports the approved future reserve and warns below 30. This is a CI/editorial warning, not an email notification service. The 14-entry Preview intentionally starts below that target. Expand toward 90 distinct sourced entries and a 30-entry future reserve before a full release. Replenishment is an editorial batch committed to the repository, not unattended generated content. Do not promise unlimited fresh content without replenishing the schedule.

Scheduled text is publicly fetchable as a static asset, though the UI hides future/draft entries. Do not put confidential drafts or private notes in this file. There is no browser editing endpoint. Only repository-authorized processes can change published assets. A future private editorial CMS can use Neon if justified; it is unnecessary for this free starter.

## Verification

Domain tests cover winter/summer midnight, 23/25-hour days, future/draft exclusion, exhausted reserve, empty/unknown regions and duplicate protection. Browser checks cover expansion, attribution, archive search, Back navigation, responsive layout and failure isolation. Full existing release tests remain required. Existing Hobby/static hosting infrastructure is reused; no new billable integration was added. Normal existing hosting quotas still apply.

Deferred: 90-entry library expansion, trivia, favorites, share links, private administrator UI, automated replenishment, administrator notifications and additional region selection. Do not add paid infrastructure for these without explicit approval.
