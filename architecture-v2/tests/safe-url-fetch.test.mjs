import test from "node:test";
import assert from "node:assert/strict";
import { validateRecipeUrl, resolvePublicIPv4, MAX_RESPONSE_BYTES, MAX_REDIRECTS } from "../src/features/recipes/safe-url-fetch.mjs";

test("only public HTTP(S) URLs on standard ports are accepted", () => {
  assert.equal(validateRecipeUrl("https://example.com/recipe").hostname, "example.com");
  assert.throws(() => validateRecipeUrl("file:///etc/passwd"));
  assert.throws(() => validateRecipeUrl("https://user:pass@example.com/"));
  assert.throws(() => validateRecipeUrl("https://example.com:8443/"));
  assert.throws(() => validateRecipeUrl("http://127.0.0.1/"));
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
