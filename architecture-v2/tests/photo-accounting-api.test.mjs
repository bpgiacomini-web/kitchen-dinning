import test from 'node:test';
import assert from 'node:assert/strict';
import { createUserDataHandler } from '../../api/user-data.js';

const response=()=>({setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}});

test('unconfigured photo accounting rejects uploads and usage checks before any database query',async()=>{
 let queries=0;
 const handler=createUserDataHandler({authenticateUser:async()=>({userId:'owner'}),
  makeSql:async()=>async()=>{queries++;throw Error('must not query journal')},makePhotoSql:async()=>null});
 for(const [method,mode] of [['GET','photo-usage'],['POST','photo-upload']]){
  const res=response();await handler({method,query:{mode},headers:{},body:{}},res);
  assert.equal(res.code,503);assert.equal(res.body.error,'Photo storage accounting is not configured.');
 }
 assert.equal(queries,0);
});

test('photo accounting remains behind authentication',async()=>{
 let databases=0;
 const handler=createUserDataHandler({authenticateUser:async()=>({error:'Sign in is required.',status:401}),
  makeSql:async()=>{databases++;throw Error('must not connect')},makePhotoSql:async()=>{databases++;throw Error('must not connect')}});
 const res=response();await handler({method:'GET',query:{mode:'photo-usage'},headers:{}},res);
 assert.equal(res.code,401);assert.equal(databases,0);
});
