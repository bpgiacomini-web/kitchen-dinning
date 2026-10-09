-- Metro Eats initial schema migration
-- Target: NON-PRODUCTION Neon branch only.
-- This file is committed for review; it has NOT been applied to any database.
--
-- RLS policies below rely on Neon Auth's JWT-aware auth.user_id() helper.
-- Run queries through a Neon Auth/Data API path that validates the caller JWT.
-- Do not use a privileged DATABASE_URL from browser code. A trusted server using
-- unrestricted credentials must independently enforce the same ownership rules.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id text PRIMARY KEY,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipe_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  parent_id uuid REFERENCES public.recipe_categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, parent_id, name)
);

CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text,
  servings text,
  prep_minutes integer CHECK (prep_minutes IS NULL OR prep_minutes >= 0),
  cook_minutes integer CHECK (cook_minutes IS NULL OR cook_minutes >= 0),
  total_minutes integer CHECK (total_minutes IS NULL OR total_minutes >= 0),
  category text,
  subcategory text,
  ingredients_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  directions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  address text,
  city text,
  region text,
  postal_code text,
  country text DEFAULT 'US',
  website text,
  phone text,
  provider_place_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  visited_at timestamptz,
  ordered_items_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  personal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.restaurant_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  visit_id uuid REFERENCES public.restaurant_visits(id) ON DELETE SET NULL,
  overall_rating numeric(3,2) CHECK (overall_rating IS NULL OR overall_rating BETWEEN 0 AND 5),
  category_ratings_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  review_text text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id text NOT NULL,
  storage_key text NOT NULL,
  content_type text,
  byte_size bigint CHECK (byte_size IS NULL OR byte_size >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, storage_key)
);

CREATE INDEX IF NOT EXISTS recipes_owner_updated_idx
  ON public.recipes (owner_user_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS recipe_categories_owner_parent_idx
  ON public.recipe_categories (owner_user_id, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS visits_owner_date_idx
  ON public.restaurant_visits (owner_user_id, visited_at DESC);
CREATE INDEX IF NOT EXISTS visits_restaurant_idx
  ON public.restaurant_visits (restaurant_id);
CREATE INDEX IF NOT EXISTS reviews_owner_updated_idx
  ON public.restaurant_reviews (owner_user_id, updated_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS reviews_public_restaurant_idx
  ON public.restaurant_reviews (restaurant_id, published_at DESC)
  WHERE published_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS media_assets_owner_idx
  ON public.media_assets (owner_user_id, created_at DESC);

-- Enable RLS everywhere. Policies fail closed unless the request has a verified
-- Neon Auth JWT context. Restaurant directory writes are intentionally not granted
-- to end users in this initial migration.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_owner_select ON public.user_profiles;
CREATE POLICY profiles_owner_select ON public.user_profiles
  FOR SELECT USING (user_id = (SELECT auth.user_id()));
DROP POLICY IF EXISTS profiles_owner_insert ON public.user_profiles;
CREATE POLICY profiles_owner_insert ON public.user_profiles
  FOR INSERT WITH CHECK (user_id = (SELECT auth.user_id()));
DROP POLICY IF EXISTS profiles_owner_update ON public.user_profiles;
CREATE POLICY profiles_owner_update ON public.user_profiles
  FOR UPDATE USING (user_id = (SELECT auth.user_id()))
  WITH CHECK (user_id = (SELECT auth.user_id()));

DROP POLICY IF EXISTS categories_owner_all ON public.recipe_categories;
CREATE POLICY categories_owner_all ON public.recipe_categories
  FOR ALL USING (owner_user_id = (SELECT auth.user_id()))
  WITH CHECK (owner_user_id = (SELECT auth.user_id()));

DROP POLICY IF EXISTS recipes_owner_all ON public.recipes;
CREATE POLICY recipes_owner_all ON public.recipes
  FOR ALL USING (owner_user_id = (SELECT auth.user_id()))
  WITH CHECK (owner_user_id = (SELECT auth.user_id()));

DROP POLICY IF EXISTS restaurants_public_read ON public.restaurants;
CREATE POLICY restaurants_public_read ON public.restaurants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS visits_owner_all ON public.restaurant_visits;
CREATE POLICY visits_owner_all ON public.restaurant_visits
  FOR ALL USING (owner_user_id = (SELECT auth.user_id()))
  WITH CHECK (owner_user_id = (SELECT auth.user_id()));

DROP POLICY IF EXISTS reviews_owner_select ON public.restaurant_reviews;
CREATE POLICY reviews_owner_select ON public.restaurant_reviews
  FOR SELECT USING (owner_user_id = (SELECT auth.user_id()) OR
    (published_at IS NOT NULL AND deleted_at IS NULL));
DROP POLICY IF EXISTS reviews_owner_insert ON public.restaurant_reviews;
CREATE POLICY reviews_owner_insert ON public.restaurant_reviews
  FOR INSERT WITH CHECK (owner_user_id = (SELECT auth.user_id()));
DROP POLICY IF EXISTS reviews_owner_update ON public.restaurant_reviews;
CREATE POLICY reviews_owner_update ON public.restaurant_reviews
  FOR UPDATE USING (owner_user_id = (SELECT auth.user_id()))
  WITH CHECK (owner_user_id = (SELECT auth.user_id()));
DROP POLICY IF EXISTS reviews_owner_delete ON public.restaurant_reviews;
CREATE POLICY reviews_owner_delete ON public.restaurant_reviews
  FOR DELETE USING (owner_user_id = (SELECT auth.user_id()));

DROP POLICY IF EXISTS media_owner_all ON public.media_assets;
CREATE POLICY media_owner_all ON public.media_assets
  FOR ALL USING (owner_user_id = (SELECT auth.user_id()))
  WITH CHECK (owner_user_id = (SELECT auth.user_id()));

COMMIT;
