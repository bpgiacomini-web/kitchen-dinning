import { put, head } from '@vercel/blob';

const PATH = 'metro-eats/data.json';
const TOKEN_TIMEOUT_MS = 8000;

// Bound storage operations so a stalled Blob request returns a useful HTTP error
// instead of leaving the browser's cloud-status check pending indefinitely.
function bounded(promise, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${TOKEN_TIMEOUT_MS}ms`)), TOKEN_TIMEOUT_MS);
    })
  ]).finally(() => clearTimeout(timer));
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
        const blob = await bounded(head(PATH, { token }), 'Cloud backup lookup');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TOKEN_TIMEOUT_MS);
        let response;
        try {
          response = await fetch(blob.url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            cache: 'no-store'
          });
        } finally {
          clearTimeout(timer);
        }
        if (!response.ok) throw new Error(`Blob read failed: ${response.status}`);
        const data = await bounded(response.json(), 'Cloud backup response');
        if (!data || !Array.isArray(data.recipes) || !Array.isArray(data.restaurants)) {
          throw new Error('Cloud backup data format is invalid.');
        }
        return res.status(200).json(data);
      } catch (e) {
        if (e?.name === 'BlobNotFoundError' || e?.statusCode === 404 || e?.status === 404 || e?.code === 'BLOB_NOT_FOUND' || e?.code === 'not_found' || /requested blob does not exist/i.test(String(e?.message || ''))) {
          return res.status(200).json({ recipes: [], restaurants: [] });
        }
        throw e;
      }
    }

    if (req.method === 'PUT') {
      const data = req.body;
      if (!data || !Array.isArray(data.recipes) || !Array.isArray(data.restaurants)) {
        return res.status(400).json({ error: 'Invalid Metro Eats data.' });
      }
      const blob = await bounded(put(PATH, JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
        contentType: 'application/json',
        token
      }), 'Cloud backup save');
      return res.status(200).json({ ok: true, url: blob.url });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Metro Eats data API error', error);
    const timedOut = /timed out|abort/i.test(String(error?.message || error?.name || ''));
    return res.status(timedOut ? 504 : 500).json({
      error: timedOut ? 'Cloud backup timed out. Device data remains on this device.' : 'Metro Eats data service unavailable.'
    });
  }
}