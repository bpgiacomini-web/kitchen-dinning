import test from 'node:test';
import assert from 'node:assert/strict';
import {createLocationService} from '../src/features/device-location.mjs';
test('restaurants and bars share a request and reloads reuse this tabs precise fix',async()=>{
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};let calls=0,resolve;const geo={getCurrentPosition(ok){calls++;resolve=ok}};
 const locate=createLocationService({geo,storage,now:()=>1000});const ask=fn=>new Promise((ok,no)=>fn(ok,no));const a=ask(locate),b=ask(locate);assert.equal(calls,1);resolve({coords:{latitude:38,longitude:-90}});await Promise.all([a,b]);
 const reload=createLocationService({geo,storage,now:()=>2000});assert.equal((await ask(reload)).coords.latitude,38);assert.equal(calls,1);
 const fresh=new Promise((ok,no)=>reload(ok,no,{maximumAge:0}));assert.equal(calls,2);resolve({coords:{latitude:39,longitude:-90}});assert.equal((await fresh).coords.latitude,39);
});
test('expired coordinates request a new device fix',async()=>{
 let calls=0;const locate=createLocationService({storage:{getItem:()=>JSON.stringify({lat:38,lon:-90,time:1}),setItem(){}},now:()=>1000000,geo:{getCurrentPosition(ok){calls++;ok({coords:{latitude:40,longitude:-90}})}}});await new Promise((ok,no)=>locate(ok,no));assert.equal(calls,1);
});
test('denied shared request releases its lock so an explicit fresh retry can succeed',async()=>{
 let calls=0,request;const geo={getCurrentPosition(ok,no,options){calls++;request={ok,no,options};}};
 const locate=createLocationService({geo});const ask=options=>new Promise((ok,no)=>locate(ok,no,options));
 const a=ask(),b=ask();request.no({code:1});const failed=await Promise.allSettled([a,b]);assert.ok(failed.every(r=>r.status==='rejected'));assert.equal(calls,1);
 const retry=ask({maximumAge:0,enableHighAccuracy:true,timeout:20000});assert.equal(calls,2);assert.equal(request.options.maximumAge,0);assert.equal(request.options.enableHighAccuracy,true);request.ok({coords:{latitude:40,longitude:-89}});assert.equal((await retry).coords.latitude,40);
});
