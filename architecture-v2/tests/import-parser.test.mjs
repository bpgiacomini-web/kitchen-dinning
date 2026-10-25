import test from "node:test";
import assert from "node:assert/strict";
import { normalizeImportedRecipe, parsePastedRecipeText, parseRecipeJsonLd, plainText } from "../src/features/recipes/import-parser.mjs";

test("JSON-LD parser extracts only recipe-specific fields from a graph", () => {
  const html = `<html><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Article", "headline": "Long article content should not become recipe data" },
      { "@type": "Recipe", "name": "Chicken Alfredo", "description": "Creamy pasta", "recipeIngredient": ["2 cups cream", "1 lb pasta"], "recipeInstructions": [{ "@type": "HowToSection", "itemListElement": [{ "@type": "HowToStep", "text": "Boil pasta." }, { "@type": "HowToStep", "text": "Make sauce." }] }], "recipeYield": "4 servings", "totalTime": "PT30M", "url": "https://example.com/recipe" }
    ]
  })}</script></html>`;
  const result = parseRecipeJsonLd(html);
  assert.equal(result.title, "Chicken Alfredo");
  assert.deepEqual(result.ingredients, ["2 cups cream", "1 lb pasta"]);
  assert.deepEqual(result.directions, ["Boil pasta.", "Make sauce."]);
  assert.equal(result.servings, "4 servings");
  assert.equal(result.totalTime, "PT30M");
  assert.equal(result.source, "https://example.com/recipe");
  assert.equal(Object.hasOwn(result, "articleBody"), false);
});

test("JSON-LD parser accepts raw JSON and rejects incomplete recipe nodes", () => {
  assert.equal(parseRecipeJsonLd(JSON.stringify({ "@type": "Recipe", "name": "Incomplete" })), null);
  const result = parseRecipeJsonLd(JSON.stringify({ "@type": "Recipe", "name": "Soup", "recipeIngredient": ["stock"], "recipeInstructions": "Simmer" }));
  assert.deepEqual(result.directions, ["Simmer"]);
});

test("pasted recipe parser extracts ingredients and directions, not unrelated article sections", () => {
  const result = parsePastedRecipeText(`Title: Sausage Gravy
A long personal story that should not be copied into recipe fields.
Ingredients
- 1 lb sausage
- 1/4 cup flour
- 3 cups milk
Directions
1. Brown the sausage.
2. Stir in flour, then whisk in milk.
Nutrition
Calories 200`);
  assert.equal(result.title, "Sausage Gravy");
  assert.deepEqual(result.ingredients, ["1 lb sausage", "1/4 cup flour", "3 cups milk"]);
  assert.deepEqual(result.directions, ["Brown the sausage.", "Stir in flour, then whisk in milk."]);
});

test("pasted recipe parser declines ambiguous text instead of inventing recipe fields", () => {
  assert.equal(parsePastedRecipeText("This is a long food blog story with no recipe sections."), null);
  assert.equal(parsePastedRecipeText(""), null);
});

test("plainText safely handles Schema.org property values", () => {
  assert.equal(plainText({ value: "2", name: "cups flour" }), "2 cups flour");
  assert.equal(plainText("<b>Fresh</b>&nbsp;tomatoes"), "Fresh tomatoes");
  assert.equal(normalizeImportedRecipe(null), null);
});
