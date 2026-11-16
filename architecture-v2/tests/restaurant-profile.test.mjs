import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRestaurantProfile, prepareRestaurantVisits, removeRestaurantVisit, duplicateRestaurant, categoryScore, mergeRestaurantProfiles } from '../src/domain/restaurant-profile.mjs';
import { upsertRestaurantReview } from '../src/domain/restaurant-review.mjs';
import { restaurantProfileMarkup } from '../src/features/restaurant-profile.mjs';
const first={id:'one',visitedAt:'2026-11-01',ratingScale:10,overall:6,food:4,service:8,value:6,orderAgain:'Yes',photoRefs:[{path:'photo-one'}]};
const second={id:'two',visitedAt:'2026-11-15',ratingScale:10,overall:10,food:10,service:10,value:10,orderAgain:'No',photoRefs:[{path:'photo-two'}]};
test('master summary derives equal visit averages, dates, answered percentages and missing category counts',()=>{
 const s=summarizeRestaurantProfile({reviewHistory:[second,first,{id:'unrated',visitedAt:'2026-11-10'}],survey:second});
 assert.equal(s.count,3);assert.equal(s.average,8);assert.equal(s.lastVisit,'2026-11-15');
 assert.equal(s.orderAgainPercent,50);assert.equal(s.answered,2);
 assert.deepEqual(s.visits.map(v=>v.id),['two','unrated','one']);
 assert.deepEqual(s.categories.find(c=>c.key==='food'),{key:'food',label:'Food',average:7,count:2});
 assert.equal(s.categories.find(c=>c.key==='atmosphere').average,null);
});
test('legacy mirrored survey and original visits survive normalization without double counting',()=>{
 const legacy={...first};delete legacy.id;
 const original={name:'Test',unknown:{keep:true},reviewHistory:[first],survey:legacy};
 const saved=prepareRestaurantVisits(original);
 assert.equal(saved.reviewHistory.length,1);assert.deepEqual(saved.unknown,{keep:true});
 assert.equal(original.survey.id,undefined);assert.equal(saved.survey.id,'one');
 const twins=prepareRestaurantVisits({reviewHistory:[legacy,{...legacy}],survey:{...legacy}});
 assert.equal(twins.reviewHistory.length,2);assert.notEqual(twins.reviewHistory[0].id,twins.reviewHistory[1].id);
 assert.deepEqual(prepareRestaurantVisits(twins).reviewHistory,twins.reviewHistory);
});
test('legacy ID assignment cannot collide with an existing visit ID',()=>{
 const s=prepareRestaurantVisits({reviewHistory:[{overall:8},{id:'legacy-visit-0',overall:6}]});
 assert.equal(new Set(s.reviewHistory.map(v=>v.id)).size,2);
});
test('editing a visit and removing it recompute all summaries and retain standalone and shared photos',()=>{
 const restaurant={id:'r',name:'Test',notes:'Keep',primaryPhoto:'photo-two',reviewHistory:[first,second],survey:second,photoRefs:[{path:'photo-one'},{path:'photo-two'},{path:'cover'}]};
 const edited=upsertRestaurantReview(prepareRestaurantVisits(restaurant),{...first,overall:8},first);
 assert.equal(summarizeRestaurantProfile(edited).average,9);
 const remaining=removeRestaurantVisit(edited,'two');
 assert.equal(summarizeRestaurantProfile(remaining).average,8);assert.equal(summarizeRestaurantProfile(remaining).orderAgainPercent,100);
 assert.equal(remaining.survey.id,'one');assert.equal(remaining.primaryPhoto,'');
 assert.deepEqual(remaining.photoRefs.map(p=>p.path),['photo-one','cover']);
 const empty=removeRestaurantVisit(remaining,'one');
 assert.equal(empty.name,'Test');assert.equal(empty.notes,'Keep');assert.equal(empty.rating,null);assert.equal(empty.survey,null);
 assert.equal(summarizeRestaurantProfile(empty).count,0);
 assert.throws(()=>removeRestaurantVisit(empty,'missing'),/no longer/);
});
test('gallery retains all visits beyond four photos and deduplicates references',()=>{
 const visits=Array.from({length:8},(_,i)=>({id:String(i),photoRefs:[{path:'photo-'+i}]}));
 const s=summarizeRestaurantProfile({reviewHistory:visits,photoRefs:[{path:'photo-0'}],photos:['https://example.com/legacy.jpg']});
 assert.equal(s.gallery.length,9);
});
test('legacy ten-question survey category indexes and five-point ratings are respected',()=>{
 const old={scores:{0:8,1:7,2:6,3:9,4:5,5:4,6:3,7:2,8:1,9:10}};
 assert.equal(categoryScore(old,'service'),9);assert.equal(categoryScore(old,'value'),3);assert.equal(categoryScore(old,'atmosphere'),5);
 assert.equal(categoryScore({ratingScale:5,food:4},'food'),8);
 assert.equal(categoryScore({surveyScores:{atmosphere:4}},'atmosphere'),4);
});
test('duplicate prevention keeps separate branches and excludes the current profile',()=>{
 const existing={id:'r',name:'Test Cafe',address:'123 Main Street'};
 assert.equal(duplicateRestaurant({name:'TEST CAFE',address:'123 Main St'},[existing]),existing);
 assert.equal(duplicateRestaurant({...existing},[existing]),null);
 assert.equal(duplicateRestaurant({name:'Test Cafe',address:'456 Main St'},[existing]),null);
 assert.equal(duplicateRestaurant({name:'Test Cafe'},[existing]),null);
});
test('profile renders safe notes and links and visit actions only inside history',()=>{
 const html=restaurantProfileMarkup({id:'r',name:'<img onerror=alert(1)>',website:'javascript:alert(1)',notes:'<script>',reviewHistory:[first,second]});
 assert.ok(html.includes('Review Another Visit'));assert.ok(html.includes('Visit history'));
 assert.ok(!html.includes('href="javascript:'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));
 assert.ok(html.indexOf('Visit history')<html.indexOf('data-action="edit-restaurant-review"'));
});
test('explicit duplicate merge retains conflicting visit IDs, notes, unknown information and photos',()=>{
 const left={id:'left',name:'Cafe',notes:'Parking in back',reviewHistory:[first],custom:'left',photoRefs:[{path:'left-cover'}]};
 const right={id:'right',name:'CAFE',notes:'Closed Mondays',reviewHistory:[{...second,id:'one'}],custom:'right',website:'https://example.com',photoRefs:[{path:'right-cover'}]};
 const merged=mergeRestaurantProfiles(left,right);
 assert.equal(merged.id,'left');assert.equal(summarizeRestaurantProfile(merged).count,2);
 assert.equal(new Set(merged.reviewHistory.map(v=>v.id)).size,2);
 assert.equal(merged.website,right.website);assert.match(merged.notes,/Parking in back/);assert.match(merged.notes,/Closed Mondays/);
 assert.equal(merged.mergedRestaurantSources[0].custom,'right');assert.equal(merged.custom,'left');
 assert.equal(summarizeRestaurantProfile(merged).gallery.length,4);assert.equal(left.reviewHistory.length,1);
 const legacy=mergeRestaurantProfiles({id:'a',reviewHistory:[{overall:8}]},{id:'b',reviewHistory:[{overall:8}]});
 assert.equal(legacy.reviewHistory.length,2);
});
