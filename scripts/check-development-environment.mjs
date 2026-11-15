import { fileURLToPath } from 'node:url';
import path from 'node:path';

const productionEndpoint = 'ep-proud-wildflower-b70u7a8q';
const productionStore = 'store_Qqch1rwiTtBYtvWr';
const required = ['DATABASE_URL', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_JWKS_URL', 'VITE_NEON_AUTH_URL', 'BLOB_STORE_ID', 'PHOTO_STORAGE_STORE_ID'];

export function validateDevelopmentEnvironment(env) {
  const errors = [];
  if (!['development', 'preview'].includes(env.METRO_ENVIRONMENT)) errors.push('Set METRO_ENVIRONMENT to development or preview.');
  for (const key of required) if (!env[key]?.trim()) errors.push(`Missing ${key}.`);
  for (const key of ['DATABASE_URL', 'PHOTO_STORAGE_DATABASE_URL', 'NEON_AUTH_BASE_URL', 'NEON_AUTH_JWKS_URL', 'VITE_NEON_AUTH_URL']) {
    if (!env[key]) continue;
    try {
      const url = new URL(env[key]);
      if (url.hostname.includes(productionEndpoint)) errors.push(`${key} points to the live owner resource.`);
      if (key.includes('DATABASE')) {
        if (!['postgres:', 'postgresql:'].includes(url.protocol)) errors.push(`${key} must be a PostgreSQL URL.`);
      } else if (url.protocol !== 'https:') errors.push(`${key} must use HTTPS.`);
    } catch { errors.push(`${key} is not a valid URL.`); }
  }
  for (const key of ['BLOB_STORE_ID', 'PHOTO_STORAGE_STORE_ID']) {
    if (env[key]?.replace(/^store_/, '') === productionStore.replace(/^store_/, '')) errors.push(`${key} points to the live photo store.`);
  }
  if (env.BLOB_STORE_ID && env.PHOTO_STORAGE_STORE_ID && env.BLOB_STORE_ID.replace(/^store_/, '') !== env.PHOTO_STORAGE_STORE_ID.replace(/^store_/, '')) errors.push('Blob and accounting store IDs must identify the same test store.');
  if (env.NEON_AUTH_BASE_URL && env.VITE_NEON_AUTH_URL && env.NEON_AUTH_BASE_URL.replace(/\/$/, '') !== env.VITE_NEON_AUTH_URL.replace(/\/$/, '')) errors.push('Auth URLs must identify the same test auth tenant.');
  if (env.NEON_AUTH_BASE_URL && env.NEON_AUTH_JWKS_URL && env.NEON_AUTH_JWKS_URL !== env.NEON_AUTH_BASE_URL.replace(/\/$/, '') + '/.well-known/jwks.json') errors.push('JWKS URL must belong to the test auth tenant.');
  return errors;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2]) {
    try { process.loadEnvFile(process.argv[2]); }
    catch { console.error('Could not load the requested local environment file.'); process.exit(1); }
  }
  const errors = validateDevelopmentEnvironment(process.env);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Development configuration passed: test-resource IDs only. Live connectivity and OIDC access still require verification.');
}
