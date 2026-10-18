import { put, head } from '@vercel/blob';

const PATH = 'metro-eats/data.json';
const EMPTY = { recipes: [], restaurants: [] };

function isMissingBlob(error) {
  return error?.statusCode === 404 ||
    error?.status === 404 ||
    error?.code === 'BLOB_NOT_FOUND' ||
    error?.code === 'not_found';
}

function isValidData(data) {
  return !!data &&
    typeof data === 'object' &&
    Array.isArray(data.recipes) &&
    Array.isArray(data.restaurants);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Blob storage is not configured.' });
    }

    if (req.method === 'GET') {
      try {
        const blob = await head(PATH, { token });
        const response = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(`Blob read failed: ${response.status}`);
        const data = await response.json();
        if (!isValidData(data)) {
          return res.status(502).json({ error: 'Stored Metro Eats data is invalid.' });
        }
        return res.status(200).json(data);
      } catch (error) {
        if (isMissingBlob(error)) return res.status(200).json(EMPTY);
        throw error;
      }
    }

    if (req.method === 'PUT') {
      const data = req.body;
      if (!isValidData(data)) {
        return res.status(400).json({ error: 'Invalid Metro Eats data.' });
      }

      // Keep the stable pathname, but explicitly permit updating the existing file.
      // Short cache lifetime reduces stale reads after a successful save.
      const blob = await put(PATH, JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
        token
      });
      return res.status(200).json({ ok: true, etag: blob.etag || null });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Metro Eats data API error', error);
    return res.status(500).json({ error: 'Metro Eats data service unavailable.' });
  }
}
