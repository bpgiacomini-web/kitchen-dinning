import test from "node:test";
import assert from "node:assert/strict";
import { validateRecipeUrl, resolvePublicIPv4, fetchPublicRecipePage, MAX_RESPONSE_BYTES, MAX_REDIRECTS } from "../src/features/recipes/safe-url-fetch.mjs";

test("only public HTTP(S) URLs on standard ports are accepted", () => {
  assert.equal(validateRecipeUrl("https://example.com/recipe").hostname, "example.com");
  assert.throws(() => validateRecipeUrl("file:///etc/passwd"));
  assert.throws(() => validateRecipeUrl("https://user:pass@example.com/"));
  assert.throws(() => validateRecipeUrl("https://example.com:8443/"));
  assert.throws(() => validateRecipeUrl("http://127.0.0.1/"));
  assert.throws(() => validateRecipeUrl("http://localhost./"));
  assert.throws(() => validateRecipeUrl("http://router.local/"));
  assert.throws(() => validateRecipeUrl("http://example.com:8080/"));
  assert.throws(() => validateRecipeUrl("http://[::1]/"));
});

test("local and special-use hostnames are rejected before network access", async () => {
  for (const host of ["localhost", "router.local", "127.0.0.1", "192.168.1.1"]) {
    await assert.rejects(resolvePublicIPv4(host));
  }
});

test("fetch guardrails have conservative caps", () => {
  assert.equal(MAX_RESPONSE_BYTES, 1_500_000);
  assert.equal(MAX_REDIRECTS, 3);
});

test("fetch pins resolved address and returns only a successfully fetched page", async () => {
  const seen = [];
  const result = await fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async host => { assert.equal(host, "example.com"); return "93.184.216.34"; },
    request: async (url, address) => {
      seen.push({ url: url.href, address });
      return { status: 200, contentType: "text/html; charset=utf-8", body: "<script type='application/ld+json'>{}</script>" };
    }
  });
  assert.deepEqual(seen, [{ url: "https://example.com/recipe", address: "93.184.216.34" }]);
  assert.equal(result.finalUrl, "https://example.com/recipe");
  assert.match(result.body, /application\/ld\+json/);
});

test("every redirect is revalidated before another DNS lookup or request", async () => {
  let requests = 0;
  let resolutions = 0;
  await assert.rejects(fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async () => { resolutions += 1; return "93.184.216.34"; },
    request: async () => { requests += 1; return { status: 302, location: "http://127.0.0.1/private", body: "" }; }
  }), /blocked_host/);
  assert.equal(requests, 1);
  assert.equal(resolutions, 1);
});

test("redirect limit and missing redirect target fail closed", async () => {
  let count = 0;
  await assert.rejects(fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async () => "93.184.216.34",
    request: async url => { count += 1; return { status: 302, location: url.pathname + "?again=" + count, body: "" }; }
  }), /too_many_redirects/);
  assert.equal(count, MAX_REDIRECTS + 1);
  await assert.rejects(fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async () => "93.184.216.34",
    request: async () => ({ status: 301, location: "", body: "" })
  }), /too_many_redirects/);
});

test("oversized response errors are preserved for the API's 413 response", async () => {
  await assert.rejects(fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async () => "93.184.216.34",
    request: async () => { throw new Error("response_too_large"); }
  }), /response_too_large/);
});

test("timeouts and DNS failures propagate as controlled reason codes", async () => {
  await assert.rejects(fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async () => { throw new Error("EAI_AGAIN"); }
  }), /EAI_AGAIN/);
  await assert.rejects(fetchPublicRecipePage("https://example.com/recipe", {
    resolveAddress: async () => "93.184.216.34",
    request: async () => { throw new Error("request_timeout"); }
  }), /request_timeout/);
});
