import test from 'node:test';
import assert from 'node:assert/strict';
import {saveBarVisit,drinksForVisit,validCocktailCollections,summarizeCocktailCollection} from '../src/domain/cocktails.mjs';
import {importCocktailUrl,parseCocktailText} from '../src/features/cocktail-import.mjs';
const fixture=()=>({bars:[{id:'bar',name:'Bar',visits:[]}],drinks:[{id:'other',name:'Other drink',overallRating:3}],cocktailRecipes:[],recipes:[{id:'r',title:'Keep me'}]});
test('visit drinks are saved once and updated in place, with independent venue averages',()=>{
 const original=fixture();const visit={id:'v',visitedAt:'2026-11-11',overallRating:6};const drink={id:'d',name:'Sour',overallRating:9};
 const result=saveBarVisit(original,'bar',visit,[drink]);assert.equal(original.drinks.length,1);assert.equal(result.drinks.length,2);assert.equal(drinksForVisit(result,'bar','v')[0].triedAt,'2026-11-11');assert.equal(validCocktailCollections(result),true);
 const edited=saveBarVisit(result,'bar',{...visit,visitedAt:'2026-11-10'},[{...result.drinks[1],overallRating:10}]);assert.equal(edited.drinks.length,2);assert.equal(drinksForVisit(edited,'bar','v')[0].overallRating,10);assert.equal(edited.drinks[1].triedAt,'2026-11-10');assert.deepEqual(edited.recipes,original.recipes);
 assert.equal(summarizeCocktailCollection(edited.bars,{visits:true}).averageRating,6);
 const removed=saveBarVisit(edited,'bar',visit,[]);assert.deepEqual(removed.drinks,original.drinks);
 assert.throws(()=>saveBarVisit(result,'bar',visit,[{...drink,id:'other'}]),/reference/);
 assert.throws(()=>saveBarVisit(result,'bar',visit,[{...drink,name:''}]),/name/);
});
test('drink references must match an existing visit in the chosen bar',()=>{
 const data=saveBarVisit(fixture(),'bar',{id:'v',visitedAt:'2026-11-11'},[{id:'d',name:'Sour',overallRating:8}]);
 assert.equal(validCocktailCollections(data),true);data.drinks[1].visitId='missing';assert.equal(validCocktailCollections(data),false);data.drinks[1].visitId='';assert.equal(validCocktailCollections(data),true);
});
test('cocktail URL import reuses authenticated importer and produces only an unsaved draft',async()=>{
 let request;const draft=await importCocktailUrl('https://example.org/cocktail',{getToken:async()=>'fixture',fetcher:async(url,options)=>{request={url,options};return {ok:true,json:async()=>({recipe:{title:'Sour',ingredients:['2 oz whiskey','1 oz lemon'],directions:['Shake'],source:'https://example.org/cocktail'}})}}});
 assert.equal(request.url,'/api/import-recipe-v2');assert.equal(request.options.headers.Authorization,'Bearer fixture');assert.deepEqual(JSON.parse(request.options.body),{url:'https://example.org/cocktail'});assert.equal(draft.name,'Sour');assert.equal(draft.id,undefined);
 await assert.rejects(importCocktailUrl('https://example.org',{getToken:async()=>null}),/Sign in/);
 await assert.rejects(importCocktailUrl('javascript:alert(1)'),/public recipe/);
 await assert.rejects(importCocktailUrl('https://example.org',{getToken:async()=>'fixture',fetcher:async()=>({ok:false,json:async()=>({error:'Blocked. Paste text instead.'})})}),/Blocked/);
});
test('pasted cocktail fallback extracts ingredients and preparation without saving',()=>{
 const draft=parseCocktailText('Whiskey Sour\nIngredients\n2 oz bourbon\n1 oz lemon juice\nDirections\nShake with ice.\nStrain into a coupe.');assert.equal(draft.name,'Whiskey Sour');assert.equal(draft.ingredients.length,2);assert.ok(draft.directions.length);assert.throws(()=>parseCocktailText('No recipe here'),/complete recipe/);
});
