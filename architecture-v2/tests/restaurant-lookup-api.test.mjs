import test from "node:test";
import assert from "node:assert/strict";
import { createRestaurantLookupHandler } from "../../api/restaurant-lookup.js";

function responseRecorder() {
  return {
    headers: {}, body: undefined, statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test("same-origin name lookup applies Vercel's approximate location as a search bias", async () => {
  let requested;
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    requested = new URL(url);
    return { ok: true, json: async () => ({ features: [{ properties: { name: "Fast Eddie's", osm_key: "amenity", osm_value: "restaurant" }, geometry: { coordinates: [-90.18, 38.89] } }] }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "Fast Eddie" }, headers: {
    "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(requested.searchParams.get("lat"), "38.89");
  assert.equal(requested.searchParams.get("lon"), "-90.18");
  assert.equal(requested.searchParams.get("location_bias_scale"), "0.1");
  assert.deepEqual(res.body.location, { lat: 38.89, lon: -90.18, city: "Alton", region: "", source: "network" });
  assert.equal(res.headers["Cache-Control"], "no-store, max-age=0");
});

test("known local restaurants remain searchable if Photon is unavailable", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("Photon unavailable"); } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "Delmar Public House" }, headers: {
    "x-vercel-ip-latitude": "38.93", "x-vercel-ip-longitude": "-90.24", "x-vercel-ip-city": "Godfrey"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.features.some(feature => feature.properties.name === "Delmar Public House"));
  assert.deepEqual(res.body.features.find(feature => feature.properties.name === "Delmar Public House").geometry.coordinates, [-90.24966, 38.93839]);
});

test("local restaurants remain searchable when Photon and Overpass are unavailable", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("map provider unavailable"); } });
  for (const [query, expected] of [
    ["Fast Eddie's", "Fast Eddie's Bon Air"],
    ["Mac's Downtown", "Mac's Downtown"],
    ["Regal Beagle", "Roper's Regal Beagle"]
  ]) {
    const res = responseRecorder();
    await handler({ method: "POST", body: { mode: "name", query }, headers: {
      "x-vercel-ip-latitude": "38.935", "x-vercel-ip-longitude": "-90.193", "x-vercel-ip-city": "Godfrey"
    } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.features.some(feature => feature.properties.name === expected), `${query} should be available from the local directory`);
  }
});

test("name lookup falls back to nearby OSM places when Photon has no match", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    const request = new URL(url);
    if (request.hostname === "photon.komoot.io") return { ok: true, json: async () => ({ features: [] }) };
    return { ok: true, json: async () => ({ elements: [
      { type: "node", lat: 38.89, lon: -90.18, tags: { name: "Mac's Downtown", amenity: "restaurant", "addr:city": "Alton", "contact:website": "https://macsdowntown.com/" } },
      { type: "node", lat: 38.92, lon: -90.19, tags: { name: "Roper's Regal Beagle", amenity: "restaurant", "addr:city": "Godfrey", website: "https://www.ropersregalbeagle.com/" } },
      { type: "node", lat: 38.90, lon: -90.18, tags: { name: "Other Cafe", amenity: "cafe" } }
    ] }) };
  } });

  for (const [query, expected] of [["Mac's Downtown", "Mac's Downtown"], ["Roper's Regal Beagle", "Roper's Regal Beagle"]]) {
    const res = responseRecorder();
    await handler({ method: "POST", body: { mode: "name", query }, headers: {
      "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
    } }, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.features.some(feature => feature.properties.name === expected));
    assert.ok(!res.body.features.some(feature => feature.properties.name === "Other Cafe"));
  }
});

test("name lookup uses the nearby fallback when Photon only finds a distant duplicate", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    const request = new URL(url);
    if (request.hostname === "photon.komoot.io") return { ok: true, json: async () => ({ features: [{
      type: "Feature",
      properties: { name: "Mac's Downtown", osm_key: "amenity", osm_value: "restaurant" },
      geometry: { type: "Point", coordinates: [-117.4, 47.7] }
    }] }) };
    return { ok: true, json: async () => ({ elements: [
      { type: "node", lat: 38.89, lon: -90.18, tags: { name: "Mac's Downtown", amenity: "restaurant", "addr:city": "Alton" } }
    ] }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "Mac's Downtown" }, headers: {
    "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.features.length >= 2);
  assert.ok(res.body.features.some(feature => feature.geometry.coordinates[0] === -90.18 && feature.geometry.coordinates[1] === 38.89));
});

test("nearby lookup falls back to approximate network location and returns closest food places", async () => {
  let requested;
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    requested = new URL(url);
    return { ok: true, json: async () => ({ elements: [
      { type: "node", lat: 38.90, lon: -90.18, tags: { name: "Nearby Cafe", amenity: "cafe", cuisine: "coffee_shop" } },
      { type: "node", lat: 38.89, lon: -90.18, tags: { name: "Nearby Fuel", amenity: "fuel" } }
    ] }) };
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby" }, headers: {
    "x-vercel-ip-latitude": "38.89", "x-vercel-ip-longitude": "-90.18", "x-vercel-ip-city": "Alton"
  } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(requested.searchParams.get("data"), /around:8047,38\.89,-90\.18/);
  assert.equal(res.body.places.find(place => place.name === "Nearby Cafe").distance, 1112);
  for (const name of ["Mac's Downtown", "Fast Eddie's Bon Air", "Roper's Regal Beagle", "Arandas MX Cocina"]) {
    assert.ok(res.body.places.some(place => place.name === name));
  }
  assert.equal(res.body.location.source, "network");
});

test("nearby results omit concessions and closed Chic N Pig, and add current local restaurants", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async url => {
    const request = new URL(url);
    if (request.hostname === "photon.komoot.io") return { ok: true, json: async () => ({ features: [
      { properties: { name: "Concession Stand", osm_key: "amenity", osm_value: "fast_food" }, geometry: { coordinates: [-90.191, 38.935] } },
      { properties: { name: "Chic N Pig", osm_key: "amenity", osm_value: "restaurant" }, geometry: { coordinates: [-90.1923, 38.935] } },
      { properties: { name: "Nearby Cafe", osm_key: "amenity", osm_value: "cafe" }, geometry: { coordinates: [-90.193, 38.935] } },
    ] }) };
    throw new Error("unexpected lookup fallback");
  } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby", location: { lat: 38.935, lon: -90.193 } }, headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.places[0].name, "Nearby Cafe");
  assert.ok(res.body.places.some(place => place.name === "Arandas MX Cocina" && place.website === "https://arandasmxcocina.com/"));
  assert.ok(res.body.places.some(place => place.name === "Delmar Public House" && place.website === "https://delmarpublichouse.com/"));
});

test("nearby lookup uses curated local restaurants when Photon and Overpass are unavailable", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("map provider unavailable"); } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby", location: { lat: 38.935, lon: -90.193 } }, headers: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.source, "directory-fallback");
  assert.ok(["Arandas MX Cocina", "Delmar Public House", "Fast Eddie's Bon Air", "Mac's Downtown", "Roper's Regal Beagle"]
    .every(name => res.body.places.some(place => place.name.toLowerCase().replace(/[^a-z0-9]/g,'') === name.toLowerCase().replace(/[^a-z0-9]/g,''))));
});

test("nearby search fails clearly when neither device nor network location exists", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("should not fetch"); } });
  const res = responseRecorder();
  await handler({ method: "POST", body: { mode: "nearby" }, headers: {} }, res);
  assert.equal(res.statusCode, 422);
  assert.match(res.body.error, /location are unavailable/i);
});

test("restaurant lookup accepts only POST and rejects malformed name searches", async () => {
  const handler = createRestaurantLookupHandler({ fetcher: async () => { throw new Error("should not fetch"); } });
  const wrongMethod = responseRecorder();
  await handler({ method: "GET", headers: {} }, wrongMethod);
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(wrongMethod.headers.Allow, "POST");
  const badQuery = responseRecorder();
  await handler({ method: "POST", body: { mode: "name", query: "x" }, headers: {} }, badQuery);
  assert.equal(badQuery.statusCode, 400);
});

test("nearby aliases inherit a verified local website at the matching location", async () => {
  const handler = createRestaurantLookupHandler({fetcher: async () => ({ok:true,json:async()=>({features:[
    {properties:{name:'Ropers Regal Beagle',osm_key:'amenity',osm_value:'restaurant'},geometry:{coordinates:[-90.190838,38.930969]}}
  ]})})});
  const res=responseRecorder();
  await handler({method:'POST',headers:{},body:{mode:'nearby',location:{lat:38.930969,lon:-90.190838}}},res);
  assert.equal(res.statusCode,200);
  const matching=res.body.places.filter(place=>/regal beagle/i.test(place.name));
  assert.equal(matching.length,1);
  assert.equal(matching[0].website,'https://www.ropersregalbeagle.com/');
});

test("bar discovery filters out restaurants for nearby and name searches", async () => {
 const feature=(name,type)=>({properties:{name,osm_key:'amenity',osm_value:type,website:'https://example.org'},geometry:{coordinates:[-90.19,38.93]}});
 const features=[feature('QA Pub','pub'),feature('QA Cafe','cafe'),feature('QA Restaurant','restaurant'),feature('QA Bar','bar')];
 const handler=createRestaurantLookupHandler({fetcher:async()=>({ok:true,json:async()=>({features})})});
 for(const mode of ['bar-nearby','bar-name']) {
  const res=responseRecorder();await handler({method:'POST',headers:{},body:{mode,query:'QA',location:{lat:38.93,lon:-90.19}}},res);
  assert.equal(res.statusCode,200);const names=(res.body.places || res.body.features.map(item=>({name:item.properties.name}))).map(item=>item.name);
  assert.ok(names.includes('QA Bar')&&names.includes('QA Pub'));assert.ok(!names.includes('QA Cafe')&&!names.includes('QA Restaurant'));if(mode==='bar-name')assert.equal(names.length,2);
 }
});

test('sparse successful primary results are supplemented by the backup provider',async()=>{
 const handler=createRestaurantLookupHandler({fetcher:async url=>({ok:true,json:async()=>String(url).includes('photon')?{features:[]}:{elements:[{lat:38.93,lon:-90.19,tags:{name:'Backup Pub',amenity:'pub'}}]}})});
 const res=responseRecorder();await handler({method:'POST',headers:{},body:{mode:'bar-nearby',location:{lat:38.93,lon:-90.19}}},res);
 assert.equal(res.statusCode,200);assert.equal(res.body.places[0].name,'Backup Pub');
});

test('cached nearby businesses remain available during provider outages',async()=>{
 const handler=createRestaurantLookupHandler({cacheLookup:async()=>({places:[{name:'Saved Pub',lat:38.93,lon:-90.19,distance:999}],updatedAt:'2026-11-01',fresh:false,skipRefresh:false,save(){throw Error('must not overwrite with failure')}}),fetcher:async()=>{throw Error('offline')}});
 const res=responseRecorder();await handler({method:'POST',headers:{},body:{mode:'bar-nearby',location:{lat:38.93,lon:-90.19}}},res);
 assert.equal(res.statusCode,200);assert.equal(res.body.places[0].name,'Saved Pub');assert.equal(res.body.places[0].distance,0);assert.equal(res.body.cache.stale,true);
});
test('fresh shared area cache avoids external provider calls',async()=>{
 const handler=createRestaurantLookupHandler({cacheLookup:async()=>({places:[{name:'Fresh Pub',lat:38.93,lon:-90.19}],fresh:true,skipRefresh:true}),fetcher:async()=>{throw Error('should not fetch')}});
 const res=responseRecorder();await handler({method:'POST',headers:{},body:{mode:'bar-nearby',location:{lat:38.93,lon:-90.19}}},res);assert.equal(res.statusCode,200);assert.equal(res.body.cache.stale,false);
});

test('dated local directory keeps restaurant and bar lists useful during an outage',async()=>{
 const handler=createRestaurantLookupHandler({cacheLookup:async()=>null,fetcher:async()=>{throw Error('offline')}});
 for(const mode of ['nearby','bar-nearby']){const res=responseRecorder();await handler({method:'POST',headers:{},body:{mode,location:{lat:38.93,lon:-90.19}}},res);assert.equal(res.statusCode,200);assert.ok(res.body.places.length>5);assert.equal(res.body.source,'directory-fallback');assert.equal(res.body.cache.stale,true);assert.ok(res.body.places.every(place=>place.distance<=8047));if(mode==='bar-nearby')assert.ok(res.body.places.every(place=>['bar','pub'].includes(place.amenity)));}
});
