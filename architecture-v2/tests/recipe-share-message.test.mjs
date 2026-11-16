import test from 'node:test';import assert from 'node:assert/strict';import {recipeShareMessage} from '../src/domain/recipe-share.mjs';
test('recipe sharing identifies Metro Eats and the selected recipe without including private account fields',()=>{
 const result=recipeShareMessage({title:'Sausage Gravy',notes:'private notes',userId:'private-id'},'https://example.test/share-recipe/?token=sample');
 assert.equal(result.title,'Sausage Gravy · Metro Eats');assert.match(result.text,/Metro Eats.*Sausage Gravy/);assert.equal(result.url,'https://example.test/share-recipe/?token=sample');assert.doesNotMatch(JSON.stringify(result),/private/);
});
