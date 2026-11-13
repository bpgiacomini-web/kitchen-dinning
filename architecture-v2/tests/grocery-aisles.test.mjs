import test from 'node:test';
import assert from 'node:assert/strict';
import {groceryAisle} from '../src/features/grocery-planner.mjs';
test('pepper flakes and dried spices stay separate from fresh produce',()=>{
 for(const item of ['1/8 teaspoon crushed red pepper flakes','red pepper flakes (0.25 g)','1 tsp paprika','ground black pepper','dried basil','ground coriander'])assert.equal(groceryAisle(item),'Spices & Seasonings',item);
 for(const item of ['1 red bell pepper','2 onions','fresh basil','1 jalapeño pepper'])assert.equal(groceryAisle(item),'Produce',item);
});
