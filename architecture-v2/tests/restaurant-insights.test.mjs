import test from "node:test";
import assert from "node:assert/strict";
import { summarizeMetroEatsInsights, summarizeRestaurantInsights } from "../src/domain/restaurant-insights.mjs";
import { averageRestaurantVisitRating, restaurantReviewRecords } from "../src/domain/restaurant-review.mjs";

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

test("insights count a survey mirror once when it has the same visit ID", () => {
  const restaurant = { name: "Cafe North", reviewHistory: [{ id: "same", overall: 8 }], survey: { id: "same", overall: 8 } };
  const result = summarizeRestaurantInsights([restaurant]);
  assert.equal(result.placeCount, 1);
  assert.equal(result.visitCount, 1);
});

test("identical reviews with distinct visit IDs remain separate visits and average independently", () => {
  const first = { id: "visit-1", visitedAt: "2026-11-07", overall: 6, experience: 5, food: 7, service: 6, value: 6, ratingScale: 10 };
  const second = { ...first, id: "visit-2", overall: 8, experience: 9, food: 7, service: 8, value: 8 };
  const restaurant = { name: "Cafe North", reviewHistory: [first, second], survey: second };
  const records = restaurantReviewRecords(restaurant);
  assert.equal(records.length, 2);
  assert.equal(averageRestaurantVisitRating(records), 7);
  assert.equal(records[0].experience, 5);
  assert.equal(records[1].experience, 9);
  const result = summarizeRestaurantInsights([restaurant]);
  assert.equal(result.visitCount, 2);
  assert.equal(result.averageRating, 7);
});

test("separate id-less visit rows with identical content are not collapsed", () => {
  const first = { visitedAt: "2026-11-07", overall: 8, ratingScale: 10 };
  const second = { ...first };
  const result = summarizeRestaurantInsights([{ name: "Cafe North", reviewHistory: [first, second] }]);
  assert.equal(result.visitCount, 2);
  assert.equal(result.averageRating, 8);
});

test("an id-less survey mirror does not add a third copy of identical visit-history rows", () => {
  const first = { visitedAt: "2026-11-07", overall: 8, ratingScale: 10 };
  const second = { ...first };
  const result = summarizeRestaurantInsights([{ name: "Cafe North", reviewHistory: [first, second], survey: { ...first } }]);
  assert.equal(result.visitCount, 2);
  assert.equal(result.averageRating, 8);
});

test("combined insights include restaurant, recipe, and pizza scores in the overall average", () => {
  const result = summarizeMetroEatsInsights({
    restaurants: [{ name: "Cafe North", survey: { overall: 8, ratingScale: 10 } }],
    recipes: [{ title: "Tomato Pasta", overallRating: 10 }, { title: "Bread", overallRating: null }],
    pizzas: [{ brand: "Metro", name: "Pepperoni", scores: { overall: 6 } }]
  });
  assert.equal(result.overallAverageRating, 8);
  assert.equal(result.ratedItemCount, 3);
  assert.equal(result.restaurants.visitCount, 1);
  assert.deepEqual({ count: result.recipes.count, ratedCount: result.recipes.ratedCount, averageRating: result.recipes.averageRating, top: result.recipes.top }, {
    count: 2, ratedCount: 1, averageRating: 10, top: { name: "Tomato Pasta", rating: 10 }
  });
  assert.deepEqual({ count: result.pizzas.count, ratedCount: result.pizzas.ratedCount, averageRating: result.pizzas.averageRating, top: result.pizzas.top }, {
    count: 1, ratedCount: 1, averageRating: 6, top: { name: "Metro · Pepperoni", rating: 6 }
  });
});
