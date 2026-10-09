# Metro Eats Database Schema Draft

Status: design draft only. This file is not an executable migration and does not create or alter any database objects.

## Design principles

- PostgreSQL is the eventual authoritative store; browser localStorage remains available during migration.
- All user-owned records include an owner identity from the verified Neon Auth session.
- Authorization must be enforced by server-side code and/or verified Neon Auth-compatible row-level security (RLS), never by UI filtering alone.
- Public community reviews are opt-in. A review is private unless `published_at` is non-null.
- Restaurant directory data is separate from each user's visit and review.
- Image binaries live in object storage; the database stores metadata and URLs/keys, not large base64 data URLs.
- Do not expose database credentials, privileged keys, or an unrestricted database client in browser JavaScript.

## Proposed tables

### `user_profiles`
- `user_id` (primary key; stable ID from verified auth session)
- `display_name` (nullable)
- `created_at`, `updated_at`

### `recipes`
- `id` (UUID primary key)
- `owner_user_id` (required)
- `title` (required)
- `description`, `servings`, `prep_minutes`, `cook_minutes`, `total_minutes`
- `category`, `subcategory`
- `ingredients_json`, `directions_json`, `metadata_json` (structured JSONB; validate in application)
- `created_at`, `updated_at`, `deleted_at` (soft-delete support during migration/recovery)

### `recipe_categories`
- `id` (UUID primary key)
- `owner_user_id` (required)
- `name` (required)
- `parent_id` (nullable self-reference for nested categories)
- `sort_order`
- `created_at`, `updated_at`

### `restaurants`
- `id` (UUID primary key)
- `name` (required)
- `address`, `city`, `region`, `postal_code`, `country`, `website`, `phone`
- `provider_place_id` (nullable external directory identifier)
- `created_at`, `updated_at`
- This is directory information, not a user's review.

### `restaurant_visits`
- `id` (UUID primary key)
- `owner_user_id` (required)
- `restaurant_id` (required foreign key)
- `visited_at` (nullable timestamp)
- `ordered_items_json` (nullable structured JSONB)
- `personal_notes` (private)
- `created_at`, `updated_at`

### `restaurant_reviews`
- `id` (UUID primary key)
- `owner_user_id` (required)
- `restaurant_id` (required foreign key)
- `visit_id` (nullable foreign key)
- `overall_rating` (nullable bounded numeric rating)
- `category_ratings_json`, `answers_json` (structured JSONB; validate in application)
- `review_text` (nullable)
- `published_at` (null means private draft; non-null means intentionally public)
- `created_at`, `updated_at`, `deleted_at`
- The author may edit/delete their own review. Public readers may read only published, non-deleted reviews.

### `media_assets`
- `id` (UUID primary key)
- `owner_user_id` (required)
- `storage_key` (required; no secret token)
- `content_type`, `byte_size`, `created_at`
- Access to private images must be authorized; never assume an unguessable URL is sufficient protection.

## Access-control matrix

| Resource | Owner | Other signed-in users | Public visitors |
|---|---|---|---|
| Profile | Read/update own | No access to private fields | No access |
| Recipes/categories | CRUD own | No access | No access |
| Restaurant directory | Read; proposed moderated writes | Read | Read if directory is public |
| Visits/personal notes | CRUD own | No access | No access |
| Review draft | CRUD own | No access | No access |
| Published review | CRUD own | Read only | Read only |
| Private media | Owner via authorized path | No access | No access |

## Required security implementation before use

1. Confirm the exact Neon Auth user ID/session claim and supported SQL helper functions for this provisioned integration.
2. Implement RLS policies using the verified Neon Auth mechanism; do not guess a helper such as `auth.user_id()` without verifying it against this project.
3. Apply least-privilege server access and validate all inputs.
4. Add indexes for owner IDs, restaurant IDs, published review visibility, and common search paths.
5. Test cross-user denial explicitly (User A cannot read/update/delete User B's private records; User B cannot alter User A's reviews).
6. Keep migration changes on the feature branch and apply to a non-production database branch first.

## Migration compatibility requirements

- Preserve the existing `metro_eats_v2` / `metro_eats_v1` local storage formats while the adapter is introduced.
- Do not automatically upload or overwrite user data without an explicit import/merge flow.
- Keep JSON export/restore working.
- Preserve existing recipes, restaurant search, visits/reviews, image support, navigation, news, and all current screens.
- No production credentials, schema, or deployments are changed by this draft.
