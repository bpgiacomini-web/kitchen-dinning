import test from "node:test";
import assert from "node:assert/strict";
import { createPizzaLookupHandler } from "../../api/pizza-lookup.js";

function responseRecorder() {
  return { headers: {}, body: undefined, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

const authenticate = async () => ({ userId: "test-account" });
const limitRequests = async () => ({ allowed: true });

test("UPC lookup queries Open Food Facts and returns product brand and name", async () => {
  let requestedUrl;
  let requestedOptions;
  const handler = createPizzaLookupHandler({ authenticate, limitRequests, fetcher: async (url, options) => {
    requestedUrl = new URL(url);
    requestedOptions = options;
    return { ok: true, json: async () => ({ status: 1, product: { code: "0012345678905", brands: "Test Brand, Other Brand", product_name: "Pepperoni Rising Crust" } }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { upc: "0012345678905" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(requestedUrl.pathname, "/api/v2/product/0012345678905.json");
  assert.equal(requestedUrl.searchParams.get("fields"), "code,product_name,product_name_en,brands");
  assert.match(requestedOptions.headers["User-Agent"], /MetroEats/);
  assert.deepEqual(res.body.product, { upc: "0012345678905", brand: "Test Brand", name: "Pepperoni Rising Crust", source: "Open Food Facts" });
  assert.equal(res.headers["Cache-Control"], "no-store, max-age=0");
});

test("UPC lookup prefers English product names and reports unknown barcodes clearly", async () => {
  const handler = createPizzaLookupHandler({ authenticate, limitRequests, fetcher: async () => ({ ok: true, json: async () => ({ status: 0 }) }) });
  const unknown = responseRecorder();
  await handler({ method: "POST", body: { upc: "01234567" } }, unknown);
  assert.equal(unknown.statusCode, 404);
  assert.match(unknown.body.error, /enter the brand and pizza name yourself/i);
  const english = createPizzaLookupHandler({ authenticate, limitRequests, fetcher: async () => ({ ok: true, json: async () => ({ status: 1, product: { code: "01234567", brands: "Brand", product_name: "Nom français", product_name_en: "English name" } }) }) });
  const found = responseRecorder();
  await english({ method: "POST", body: { upc: "01234567" } }, found);
  assert.equal(found.body.product.name, "English name");
});

test("UPC lookup requires a valid barcode, authentication, and POST", async () => {
  const handler = createPizzaLookupHandler({ authenticate, limitRequests, fetcher: async () => { throw new Error("should not fetch"); } });
  const wrongMethod = responseRecorder();
  await handler({ method: "GET" }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(wrongMethod.headers.Allow, "POST");
  const invalid = responseRecorder();
  await handler({ method: "POST", body: { upc: "abc12345" } }, invalid);
  assert.equal(invalid.statusCode, 400);
  const unauthenticated = createPizzaLookupHandler({ authenticate: async () => ({ error: "Sign in required.", status: 401 }), limitRequests });
  const denied = responseRecorder();
  await unauthenticated({ method: "POST", body: { upc: "01234567" } }, denied);
  assert.equal(denied.statusCode, 401);
});

test("UPC lookup enforces per-account limits and handles upstream errors", async () => {
  const limited = createPizzaLookupHandler({ authenticate, limitRequests: async () => ({ allowed: false, retryAfterSeconds: 12 }), fetcher: async () => { throw new Error("should not fetch"); } });
  const limitedRes = responseRecorder();
  await limited({ method: "POST", body: { upc: "01234567" } }, limitedRes);
  assert.equal(limitedRes.statusCode, 429);
  assert.equal(limitedRes.headers["Retry-After"], "12");
  const failed = createPizzaLookupHandler({ authenticate, limitRequests, fetcher: async () => { throw new Error("network unavailable"); } });
  const failedRes = responseRecorder();
  await failed({ method: "POST", body: { upc: "01234567" } }, failedRes);
  assert.equal(failedRes.statusCode, 502);
  assert.match(failedRes.body.error, /temporarily unavailable/i);
});
