import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';

const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const empty = { recipes: [], restaurants: [], cats: [] };

async function getUser(req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match || !authBaseUrl || !jwksUrl) return null;
  try {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(match[1], createRemoteJWKSet(new URL(jwksUrl)), { issuer: new URL(authBaseUrl).origin });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const userId = await getUser(req);
  if (!userId) return res.status(401).json({ error: 'Sign in to access restore points.' });
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Preview database is not configured.' });
  try {
    const sql = neon(process.env.DATABASE_URL);
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, created_at, jsonb_array_length(COALESCE(snapshot->'recipes','[]'::jsonb)) AS recipes,
        jsonb_array_length(COALESCE(snapshot->'restaurants','[]'::jsonb)) AS restaurants
        FROM metro_eats_restore_points WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC LIMIT 10`;
      const current = await sql`SELECT revision FROM metro_eats_user_datasets WHERE user_id = ${userId} LIMIT 1`;
      return res.status(200).json({ restorePoints: rows, revision: current.length ? Number(current[0].revision) : 0 });
    }
    const id = Number(req.body?.id);
    const expectedRevision = Number(req.body?.expectedRevision);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      return res.status(400).json({ error: 'Choose a valid restore point and reload the current dataset.' });
    }
    const point = await sql`SELECT snapshot FROM metro_eats_restore_points WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
    if (!point.length) return res.status(404).json({ error: 'That restore point is no longer available.' });
    const writeToken = randomUUID();
    const results = await sql.transaction([
      sql`INSERT INTO metro_eats_restore_points (user_id, snapshot)
        SELECT ${userId}, payload FROM metro_eats_user_datasets
        WHERE user_id = ${userId} AND revision = ${expectedRevision} AND ${expectedRevision} > 0`,
      sql`INSERT INTO metro_eats_user_datasets (user_id, payload, revision, updated_at, last_write_token)
        SELECT ${userId}, ${JSON.stringify(point[0].snapshot)}::jsonb, 1, now(), ${writeToken} WHERE ${expectedRevision} = 0
        ON CONFLICT (user_id) DO UPDATE SET payload = EXCLUDED.payload,
          revision = metro_eats_user_datasets.revision + 1, updated_at = now(), last_write_token = ${writeToken}
        WHERE metro_eats_user_datasets.revision = ${expectedRevision}
        RETURNING revision`,
      sql`DELETE FROM metro_eats_recipes WHERE user_id = ${userId}
        AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(point[0].snapshot.recipes || [])}::jsonb))
        AND EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${userId} AND last_write_token = ${writeToken})`,
      sql`INSERT INTO metro_eats_recipes (user_id, id, payload, revision, updated_at)
        SELECT ${userId}, value->>'id', value, 1, now() FROM jsonb_array_elements(${JSON.stringify(point[0].snapshot.recipes || [])}::jsonb) AS item(value)
        WHERE EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${userId} AND last_write_token = ${writeToken})
        ON CONFLICT (user_id, id) DO UPDATE SET payload = EXCLUDED.payload,
          revision = metro_eats_recipes.revision + 1, updated_at = now()`,
      sql`DELETE FROM metro_eats_restaurants WHERE user_id = ${userId}
        AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(point[0].snapshot.restaurants || [])}::jsonb))
        AND EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${userId} AND last_write_token = ${writeToken})`,
      sql`INSERT INTO metro_eats_restaurants (user_id, id, payload, revision, updated_at)
        SELECT ${userId}, value->>'id', value, 1, now() FROM jsonb_array_elements(${JSON.stringify(point[0].snapshot.restaurants || [])}::jsonb) AS item(value)
        WHERE EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${userId} AND last_write_token = ${writeToken})
        ON CONFLICT (user_id, id) DO UPDATE SET payload = EXCLUDED.payload,
          revision = metro_eats_restaurants.revision + 1, updated_at = now()`,
      sql`DELETE FROM metro_eats_restore_points WHERE user_id = ${userId} AND id NOT IN
        (SELECT id FROM metro_eats_restore_points WHERE user_id = ${userId} ORDER BY created_at DESC, id DESC LIMIT 10)`
    ]);
    const restored = results[1];
    if (!restored.length) return res.status(409).json({ error: 'Your data changed. Reload before restoring.' });
    return res.status(200).json({ ok: true, revision: Number(restored[0].revision) });
  } catch (error) {
    console.error('Metro Eats restore point request failed', error?.name || 'UnknownError');
    return res.status(503).json({ error: 'Restore points are unavailable. Your data was not reported as restored.' });
  }
}
