import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBase = process.env.NEON_AUTH_BASE_URL;
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;

async function getUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !jwks || !authBase) return null;
  try {
    const { payload } = await jwtVerify(match[1], jwks, { issuer: new URL(authBase).origin });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const userId = await getUser(req);
  if (!userId) return res.status(401).json({ error: 'Please sign in to access your Metro Eats data.' });
  if (!databaseUrl) return res.status(503).json({ error: 'Preview database is not configured yet. Add DATABASE_URL for this preview branch.' });

  try {
    const sql = neon(databaseUrl);
    await sql`CREATE TABLE IF NOT EXISTS metro_eats_user_data (
      user_id TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{"recipes":[],"restaurants":[],"cats":[]}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    if (req.method === 'GET') {
      const rows = await sql`SELECT data FROM metro_eats_user_data WHERE user_id = ${userId} LIMIT 1`;
      const data = rows[0]?.data || { recipes: [], restaurants: [], cats: [] };
      return res.status(200).json(data);
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    if (!Array.isArray(body.recipes) || !Array.isArray(body.restaurants)) {
      return res.status(400).json({ error: 'Expected recipes and restaurants arrays.' });
    }
    if (JSON.stringify(body).length > 4_000_000) {
      return res.status(413).json({ error: 'This backup is too large to save in one request.' });
    }
    const data = {
      recipes: body.recipes,
      restaurants: body.restaurants,
      cats: Array.isArray(body.cats) ? body.cats : []
    };
    await sql`INSERT INTO metro_eats_user_data (user_id, data, updated_at)
      VALUES (${userId}, ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`;
    return res.status(200).json({ ok: true, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Metro Eats user-data API failed', error);
    return res.status(503).json({ error: 'Could not access the preview database. Check the preview database configuration.' });
  }
}
