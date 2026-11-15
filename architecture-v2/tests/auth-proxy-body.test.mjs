import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import handler from '../../api/auth/[...path].js';

test('auth proxy preserves raw and runtime-parsed request bodies', async () => {
  const oldFetch = globalThis.fetch;
  const oldBase = process.env.NEON_AUTH_BASE_URL;
  process.env.NEON_AUTH_BASE_URL = 'https://auth.example.test/auth';
  const payload = { email: 'test@example.invalid', password: 'synthetic-test-value' };
  try {
    for (const [chunks, parsed] of [
      [[Buffer.from(JSON.stringify(payload))], { ignored: true }],
      [[], payload],
      [[], JSON.stringify(payload)],
      [[], Buffer.from(JSON.stringify(payload))],
    ]) {
      let forwarded;
      globalThis.fetch = async (_url, options) => {
        forwarded = JSON.parse(options.body.toString());
        return new Response('{}', { status: 400 });
      };
      const req = Object.assign(Readable.from(chunks), {
        method: 'POST', url: '/api/auth/sign-in/email',
        headers: { host: 'localhost:3000', 'content-type': 'application/json' }, body: parsed,
      });
      const res = { setHeader() {}, end() {} };
      await handler(req, res);
      assert.deepEqual(forwarded, payload);
      assert.equal(res.statusCode, 400);
    }
  } finally {
    globalThis.fetch = oldFetch;
    if (oldBase === undefined) delete process.env.NEON_AUTH_BASE_URL;
    else process.env.NEON_AUTH_BASE_URL = oldBase;
  }
});
