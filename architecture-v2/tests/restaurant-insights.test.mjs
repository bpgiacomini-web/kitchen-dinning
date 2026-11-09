import test from "node:test";
import assert from "node:assert/strict";
import { summarizeRestaurantInsights } from "../src/domain/restaurant-insights.mjs";

test("empty collection has no restaurant insights", () => {
  assert.deepEqual(summarizeRestaurantInsights([]), {
    placeCount: 0, visitCount: 0, averageRating: null, topRestaurant: null,
    mostVisited: null, topCuisine: null, topDish: null
  });
});

test("insights rank reviewed restaurants and summarize visit and dish patterns", () => {
  const restaurants = [
    { id: "a", name: "Cafe North", cuisine: "Italian", reviewHistory: [
      { id: "a1", visitedAt: "2026-11-01", overall: 9, ratingScale: 10, foodItems: [{ name: "Pasta", rating: 10 }] },
      { id: "a2", visitedAt: "2026-11-02", overall: 7, ratingScale: 10, foodItems: [{ name: "Pasta", rating: 8 }] }
    ] },
    { id: "b", name: "Taco House", cuisine: "Mexican", survey: {
      id: "b1", visitedAt: "2026-11-03", overall: 10, ratingScale: 10, foodItems: [{ name: "Tacos", rating: 9 }]
    } },
    { id: "c", name: "No Visit Yet", cuisine: "French" }
  ];

  const result = summarizeRestaurantInsights(restaurants);
  assert.equal(result.placeCount, 2);
  assert.equal(result.visitCount, 3);
  assert.equal(result.averageRating, 26 / 3);
  assert.equal(result.topRestaurant.restaurant.name, "Taco House");
  assert.equal(result.mostVisited.restaurant.name, "Cafe North");
  assert.equal(result.topCuisine.name, "Italian");
  assert.deepEqual(result.topDish, { name: "Pasta", rating: 9, ratings: 2 });
});

test("insights count duplicate visit representations only once", () => {
  const restaurant = { name: "Cafe North", reviewHistory: [{ id: "same", overall: 8 }], survey: { id: "same", overall: 8 } };
  const result = summarizeRestaurantInsights([restaurant]);
  assert.equal(result.placeCount, 1);
  assert.equal(result.visitCount, 1);
});
