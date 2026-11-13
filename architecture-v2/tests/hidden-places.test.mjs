import test from 'node:test';
import assert from 'node:assert/strict';
import {filterHiddenPlaces,hiddenPlaceDescriptor,isHiddenPlace,validHiddenPlaces} from '../src/domain/hidden-places.mjs';
import {normalizeDataset} from '../src/domain/normalize.mjs';
import {pickCandidates} from '../src/features/personal-home.mjs';
const venue={id:'saved-a',name:"Joe's Cafe",address:'123 Main Street, Alton, Illinois',lat:38.9,lon:-90.2};
const hidden={...hiddenPlaceDescriptor(venue),id:'hidden-a',reason:'closed',hiddenAt:'2026-11-13T15:00:00.000Z'};
test('hiding is location-specific and independent of another account',()=>{
 const nearby={name:'Joes Cafe',address:'123, Main St, Alton, IL',lat:38.9001,lon:-90.2001};
 const otherBranch={...nearby,address:'456 Main St, Alton, IL',lat:38.91};
 assert.equal(isHiddenPlace(nearby,[hidden]),true);assert.equal(isHiddenPlace(otherBranch,[hidden]),false);
 assert.equal(isHiddenPlace(nearby,[]),false);assert.deepEqual(filterHiddenPlaces([nearby,otherBranch],[hidden]),[otherBranch]);
 const savedReview={...venue,reviewHistory:[{overall:8,ratingScale:10}],photoRefs:[{path:'unchanged'}]};
 const data=normalizeDataset({recipes:[],restaurants:[savedReview],hiddenPlaces:[hidden]});
 assert.equal(data.restaurants.length,1);assert.equal(data.restaurants[0].reviewHistory[0].overall,8);assert.deepEqual(data.restaurants[0].photoRefs,savedReview.photoRefs);
 assert.equal(pickCandidates(data,'all',[nearby,otherBranch]).length,1);
 assert.equal(pickCandidates({...data,hiddenPlaces:[]},'all',[nearby,otherBranch]).length,2);
});
test('hidden places survive normalization and require bounded specific locations',()=>{
 assert.equal(validHiddenPlaces([hidden]),true);assert.deepEqual(normalizeDataset({hiddenPlaces:[hidden]}).hiddenPlaces,[hidden]);
 assert.equal(validHiddenPlaces([hidden,{...hidden}]),false);
 assert.equal(validHiddenPlaces([{...hidden,lat:null,lon:null,address:'Alton, IL'}]),false);
 assert.equal(validHiddenPlaces([{...hidden,lat:Infinity}]),false);
 assert.equal(validHiddenPlaces([{...hidden,reason:'other'}]),false);
 assert.equal(validHiddenPlaces(Array.from({length:1001},(_,i)=>({...hidden,id:String(i)}))),false);
 assert.equal(validHiddenPlaces(undefined),true);
 assert.equal(isHiddenPlace({name:"Joe's Cafe",address:'123 Main St, Alton, IL'},[hidden]),true);
});
