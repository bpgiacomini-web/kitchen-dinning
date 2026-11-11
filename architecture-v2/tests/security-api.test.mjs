import test from 'node:test';
import assert from 'node:assert/strict';
import { createUserDataHandler } from '../../api/user-data.js';
import { createRestorePointsHandler } from '../../api/restore-points.js';
import { createRecipeShareHandler } from '../../api/recipe-share.js';

function responseRecorder() {
  return {
    headers: {}, body: undefined, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

const dataset = title => ({ recipes: [{ id: 'r1', title, ingredients: ['1 cup flour'], directions: ['Mix'] }], restaurants: [], cats: [] });
const account = userId => async () => ({ userId });

function taggedSql(execute) {
  const sql = (strings, ...values) => {
    const query = { text: strings.join(' '), values };
    query.then = (resolve, reject) => Promise.resolve().then(() => execute(query.text, query.values)).then(resolve, reject);
    return query;
  };
  return sql;
}

test('user data reads are scoped to the authenticated account', async () => {
  const calls = [];
  const sql = taggedSql(async (query, values) => {
    calls.push({ query, values });
    if (query.includes('metro_eats_user_datasets')) return [{ payload: dataset('account A'), revision: 4 }];
    if (query.includes('metro_eats_recipes')) return [{ payload: dataset('account A').recipes[0] }];
    return [];
  });
  const handler = createUserDataHandler({ authenticateUser: account('account-A'), makeSql: () => sql });
  const res = responseRecorder();
  await handler({ method: 'GET', headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.recipes[0].title, 'account A');
  assert.ok(calls.every(call => call.values[0] === 'account-A'));
});

test('invalid and oversized dataset writes are rejected before a transaction', async t => {
  let transactions = 0;
  const sql = Object.assign(taggedSql(async () => []), { transaction: async () => { transactions++; return [[{ revision: 1 }]]; } });
  const handler = createUserDataHandler({ authenticateUser: account('account-A'), makeSql: () => sql });
  for (const [body, status] of [
    [{ expectedRevision: 0, data: { recipes: 'no', restaurants: [] } }, 400],
    [{ expectedRevision: 0, data: { ...dataset('x'), pizzas: [{ id: 'p1', brand: 'Brand', name: 'Pizza', scores: { overall: 11 } }] } }, 400],
    [{ expectedRevision: 0, data: { ...dataset('x'), bars: 'bad' } }, 400],
    [{ expectedRevision: 0, data: { ...dataset('x'), drinks: [{id:'drink',name:'Drink',barId:'not-owned'}] } }, 400],
    [{ expectedRevision: 0, data: { ...dataset('x'), restaurants:[{id:'place',awards:[{name:'Unapproved award'}]}] } }, 400],
    [{ expectedRevision: 0, data: dataset('x'.repeat(1_500_100)) }, 413]
  ]) {
    const res = responseRecorder();
    await handler({ method: 'PUT', headers: {}, body }, res);
    assert.equal(res.statusCode, status);
  }
  assert.equal(transactions, 0);
});

test('valid frozen-pizza records are saved inside the account dataset snapshot', async () => {
  let savedPayload;
  const sql = Object.assign(taggedSql(async () => []), {
    transaction: async queries => {
      savedPayload = queries[0].values.find(value => typeof value === 'string' && value.includes('Pepperoni'));
      return [[{ revision: 1 }], [], [], [], [], []];
    }
  });
  const handler = createUserDataHandler({ authenticateUser: account('account-A'), makeSql: () => sql });
  const res = responseRecorder();
  await handler({ method: 'PUT', headers: {}, body: { expectedRevision: 0, data: { ...dataset('recipe'), pizzas: [{ id: 'p1', brand: 'Test Brand', name: 'Pepperoni', upc: '012345678905', price: 8.5, scores: { taste: 8, overall: 8 } }] } } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.match(savedPayload, /"name":"Pepperoni"/);
});

test('stale dataset writes return 409 without reporting a save', async () => {
  const sql = Object.assign(taggedSql(async (query, values) => {
    assert.equal(query.includes('SELECT revision FROM metro_eats_user_datasets'), true);
    assert.equal(values[0], 'account-A');
    return [{ revision: 7 }];
  }), { transaction: async () => [[]] });
  const handler = createUserDataHandler({ authenticateUser: account('account-A'), makeSql: () => sql });
  const res = responseRecorder();
  await handler({ method: 'PUT', headers: {}, body: { expectedRevision: 6, data: dataset('stale') } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.revision, 7);
  assert.equal(res.body.ok, undefined);
});

test('restore point lookup is owner-scoped and hides another account’s point', async () => {
  let scopedAccount;
  const sql = taggedSql(async (query, values) => {
    assert.match(query, /metro_eats_restore_points WHERE id/);
    scopedAccount = values[1];
    return [];
  });
  const handler = createRestorePointsHandler({ authenticateUser: async () => 'account-B', makeSql: () => sql });
  const res = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: { id: 25, expectedRevision: 3 } }, res);
  assert.equal(scopedAccount, 'account-B');
  assert.equal(res.statusCode, 404);
});

test('stale restore requests return 409 without applying the snapshot', async () => {
  let transactions = 0;
  const sql = Object.assign(taggedSql(async query => {
    assert.match(query, /SELECT snapshot FROM metro_eats_restore_points/);
    return [{ snapshot: dataset('backup') }];
  }), { transaction: async () => { transactions++; return [[]]; } });
  const handler = createRestorePointsHandler({ authenticateUser: account('account-A'), makeSql: () => sql });
  const res = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: { id: 25, expectedRevision: 2 } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(transactions, 1);
  assert.equal(res.body.ok, undefined);
});

test('recipe share links stop resolving after owner revokes them', async () => {
  let storedHash;
  let revoked = false;
  const sql = async (strings, ...values) => {
    const query = strings.join(' ');
    if (query.includes('SELECT payload FROM metro_eats_recipes')) return [{ payload: dataset('shared').recipes[0] }];
    if (query.includes('INSERT INTO metro_eats_recipe_shares')) { storedHash = values[0]; return []; }
    if (query.includes('UPDATE metro_eats_recipe_shares')) { if (storedHash) revoked = true; return []; }
    if (query.includes('SELECT r.payload, s.owner_user_id') && !revoked) return [{ payload: dataset('shared').recipes[0], owner_user_id: 'account-A' }];
    return [];
  };
  const handler = createRecipeShareHandler({ makeSql: () => sql, authenticateUser: account('account-A'), consumeLimit: async () => ({ allowed: true }) });
  const create = responseRecorder();
  await handler({ method: 'POST', headers: {}, body: { recipeId: 'r1' } }, create);
  assert.equal(create.statusCode, 201);
  assert.ok(storedHash);
  const before = responseRecorder();
  await handler({ method: 'GET', query: { token: create.body.token } }, before);
  assert.equal(before.statusCode, 200);
  const remove = responseRecorder();
  await handler({ method: 'DELETE', headers: {}, body: { recipeId: 'r1' } }, remove);
  assert.equal(remove.statusCode, 200);
  const after = responseRecorder();
  await handler({ method: 'GET', query: { token: create.body.token } }, after);
  assert.equal(after.statusCode, 404);
});
