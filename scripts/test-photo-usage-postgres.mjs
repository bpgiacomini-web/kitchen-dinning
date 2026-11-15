// Isolated real PostgreSQL engine; never connects to Neon or Blob.
import { PGlite } from '../test-tools/node_modules/@electric-sql/pglite/dist/index.js';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhotoUsage, PhotoUsageError } from '../api/_lib/photo-usage.cjs';
import photos from '../api/_lib/journal-photos.cjs';
import { consumeAccountRateLimit } from '../api/_lib/rate-limit.js';

const pg = new PGlite();
await pg.exec(await readFile(new URL('../architecture-v2/migrations/004_photo_usage.sql',import.meta.url),'utf8'));
await pg.exec(await readFile(new URL('../architecture-v2/migrations/004_photo_usage.sql',import.meta.url),'utf8'));
await pg.exec(await readFile(new URL('../architecture-v2/migrations/003_durable_rate_limits.sql',import.meta.url),'utf8'));
const db = async (parts,...values) => (await pg.query(parts.reduce((text,part,i)=>text+(i?'$'+i:'')+part,''),values)).rows;
const state = async id => (await pg.query('SELECT * FROM metro_eats_photo_usage WHERE store_id=$1',[id])).rows[0];
const seed = (id,list,options={})=>createPhotoUsage({db,storeId:id,list,...options});
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}});
const bytes=Buffer.alloc(32);bytes.write('RIFF');bytes.write('WEBP',8);bytes.write('VP8 ',12);bytes[23]=0x9d;bytes[24]=1;bytes[25]=0x2a;bytes.writeUInt16LE(500,26);bytes.writeUInt16LE(400,28);
const request={method:'POST',query:{mode:'photo-upload'},body:{collection:'recipes',id:'r',image:bytes.toString('base64')}};
const allowed=async()=>({allowed:true});
const journal=async()=>[{payload:{recipes:[{id:'r'}]}}];

test('paginated baseline survives cold starts; repeated reads and uploads do not list again',async()=>{
 let lists=0,checks=0;
 const list=async options=>{lists++;if(!options.cursor)return {blobs:Array.from({length:1000},()=>({size:2})),hasMore:true,cursor:'page2'};assert.equal(options.cursor,'page2');return {blobs:[{size:3}],hasMore:false};};
 const usage=seed('paged',list,{beforeList:async()=>{checks++}});
 assert.equal(await usage.getUsage(),2003);
 for(let i=0;i<20;i++)assert.equal(await seed('paged',()=>{throw Error('unexpected list')}).getUsage(),2003);
 assert.equal(await usage.reserve(32,900000000),2035);
 assert.equal(await usage.getUsage(),2035);
 assert.equal(lists,2);assert.equal(checks,2);
});

test('parallel workers reserve atomically at capacity and counters are store-scoped',async()=>{
 await seed('race',async()=>({blobs:[{size:90}],hasMore:false})).getUsage();
 const workers=Array.from({length:20},()=>seed('race',()=>{throw Error('no inventory needed')}));
 const results=await Promise.allSettled(workers.map(worker=>worker.reserve(5,100)));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,2);
 assert.ok(results.filter(r=>r.status==='rejected').every(r=>r.reason.status===413));
 assert.equal(Number((await state('race')).used_bytes),100);
 assert.equal(await seed('another-store',async()=>({blobs:[],hasMore:false})).getUsage(),0);
});

test('only one baseline worker lists; failed seed can retry without publishing partial totals',async()=>{
 let unblock,started;
 const entered=new Promise(resolve=>started=resolve),wait=new Promise(resolve=>unblock=resolve);
 const first=seed('initializing',async()=>{started();await wait;return {blobs:[{size:7}],hasMore:false}}).getUsage();
 await entered;
 await assert.rejects(seed('initializing',()=>{throw Error('duplicate scan')}).getUsage(),e=>e instanceof PhotoUsageError && e.status===503);
 unblock();assert.equal(await first,7);
 await assert.rejects(seed('failed',async()=>{throw Error('provider unavailable')}).getUsage(),/provider unavailable/);
 assert.equal((await state('failed')).initialized_at,null);
 assert.equal(await seed('failed',async()=>({blobs:[{size:4}],hasMore:false})).getUsage(),4);
});

test('expired lease cannot let an old worker overwrite newer accounting',async()=>{
 let unblock,started;
 const entered=new Promise(resolve=>started=resolve),wait=new Promise(resolve=>unblock=resolve);
 const old=seed('fenced',async()=>{started();await wait;return {blobs:[{size:1}],hasMore:false}}).getUsage();
 await entered;
 await pg.query("UPDATE metro_eats_photo_usage SET seed_until=now()-interval '1 second' WHERE store_id='fenced'");
 const newer=seed('fenced',async()=>({blobs:[{size:10}],hasMore:false}));
 assert.equal(await newer.getUsage(),10);assert.equal(await newer.reserve(5,100),15);
 unblock();await assert.rejects(old,/superseded/);
 assert.equal(await newer.getUsage(),15);
});

test('invalid/repeating pagination, negative sizes, and scan quota failure fail closed',async()=>{
 for(const [id,list,options] of [
  ['bad-cursor',async()=>({blobs:[],hasMore:true}),{}],
  ['repeat',async()=>({blobs:[],hasMore:true,cursor:'same'}),{}],
  ['negative',async()=>({blobs:[{size:-1}],hasMore:false}),{}],
  ['bounded',async()=>({blobs:[],hasMore:true,cursor:'next'}),{maxPages:1}],
  ['quota',async()=>{throw Error('must not list')},{beforeList:async()=>{throw new PhotoUsageError('quota',429,20)}}]
 ]){
  await assert.rejects(seed(id,list,options).reserve(32,100));
  assert.equal((await state(id)).initialized_at,null);
  assert.equal(Number((await state(id)).used_bytes),0);
 }
});

test('upload timeout keeps reserved bytes; handler success and usage checks consume no new lists',async()=>{
 let lists=0,puts=0;
 const usage=seed('handler',async()=>{lists++;return {blobs:[],hasMore:false}});
 const dependencies={userId:'owner',sql:journal,limit:allowed,usage,blob:{put:async()=>{puts++;throw Error('timeout after provider accepted bytes')}}};
 await assert.rejects(photos.handlePhotos(request,response(),dependencies),/timeout/);
 assert.equal(await usage.getUsage(),32);
 dependencies.blob.put=async path=>{puts++;return {pathname:path,url:'https://store.private.blob.vercel-storage.com/'+path}};
 const saved=response();await photos.handlePhotos(request,saved,dependencies);
 assert.equal(saved.code,200);assert.equal(saved.body.used,64);
 assert.ok(saved.body.photo.path.startsWith(photos.ownerPrefix('owner')));
 for(let i=0;i<10;i++){
  const res=response();await photos.handlePhotos({method:'GET',query:{mode:'photo-usage'}},res,dependencies);
  assert.equal(res.code,200);assert.equal(res.body.used,64);assert.equal(res.body.conservative,true);
 }
 assert.equal(lists,1);assert.equal(puts,2);
});

test('missing configuration and full capacity cannot write a photo',async()=>{
 assert.throws(()=>seed('',()=>{}),/not configured/);
 const usage=seed('full-handler',async()=>({blobs:[{size:photos.LIMIT_BYTES}],hasMore:false}));
 let puts=0;const res=response();
 await photos.handlePhotos(request,res,{userId:'owner',sql:journal,limit:allowed,usage,blob:{put:async()=>{puts++}}});
 assert.equal(res.code,413);assert.equal(puts,0);
});

test('shared photo quotas execute on the designated database and enforce their limit',async()=>{
 const options={scope:'photo-uploads',accountId:'metro-eats-photo-store',limit:2,windowSeconds:2592000,sql:db};
 assert.equal((await consumeAccountRateLimit(options)).allowed,true);
 assert.equal((await consumeAccountRateLimit(options)).allowed,true);
 const denied=await consumeAccountRateLimit(options);
 assert.equal(denied.allowed,false);assert.ok(denied.retryAfterSeconds>0);
});

test.after(async()=>{await pg.close()});
