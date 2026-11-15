import test from "node:test";
import assert from "node:assert/strict";
import { createUserDatasetClient } from "../src/data/user-dataset-client.mjs";

test("cloud client sends a session token and reads data plus revision", async () => {
  let call;
  const client = createUserDatasetClient({
    getAccessToken: async () => "session-token",
    fetchImpl: async (url, options) => {
      call = { url, options };
      return { ok: true, json: async () => ({ data: { recipes: [], restaurants: [], cats: [] }, revision: 3 }) };
    }
  });
  const result = await client.load();
  assert.equal(call.url, "/api/user-data");
  assert.equal(call.options.headers.Authorization, "Bearer session-token");
  assert.equal(call.options.cache, "no-store");
  assert.equal(result.revision, 3);
});

test("cloud client refuses requests without a signed-in session", async () => {
  let called = false;
  const client = createUserDatasetClient({
    getAccessToken: async () => null,
    fetchImpl: async () => { called = true; throw new Error("must not call"); }
  });
  await assert.rejects(client.load(), error => error.code === "AUTH_REQUIRED");
  assert.equal(called, false);
});

test("cloud client sends optimistic revision on save", async () => {
  let body;
  const client = createUserDatasetClient({
    getAccessToken: async () => "session-token",
    fetchImpl: async (_url, options) => {
      body = JSON.parse(options.body);
      return { ok: true, json: async () => ({ ok: true, revision: 4 }) };
    }
  });
  const result = await client.save({ recipes: [], restaurants: [], cats: [] }, 3);
  assert.equal(body.expectedRevision, 3);
  assert.equal(result.revision, 4);
});

test("cloud client surfaces revision conflicts without claiming success", async () => {
  const client = createUserDatasetClient({
    getAccessToken: async () => "session-token",
    fetchImpl: async () => ({
      ok: false,
      status: 409,
      json: async () => ({ error: "Reload before saving.", revision: 5 })
    })
  });
  await assert.rejects(client.save({ recipes: [], restaurants: [], cats: [] }, 4), error =>
    error.code === "REVISION_CONFLICT" && error.revision === 5
  );
});

test("cloud client rejects a malformed success response", async () => {
  const client = createUserDatasetClient({
    getAccessToken: async () => "session-token",
    fetchImpl: async () => ({ ok: true, json: async () => ({ data: {}, revision: "latest" }) })
  });
  await assert.rejects(client.load(), /response was invalid/);
});
