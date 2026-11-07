import test from "node:test";
import assert from "node:assert/strict";
import { createRestaurantReview } from "../src/domain/restaurant-review.mjs";

const base = {
  id: "visit-1", visitedAt: "2026-11-07", createdAt: "2026-11-07T18:00:00.000Z",
  experience: 8, service: 7, value: 9, foodItems: [
    { category: "Appetizers", name: "Toasted ravioli", rating: 9, notes: "Crisp outside" },
    { category: "Drinks", name: "Lemonade", rating: 7 }
  ], order: "Shared appetizers", orderAgain: "Yes", notes: "Good neighborhood spot"
};

test("restaurant visit stores Production-compatible critic scores and rated dishes", () => {
  const review = createRestaurantReview(base);
  assert.deepEqual(review.scores, { 0: 8, 1: 8, 2: 7, 3: 9 });
  assert.equal(review.food, 8);
  assert.equal(review.overall, 8);
  assert.equal(review.ratingScale, 10);
  assert.equal(review.order, "Shared appetizers");
  assert.equal(review.orderAgain, "Yes");
  assert.equal(review.foodItems[0].notes, "Crisp outside");
});

test("restaurant visit calculates averages to one decimal place", () => {
  const review = createRestaurantReview({ ...base, experience: 8, service: 8, value: 8, foodItems: [
    { category: "Entrées", name: "Pasta", rating: 8 },
    { category: "Desserts", name: "Tart", rating: 9 }
  ] });
  assert.equal(review.food, 8.5);
  assert.equal(review.overall, 8.1);
});

test("restaurant visit rejects missing ratings, invalid dish data, and incomplete order-again choice", () => {
  assert.throws(() => createRestaurantReview({ ...base, service: 0 }), /rated from 1 to 10/);
  assert.throws(() => createRestaurantReview({ ...base, foodItems: [{ category: "Entrées", name: "Pasta", rating: 0 }] }), /Give every dish/);
  assert.throws(() => createRestaurantReview({ ...base, orderAgain: "" }), /Choose Yes or No/);
});

test("restaurant visit rejects invalid calendar dates", () => {
  assert.throws(() => createRestaurantReview({ ...base, visitedAt: "2026-02-31" }), /valid visit date/);
});
