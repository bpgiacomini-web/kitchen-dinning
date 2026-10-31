export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const upstreamAuthUrl = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL;
  if (!upstreamAuthUrl) return res.status(503).json({ error: 'Preview authentication URL is not configured.' });

  // The browser must use this app-origin endpoint. The server-side proxy at
  // /api/auth/* forwards requests to Neon Auth and returns its session cookies
  // on the Preview origin, avoiding Safari third-party-cookie blocking.
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  if (!forwardedHost || !/^[a-z0-9.-]+(?::\d+)?$/i.test(forwardedHost) || !['http', 'https'].includes(forwardedProto)) {
    return res.status(400).json({ error: 'Could not determine the Preview origin.' });
  }
  return res.status(200).json({ authUrl: forwardedProto + '://' + forwardedHost + '/api/auth' });
}
