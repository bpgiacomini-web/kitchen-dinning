import test from 'node:test';
import assert from 'node:assert/strict';
import { createRecipeShareHandler } from '../../api/recipe-share.js';

function responseRecorder() {
  return {
    headers: {}, body: undefined, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('public recipe reads are limited by the sharing account before returning content', async () => {
  const sql = async () => [{ payload: { id: 'recipe-1', title: 'Private recipe' }, owner_user_id: 'owner-1' }];
  let limitedAccount;
  const handler = createRecipeShareHandler({
    makeSql: () => sql,
    consumeLimit: async input => {
      limitedAccount = input.accountId;
      assert.equal(input.scope, 'shared-recipe-read');
      assert.equal(input.limit, 300);
      return { allowed: false, retryAfterSeconds: 90 };
    }
  });
  const res = responseRecorder();
  await handler({ method: 'GET', query: { token: 'a'.repeat(43) } }, res);
  assert.equal(limitedAccount, 'owner-1');
  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['Retry-After'], '90');
  assert.equal(Object.hasOwn(res.body, 'recipe'), false);
});

test('public recipe reads fail closed when durable rate-limit storage is unavailable', async () => {
  const handler = createRecipeShareHandler({
    makeSql: async () => async () => [{ payload: { id: 'recipe-1' }, owner_user_id: 'owner-1' }],
    consumeLimit: async () => { throw new Error('database unavailable'); }
  });
  const res = responseRecorder();
  await handler({ method: 'GET', query: { token: 'b'.repeat(43) } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal(Object.hasOwn(res.body, 'recipe'), false);
});
