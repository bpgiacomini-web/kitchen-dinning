import test from "node:test";
import assert from "node:assert/strict";
import { asText, normalizeDataset, normalizeRecipe, normalizeRestaurant } from "../src/domain/normalize.mjs";

test("recipe normalization supports the fields used by the current Metro Eats app", () => {
  const source = {
    id: "recipe-1", title: "BG's Chili", category: "Main Dishes", subcategory: "Beef",
    ingredients: ["2 lb beef", "beans"], steps: ["Brown beef", "Simmer"],
    servings: "8", time: "90 min", favorite: true, photos: ["data:image/jpeg;base64,abc"],
    createdAt: "2026-10-01T12:00:00.000Z", updatedAt: "2026-10-02T12:00:00.000Z"
  };
  const before = structuredClone(source);
  const result = normalizeRecipe(source);
  assert.equal(result.id, "recipe-1");
  assert.equal(result.title, "BG's Chili");
  assert.equal(result.category, "Main Dishes");
  assert.equal(result.subcategory, "Beef");
  assert.deepEqual(result.ingredients, ["2 lb beef", "beans"]);
  assert.deepEqual(result.directions, ["Brown beef", "Simmer"]);
  assert.equal(result.favorite, true);
  assert.equal(result.photos.length, 1);
  assert.equal(result.createdAt, source.createdAt);
  assert.deepEqual(source, before);
});

test("recipe normalization accepts imported Schema.org fields", () => {
  const result = normalizeRecipe({ name: "Imported", recipeIngredient: ["flour"], recipeInstructions: [{ "@type": "HowToSection", itemListElement: [{ "@type": "HowToStep", text: "Mix" }, { "@type": "HowToStep", text: "Bake" }] }] });
  assert.equal(result.title, "Imported");
  assert.deepEqual(result.ingredients, ["flour"]);
  assert.deepEqual(result.directions, ["Mix", "Bake"]);
});

test("restaurant normalization retains current Metro Eats fields and review history", () => {
  const source = {
    id: "restaurant-1", name: "Cafe", type: "American", location: "1 Main, Alton, IL",
    rating: "4.5", website: "https://example.com", notes: "Try the soup",
    photos: ["data:image/jpeg;base64,abc"], createdAt: "2026-10-01T12:00:00.000Z",
    reviewHistory: [{ createdAt: "2026-10-01T12:00:00.000Z" }, { createdAt: "2026-10-02T12:00:00.000Z" }]
  };
  const result = normalizeRestaurant(source);
  assert.equal(result.name, "Cafe");
  assert.equal(result.cuisine, "American");
  assert.equal(result.address, "1 Main, Alton, IL");
  assert.equal(result.rating, 4.5);
  assert.equal(result.reviewCount, 2);
  assert.equal(result.latestReviewAt, "2026-10-02T12:00:00.000Z");
  assert.equal(result.website, "https://example.com");
  assert.equal(result.notes, "Try the soup");
  assert.equal(result.photos.length, 1);
});

test("restaurant normalization handles object addresses and a legacy single survey", () => {
  const result = normalizeRestaurant({ title: "Cafe", location: { street: "1 Main", city: "Alton", state: "IL" }, survey: { createdAt: "2026-10-03" } });
  assert.equal(result.name, "Cafe");
  assert.equal(result.address, "1 Main, Alton, IL");
  assert.equal(result.reviewCount, 1);
  assert.equal(result.latestReviewAt, "2026-10-03");
});

test("dataset normalization safely handles malformed top-level shapes", () => {
  assert.deepEqual(normalizeDataset(null), { recipes: [], restaurants: [], cats: [] });
  assert.deepEqual(normalizeDataset({ cats: { Beef: ["Main Dishes", "Beef"] } }).cats, { Beef: ["Main Dishes", "Beef"] });
  assert.equal(normalizeDataset({ recipes: [null], restaurants: [null] }).recipes[0].title, "Untitled recipe");
  assert.deepEqual(normalizeDataset({ recipes: "bad", restaurants: {} }).restaurants, []);
});

test("asText handles structured values safely", () => {
  assert.equal(asText({ text: "  Step one " }), "Step one");
  assert.equal(asText(["a", "b"]), "a, b");
});

test("normalization preserves unknown legacy fields and original instruction/review payloads", () => {
  const source = {
    recipes: [{
      id: "raw-r1", title: "Recipe", ingredients: ["salt"], steps: [{ text: "Keep source step object" }],
      importedNutrition: { calories: 123 }, articleExcerpt: "Do not discard", customFlag: true
    }],
    restaurants: [{
      id: "raw-d1", name: "Cafe", type: "American", location: "Alton, IL",
      menuUrl: "https://example.com/menu", lat: 38.9, lon: -90.1,
      survey: { createdAt: "2026-10-01", customScore: { service: 9 } },
      reviewHistory: [{ createdAt: "2026-10-01", customDish: "Soup", nested: { preserved: true } }]
    }],
    cats: ["Main Dishes"],
    exportMetadata: { source: "metro_eats_v2", version: 2 }
  };
  const result = normalizeDataset(source);
  assert.deepEqual(result.exportMetadata, source.exportMetadata);
  assert.deepEqual(result.recipes[0].steps, source.recipes[0].steps);
  assert.deepEqual(result.recipes[0].importedNutrition, source.recipes[0].importedNutrition);
  assert.equal(result.recipes[0].customFlag, true);
  assert.deepEqual(result.restaurants[0].survey, source.restaurants[0].survey);
  assert.deepEqual(result.restaurants[0].reviewHistory, source.restaurants[0].reviewHistory);
  assert.equal(result.restaurants[0].menuUrl, source.restaurants[0].menuUrl);
  assert.equal(result.restaurants[0].lat, 38.9);
});
