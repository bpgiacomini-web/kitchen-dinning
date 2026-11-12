import test from 'node:test';
import assert from 'node:assert/strict';
import { createRestaurantLookupHandler } from '../../api/restaurant-lookup.js';
const createFoodNewsHandler = ({fetchImpl}) => createRestaurantLookupHandler({fetcher:fetchImpl});
const recorder=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},json(body){this.body=body;return this}});
test('Preview news reloads the current public feed at a fixed URL without forwarding account credentials',async()=>{
  let observed;const handler=createFoodNewsHandler({fetchImpl:async(url,options)=>{if(url.includes("news.json")) observed={url,options};return {ok:true,text:async()=>JSON.stringify({updated:'2026-11-11',items:[{title:'New story',url:'https://example.org'}]})}}});
  const res=recorder();await handler({method:'POST',body:{mode:'food-news'},headers:{authorization:'secret'},query:{url:'https://other.test'}},res);
  assert.equal(res.code,200);assert.equal(observed.url,'https://bpgiacomini-web.github.io/kitchen-dinning/news.json');assert.equal(observed.options.headers.Authorization,undefined);assert.equal(res.body.items[0].title,'New story');
});
test('news failures are explicit and never reported as successful empty feeds',async()=>{
  for(const fetchImpl of [async()=>{throw Error('offline')},async()=>({ok:false}),async()=>({ok:true,text:async()=>'{}'})]){const res=recorder();await createFoodNewsHandler({fetchImpl})({method:'POST',body:{mode:'food-news'}},res);assert.equal(res.code,503);assert.ok(res.body.error);}
});
