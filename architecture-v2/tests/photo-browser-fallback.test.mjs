import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {optimizePhoto} from '../src/features/journal-photos.mjs';
const {validJpeg}=createRequire(import.meta.url)('../../api/_lib/journal-photos.cjs');
test('Safari PNG fallback is recompressed as JPEG under the same photo limits',async()=>{
 const oldDocument=globalThis.document,oldBitmap=globalThis.createImageBitmap;const calls=[];
 globalThis.createImageBitmap=async()=>({width:2400,height:1600,close(){}});
 const canvas={getContext:()=>({drawImage(){}}),toBlob(done,type,quality){calls.push({type,quality});done(new Blob(['photo'],{type:type==='image/webp'?'image/png':'image/jpeg'}));}};
 globalThis.document={createElement:()=>canvas};
 try{const result=await optimizePhoto({size:100000,type:'image/jpeg'});assert.equal(result.blob.type,'image/jpeg');assert.equal(result.width,1200);assert.equal(result.height,800);assert.deepEqual(calls.map(x=>x.type),['image/webp','image/jpeg']);}finally{globalThis.document=oldDocument;globalThis.createImageBitmap=oldBitmap;}
});
test('JPEG uploads validate dimensions and reject disguised or oversized images',()=>{
 const bytes=Buffer.from([255,216,255,192,0,8,8,3,32,4,176,1,255,217]);
 assert.equal(validJpeg(bytes),true);const large=Buffer.from(bytes);large.writeUInt16BE(1201,9);assert.equal(validJpeg(large),false);assert.equal(validJpeg(Buffer.from('fake jpeg')),false);assert.equal(validJpeg(bytes.subarray(0,10)),false);
});
