import test from "node:test";
import assert from "node:assert/strict";
import { createRestaurantReview, upsertRestaurantReview } from "../src/domain/restaurant-review.mjs";

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

test("editing a visit replaces that history entry and its mirrored survey without adding a duplicate", () => {
  const original = { id: "visit-1", visitedAt: "2026-11-01", overall: 7, notes: "Original" };
  const later = { id: "visit-2", visitedAt: "2026-11-07", overall: 9, notes: "Later" };
  const edited = { ...original, overall: 8, notes: "Updated" };
  const saved = upsertRestaurantReview({ reviewHistory: [original, later], survey: original }, edited, original);
  assert.deepEqual(saved.reviewHistory, [edited, later]);
  assert.equal(saved.survey, edited);
  assert.equal(saved.reviewHistory.length, 2);
});

test("editing an older visit preserves the separate latest survey and every other visit", () => {
  const older = { id: "visit-1", visitedAt: "2026-11-01", overall: 7 };
  const latest = { id: "visit-2", visitedAt: "2026-11-07", overall: 9 };
  const edited = { ...older, overall: 8 };
  const saved = upsertRestaurantReview({ reviewHistory: [older, latest], survey: latest }, edited, older);
  assert.deepEqual(saved.reviewHistory, [edited, latest]);
  assert.equal(saved.survey, latest);
});

test("adding a visit appends history and mirrors it to the current survey", () => {
  const existing = { id: "visit-1", visitedAt: "2026-11-01", overall: 7 };
  const next = { id: "visit-2", visitedAt: "2026-11-07", overall: 9 };
  const saved = upsertRestaurantReview({ reviewHistory: [existing], survey: existing }, next);
  assert.deepEqual(saved.reviewHistory, [existing, next]);
  assert.equal(saved.survey, next);
});
