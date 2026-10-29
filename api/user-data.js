import { neon } from '@neondatabase/serverless';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const MAX_BODY_BYTES = 1_500_000;
const EMPTY_DATASET = { recipes: [], restaurants: [], cats: [] };
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
const jwks = jwksUrl ? createRemoteJWKSet(new URL(jwksUrl)) : null;

function send(res, status, body) {
  return res.status(status).json(body);
}

async function authenticatedUser(req) {
  if (!jwks || !authBaseUrl) return { error: 'Preview authentication is not configured.' };
  const header = String(req.headers.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { error: 'Sign in is required.', status: 401 };
  try {
    const { payload } = await jwtVerify(match[1], jwks, { issuer: new URL(authBaseUrl).origin });
    if (typeof payload.sub !== 'string' || !payload.sub.trim()) return { error: 'Invalid session.', status: 401 };
    return { userId: payload.sub };
  } catch {
    return { error: 'Your session is invalid or expired. Please sign in again.', status: 401 };
  }
}

function validDataset(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!Array.isArray(value.recipes) || !Array.isArray(value.restaurants)) return false;
  if (value.cats != null && !Array.isArray(value.cats) && (typeof value.cats !== 'object' || value.cats === null)) return false;
  return true;
}

function roughSize(value) {
  try { return Buffer.byteLength(JSON.stringify(value), 'utf8'); } catch { return Infinity; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Vary', 'Authorization');

  if (!['GET', 'PUT'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { error: 'Method not allowed.' });
  }

  const identity = await authenticatedUser(req);
  if (identity.error) return send(res, identity.status || 503, { error: identity.error });

  if (!process.env.DATABASE_URL) return send(res, 503, { error: 'Preview database is not configured.' });

  let sql;
  try {
    sql = neon(process.env.DATABASE_URL);
    if (req.method === 'GET') {
      const rows = await sql`SELECT payload, revision FROM metro_eats_user_datasets WHERE user_id = ${identity.userId} LIMIT 1`;
      if (!rows.length) return send(res, 200, { data: EMPTY_DATASET, revision: 0 });
      return send(res, 200, { data: rows[0].payload, revision: Number(rows[0].revision) });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const dataset = body.data;
    const expectedRevision = body.expectedRevision;
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
      return send(res, 400, { error: 'A valid expectedRevision is required.' });
    }
    if (!validDataset(dataset)) return send(res, 400, { error: 'Dataset must include recipe and restaurant arrays.' });
    if (roughSize(dataset) > MAX_BODY_BYTES) return send(res, 413, { error: 'Dataset is too large to save.' });

    const rows = await sql`
      INSERT INTO metro_eats_user_datasets (user_id, payload, revision, updated_at)
      VALUES (${identity.userId}, ${JSON.stringify(dataset)}::jsonb, 1, now())
      ON CONFLICT (user_id) DO UPDATE
      SET payload = EXCLUDED.payload,
          revision = metro_eats_user_datasets.revision + 1,
          updated_at = now()
      WHERE metro_eats_user_datasets.revision = ${expectedRevision}
      RETURNING revision
    `;
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
}
