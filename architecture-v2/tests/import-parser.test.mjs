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

test("pasted recipe parser keeps serving and time labels out of recipe directions", () => {
  const result = parsePastedRecipeText(`Title: Simple Tomato Basil Pasta
Servings: 2
Prep time: 10 minutes
Cook time: 15 minutes
Total time: 25 minutes
Ingredients:
- 8 oz spaghetti
- 1 tablespoon olive oil
Directions:
1. Cook the spaghetti, then drain.
2. Simmer the tomato sauce until thickened.`);
  assert.equal(result.title, "Simple Tomato Basil Pasta");
  assert.equal(result.servings, "2");
  assert.equal(result.prepTime, "10 minutes");
  assert.equal(result.cookTime, "15 minutes");
  assert.equal(result.totalTime, "25 minutes");
  assert.deepEqual(result.directions, ["Cook the spaghetti, then drain.", "Simmer the tomato sauce until thickened."]);
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

test("source links only retain safe HTTP and HTTPS URLs", () => {
  assert.equal(parseRecipeJsonLd(JSON.stringify({
    "@type": "Recipe", name: "Soup", recipeIngredient: ["stock"], recipeInstructions: "Simmer", url: "javascript:alert(1)"
  })).source, "");
  assert.equal(parseRecipeJsonLd(JSON.stringify({
    "@type": "Recipe", name: "Soup", recipeIngredient: ["stock"], recipeInstructions: "Simmer", url: "data:text/html,unsafe"
  })).source, "");
  assert.equal(parseRecipeJsonLd(JSON.stringify({
    "@type": "Recipe", name: "Soup", recipeIngredient: ["stock"], recipeInstructions: "Simmer", url: "https://user:pass@example.com/soup"
  })).source, "");
  assert.equal(parseRecipeJsonLd(JSON.stringify({
    "@type": "Recipe", name: "Soup", recipeIngredient: ["stock"], recipeInstructions: "Simmer", url: "https://example.com/soup?utm_source=copy#recipe"
  })).source, "https://example.com/soup");
});

test("pasted recipe title is taken from the pre-ingredients heading, not later story text", () => {
  const result = parsePastedRecipeText(`Chicken Alfredo
https://example.com/story
A long article paragraph that should not become the recipe title.
Ingredients
- 1 lb pasta
Directions
- Boil pasta.`);
  assert.equal(result.title, "Chicken Alfredo");
  assert.deepEqual(result.ingredients, ["1 lb pasta"]);
  assert.deepEqual(result.directions, ["Boil pasta."]);
});
