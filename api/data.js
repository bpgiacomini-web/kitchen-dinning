import { head } from '@vercel/blob';

// This branch is a read-only architecture preview. Never read or write production data.
const PATH = 'metro-eats/architecture-preview-data.json';

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
      // Clearly labeled fixture records let the read-only preview exercise both lists
      // without copying, exposing, or modifying any production user data.
      return res.status(200).json({
        cats: ["Preview Test"],
        recipes: [{
          id: "preview-recipe-demo",
          title: "PREVIEW TEST — Simple Tomato Pasta",
          category: "Preview Test",
          subcategory: "Demo",
          servings: "2",
          totalTime: "20 minutes",
          ingredients: ["200 g pasta", "1 cup tomato sauce", "1 tablespoon olive oil"],
          directions: ["Boil pasta until tender.", "Warm the tomato sauce with olive oil.", "Toss together and serve."]
        }],
        restaurants: [{
          id: "preview-restaurant-demo",
          name: "PREVIEW TEST — Sample Restaurant",
          type: "Demo only",
          address: "Not a real restaurant",
          location: "Preview test record — not a real business",
          notes: "This is sample data used only to verify preview rendering. Do not treat as a real restaurant or review.",
          rating: null,
          reviewHistory: []
        }]
      });
    }
    console.error('Metro Eats preview data read failed', error);
    return res.status(503).json({ error: 'Preview data service unavailable.' });
  }
}
