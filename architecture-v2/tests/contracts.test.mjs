import test from "node:test";
import assert from "node:assert/strict";
import { validateDatasetEnvelope } from "../src/domain/contracts.mjs";

test("dataset contract accepts current recipe and dining record shapes", () => {
  const data = {
    recipes: [{ id: "r1", title: "Soup", ingredients: ["stock"], steps: ["Simmer"] }],
    restaurants: [{ id: "d1", name: "Cafe", reviewHistory: [], photos: [] }]
  };
  const before = structuredClone(data);
  assert.deepEqual(validateDatasetEnvelope(data), { valid: true, errors: [] });
  assert.deepEqual(data, before);
});

test("dataset contract rejects malformed envelopes and collection entries", () => {
  assert.deepEqual(validateDatasetEnvelope(null), { valid: false, errors: ["dataset must be an object"] });
  const result = validateDatasetEnvelope({ recipes: {}, restaurants: [null] });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["recipes must be an array", "restaurants[0] must be an object"]);
});

test("dataset contract rejects duplicate non-empty IDs within each collection", () => {
  const result = validateDatasetEnvelope({
    recipes: [{ id: "same" }, { id: "same" }, {}],
    restaurants: [{ id: "same" }]
  });
  assert.deepEqual(result.errors, ['recipes contains duplicate id "same"']);
});

test("dataset contract limits pathological collection sizes", () => {
  const tooMany = Array.from({ length: 10_001 }, () => ({}));
  const result = validateDatasetEnvelope({ recipes: tooMany, restaurants: [] });
  assert.equal(result.valid, false);
  assert.equal(result.errors[0], "recipes exceeds the maximum of 10000 records");
});
