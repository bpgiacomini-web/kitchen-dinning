import test from "node:test";
import assert from "node:assert/strict";
import { restaurantDirectionsUrl, restaurantNavigationOptions } from "../src/domain/restaurant-directions.mjs";

test("uses Apple Maps directions for nearby restaurants on iPhone and iPad", () => {
  const url = new URL(restaurantDirectionsUrl({ name: "Roper's Regal Beagle", lat: 38.93, lon: -90.19 }, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"));
  assert.equal(url.hostname, "maps.apple.com");
  assert.equal(url.searchParams.get("daddr"), "38.93,-90.19");
  assert.equal(url.searchParams.get("q"), "Roper's Regal Beagle");
});

test("uses Google Maps directions on non-Apple devices and falls back to restaurant address", () => {
  const url = new URL(restaurantDirectionsUrl({ name: "Fast Eddie's", address: "Alton, Illinois" }, "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"));
  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("destination"), "Fast Eddie's, Alton, Illinois");
});

test("does not treat missing coordinates as a real location", () => {
  const url = new URL(restaurantDirectionsUrl({ name: "Cafe North", lat: null, lon: null }, "iPhone"));
  assert.equal(url.searchParams.get("daddr"), "Cafe North");
});

test("returns no directions destination for an empty place", () => {
  assert.equal(restaurantDirectionsUrl({}), "");
});

test("offers Apple Maps, Google Maps, and Waze with the same coordinate destination", () => {
  const options = restaurantNavigationOptions({ name: "Pump House", lat: 38.86, lon: -90.07 });
  assert.deepEqual(options.map(option => option.label), ["Apple Maps", "Google Maps", "Waze"]);
  assert.equal(new URL(options[0].url).searchParams.get("daddr"), "38.86,-90.07");
  assert.equal(new URL(options[1].url).searchParams.get("destination"), "38.86,-90.07");
  assert.equal(new URL(options[2].url).searchParams.get("ll"), "38.86,-90.07");
});

test("map app choices fall back to the restaurant name and address without coordinates", () => {
  const options = restaurantNavigationOptions({ name: "Fast Eddie's", address: "Alton, Illinois" });
  assert.equal(new URL(options[0].url).searchParams.get("daddr"), "Fast Eddie's, Alton, Illinois");
  assert.equal(new URL(options[1].url).searchParams.get("destination"), "Fast Eddie's, Alton, Illinois");
  assert.equal(new URL(options[2].url).searchParams.get("q"), "Fast Eddie's, Alton, Illinois");
  assert.deepEqual(restaurantNavigationOptions({}), []);
});
