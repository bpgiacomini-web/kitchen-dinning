import test from "node:test";
import assert from "node:assert/strict";
import { importedRecipeCategory, recipeEditorCategories, RECIPE_CATEGORIES } from "../src/features/recipes/categories.mjs";

test("imports use a supported category and default to Other", () => {
  assert.equal(importedRecipeCategory("Italian"), "Italian");
  assert.equal(importedRecipeCategory("Imported"), "Other");
  assert.equal(importedRecipeCategory("unknown category"), "Other");
  assert.ok(RECIPE_CATEGORIES.includes(importedRecipeCategory("")));
});

test("recipe editor preserves legacy categories without selecting a different one", () => {
  assert.deepEqual(recipeEditorCategories("Imported"), [...RECIPE_CATEGORIES, "Imported"]);
  assert.deepEqual(recipeEditorCategories("Italian"), RECIPE_CATEGORIES);
  assert.deepEqual(recipeEditorCategories(""), RECIPE_CATEGORIES);
});
