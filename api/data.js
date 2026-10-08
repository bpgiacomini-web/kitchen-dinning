import { put, head } from '@vercel/blob';

const PATH = 'metro-eats/data.json';

export default async function handler(req, res) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'Blob storage is not configured.' });
    }

    if (req.method === 'GET') {
      try {
        const blob = await head(PATH, { token: process.env.BLOB_READ_WRITE_TOKEN });
        const response = await fetch(blob.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
        });
        if (!response.ok) throw new Error(`Blob read failed: ${response.status}`);
        const data = await response.json();
        return res.status(200).json(data);
      } catch (e) {
        if (e?.statusCode === 404 || e?.status === 404 || e?.code === 'BLOB_NOT_FOUND' || e?.code === 'not_found') {
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
      const blob = await put(PATH, JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        contentType: 'application/json',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return res.status(200).json({ ok: true, url: blob.url });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Metro Eats data API error', error);
    return res.status(500).json({ error: 'Metro Eats data service unavailable.' });
  }
}