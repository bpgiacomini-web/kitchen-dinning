import test from "node:test";
import assert from "node:assert/strict";
import { asText, normalizeDataset, normalizeRecipe, normalizeRestaurant } from "../src/domain/normalize.mjs";

test("recipe normalization accepts legacy fields without mutating input", () => {
  const source = { name: "Chili", recipeIngredient: ["beef", "beans"], recipeInstructions: [{ text: "Simmer" }], favorite: true };
  const before = structuredClone(source);
  const result = normalizeRecipe(source, 2);
  assert.equal(result.title, "Chili");
  assert.deepEqual(result.ingredients, ["beef", "beans"]);
  assert.deepEqual(result.directions, ["Simmer"]);
  assert.equal(result.favorite, true);
  assert.deepEqual(source, before);
});

test("restaurant normalization handles alternate fields", () => {
  const result = normalizeRestaurant({ title: "Cafe", location: { street: "1 Main", city: "Alton", state: "IL" }, rating: "4.5", reviewHistory: [{}, {}] });
  assert.equal(result.name, "Cafe");
  assert.equal(result.address, "1 Main, Alton, IL");
  assert.equal(result.rating, 4.5);
  assert.equal(result.reviewCount, 2);
});

test("dataset normalization safely handles malformed top-level shapes", () => {
  assert.deepEqual(normalizeDataset(null), { recipes: [], restaurants: [] });
  assert.equal(normalizeDataset({ recipes: [null], restaurants: [null] }).recipes[0].title, "Untitled recipe");
});

test("asText handles structured values safely", () => {
  assert.equal(asText({ text: "  Step one " }), "Step one");
  assert.equal(asText(["a", "b"]), "a, b");
});
