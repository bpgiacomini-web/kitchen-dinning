// Metro Eats cloud data endpoint — intentionally fail-closed until authenticated
// per-user storage is implemented. Never read or write the legacy shared Blob.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  return res.status(503).json({
    error: 'Authenticated cloud storage is not configured.',
    code: 'CLOUD_STORAGE_NOT_READY'
  });
}
