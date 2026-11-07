import test from "node:test";
import assert from "node:assert/strict";
import { createRestaurantLookupHandler } from "../../api/restaurant-lookup.js";

function responseRecorder() {
  return {
    headers: {}, body: undefined, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test("same-origin name lookup applies Vercel's approximate location as a search bias", async () => {
  let requested;
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    requested = new URL(url);
    return { ok: true, json: async () => ({ features: [{ properties: { name: "Fast Eddie's" } }] }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "Fast Eddie" }, headers: {
    "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(requested.searchParams.get("lat"), "38.89");
  assert.equal(requested.searchParams.get("lon"), "-90.18");
  assert.equal(requested.searchParams.get("location_bias_scale"), "0.1");
  assert.deepEqual(res.body.location, { lat: 38.89, lon: -90.18, city: "Alton", region: "", source: "network" });
  assert.equal(res.headers["Cache-Control"], "no-store, max-age=0");
});

test("nearby lookup falls back to approximate network location and returns closest food places", async () => {
  let requested;
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    requested = new URL(url);
    return { ok: true, json: async () => ({ elements: [
      { type: "node", lat: 38.90, lon: -90.18, tags: { name: "Nearby Cafe", amenity: "cafe", cuisine: "coffee_shop" } },
      { type: "node", lat: 38.89, lon: -90.18, tags: { name: "Nearby Fuel", amenity: "fuel" } }
    ] }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby" }, headers: {
    "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(requested.searchParams.get("data"), /around:8047,38\.89,-90\.18/);
  assert.deepEqual(res.body.places.map(place => place.name), ["Nearby Cafe"]);
  assert.equal(res.body.places[0].distance, 1112);
  assert.equal(res.body.location.source, "network");
});

test("nearby search fails clearly when neither device nor network location exists", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("should not fetch"); } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby" }, headers: {} }, res);
  assert.equal(res.statusCode, 422);
  assert.match(res.body.error, /location are unavailable/i);
});

test("restaurant lookup accepts only POST and rejects malformed name searches", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("should not fetch"); } });
  const wrongMethod = responseRecorder();
  await handler({ method: "GET", headers: {} }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(wrongMethod.headers.Allow, "POST");
  const badQuery = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "x" }, headers: {} }, badQuery);
  assert.equal(badQuery.statusCode, 400);
});
