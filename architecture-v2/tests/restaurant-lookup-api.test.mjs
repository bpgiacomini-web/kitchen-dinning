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
    return { ok: true, json: async () => ({ features: [{ properties: { name: "Fast Eddie's", osm_key: "amenity", osm_value: "restaurant" }, geometry: { coordinates: [-90.18, 38.89] } }] }) };
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

test("known local restaurants remain searchable if Photon is unavailable", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("Photon unavailable"); } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "Delmar Public House" }, headers: {
    "x-vercel-ip-latitude": "38.93", "x-vercel-ip-longitude": "-90.24", "x-vercel-ip-city": "Godfrey"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.features.some(feature => feature.properties.name === "Delmar Public House"));
  assert.deepEqual(res.body.features.find(feature => feature.properties.name === "Delmar Public House").geometry.coordinates, [-90.24966, 38.93839]);
});

test("name lookup falls back to nearby OSM places when Photon has no match", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    const request = new URL(url);
    if (request.hostname === "photon.komoot.io") return { ok: true, json: async () => ({ features: [] }) };
    return { ok: true, json: async () => ({ elements: [
      { type: "node", lat: 38.89, lon: -90.18, tags: { name: "Mac's Downtown", amenity: "restaurant", "addr:city": "Alton", "contact:website": "https://macsdowntown.com/" } },
      { type: "node", lat: 38.92, lon: -90.19, tags: { name: "Roper's Regal Beagle", amenity: "restaurant", "addr:city": "Godfrey", website: "https://www.ropersregalbeagle.com/" } },
      { type: "node", lat: 38.90, lon: -90.18, tags: { name: "Other Cafe", amenity: "cafe" } }
    ] }) };
  } });

  for (const [query, expected] of [["Mac's Downtown", "Mac's Downtown"], ["Roper's Regal Beagle", "Roper's Regal Beagle"]]) {
    const res = responseRecorder();
    await handler({ method: "POST", body: { mode: "name", query }, headers: {
      "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
    } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.features.some(feature => feature.properties.name === expected));
    assert.ok(!res.body.features.some(feature => feature.properties.name === "Other Cafe"));
  }
});

test("name lookup uses the nearby fallback when Photon only finds a distant duplicate", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    const request = new URL(url);
    if (request.hostname === "photon.komoot.io") return { ok: true, json: async () => ({ features: [{
      type: "Feature",
      properties: { name: "Mac's Downtown", osm_key: "amenity", osm_value: "restaurant" },
      geometry: { type: "Point", coordinates: [-117.4, 47.7] }
    }] }) };
    return { ok: true, json: async () => ({ elements: [
      { type: "node", lat: 38.89, lon: -90.18, tags: { name: "Mac's Downtown", amenity: "restaurant", "addr:city": "Alton" } }
    ] }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "Mac's Downtown" }, headers: {
    "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.features.length, 2);
  assert.deepEqual(res.body.features[1].geometry.coordinates, [-90.18, 38.89]);
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
  assert.deepEqual(res.body.places.map(place => place.name), ["Nearby Cafe", "Arandas MX Cocina"]);
  assert.equal(res.body.places[0].distance, 1112);
  assert.equal(res.body.location.source, "network");
});

test("nearby results omit concessions and closed Chic N Pig, and add current local restaurants", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    const request = new URL(url);
    if (request.hostname === "photon.komoot.io") return { ok: true, json: async () => ({ features: [
      { properties: { name: "Concession Stand", osm_key: "amenity", osm_value: "fast_food" }, geometry: { coordinates: [-90.191, 38.935] } },
      { properties: { name: "Chic N Pig", osm_key: "amenity", osm_value: "restaurant" }, geometry: { coordinates: [-90.1923, 38.935] } },
      { properties: { name: "Nearby Cafe", osm_key: "amenity", osm_value: "cafe" }, geometry: { coordinates: [-90.193, 38.935] } },
    ] }) };
    throw new Error("unexpected lookup fallback");
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby", location: { lat: 38.935, lon: -90.193 } }, headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.places.map(place => place.name), ["Nearby Cafe", "Arandas MX Cocina", "Delmar Public House"]);
  assert.equal(res.body.places[1].website, "https://arandasmxcocina.com/");
  assert.equal(res.body.places[2].website, "https://delmarpublichouse.com/");
});

test("nearby lookup uses curated local restaurants when Photon and Overpass are unavailable", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("map provider unavailable"); } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby", location: { lat: 38.935, lon: -90.193 } }, headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, "curated-fallback");
  assert.deepEqual(res.body.places.map(place => place.name), ["Arandas MX Cocina", "Delmar Public House"]);
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
