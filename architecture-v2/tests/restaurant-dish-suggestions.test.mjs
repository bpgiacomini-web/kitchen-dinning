import test from "node:test";
import assert from "node:assert/strict";
import { restaurantDishSuggestions } from "../src/domain/restaurant-dish-suggestions.mjs";

test("suggests popular dishes and drinks for the selected cuisine", () => {
  assert.ok(restaurantDishSuggestions("Italian", "Appetizers").includes("Toasted ravioli"));
  assert.ok(restaurantDishSuggestions("Italian", "Drinks").includes("Espresso"));
  assert.ok(restaurantDishSuggestions("Mexican", "Entrées").includes("Carne asada tacos"));
});

test("keeps suggestions category-specific and allows an open-ended fallback", () => {
  assert.ok(!restaurantDishSuggestions("Italian", "Drinks").includes("Toasted ravioli"));
  assert.ok(restaurantDishSuggestions("Cuisine we do not know", "Desserts").length > 0);
});
