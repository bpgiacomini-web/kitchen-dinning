-- Prepare on the designated photo-accounting database before candidate deploy.
-- All environments writing the same Blob store MUST use this database and the
-- same PHOTO_STORAGE_STORE_ID. Pause all writers while first inventory seeds.
-- Do not reset an initialized row or copy it to a different store.
CREATE TABLE IF NOT EXISTS metro_eats_photo_usage (
 store_id text PRIMARY KEY,
 used_bytes bigint NOT NULL DEFAULT 0 CHECK (used_bytes >= 0),
 initialized_at timestamptz,
 seed_token uuid,
 seed_until timestamptz
);
