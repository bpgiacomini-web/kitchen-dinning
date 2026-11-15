import test from 'node:test';
import assert from 'node:assert/strict';
import {dashboardCategory,renderJournalInsights} from '../src/features/journal-insights.mjs';
import {normalizeDataset} from '../src/domain/normalize.mjs';
test('dashboard cuisine bars count visits and keep recipe scores separate',()=>{
 const data=normalizeDataset({restaurants:[{id:'a',name:'QA Cafe',cuisine:'American',reviewHistory:[{overall:7,ratingScale:10},{overall:9,ratingScale:10}]}],recipes:[{id:'r',title:'QA Soup',ingredients:['x'],directions:['y'],overallRating:3}]});
 const model=dashboardCategory(data,'restaurants');assert.equal(model.count,1);assert.equal(model.rows[0].value,2);assert.equal(model.second,8);assert.equal(model.standout.item.id,'a');assert.equal(model.standout.value,8);assert.equal(dashboardCategory(data,'recipes').second,3);
});
test('bar dashboard shows each dimension and visit count without a combined score',()=>{
 const data=normalizeDataset({bars:[{id:'b',name:'Pub',visits:[{id:'v',atmosphere:8,drinkQuality:6,bartenders:9,restrooms:5}]}]});const model=dashboardCategory(data,'bars');assert.equal(model.secondLabel,'Visits');assert.deepEqual(model.rows.map(x=>x.value),[8,6,9,5]);assert.equal(model.standout.value,null);
});
test('dashboard embeds the map and exposes category panels with honest empty states',()=>{
 const html=renderJournalInsights(normalizeDataset({}));assert.ok(html.includes('class="dashboardMap"'));assert.equal((html.match(/role="tabpanel"/g)||[]).length,6);assert.ok(html.includes('A few ratings'));assert.ok(!html.includes('Journey Map ↗'));assert.ok(!html.includes('Explore Insights'));
});
