# Metro Eats — Recovery / Restaurant Search Fix Build

This is a recovery/test build based on the last Metro Eats/Kitchen to Dining source available in the project files. It is **not claimed to be the latest live build** because the newer source could not be recovered from GitHub.

## Restaurant search fix
- Debounced name search (450 ms)
- Works with or without location
- Current-location ranking and progressive 2 / 5 / 15 / 30 mile search attempts
- Name normalization for punctuation such as Joe's / Joes / Joe’s
- Exact/strong name matches rank before distance
- Multiple providers: Nominatim with Photon fallback
- Hard 5-second provider timeout
- Stale requests are aborted/ignored
- User must explicitly select a result
- Address shown to the user is street, city, state only
- Selection stores coordinates internally and official website when available
- Manual entry remains available if lookup fails

## Test case
Try `Gentlin's`, then `Gentlins`, then a partial name. The search should either return results or end with a clear error/manual-entry message; it must never spin forever.
