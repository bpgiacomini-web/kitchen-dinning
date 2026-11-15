-- Metro Eats preview-only durable dataset storage.
-- Apply only to the Neon PREVIEW database, never production.
-- Each row belongs to one verified authenticated user; the server must derive user_id
-- from a validated Neon Auth JWT, never from a request body.
CREATE TABLE IF NOT EXISTS metro_eats_user_datasets (
  user_id text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{"recipes":[],"restaurants":[],"cats":[]}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object'),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS metro_eats_user_datasets_updated_at_idx
  ON metro_eats_user_datasets (updated_at DESC);
