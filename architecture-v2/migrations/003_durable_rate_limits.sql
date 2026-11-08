-- Per-account API request limits for the isolated Metro Eats Preview.
-- Apply only to the Neon PREVIEW branch, never Production.
-- bucket_key contains a namespace plus a one-way hash, not a raw account ID.
CREATE TABLE IF NOT EXISTS metro_eats_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS metro_eats_rate_limits_expiry_idx
  ON metro_eats_rate_limits (expires_at);
