import { randomUUID } from 'node:crypto';

const MAX_BODY_BYTES = 1_500_000;
const EMPTY_DATASET = { recipes: [], restaurants: [], cats: [] };
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;

function send(res, status, body) {
  return res.status(status).json(body);
}

async function authenticatedUser(req) {
  if (!jwksUrl || !authBaseUrl) return { error: 'Preview authentication is not configured.' };
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    console.warn('Metro Eats user-data request has no bearer token');
    return { error: 'Sign in is required.', status: 401 };
  }
  try {
    // jose v6 is ESM-only. Load it dynamically because Vercel currently compiles
    // this project's API entrypoints from ESM to CommonJS during deployment.
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const jwks = createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jwtVerify(match[1], jwks, { issuer: new URL(authBaseUrl).origin });
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) return { error: 'Invalid session.', status: 401 };
    return { userId: payload.sub };
  } catch (error) {
    // Keep diagnostics useful without logging the JWT, its claims, or user data.
    console.warn('Metro Eats user-data token verification failed', error?.code || error?.name || 'UnknownError');
    return { error: 'Your session is invalid or expired. Please sign in again.', status: 401 };
  }
}

function validDataset(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!Array.isArray(value.recipes) || !Array.isArray(value.restaurants)) return false;
  if (value.cats != null && !Array.isArray(value.cats) && (typeof value.cats !== 'object' || value.cats === null)) return false;
  if (value.recipes.length > 10000 || value.restaurants.length > 10000) return false;
  const validRows = rows => rows.every(row => row && typeof row === 'object' && !Array.isArray(row)
    && typeof row.id === 'string' && row.id.trim().length > 0);
  if (!validRows(value.recipes) || !validRows(value.restaurants)) return false;
  if (new Set(value.recipes.map(row => row.id)).size !== value.recipes.length) return false;
  if (new Set(value.restaurants.map(row => row.id)).size !== value.restaurants.length) return false;
  if (value.recipes.some(row => typeof row.title !== 'string' || !row.title.trim()
    || !Array.isArray(row.ingredients) || !row.ingredients.length
    || !Array.isArray(row.directions) || !row.directions.length
    || row.ingredients.some(item => typeof item !== 'string' || !item.trim())
    || row.directions.some(item => typeof item !== 'string' || !item.trim()))) return false;
  return true;
}

function roughSize(value) {
  try { return Buffer.byteLength(JSON.stringify(value), 'utf8'); } catch { return Infinity; }
}

export function createUserDataHandler({ authenticateUser: authenticate = authenticatedUser, makeSql = async () => {
  if (!process.env.DATABASE_URL) return null;
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL);
} } = {}) {
 return async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Authorization');

  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { error: 'Method not allowed.' });
  }

  const identity = await authenticate(req);
  if (identity.error) return send(res, identity.status || 503, { error: identity.error });

  let sql;
  try {
    sql = await makeSql();
    if (!sql) return send(res, 503, { error: 'Preview database is not configured.' });
    if (req.method === 'GET') {
      const rows = await sql`SELECT payload, revision FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} LIMIT 1`;
      const recipes = await sql`SELECT payload FROM metro_eats_recipes WHERE user_id = ${identity.userId} ORDER BY updated_at DESC, id`;
      const restaurants = await sql`SELECT payload FROM metro_eats_restaurants WHERE user_id = ${identity.userId} ORDER BY created_at, id`;
      if (!rows.length) return send(res, 200, { data: { ...EMPTY_DATASET, recipes: recipes.map(row => row.payload), restaurants: restaurants.map(row => row.payload) }, revision: 0 });
      const restaurantMap = new Map(restaurants.map(row => [String(row.payload?.id || ''), row.payload]));
      for (const restaurant of Array.isArray(rows[0].payload.restaurants) ? rows[0].payload.restaurants : []) restaurantMap.set(String(restaurant.id || ''), restaurant);
      return send(res, 200, { data: { ...rows[0].payload, recipes: recipes.map(row => row.payload), restaurants: [...restaurantMap.values()] }, revision: Number(rows[0].revision) });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const dataset = body.data;
    const expectedRevision = body.expectedRevision;
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      return send(res, 400, { error: 'A valid expectedRevision is required.' });
    }
    if (!validDataset(dataset)) return send(res, 400, { error: 'Dataset must include recipe and restaurant arrays.' });
    if (roughSize(dataset) > MAX_BODY_BYTES) return send(res, 413, { error: 'Dataset is too large to save.' });

    // Use an UPDATE for existing datasets and an INSERT for first saves.
    // ON CONFLICT only runs when an INSERT actually has a row to insert, so
    // an INSERT ... SELECT ... WHERE expectedRevision = 0 cannot update an
    // existing dataset. Capture the old snapshot only when the CAS succeeds.
    const writeToken = randomUUID();
    const results = await sql.transaction([
      sql`
      WITH previous AS MATERIALIZED (
        SELECT payload FROM metro_eats_user_datasets
        WHERE user_id = ${identity.userId} AND revision = ${expectedRevision} AND ${expectedRevision} > 0
      ), updated AS (
        UPDATE metro_eats_user_datasets
        SET payload = ${JSON.stringify(dataset)}::jsonb,
            revision = revision + 1,
            updated_at = now(),
            last_write_token = ${writeToken}
        WHERE user_id = ${identity.userId} AND revision = ${expectedRevision} AND ${expectedRevision} > 0
        RETURNING revision
      ), inserted AS (
        INSERT INTO metro_eats_user_datasets (user_id, payload, revision, updated_at, last_write_token)
        SELECT ${identity.userId}, ${JSON.stringify(dataset)}::jsonb, 1, now(), ${writeToken}
        WHERE ${expectedRevision} = 0
        ON CONFLICT (user_id) DO NOTHING
        RETURNING revision
      ), backup AS (
        INSERT INTO metro_eats_restore_points (user_id, snapshot)
        SELECT ${identity.userId}, previous.payload FROM previous
        WHERE EXISTS (SELECT 1 FROM updated)
        RETURNING id
      )
      SELECT revision FROM updated
      UNION ALL
      SELECT revision FROM inserted
      `,
      sql`DELETE FROM metro_eats_recipes WHERE user_id = ${identity.userId}
        AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(dataset.recipes)}::jsonb))
        AND EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} AND last_write_token = ${writeToken})`,
      sql`INSERT INTO metro_eats_recipes (user_id, id, payload, revision, updated_at)
        SELECT ${identity.userId}, value->>'id', value, 1, now()
        FROM jsonb_array_elements(${JSON.stringify(dataset.recipes)}::jsonb) AS item(value)
        WHERE EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} AND last_write_token = ${writeToken})
        ON CONFLICT (user_id, id) DO UPDATE SET payload = EXCLUDED.payload,
          revision = metro_eats_recipes.revision + 1, updated_at = now()`,
      sql`DELETE FROM metro_eats_restaurants WHERE user_id = ${identity.userId}
        AND id NOT IN (SELECT value->>'id' FROM jsonb_array_elements(${JSON.stringify(dataset.restaurants)}::jsonb))
        AND EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} AND last_write_token = ${writeToken})`,
      sql`INSERT INTO metro_eats_restaurants (user_id, id, payload, revision, updated_at)
        SELECT ${identity.userId}, value->>'id', value, 1, now()
        FROM jsonb_array_elements(${JSON.stringify(dataset.restaurants)}::jsonb) AS item(value)
        WHERE EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} AND last_write_token = ${writeToken})
        ON CONFLICT (user_id, id) DO UPDATE SET payload = EXCLUDED.payload,
          revision = metro_eats_restaurants.revision + 1, updated_at = now()`,
      sql`DELETE FROM metro_eats_restore_points WHERE user_id = ${identity.userId} AND id NOT IN
        (SELECT id FROM metro_eats_restore_points WHERE user_id = ${identity.userId} ORDER BY created_at DESC, id DESC LIMIT 10)
        AND EXISTS (SELECT 1 FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} AND last_write_token = ${writeToken})`
    ]);
    const rows = results[0];
    if (!rows.length) {
      const current = await sql`SELECT revision FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} LIMIT 1`;
      return send(res, 409, { error: 'This dataset changed elsewhere. Reload before saving to avoid losing edits.', revision: current.length ? Number(current[0].revision) : 0 });
    }
    return send(res, 200, { ok: true, revision: Number(rows[0].revision) });
  } catch (error) {
    // Do not leak SQL, tokens, connection strings, or schema details to clients.
    console.error('Metro Eats user dataset request failed', error?.name || 'UnknownError');
    return send(res, 503, { error: 'Secure preview storage is unavailable. No data was reported as saved.' });
  }
 };
}

export default createUserDataHandler();
