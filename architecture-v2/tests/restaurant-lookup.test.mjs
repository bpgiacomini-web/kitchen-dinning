import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRestaurantLookup, searchNearbyRestaurants, searchRestaurantNames } from "../src/domain/restaurant-lookup.mjs";

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

test("known Metro East restaurant matches fill official websites when the map listing omits them", () => {
  const places = normalizeRestaurantLookup([
    feature("Fast Eddie's Bon Air", { amenity: "bar", website: "" }),
    feature("Ropers Regal Beagle", { website: "" })
  ], { lat: 38.89, lon: -90.18 });
  assert.equal(places[0].website, "https://fasteddiesbonair.com/");
  assert.equal(places[1].website, "https://www.ropersregalbeagle.com/");
});

test("restaurant name lookup queries OpenStreetMap and sorts exact matches first", async () => {
  let requested;
  const fetcher = async (url, options) => {
    requested = { url, body: JSON.parse(options.body) };
    return { ok: true, json: async () => ({ location: { lat: 38.89, lon: -90.18, source: "network" }, features: [
      feature("Olive Garden - Nearby", { coordinates: [-90.17, 38.89] }),
      feature("Olive Garden", { coordinates: [-90.19, 38.89] }),
      feature("Office Building", { amenity: "office" })
    ] }) };
  };
  const { places, location } = await searchRestaurantNames("Olive Garden", { location: { lat: 38.89, lon: -90.18 }, fetcher });
  assert.equal(requested.url, "/api/restaurant-lookup");
  assert.equal(requested.body.query, "Olive Garden");
  assert.deepEqual(location, { lat: 38.89, lon: -90.18, source: "network" });
  assert.equal(places[0].name, "Olive Garden");
  assert.equal(places.length, 2);
});

test("restaurant name lookup returns matches without location and reports service failures", async () => {
  const { places } = await searchRestaurantNames("Main Street", { fetcher: async () => ({ ok: true, json: async () => ({ location: null, features: [feature("Main Street Diner")] }) }) });
  assert.equal(places.length, 1);
  assert.equal(places[0].name, "Main Street Diner");
  await assert.rejects(searchRestaurantNames("Main Street", { fetcher: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
});

test("name search drops distant results that would mislead local selection", async () => {
  const { places } = await searchRestaurantNames("Fast Eddie", { fetcher: async () => ({ ok: true, json: async () => ({
    location: { lat: 38.89, lon: -90.18, city: "Alton", source: "network" },
    features: [feature("Fast Eddie's", { coordinates: [-117.4, 47.7] }), feature("Fast Eddie's", { coordinates: [-90.18, 38.89] })]
  }) }) });
  assert.equal(places.length, 1);
  assert.equal(places[0].name, "Fast Eddie's");
  assert.equal(places[0].distance, 0);
});

test("name search prioritizes the closest result over an exact but farther duplicate", async () => {
  const { places } = await searchRestaurantNames("Fast Eddie's", { fetcher: async () => ({ ok: true, json: async () => ({
    location: { lat: 38.89, lon: -90.18, city: "Alton", source: "network" },
    features: [feature("Fast Eddie's", { coordinates: [-90.28, 38.89] }), feature("Fast Eddie's Bon Air", { coordinates: [-90.16, 38.89] })]
  }) }) });
  assert.equal(places[0].name, "Fast Eddie's Bon Air");
});

test("name search hides distant exact-name results when location is known", async () => {
  const { places } = await searchRestaurantNames("Regal Beagle", { fetcher: async () => ({ ok: true, json: async () => ({
    location: { lat: 34.05, lon: -118.24, city: "Los Angeles", source: "network" },
    features: [feature("Ropers Regal Beagle", { coordinates: [-90.19, 38.93] }), feature("The Regal", { coordinates: [-118.2, 34.05] })]
  }) }) });
  assert.equal(places.length, 0);
});

test("nearby lookup uses the same-origin API and reports the resolved location", async () => {
  let body;
  const result = await searchNearbyRestaurants({ fetcher: async (url, options) => {
    body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ places: [{ name: "Local Cafe" }], location: { lat: 38.89, lon: -90.18, city: "Alton", source: "network" } }) };
  } });
  assert.equal(body.mode, "nearby");
  assert.deepEqual(result.location, { lat: 38.89, lon: -90.18, city: "Alton", source: "network" });
  assert.equal(result.places[0].name, "Local Cafe");
});
