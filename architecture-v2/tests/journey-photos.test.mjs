import test from 'node:test';
import assert from 'node:assert/strict';
import photos from '../../api/_lib/journal-photos.cjs';
import publisher from '../../api/_lib/publisher-news.cjs';
import {recentJournalEntries,pickCandidates} from '../src/features/personal-home.mjs';
const record=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this},send(body){this.body=body;return this}});
const webp=(width=1200,height=800)=>{const bytes=Buffer.alloc(32);bytes.write('RIFF');bytes.write('WEBP',8);bytes.write('VP8 ',12);bytes[23]=0x9d;bytes[24]=1;bytes[25]=0x2a;bytes.writeUInt16LE(width,26);bytes.writeUInt16LE(height,28);return bytes;};
const sql=async()=>[{payload:{recipes:[{id:'r',title:'Soup'}]}}];
const allowed=async()=>({allowed:true});
test('photo uploads validate bytes, dimensions, ownership, and private storage references',async()=>{
 let writes=0;const sdk={list:async()=>({blobs:[],hasMore:false}),put:async(path,bytes,options)=>{writes++;assert.equal(options.access,'private');assert.ok(path.startsWith(photos.ownerPrefix('owner')));return {pathname:path,url:'https://store.private.blob.vercel-storage.com/'+path}}};
 const req={method:'POST',query:{mode:'photo-upload'},body:{collection:'recipes',id:'r',image:webp().toString('base64'),width:1200,height:800}},res=record();
 await photos.handlePhotos(req,res,{userId:'owner',sql,limit:allowed,blob:sdk});assert.equal(res.code,200);assert.equal(res.body.photo.bytes,32);assert.equal(res.body.photo.path.startsWith(photos.ownerPrefix('owner')),true);assert.equal(res.body.photo.image,undefined);
 for(const image of [Buffer.from('bad').toString('base64'),webp(1201).toString('base64'),Buffer.alloc(210000).toString('base64')]){const bad=record();await photos.handlePhotos({...req,body:{...req.body,image}},bad,{userId:'owner',sql,limit:allowed,blob:sdk});assert.equal(bad.code,400);}assert.equal(writes,1);
 const missing=record();await photos.handlePhotos({...req,body:{...req.body,id:'other'}},missing,{userId:'owner',sql,limit:allowed,blob:sdk});assert.equal(missing.code,404);
});
test('photos fail closed at storage and free-operation limits',async()=>{
 const req={method:'POST',query:{mode:'photo-upload'},body:{collection:'recipes',id:'r',image:webp().toString('base64')}};let written=false;
 const sdk={list:async()=>({blobs:[{size:photos.LIMIT_BYTES}],hasMore:false}),put:async()=>{written=true}};
 const full=record();await photos.handlePhotos(req,full,{userId:'owner',sql,limit:allowed,blob:sdk});assert.equal(full.code,413);assert.equal(written,false);
 const limited=record();await photos.handlePhotos(req,limited,{userId:'owner',sql,limit:async()=>({allowed:false,retryAfterSeconds:20}),blob:sdk});assert.equal(limited.code,429);
 const denied=record();await photos.handlePhotos({method:'GET',query:{mode:'photo-read',path:photos.ownerPrefix('other')+'fake.webp'}},denied,{userId:'owner',sql,limit:allowed,blob:sdk});assert.equal(denied.code,404);
});
test('recent memories and picks use saved personal records without changing them',()=>{
 const data={restaurants:[{id:'a',name:'Cafe',favorite:true,updatedAt:'2026-11-10'},{id:'b',name:'Pub',wantToTry:true,createdAt:'2026-11-11'}],recipes:[{id:'r',title:'Soup',createdAt:'2026-11-09'}]};
 assert.deepEqual(recentJournalEntries(data).map(row=>row.id),['b','a','r']);assert.deepEqual(pickCandidates(data,'favorites').map(row=>row.id),['a']);assert.deepEqual(pickCandidates(data,'want').map(row=>row.id),['b']);
});
test('publisher news uses real syndicated food pictures and rejects logo, unsafe and unrelated images',()=>{
 const story=(title,image)=>`<item><title>${title}</title><link>https://www.riverbender.com/articles/test.cfm</link><description><![CDATA[<img src="${image}">]]></description></item>`;
 const xml=story('New restaurant opens','https://www.riverbender.com/news/images/meal.jpg')+story('Election news','https://www.riverbender.com/news/images/a.jpg')+story('New restaurant','https://evil.test/meal.jpg')+story('New pizza place','https://www.riverbender.com/logo.png');
 const stories=publisher.publisherStories(xml);assert.equal(stories.length,1);assert.ok(stories[0].image.endsWith('meal.jpg'));
});
