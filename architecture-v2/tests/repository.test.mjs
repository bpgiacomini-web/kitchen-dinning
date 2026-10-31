import test from "node:test";
import assert from "node:assert/strict";
import { loadDataset, readLegacyDataset } from "../src/data/repository.mjs";

function fakeStorage(entries = {}) {
  return { getItem(key) { return Object.hasOwn(entries, key) ? entries[key] : null; } };
}

test("legacy reader prefers v2 and does not write to storage", () => {
  const storage = fakeStorage({ metro_eats_v2: JSON.stringify({ recipes: [{ name: "New" }], restaurants: [] }), metro_eats_v1: JSON.stringify({ recipes: [{ name: "Old" }], restaurants: [] }) });
  const result = readLegacyDataset(storage);
  assert.equal(result.source, "local:metro_eats_v2");
  assert.equal(result.data.recipes[0].title, "New");
});

test("legacy reader supports real saved recipe steps and dining review history", () => {
  const storage = fakeStorage({ metro_eats_v2: JSON.stringify({
    recipes: [{ id: "r1", title: "Soup", category: "Soups, Salads & Sandwiches", subcategory: "Soups", ingredients: ["stock"], steps: ["Simmer"] }],
    restaurants: [{ id: "d1", name: "Cafe", type: "American", location: "Alton, IL", reviewHistory: [{ createdAt: "2026-10-02" }] }],
    cats: ["Soups, Salads & Sandwiches"]
  }) });
  const result = readLegacyDataset(storage);
  assert.deepEqual(result.data.recipes[0].directions, ["Simmer"]);
  assert.equal(result.data.recipes[0].subcategory, "Soups");
  assert.equal(result.data.restaurants[0].reviewCount, 1);
  assert.deepEqual(result.data.cats, ["Soups, Salads & Sandwiches"]);
});

test("loadDataset uses local data without a network request", async () => {
  let called = false;
  const result = await loadDataset({ storage: fakeStorage({ metro_eats_v2: JSON.stringify({ recipes: [{ name: "Local" }], restaurants: [] }) }), fetchImpl: async () => { called = true; throw new Error("must not call"); } });
  assert.equal(result.data.recipes[0].title, "Local");
  assert.equal(called, false);
});

test("loadDataset falls back to remote data when local records are absent", async () => {
  const result = await loadDataset({ storage: fakeStorage(), getToken: async () => "test-session-token", fetchImpl: async (url, options) => { assert.equal(url, "/api/data"); assert.equal(options.method, "GET"); assert.equal(options.headers.Authorization, "Bearer test-session-token"); return { ok: true, json: async () => ({ recipes: [{ name: "Cloud" }], restaurants: [] }) }; } });
  assert.equal(result.source, "cloud");
  assert.equal(result.data.recipes[0].title, "Cloud");
});

test("loadDataset fails safely when sources are unavailable", async () => {
  const result = await loadDataset({ storage: fakeStorage(), getToken: async () => "test-session-token", fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(result.source, "empty");
  assert.equal(result.staleFallback, true);
  assert.deepEqual(result.data, { recipes: [], restaurants: [], cats: [] });
});
