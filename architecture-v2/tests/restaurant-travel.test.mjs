import test from 'node:test';
import assert from 'node:assert/strict';
import {homeJournalData,matchesRestaurantScope} from '../src/domain/restaurant-travel.mjs';
import {pickCandidates} from '../src/features/personal-home.mjs';
import {summarizeRestaurantInsights} from '../src/domain/restaurant-insights.mjs';
test('existing restaurants default to Home; Travel and All filters retain original records',()=>{
 const home={id:'home'},travel={id:'travel',travel:true};
 assert.equal(matchesRestaurantScope(home,'home'),true);
 assert.equal(matchesRestaurantScope(travel,'home'),false);
 assert.equal(matchesRestaurantScope(travel,'travel'),true);
 assert.equal(matchesRestaurantScope(home,'all'),true);
 const data={restaurants:[home,travel],recipes:[{id:'recipe'}]};
 assert.deepEqual(homeJournalData(data).restaurants,[home]);
 assert.equal(homeJournalData(data).recipes,data.recipes);
 assert.equal(data.restaurants.length,2);
});
test('travel ratings do not change home statistics or dinner suggestions',()=>{
 const home={id:'home',name:'Home Cafe',address:'123 Home Street',reviewHistory:[{id:'v1',ratingScale:10,overall:8}]};
 const travel={id:'travel',name:'Travel Cafe',address:'456 Travel Street',travel:true,reviewHistory:[{id:'v2',ratingScale:10,overall:2}]};
 const data={restaurants:[home,travel]};
 assert.equal(summarizeRestaurantInsights(homeJournalData(data).restaurants).averageRating,8);
 assert.equal(summarizeRestaurantInsights(data.restaurants).visitCount,2);
 const picks=pickCandidates(data,'all',[{name:home.name,address:home.address,distance:50},{name:travel.name,address:travel.address,distance:50}]);
 assert.deepEqual(picks.map(row=>row.name),[home.name]);
});
