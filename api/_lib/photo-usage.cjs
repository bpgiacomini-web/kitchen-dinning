const { randomUUID } = require('node:crypto');

class PhotoUsageError extends Error {
 constructor(message, status = 503, retryAfterSeconds = 5) {
  super(message); this.status = status; this.retryAfterSeconds = retryAfterSeconds;
 }
}

// One durable row per physical Blob store. Every writer must use this same
// database and store ID. Never expire/reseed a ready counter automatically:
// reserved bytes include uploads whose outcome could not be confirmed.
function createPhotoUsage({ db, storeId, list, beforeList = async () => {}, maxPages = 10 }) {
 if (typeof storeId !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(storeId)) {
  throw new PhotoUsageError('Photo storage accounting is not configured.');
 }
 const read = async () => {
  const rows = await db`SELECT used_bytes FROM metro_eats_photo_usage
   WHERE store_id = ${storeId} AND initialized_at IS NOT NULL`;
  return rows.length ? Number(rows[0].used_bytes) : null;
 };
 async function getUsage() {
  const existing = await read();
  if (existing !== null) return existing;
  const token = randomUUID();
  const claimed = await db`
   INSERT INTO metro_eats_photo_usage AS usage (store_id, seed_token, seed_until)
   VALUES (${storeId}, ${token}, now() + interval '2 minutes')
   ON CONFLICT (store_id) DO UPDATE SET seed_token = EXCLUDED.seed_token,
    seed_until = EXCLUDED.seed_until
   WHERE usage.initialized_at IS NULL AND (usage.seed_until IS NULL OR usage.seed_until <= now())
   RETURNING store_id`;
  if (!claimed.length) {
   const ready = await read();
   if (ready !== null) return ready;
   throw new PhotoUsageError('Photo storage is being checked. Try again shortly.');
  }
  try {
   let used = 0, cursor;
   const seen = new Set();
   for (let page = 0; ; page++) {
    if (page >= maxPages) throw new PhotoUsageError('Photo inventory needs an administrator review.');
    await beforeList();
    const result = await list({ limit: 1000, ...(cursor ? { cursor } : {}) });
    if (!Array.isArray(result.blobs) || typeof result.hasMore !== 'boolean') throw new PhotoUsageError('Photo inventory could not be verified.');
    for (const item of result.blobs) {
     if (!Number.isSafeInteger(item.size) || item.size < 0 || !Number.isSafeInteger(used + item.size)) throw new PhotoUsageError('Photo inventory could not be verified.');
     used += item.size;
    }
    if (!result.hasMore) break;
    if (typeof result.cursor !== 'string' || !result.cursor || seen.has(result.cursor)) throw new PhotoUsageError('Photo inventory could not be verified.');
    cursor = result.cursor; seen.add(cursor);
   }
   const published = await db`UPDATE metro_eats_photo_usage
    SET used_bytes = ${used}, initialized_at = now(), seed_token = NULL, seed_until = NULL
    WHERE store_id = ${storeId} AND initialized_at IS NULL AND seed_token = ${token}
    RETURNING used_bytes`;
   if (!published.length) throw new PhotoUsageError('Photo storage check was superseded. Try again shortly.');
   return Number(published[0].used_bytes);
  } catch (error) {
   // Fencing token prevents a late worker from clearing a newer seed lease.
   await db`UPDATE metro_eats_photo_usage SET seed_token = NULL, seed_until = NULL
    WHERE store_id = ${storeId} AND initialized_at IS NULL AND seed_token = ${token}`;
   throw error;
  }
 }
 async function reserve(bytes, limit) {
  if (!Number.isSafeInteger(bytes) || bytes <= 0 || !Number.isSafeInteger(limit) || limit < bytes) throw new PhotoUsageError('Invalid photo storage reservation.');
  await getUsage();
  const rows = await db`UPDATE metro_eats_photo_usage
   SET used_bytes = used_bytes + ${bytes}
   WHERE store_id = ${storeId} AND initialized_at IS NOT NULL AND used_bytes <= ${limit - bytes}
   RETURNING used_bytes`;
  if (!rows.length) throw new PhotoUsageError('Photo storage is full. Upload stopped to keep Metro Eats free.', 413, 0);
  return Number(rows[0].used_bytes);
 }
 return { getUsage, reserve };
}

module.exports = { createPhotoUsage, PhotoUsageError };
