import { head } from '@vercel/blob';

// A distinct key prevents the read-only preview from exposing production records.
const PATH = 'metro-eats/architecture-preview-data.json';

/**
 * Read-only data endpoint for the isolated architecture preview.
 * Intentionally exposes GET only; no writes are permitted here.
 */
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'Preview data storage is not configured.' });
  }

  try {
    const blob = await head(PATH, { token });
    const response = await fetch(blob.url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Blob read failed: ${response.status}`);
    return res.status(200).json(await response.json());
  } catch (error) {
    if (error?.name === 'BlobNotFoundError' || error?.statusCode === 404 ||
        error?.status === 404 || error?.code === 'BLOB_NOT_FOUND' ||
        error?.code === 'not_found' ||
        /requested blob does not exist/i.test(String(error?.message || ''))) {
      return res.status(200).json({ recipes: [], restaurants: [] });
    }
    console.error('Metro Eats preview data read failed', error);
    return res.status(503).json({ error: 'Preview data service unavailable.' });
  }
}
