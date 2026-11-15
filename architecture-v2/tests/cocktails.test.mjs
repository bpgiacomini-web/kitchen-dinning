import test from 'node:test';
import assert from 'node:assert/strict';
import { validCocktailCollections, summarizeCocktailCollection } from '../src/domain/cocktails.mjs';
import { normalizeDataset } from '../src/domain/normalize.mjs';
import { renderJournalInsights } from '../src/features/journal-insights.mjs';
import { awardSearchLinks, validAward } from '../src/domain/restaurant-awards.mjs';
export const cocktailFixture = () => ({
  bars:[{id:'b1',name:'Sample Bar',favorite:true,visits:[{id:'v1',visitedAt:'2026-11-01',overallRating:4},{id:'v2',visitedAt:'2026-11-02',overallRating:8}]}],
  drinks:[{id:'d1',name:'Old Fashioned',barId:'b1',overallRating:9,triedAt:'2026-11-02'}],
  cocktailRecipes:[{id:'c1',name:'Home Sour',ingredients:['2 oz whiskey','1 oz lemon'],directions:['Shake with ice.'],overallRating:10}]
});
test('legacy datasets gain empty cocktail collections without losing records, awards, or metadata',()=>{
  const original={recipes:[{id:'r',title:'Soup',ingredients:['salt'],directions:['Mix']}],restaurants:[{id:'x',name:'Cafe',awards:[{name:'Legacy recognition'}]}],pizzas:[],custom:{preserve:true}};
  const copy=structuredClone(original),result=normalizeDataset(original);
  assert.deepEqual(original,copy);assert.deepEqual(result.restaurants[0].awards,copy.restaurants[0].awards);assert.deepEqual(result.custom,copy.custom);
  assert.deepEqual(result.bars,[]);assert.deepEqual(result.drinks,[]);assert.deepEqual(result.cocktailRecipes,[]);
  const mixed=normalizeDataset({...original,...cocktailFixture()});assert.deepEqual(mixed.drinks,cocktailFixture().drinks);
});
test('cocktail validation accepts legacy and complete datasets and rejects broken references and malformed scores',()=>{
  assert.equal(validCocktailCollections({}),true);assert.equal(validCocktailCollections(cocktailFixture()),true);
  for(const change of [{bars:null},{drinks:[{id:'d',name:'Drink',barId:'missing'}]},{drinks:[{id:'d',name:'Drink',overallRating:11}]},{cocktailRecipes:[{id:'c',name:'Recipe',ingredients:[],directions:['Mix']}]},{bars:[{id:'b',name:'Bar',website:'javascript:alert(1)',visits:[]}]},{bars:[{id:'b',name:'Bar',visits:[{id:'v',visitedAt:'2026-02-30'}]}]}]) assert.equal(validCocktailCollections({...cocktailFixture(),...change}),false);
});
test('venue averages count repeat visits and never incorporate drink or recipe scores',()=>{
  const fixture=cocktailFixture();const result=summarizeCocktailCollection(fixture.bars,{visits:true});
  assert.equal(result.averageRating,6);assert.equal(result.visitCount,2);assert.equal(result.visited,1);assert.equal(result.favoriteCount,1);
  assert.equal(summarizeCocktailCollection(fixture.drinks).averageRating,9);assert.equal(summarizeCocktailCollection(fixture.cocktailRecipes).averageRating,10);
});
test('insights render category navigation, separate averages, and safe labels even when unrated',()=>{
  const data=normalizeDataset({...cocktailFixture(),recipes:[{id:'r',title:'<script>',ingredients:['a'],directions:['b'],overallRating:7}],restaurants:[],pizzas:[]});
  const html=renderJournalInsights(data);
  for(const view of ['dining','recipes','pizzas','cocktails'])assert.ok(html.includes(`data-view="${view}"`));
  assert.ok(html.includes('data-cocktail-category="cocktailRecipes"'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('Overall rating across'));
  assert.ok(renderJournalInsights(normalizeDataset({})).includes('Unrated'));
});
test('awards need source, year, location, and approval; searches never assert an award exists',()=>{
  const award={id:'a',name:'Best New Restaurant finalist',year:2026,level:'Local',source:'Publisher',sourceUrl:'https://example.org/awards',location:'Alton',approvedAt:new Date().toISOString()};
  assert.equal(validAward(award),true);
  for(const change of [{approvedAt:''},{year:0},{sourceUrl:'javascript:alert(1)'},{location:''},{source:''}])assert.equal(Boolean(validAward({...award,...change})),false);
  const links=awardSearchLinks({name:'Cafe & Bar',address:'Alton'});assert.equal(links.length,4);assert.ok(links.every(link=>new URL(link.url).searchParams.get('q').includes('Cafe & Bar Alton')));
});
