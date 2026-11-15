import { createHash } from 'node:crypto';

function bucketKey(scope, accountId) {
  const digest = createHash('sha256').update(`${scope}\0${accountId}`).digest('hex');
  return `${scope}:${digest}`;
}

/** Atomically consume one request from a durable, fixed-window account limit. */
export async function consumeAccountRateLimit({ scope, accountId, limit, windowSeconds, sql: providedSql }) {
  if (!providedSql && !process.env.DATABASE_URL) throw new Error('Rate limit database is not configured.');
  const key = bucketKey(scope, accountId);
  let sql = providedSql;
  if (!sql) {
    const { neon } = await import('@neondatabase/serverless');
    sql = neon(process.env.DATABASE_URL);
  }
  const rows = await sql`
    INSERT INTO metro_eats_rate_limits AS current_limit
      (bucket_key, window_started_at, request_count, expires_at)
    VALUES (
      ${key}, now(), 1,
      now() + make_interval(secs => ${windowSeconds})
    )
    ON CONFLICT (bucket_key) DO UPDATE SET
      window_started_at = CASE
        WHEN current_limit.window_started_at + make_interval(secs => ${windowSeconds}) <= now() THEN now()
        ELSE current_limit.window_started_at
      END,
      request_count = CASE
        WHEN current_limit.window_started_at + make_interval(secs => ${windowSeconds}) <= now() THEN 1
        ELSE LEAST(current_limit.request_count + 1, ${limit + 1})
      END,
      expires_at = CASE
        WHEN current_limit.window_started_at + make_interval(secs => ${windowSeconds}) <= now()
          THEN now() + make_interval(secs => ${windowSeconds})
        ELSE current_limit.expires_at
      END
    RETURNING
      request_count <= ${limit} AS allowed,
      GREATEST(0, CEIL(EXTRACT(EPOCH FROM window_started_at + make_interval(secs => ${windowSeconds}) - now())))::int AS retry_after_seconds
  `;
  if (!rows.length) throw new Error('Rate limit result was empty.');
  return {
    allowed: rows[0].allowed === true,
    retryAfterSeconds: Math.max(1, Number(rows[0].retry_after_seconds) || windowSeconds)
  };
}

export function sendRateLimitResponse(res, retryAfterSeconds) {
  const seconds = Math.max(1, Math.ceil(Number(retryAfterSeconds) || 1));
  res.setHeader('Retry-After', String(seconds));
  return res.status(429).json({ error: 'Too many requests. Please try again later.' });
}
