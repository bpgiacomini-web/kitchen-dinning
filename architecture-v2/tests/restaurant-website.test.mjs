import test from 'node:test';
import assert from 'node:assert/strict';
import {createRestaurantLookupHandler} from '../../api/restaurant-lookup.js';
import {fillRestaurantWebsite} from '../src/domain/restaurant-lookup.mjs';
const recorder=()=>({statusCode:200,setHeader(){},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}});
const request=place=>({method:'POST',headers:{},body:{mode:'website',place}});
const place={name:'Website QA Cafe',lat:40,lon:-100};
const allowed={authenticate:async()=>({userId:'test'}),limitRequests:async()=>({allowed:true})};
test('selected website lookup uses exact venue and caches details without fetching arbitrary websites',async()=>{
 let calls=0;
 const handler=createRestaurantLookupHandler({...allowed,fetcher:async url=>{calls++;assert.match(String(url),/^https:\/\/overpass\./);return {ok:true,json:async()=>({elements:[
 {lat:40.02,lon:-100,tags:{name:place.name,amenity:'restaurant',website:'https://wrong-branch.example'}},
 {lat:40,lon:-100,tags:{name:'Different Cafe',amenity:'restaurant',website:'https://wrong-name.example'}},
 {lat:40,lon:-100,tags:{name:place.name,amenity:'restaurant','contact:website':'qa-cafe.example'}}]})};}});
 for(let i=0;i<2;i++){const res=recorder();await handler(request(place),res);assert.equal(res.body.website,'https://qa-cafe.example/');}
 assert.equal(calls,1);
});
test('website lookup uses backup on outage, tolerates missing data, validates location and requires sign-in',async()=>{
 let calls=0;const handler=createRestaurantLookupHandler({...allowed,fetcher:async()=>{if(++calls===1)throw Error('down');return {ok:true,json:async()=>({elements:[]})};}});
 const res=recorder();await handler(request(place),res);assert.deepEqual(res.body,{website:''});assert.equal(calls,2);
 const bad=recorder();await handler(request({...place,lat:null}),bad);assert.equal(bad.statusCode,400);
 const denied=recorder();await createRestaurantLookupHandler({authenticate:async()=>({error:'Sign in',status:401})})(request(place),denied);assert.equal(denied.statusCode,401);
 const limited=recorder();await createRestaurantLookupHandler({...allowed,limitRequests:async()=>({allowed:false,retryAfterSeconds:60})})(request(place),limited);assert.equal(limited.statusCode,429);
});
function editor(){const fields=Object.fromEntries(['website','name','address'].map(key=>[key,{value:key==='name'?place.name:key==='address'?'123 Main St':'',isConnected:true,listeners:new Map(),addEventListener(type,fn){this.listeners.set(type,fn);},removeEventListener(type){this.listeners.delete(type);}}]));return {fields,querySelector:selector=>fields[selector.replace('#restaurant-','')]};}
test('website enrichment fills blank field but preserves manual edits, navigation and changed selection',async()=>{
 for(const action of ['fill','manual','leave','selection','clear-manual']){
 const root=editor();let resolve;const pending=fillRestaurantWebsite(root,place,{getToken:async()=>'test-token',fetcher:(url,options)=>{assert.equal(options.headers.Authorization,'Bearer test-token');return new Promise(done=>{resolve=done;});}});
 await Promise.resolve();
 if(action==='manual'){root.fields.website.value='https://mine.example';root.fields.website.listeners.get('input')();}
 if(action==='clear-manual'){root.fields.website.listeners.get('input')();}
 if(action==='leave')root.fields.website.isConnected=false;
 if(action==='selection')root.fields.name.value='Another Cafe';
 resolve({ok:true,json:async()=>({website:'qa-cafe.example'})});await pending;
 assert.equal(root.fields.website.value,action==='fill'?'https://qa-cafe.example/':action==='manual'?'https://mine.example':'');
 }
 const root=editor();root.fields.website.value='https://existing.example';await fillRestaurantWebsite(root,place,{getToken:async()=>'test-token',fetcher:()=>{throw Error('should not fetch');}});assert.equal(root.fields.website.value,'https://existing.example');
});
