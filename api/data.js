// Retired: all journal reads and writes use the account-scoped v2 API.
export default function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(410).json({ error: 'This legacy endpoint has been retired. Open Metro Eats at /architecture-v2/.' });
}
