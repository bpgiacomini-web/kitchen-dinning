import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeImageUrl,normalizeImportedRecipe} from '../src/features/recipes/import-parser.mjs';
import {pickCandidates,renderTonightPick} from '../src/features/personal-home.mjs';
import storage from '../../api/_lib/journal-photos.cjs';
test('recipe image extraction handles structured image forms and excludes unsafe addresses',()=>{
 for(const image of ['https://images.example.org/food.jpg',[{url:'https://images.example.org/food.jpg'}],{contentUrl:'https://images.example.org/food.jpg'}])assert.equal(recipeImageUrl(image),'https://images.example.org/food.jpg');
 for(const image of ['javascript:alert(1)','http://example.org/a.jpg','https://user:password@example.org/a.jpg','https://127.0.0.1/a.jpg','https://192.168.0.1/a.jpg'])assert.equal(recipeImageUrl(image),'');
 const recipe=normalizeImportedRecipe({name:'Soup',recipeIngredient:['Salt'],recipeInstructions:['Mix'],image:{url:'https://images.example.org/food.jpg'}});assert.equal(recipe.sourceImageUrl,'https://images.example.org/food.jpg');
});
test('coin picker starts empty and only draws from nearby restaurants',()=>{
 const data={restaurants:[{id:'reviewed',name:'Cafe',address:'Main',reviewHistory:[{}]},{id:'want',name:'New',wantToTry:true},{id:'saved',name:'Unreviewed'}]};
 const nearby=[{name:'Cafe',address:'Main'},{name:'Nearby Pub',address:'2 Main'}];
 const picks=pickCandidates(data,'all',nearby);assert.equal(picks.length,2);assert.ok(!picks.some(item=>item.id==='saved'));assert.ok(picks.every(item=>item.id.startsWith('nearby:')));
 const html=renderTonightPick(data,'all',null,nearby);assert.ok(html.includes('Flip for a restaurant'));assert.ok(!html.includes('pickResult'));assert.ok(renderTonightPick(data,'all',picks[0].id,nearby).includes('Reshuffle'));
});
test('unsaved restaurant photo drafts remain private without creating a journal record',async()=>{
 const bytes=Buffer.alloc(32);bytes.write('RIFF');bytes.write('WEBP',8);bytes.write('VP8 ',12);bytes[23]=0x9d;bytes[24]=1;bytes[25]=0x2a;bytes.writeUInt16LE(500,26);bytes.writeUInt16LE(400,28);
 let queried=false;const res={setHeader(){},status(code){this.code=code;return this},json(body){this.body=body;return this}};
 await storage.handlePhotos({method:'POST',query:{mode:'photo-upload'},body:{collection:'restaurants',id:'draft-00000000-0000-0000-0000-000000000000',draft:true,image:bytes.toString('base64')}},res,{userId:'owner',sql:async()=>{queried=true;return []},limit:async()=>({allowed:true}),usage:{reserve:async size=>size},blob:{list:async()=>({blobs:[],hasMore:false}),put:async path=>({pathname:path,url:'https://store.private.blob.vercel-storage.com/'+path})}});
 assert.equal(res.code,200);assert.equal(queried,false);assert.ok(res.body.photo.path.startsWith(storage.ownerPrefix('owner')));
});
