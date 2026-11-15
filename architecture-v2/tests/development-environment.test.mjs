import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDevelopmentEnvironment as check } from '../../scripts/check-development-environment.mjs';
const env = () => ({METRO_ENVIRONMENT:'development',DATABASE_URL:'postgresql://test:placeholder@ep-test.example/neondb',NEON_AUTH_BASE_URL:'https://test.example/neondb/auth',VITE_NEON_AUTH_URL:'https://test.example/neondb/auth',NEON_AUTH_JWKS_URL:'https://test.example/neondb/auth/.well-known/jwks.json',BLOB_STORE_ID:'store_test',PHOTO_STORAGE_STORE_ID:'store_test'});
test('isolated development resource configuration passes',()=>assert.deepEqual(check(env()),[]));
test('every production database or auth reference is rejected without exposing its value',()=>{
 for(const key of ['DATABASE_URL','PHOTO_STORAGE_DATABASE_URL','NEON_AUTH_BASE_URL','NEON_AUTH_JWKS_URL','VITE_NEON_AUTH_URL']) {
  const value=env();value[key]='postgresql://private-user:private-password@ep-proud-wildflower-b70u7a8q-pooler.example/neondb';
  const errors=check(value);assert.ok(errors.some(error=>error.includes('live owner')));assert.ok(!errors.join('').includes('private-password'));
 }
});
test('production media store and mismatched accounting store are rejected',()=>{
 for(const key of ['BLOB_STORE_ID','PHOTO_STORAGE_STORE_ID']) {const value=env();value[key]='store_Qqch1rwiTtBYtvWr';assert.ok(check(value).some(error=>error.includes('live photo')));}
 const value=env();value.PHOTO_STORAGE_STORE_ID='store_other';assert.ok(check(value).some(error=>error.includes('same test store')));
});
test('incomplete and mixed auth tenant configurations are rejected',()=>{
 assert.ok(check({}).length>=7);const value=env();value.NEON_AUTH_JWKS_URL='https://other.example/jwks';assert.ok(check(value).some(error=>error.includes('JWKS')));
});
