import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '../test-tools/node_modules/@electric-sql/pglite/dist/index.js';
import {createUserDataHandler} from '../api/user-data.js';
import {createRestorePointsHandler} from '../api/restore-points.js';
import {createRecipeShareHandler} from '../api/recipe-share.js';
import photos from '../api/_lib/journal-photos.cjs';
const pg=new PGlite();await pg.exec(await readFile(new URL('../architecture-v2/migrations/002_private_recipe_storage.sql',import.meta.url),'utf8'));
function sql(parts,...values){const query={text:parts.reduce((text,part,i)=>text+(i?'$'+i:'')+part,''),values};query.then=(resolve,reject)=>pg.query(query.text,values).then(result=>result.rows).then(resolve,reject);return query;}
sql.transaction=queries=>pg.transaction(async tx=>{const results=[];for(const query of queries)results.push((await tx.query(query.text,query.values)).rows);return results;});
const response=()=>({statusCode:200,setHeader(){},status(code){this.statusCode=code;return this},json(body){this.body=body;return this},send(body){this.body=body;return this}});
const userData=createUserDataHandler({authenticateUser:async req=>({userId:req.headers['test-user']}),makeSql:async()=>sql});
const restore=createRestorePointsHandler({authenticateUser:async req=>req.headers['test-user'],makeSql:async()=>sql});
const share=createRecipeShareHandler({authenticateUser:async req=>req.headers['test-user'],makeSql:async()=>sql,consumeLimit:async()=>({allowed:true})});
const request=async(handler,user,method,body={},query={})=>{const res=response();await handler({method,headers:{'test-user':user},body,query},res);return res;};
const dataset=title=>({recipes:[{id:'same-id',title,ingredients:['1 cup flour'],directions:['Mix']}],restaurants:[],cats:[]});

test('two users sharing record IDs save and load separate data; spoofed owner fields cannot choose a row',async()=>{
 for(const user of ['test-A','test-B']){const fresh=await request(userData,user,'GET');assert.deepEqual(fresh.body.data.recipes,[]);const saved=await request(userData,user,'PUT',{expectedRevision:0,userId:'test-A',data:dataset(user)});assert.equal(saved.statusCode,200);}
 const b=await request(userData,'test-B','PUT',{expectedRevision:1,userId:'test-A',data:dataset('B edited')});assert.equal(b.statusCode,200);
 assert.equal((await request(userData,'test-A','GET')).body.data.recipes[0].title,'test-A');assert.equal((await request(userData,'test-B','GET')).body.data.recipes[0].title,'B edited');
 const stale=await request(userData,'test-A','PUT',{expectedRevision:0,data:dataset('stale')});assert.equal(stale.statusCode,409);
});

test('restore-point lists and direct IDs cannot read or overwrite another user',async()=>{
 await request(userData,'test-A','PUT',{expectedRevision:1,data:dataset('A edited')});
 const a=await request(restore,'test-A','GET'),b=await request(restore,'test-B','GET');
 assert.equal(a.body.restorePoints.length,1);assert.equal(b.body.restorePoints.length,1);assert.notEqual(a.body.restorePoints[0].id,b.body.restorePoints[0].id);
 const denied=await request(restore,'test-B','POST',{id:Number(a.body.restorePoints[0].id),expectedRevision:2,userId:'test-A'});assert.equal(denied.statusCode,404);
 assert.equal((await request(userData,'test-B','GET')).body.data.recipes[0].title,'B edited');
 const own=await request(restore,'test-A','POST',{id:Number(a.body.restorePoints[0].id),expectedRevision:2});assert.equal(own.statusCode,200);
 assert.equal((await request(userData,'test-A','GET')).body.data.recipes[0].title,'test-A');assert.equal((await request(userData,'test-B','GET')).body.data.recipes[0].title,'B edited');
});

test('one user cannot revoke another user recipe share even with the same recipe ID',async()=>{
 const created=await request(share,'test-A','POST',{recipeId:'same-id'});assert.equal(created.statusCode,201);
 await request(share,'test-B','DELETE',{recipeId:'same-id',owner_user_id:'test-A'});
 const stillPublic=await request(share,'','GET',{}, {token:created.body.token});assert.equal(stillPublic.statusCode,200);assert.equal(stillPublic.body.recipe.title,'test-A');
 await request(share,'test-A','DELETE',{recipeId:'same-id'});assert.equal((await request(share,'','GET',{}, {token:created.body.token})).statusCode,404);
});

test('private photo reads reject a different owner before contacting Blob',async()=>{
 let reads=0;const path=photos.ownerPrefix('test-A')+'00000000-0000-0000-0000-000000000001.webp',res=response();
 await photos.handlePhotos({method:'GET',query:{mode:'photo-read',path}},res,{userId:'test-B',sql,limit:async()=>({allowed:true}),blob:{get:async()=>{reads++;throw Error('must not contact Blob')}}});
 assert.equal(res.statusCode,404);assert.equal(reads,0);
});
test.after(()=>pg.close());
