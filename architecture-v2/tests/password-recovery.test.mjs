import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryContext, requestPasswordReset, resetPassword, mountPasswordRecovery } from '../src/features/password-recovery.mjs';

test('recovery validates email and uses only the current origin for the reset callback', async () => {
  let sent;
  const fetcher = async (url, options) => { sent = { url, ...options, body: JSON.parse(options.body) }; return { ok: true }; };
  await assert.rejects(requestPasswordReset(fetcher, { email: 'invalid', origin: 'https://metro.example' }), /valid email/);
  assert.equal(sent, undefined);
  const message = await requestPasswordReset(fetcher, { email: ' test@example.invalid ', origin: 'https://metro.example/untrusted?next=https://other.example' });
  assert.equal(sent.url, '/api/auth/request-password-reset');
  assert.deepEqual(sent.body, { email: 'test@example.invalid', redirectTo: 'https://metro.example/architecture-v2/reset-password.html' });
  assert.equal(sent.credentials, 'same-origin'); assert.equal(sent.cache, 'no-store');
  assert.match(message, /If an account exists/);
  await assert.rejects(requestPasswordReset(fetcher, { email: 'test@example.invalid', origin: 'http://other.example' }), /secure site/);
});

test('password reset needs a token and matching passwords before making any request', async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++; assert.equal(url, '/api/auth/reset-password');
    assert.deepEqual(JSON.parse(options.body), { token: 'one-time-fixture', newPassword: 'new fixture password' });
    return { ok: true };
  };
  const input = { token: 'one-time-fixture', password: 'new fixture password', confirmation: 'new fixture password' };
  for (const change of [{ token: '' }, { password: 'short', confirmation: 'short' }, { confirmation: 'different' }]) {
    await assert.rejects(resetPassword(fetcher, { ...input, ...change }));
  }
  assert.equal(calls, 0); await resetPassword(fetcher, input); assert.equal(calls, 1);
});

test('rate limits, invalid links and network failures never echo provider secrets', async () => {
  const input = { token: 'secret-fixture', password: 'new fixture password', confirmation: 'new fixture password' };
  for (const status of [400, 401, 403, 422, 429, 500]) {
    await assert.rejects(resetPassword(async () => ({ ok: false, status, json() { throw Error('must not inspect private response'); } }), input), error => !error.message.includes(input.token));
  }
  await assert.rejects(resetPassword(async () => { throw Error('private network details'); }, input), /could not be reached/);
});

test('reset link token and callback input are removed from browser navigation immediately', () => {
  const href = 'https://metro.example/architecture-v2/reset-password.html?token=fixture&next=https://other.example#secret';
  assert.deepEqual(recoveryContext(href), { token: 'fixture', invalid: false, cleanPath: '/architecture-v2/reset-password.html' });
  assert.equal(recoveryContext('https://metro.example/reset?token=fixture&error=INVALID_TOKEN').token, '');
  const elements = new Map();
  const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, { addEventListener() {}, value: '', querySelector: () => ({}) }); return elements.get(id); } };
  let replacement;
  mountPasswordRecovery({ document, location: { href, origin: 'https://metro.example' }, history: { replaceState(...args) { replacement = args; } }, fetcher: () => { throw Error('No request on opening a link'); } });
  assert.deepEqual(replacement, [null, '', '/architecture-v2/reset-password.html']);
  assert.equal(elements.get('recovery-reset').hidden, false);
  assert.equal(elements.get('recovery-request').hidden, true);
});
