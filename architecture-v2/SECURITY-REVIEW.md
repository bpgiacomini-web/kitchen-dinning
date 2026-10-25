# Security review — initial source-level findings

This is a source-level review, not a penetration test.

## High priority: shared data endpoint
The existing `api/data.js` accepts GET and PUT and uses a server-side Vercel Blob token, but no request-level authentication or per-user ownership enforcement was found in the reviewed source. If the endpoint is publicly reachable, callers may be able to read or replace the shared dataset.

## Required before multi-user release
- Add server-verified authentication; never trust a client-supplied user ID.
- Authorize every read/write against the authenticated user's dataset.
- Validate field types, size limits, nested objects, and allowed fields server-side.
- Add optimistic concurrency/version checks so stale clients cannot silently overwrite newer data.
- Rate-limit expensive operations and recipe import; keep URL-fetch protections and request timeouts.
- Ensure logs do not include private recipe/review content or credentials.
- Add tests for unauthenticated, cross-user, malformed, oversized, and stale-write requests.

Do not embed a shared secret in browser JavaScript. Do not consider the current endpoint safe for multi-user private data until the controls above are implemented and tested.
