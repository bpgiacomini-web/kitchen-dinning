import test from "node:test";
import assert from "node:assert/strict";
import { createImportRecipeHandler } from "../../api/import-recipe-v2.js";

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test("recipe URL import requires an authenticated session", async () => {
  let fetchCalled = false;
  const handler = createImportRecipeHandler({
    isAuthenticated: async () => false,
    fetchPage: async () => { fetchCalled = true; }
  });
  const res = responseRecorder();
  await handler({ method: "POST", headers: {}, body: { url: "https://example.com/recipe" } }, res);
  assert.equal(res.statusCode, 401);
  assert.match(res.body.error, /Sign in/);
  assert.equal(fetchCalled, false);
});

test("recipe URL import returns reviewed fields and a cleaned final source without saving", async () => {
  let requestedUrl = "";
  const html = `<script type="application/ld+json">${JSON.stringify({
    "@type": "Recipe",
    name: "Tomato Soup",
    recipeIngredient: ["2 tomatoes", "1 cup stock"],
    recipeInstructions: [{ "@type": "HowToStep", text: "Simmer until soft." }],
    url: "javascript:alert(1)"
  })}</script>`;
  const handler = createImportRecipeHandler({
    isAuthenticated: async () => true,
    fetchPage: async url => {
      requestedUrl = url;
      return { body: html, contentType: "text/html; charset=utf-8", finalUrl: "https://example.com/soup?utm_source=metro#recipe" };
    }
  });
  const res = responseRecorder();
  await handler({ method: "POST", headers: {}, body: { url: " https://example.com/soup " } }, res);
  assert.equal(requestedUrl, "https://example.com/soup");
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.recipe.title, "Tomato Soup");
  assert.deepEqual(res.body.recipe.ingredients, ["2 tomatoes", "1 cup stock"]);
  assert.deepEqual(res.body.recipe.directions, ["Simmer until soft."]);
  assert.equal(res.body.recipe.source, "https://example.com/soup");
  assert.equal(res.body.recipe.extractionMethod, "Server-side recipe structured data");
  assert.equal(Object.hasOwn(res.body, "saved"), false);
});

test("recipe URL import rejects unsupported methods and oversized URL input", async () => {
  const handler = createImportRecipeHandler({ isAuthenticated: async () => true, fetchPage: async () => { throw new Error("unexpected fetch"); } });
  const methodResponse = responseRecorder();
  await handler({ method: "GET", headers: {}, body: {} }, methodResponse);
  assert.equal(methodResponse.statusCode, 405);
  assert.equal(methodResponse.headers.Allow, "POST");

  const inputResponse = responseRecorder();
  await handler({ method: "POST", headers: {}, body: { url: "x".repeat(2049) } }, inputResponse);
  assert.equal(inputResponse.statusCode, 400);
});

test("recipe URL import maps unsafe destination failures to a client error", async () => {
  const handler = createImportRecipeHandler({ isAuthenticated: async () => true, fetchPage: async () => { throw new Error("blocked_host"); } });
  const res = responseRecorder();
  await handler({ method: "POST", headers: {}, body: { url: "http://127.0.0.1/recipe" } }, res);
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /public recipe webpage/);
});
