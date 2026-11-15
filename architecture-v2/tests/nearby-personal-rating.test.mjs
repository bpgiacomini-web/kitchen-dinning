import test from 'node:test';
import assert from 'node:assert/strict';
import {nearbyPersonalRating} from '../src/domain/nearby-personal-rating.mjs';
test('nearby ratings match the reviewed location and average its visits',()=>{
 const saved={name:"Joe's Cafe",address:'123 Main Street, Alton, Illinois',reviewHistory:[{id:'1',overall:8,ratingScale:10},{id:'2',overall:6,ratingScale:10}]};
 assert.equal(nearbyPersonalRating({name:'Joes Cafe',address:'123, Main St, Alton, IL 62002'},[saved]),7);
 assert.equal(nearbyPersonalRating({name:'Joes Cafe',address:'456 Main St, Alton, IL'},[saved]),null);
 assert.equal(nearbyPersonalRating({name:'Joes Cafe'},[saved]),null);
 assert.equal(nearbyPersonalRating({name:'Other Cafe',address:saved.address},[saved]),null);
});
test('coordinate matches do not borrow a rating from a different branch',()=>{
 const saved={name:'Cafe',lat:38.9,lon:-90.2,rating:4,ratingScale:5};
 assert.equal(nearbyPersonalRating({name:'Cafe',lat:38.9001,lon:-90.2001},[saved]),8);
 assert.equal(nearbyPersonalRating({name:'Cafe',lat:39.9,lon:-90.2},[saved]),null);
 assert.equal(nearbyPersonalRating({name:'Cafe',lat:38.9,lon:-90.2},[{...saved,rating:null}]),null);
});
