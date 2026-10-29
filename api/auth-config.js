export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const authUrl = process.env.VITE_NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL;
  if (!authUrl) return res.status(503).json({ error: 'Preview authentication URL is not configured.' });
  return res.status(200).json({ authUrl });
}
