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
