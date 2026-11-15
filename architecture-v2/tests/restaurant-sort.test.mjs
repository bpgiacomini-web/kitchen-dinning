import test from "node:test";
import assert from "node:assert/strict";
import { sortRestaurantItems } from "../src/domain/restaurant-sort.mjs";

const restaurants = [
  { name: "Bistro", lastVisit: 10, score: 8 },
  { name: "Cafe", lastVisit: 30, score: 9 },
  { name: "Diner", lastVisit: 0, score: null },
  { name: "A Kitchen", lastVisit: 20, score: 6 }
];
const options = { lastVisit: item => item.lastVisit, averageRating: item => item.score };

test("restaurant sort defaults to newest visit first and leaves restaurants without visits last", () => {
  assert.deepEqual(sortRestaurantItems(restaurants, "recent", options).map(item => item.name), ["Cafe", "A Kitchen", "Bistro", "Diner"]);
});

test("restaurant sort orders top and low ratings while keeping unrated places last", () => {
  assert.deepEqual(sortRestaurantItems(restaurants, "highest", options).map(item => item.name), ["Cafe", "Bistro", "A Kitchen", "Diner"]);
  assert.deepEqual(sortRestaurantItems(restaurants, "lowest", options).map(item => item.name), ["A Kitchen", "Bistro", "Cafe", "Diner"]);
});

test("restaurant sort supports alphabetical order without mutating saved data", () => {
  assert.deepEqual(sortRestaurantItems(restaurants, "name", options).map(item => item.name), ["A Kitchen", "Bistro", "Cafe", "Diner"]);
  assert.equal(restaurants[0].name, "Bistro");
});
