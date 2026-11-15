import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load these dependency-free ESM routes without changing the root package mode.
async function load(relative) {
  const source = await readFile(new URL(relative, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

test('release entry points redirect to the app, preserve query, and do not loop', async () => {
  const { default: middleware, config } = await load('../../middleware.js');
  for (const path of ['/', '/index.html', '/index-persistence.html']) {
    assert.ok(config.matcher.includes(path));
    const response = middleware(new Request(`https://metro.example${path}?source=home`));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), 'https://metro.example/architecture-v2/?source=home');
  }
  for (const path of ['/architecture-v2/', '/architecture-v2/src/main.mjs', '/api/user-data', '/share-recipe/']) {
    assert.equal(middleware(new Request(`https://metro.example${path}`)), undefined);
  }
});

for (const route of ['data', 'import-recipe']) {
  test(`retired ${route} cannot write data or fetch remote input`, async () => {
    const { default: handler } = await load(`../../api/${route}.js`);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => { throw new Error('Legacy handler must not fetch'); };
    try {
      for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
        const headers = {};
        const res = { setHeader(key, value) { headers[key] = value; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
        const req = { method, get body() { throw new Error('Legacy handler must not read request body'); } };
        handler(req, res);
        assert.equal(res.code, 410);
        assert.match(headers['Cache-Control'], /no-store/);
        assert.match(res.body.error, /retired/);
      }
    } finally { globalThis.fetch = originalFetch; }
  });
}
