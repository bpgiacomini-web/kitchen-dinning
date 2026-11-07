import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRestaurantLookup, searchRestaurantNames } from "../src/domain/restaurant-lookup.mjs";

const feature = (name, { city = "Alton", street = "State Street", amenity = "restaurant", coordinates = [-90.18, 38.89], cuisine = "italian", website = "https://example.com" } = {}) => ({
  properties: { name, city, street, osm_key: "amenity", osm_value: amenity, extra: { cuisine, website } },
  geometry: { coordinates }
});

test("restaurant lookup normalizes food places and excludes non-food matches", () => {
  const places = normalizeRestaurantLookup([
    feature("Cafe Uno"), feature("Cafe Uno"), feature("Gas Station", { amenity: "fuel" })
  ], { lat: 38.89, lon: -90.18 });
  assert.equal(places.length, 1);
  assert.equal(places[0].name, "Cafe Uno");
  assert.equal(places[0].cuisine, "italian");
  assert.equal(places[0].address, "State Street, Alton");
  assert.equal(places[0].distance, 0);
});

test("restaurant name lookup queries OpenStreetMap and sorts exact matches first", async () => {
  let requested;
  const fetcher = async url => {
    requested = new URL(url);
    return { ok: true, json: async () => ({ features: [
      feature("Olive Garden - Nearby", { coordinates: [-90.17, 38.89] }),
      feature("Olive Garden", { coordinates: [-90.19, 38.89] }),
      feature("Office Building", { amenity: "office" })
    ] }) };
  };
  const places = await searchRestaurantNames("Olive Garden", { location: { lat: 38.89, lon: -90.18 }, fetcher });
  assert.equal(requested.searchParams.get("q"), "Olive Garden");
  assert.equal(requested.searchParams.get("lat"), "38.89");
  assert.equal(places[0].name, "Olive Garden");
  assert.equal(places.length, 2);
});

test("restaurant name lookup works without location and reports service failures", async () => {
  const results = await searchRestaurantNames("Main Street", { fetcher: async () => ({ ok: true, json: async () => ({ features: [] }) }) });
  assert.deepEqual(results, []);
  await assert.rejects(searchRestaurantNames("Main Street", { fetcher: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
});
