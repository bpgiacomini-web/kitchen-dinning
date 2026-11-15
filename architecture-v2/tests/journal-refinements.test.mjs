import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCocktailText,cleanCocktailFields} from '../src/features/cocktail-import.mjs';
import {groceryRows} from '../src/features/grocery-planner.mjs';

test('Jameson-style pasted recipe joins quantities and excludes page controls and step headings',()=>{
 const recipe=parseCocktailText(`Home\nRecipes\nJameson Orange Tea\nPrint\nIngredients\nMETRIC\nPARTS\n4 PARTS\nJAMESON ORANGE\n2 PARTS\nELDERFLOWER LIQUEUR\n1 PART\nGRAPEFRUIT JUICE\n2 PARTS\nSOUR MIX\nSTEP-BY-STEP\nHow to make\nBuild the base\nPour 4 parts Jameson Orange into a shaker.\nAdd the flavor\nMix in 2 parts elderflower liqueur.\nShake it up\nShake well until chilled.\nPour & serve\nStrain into a shot glass.\nComments\nUnrelated footer`);
 assert.equal(recipe.name,'Jameson Orange Tea');
 assert.deepEqual(recipe.ingredients,['4 PARTS JAMESON ORANGE','2 PARTS ELDERFLOWER LIQUEUR','1 PART GRAPEFRUIT JUICE','2 PARTS SOUR MIX']);
 assert.equal(recipe.directions.length,4);
 assert.ok(!recipe.directions.some(line=>/flavor|serve|footer/i.test(line)));
});
test('cleaning an existing recipe does not invent a missing quantity or modify the source',()=>{
 const ingredients=['METRIC','PARTS','4 PARTS','WHISKEY','SOUR MIX','STEP-BY-STEP','Cheers'];
 const clean=cleanCocktailFields(ingredients,['Shake with ice.']);
 assert.deepEqual(clean.ingredients,['4 PARTS WHISKEY','SOUR MIX']);
 assert.equal(ingredients.length,7);
});
test('multi-recipe grocery list preserves distinct quantities and isolates recipe selection',()=>{
 const recipes=[{id:'a',title:'Soup',ingredients:['1 cup milk','2 onions']},{id:'b',title:'Sauce',ingredients:['200 ml milk']}];
 const rows=groceryRows(recipes,new Set(['a','b']));
 assert.equal(rows.length,3);assert.deepEqual(rows.filter(row=>row.aisle==='Dairy & Eggs').map(row=>row.text),['1 cup milk','200 ml milk']);
 assert.equal(groceryRows(recipes,new Set(['b'])).length,1);
 assert.equal(new Set(rows.map(row=>row.key)).size,3);
});
