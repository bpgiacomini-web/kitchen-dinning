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

## Recipe URL importer — current review

The isolated `/api/import-recipe-v2` endpoint is POST-only and returns extracted fields without writing data. Its fetcher rejects non-HTTP(S), credentials, nonstandard ports, IP literals, local hostnames, and resolved non-public IPv4 addresses; revalidates each redirect; pins the selected public IPv4 address for the request; limits redirects, response type, response size, and request duration; and avoids logging the supplied URL or page body.

Automated tests now exercise redirect-to-localhost rejection, redirect limits, address pinning, oversized-response reason propagation, timeout/DNS failure propagation, and recipe-specific field extraction. These use an injected request/resolver for deterministic tests; they are **not** a real-network or deployed-runtime integration test.

Remaining release gates:
- Verify the actual Node/Vercel runtime's HTTPS/TLS and DNS lookup behavior with safe external test pages.
- Test the known recipe URLs and confirm each page's structured data works.
- Add reliable platform-level rate limiting before broad public exposure; an in-memory serverless counter would not be a reliable control.
- Review the deployment's request-body parser limits and endpoint observability.
- Do not treat URL-fetch checks as a substitute for authentication and authorization on data writes.
