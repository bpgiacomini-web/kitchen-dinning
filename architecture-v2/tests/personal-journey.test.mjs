import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesReviewFilter,journeyPlaces} from '../src/domain/personal-journey.mjs';
import {renderPersonalPatterns} from '../src/features/personal-patterns.mjs';
test('Review Later separates saved places from reviewed restaurants and bars',()=>{
 assert.equal(matchesReviewFilter({reviewHistory:[{overall:8}]},'later'),false);
 assert.equal(matchesReviewFilter({name:'New'},'later'),true);
 assert.equal(matchesReviewFilter({visits:[{}]},'reviewed','bars'),true);
 assert.equal(matchesReviewFilter({wantToTry:true},'want'),true);
});
test('journey pins reviewed places with matching coordinates and leaves unknown places unpinned',()=>{
 const data={restaurants:[{id:'a',name:"Fast Eddie's Bon Air",address:'1530 East 4th Street, Alton',reviewHistory:[{}]},{id:'b',name:'Unknown',address:'Paris',reviewHistory:[{}]},{id:'c',name:'Not visited',lat:1,lon:1}],bars:[{id:'d',name:'Pub',lat:40,lon:-90,visits:[{}]}]};
 const rows=journeyPlaces(data);assert.equal(rows.length,3);assert.ok(Number.isFinite(rows[0].lat));assert.equal(rows[1].lat,undefined);assert.equal(journeyPlaces(data,'bars').length,1);
});
test('expanded patterns start collapsed and keep categories distinct',()=>{
 const html=renderPersonalPatterns({restaurants:[],recipes:[],pizzas:[],bars:[],drinks:[],cocktailRecipes:[]});assert.ok(html.includes('Explore Insights'));assert.ok(!html.includes('<details open'));for(const title of ['Restaurants','Recipes','Frozen Pizzas','My Cocktails','The Barstool','Drinks'])assert.ok(html.includes('<h3>'+title+'</h3>'));
});
