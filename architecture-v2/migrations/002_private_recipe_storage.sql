-- Metro Eats preview schema for private recipes, restaurant reviews,
-- restore points, and explicitly shared recipes.
-- Apply only to the isolated Neon Preview branch.

CREATE TABLE IF NOT EXISTS metro_eats_user_datasets (
  user_id text PRIMARY KEY,
  payload jsonb NOT NULL DEFAULT '{"recipes":[],"restaurants":[],"cats":[]}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object'),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  last_write_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE metro_eats_user_datasets ADD COLUMN IF NOT EXISTS last_write_token text;

CREATE TABLE IF NOT EXISTS metro_eats_recipes (
  user_id text NOT NULL,
  id text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS metro_eats_recipes_owner_updated_idx
  ON metro_eats_recipes (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS metro_eats_restaurants (
  user_id text NOT NULL,
  id text NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS metro_eats_restore_points (
  id bigserial PRIMARY KEY,
  user_id text NOT NULL,
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS metro_eats_restore_points_owner_created_idx
  ON metro_eats_restore_points (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS metro_eats_recipe_shares (
  token_hash text PRIMARY KEY,
  owner_user_id text NOT NULL,
  recipe_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  FOREIGN KEY (owner_user_id, recipe_id)
    REFERENCES metro_eats_recipes (user_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS metro_eats_recipe_shares_owner_recipe_idx
  ON metro_eats_recipe_shares (owner_user_id, recipe_id);

-- Preserve existing restaurant/review data from the preview's legacy store.
-- Recipe data is intentionally not copied; the owner chose to start the
-- recipe collection fresh. ON CONFLICT makes this safe to re-run.
DO $$
BEGIN
  IF to_regclass('public.metro_eats_user_data') IS NOT NULL THEN
    EXECUTE $migration$
      INSERT INTO metro_eats_restaurants (user_id, id, payload, created_at, updated_at)
      SELECT legacy.user_id,
             COALESCE(NULLIF(btrim(item.value->>'id'), ''), 'legacy-' || md5(item.value::text)),
             item.value,
             now(),
             now()
      FROM metro_eats_user_data AS legacy
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(legacy.data->'restaurants') = 'array'
             THEN legacy.data->'restaurants' ELSE '[]'::jsonb END
      ) AS item(value)
      WHERE jsonb_typeof(item.value) = 'object'
      ON CONFLICT (user_id, id) DO NOTHING
    $migration$;
  END IF;
END $$;
