import { createHash, randomBytes } from 'node:crypto';
import { consumeAccountRateLimit, sendRateLimitResponse } from './_lib/rate-limit.js';

const authBaseUrl = process.env.NEON_AUTH_BASE_URL;
const jwksUrl = process.env.NEON_AUTH_JWKS_URL;
const hashToken = token => createHash('sha256').update(token).digest('hex');

async function getUser(req) {
  const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match || !authBaseUrl || !jwksUrl) return null;
  try {
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    const { payload } = await jwtVerify(match[1], createRemoteJWKSet(new URL(jwksUrl)), { issuer: new URL(authBaseUrl).origin });
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch { return null; }
}

export function createRecipeShareHandler({ makeSql = async () => {
  if (!process.env.DATABASE_URL) return null;
  const { neon } = await import('@neondatabase/serverless');
  return neon(process.env.DATABASE_URL);
}, authenticateUser = getUser, consumeLimit = consumeAccountRateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    try {
      const sql = await makeSql();
      if (!sql) return res.status(503).json({ error: 'Preview database is not configured.' });
      if (req.method === 'GET') {
        const token = typeof req.query?.token === 'string' ? req.query.token : '';
        if (!/^[A-Za-z0-9_-]{40,100}$/.test(token)) return res.status(404).json({ error: 'This shared recipe is unavailable.' });
        const rows = await sql`SELECT r.payload, s.owner_user_id FROM metro_eats_recipe_shares s
          JOIN metro_eats_recipes r ON r.user_id = s.owner_user_id AND r.id = s.recipe_id
          WHERE s.token_hash = ${hashToken(token)} AND s.revoked_at IS NULL LIMIT 1`;
        if (!rows.length) return res.status(404).json({ error: 'This shared recipe is unavailable.' });
        const quota = await consumeLimit({ scope: 'shared-recipe-read', accountId: rows[0].owner_user_id, limit: 300, windowSeconds: 3600 });
        if (!quota.allowed) return sendRateLimitResponse(res, quota.retryAfterSeconds);
        return res.status(200).json({ recipe: rows[0].payload });
      }
      if (!['POST', 'DELETE'].includes(req.method)) {
        res.setHeader('Allow', 'GET, POST, DELETE');
        return res.status(405).json({ error: 'Method not allowed.' });
      }
      const userId = await authenticateUser(req);
      if (!userId) return res.status(401).json({ error: 'Sign in to manage recipe links.' });
      const recipeId = String(req.body?.recipeId || '').trim();
      if (!recipeId || recipeId.length > 180) return res.status(400).json({ error: 'A valid recipe is required.' });
      if (req.method === 'DELETE') {
        await sql`UPDATE metro_eats_recipe_shares SET revoked_at = now()
          WHERE owner_user_id = ${userId} AND recipe_id = ${recipeId} AND revoked_at IS NULL`;
        return res.status(200).json({ ok: true });
      }
      const recipe = await sql`SELECT payload FROM metro_eats_recipes WHERE user_id = ${userId} AND id = ${recipeId} LIMIT 1`;
      if (!recipe.length) return res.status(404).json({ error: 'Save this recipe to your account before sharing it.' });
      const secret = randomBytes(32).toString('base64url');
      const tokenHash = hashToken(secret);
      await sql`UPDATE metro_eats_recipe_shares SET revoked_at = now()
        WHERE owner_user_id = ${userId} AND recipe_id = ${recipeId} AND revoked_at IS NULL`;
      await sql`INSERT INTO metro_eats_recipe_shares (token_hash, owner_user_id, recipe_id)
        VALUES (${tokenHash}, ${userId}, ${recipeId})`;
      return res.status(201).json({ token: secret });
    } catch (error) {
      console.error('Metro Eats recipe share request failed', error?.name || 'UnknownError');
      return res.status(503).json({ error: 'Recipe sharing is temporarily unavailable.' });
    }
  };
}

export default createRecipeShareHandler();
