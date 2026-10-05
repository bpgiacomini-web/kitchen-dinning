
const KEY='metro_eats_v2';
const OLD_KEY='metro_eats_v1';
const categories={
 'Appetizers & Snacks':['Dips & Spreads','Finger Foods','Chips & Nachos','Wings','Charcuterie','Party Snacks'],
 'Breakfast & Brunch':['Eggs','Breakfast Meats','Pancakes & Waffles','French Toast','Biscuits & Gravy','Breakfast Casseroles','Brunch'],
 'Soups, Salads & Sandwiches':['Soups','Stews','Chili','Salads','Sandwiches','Burgers','Wraps'],
 'Main Dishes':['Beef','Pork','Chicken','Turkey','Seafood','Pasta','Casseroles','Meatless','Slow Cooker','One-Pot Meals'],
 'Mexican & Latin':['Tacos','Burritos','Enchiladas','Fajitas','Quesadillas','Nachos','Mexican Sides','Latin American'],
 'Italian':['Pasta','Pizza','Italian Beef','Chicken','Sauces','Italian Sides'],
 'BBQ & Grilling':['Steaks','Burgers','Ribs','Brisket','Pulled Pork','Chicken','Grilled Seafood','BBQ Sauces & Rubs'],
 'Side Dishes':['Potatoes','Rice','Vegetables','Mac & Cheese','Pasta Sides','Casseroles','Beans','Bread & Rolls'],
 'Sauces, Gravies & Condiments':['Sauces','Gravies','Marinades','Rubs','Dressings','Dips'],
 'Bread & Baking':['Breads','Biscuits','Rolls','Muffins','Cakes','Cookies','Pies','Pastries'],
 'Desserts':['Cakes','Pies','Cookies','Brownies & Bars','Ice Cream','Puddings','Fruit Desserts'],
 'Drinks':['Cocktails','Beer Drinks','Wine Drinks','Non-Alcoholic','Coffee','Tea','Smoothies & Shakes'],
 'Other':['Other']
};
const restaurantTypes=['American','Bar & Grill','BBQ','Burgers','Breakfast & Brunch','Cafés & Coffee','Chinese','Deli','Fast Food','Fine Dining','French','Indian','Italian','Japanese','Korean','Mediterranean','Mexican','Middle Eastern','Pizza','Seafood','Southern / Soul Food','Steakhouse','Thai','Vietnamese','Vegetarian / Vegan','Food Truck','Bakery','Dessert / Ice Cream','Brewery / Brewpub','Gastropub','Sports Bar','Other'];
const surveyQuestions=[['Overall Experience','Your overall impression of the visit.'],['Food Quality','Taste, freshness, preparation and consistency.'],['Menu & Selection','Variety, creativity and choices.'],['Service','Attentiveness, friendliness, professionalism and timing.'],['Atmosphere','Ambiance, comfort, noise level and vibe.'],['Cleanliness','Dining area, tables, restrooms and overall cleanliness.'],['Value for Money','Pricing, portions, quality and whether it felt worth it.'],['Drinks & Bar','Drink quality, selection, presentation and service.'],['Location & Accessibility','Parking, access, seating and convenience.'],['Would You Return?','How likely you are to return to this restaurant.']];
var ME_CRITIC_QUESTIONS=[
  ['Overall Experience','Your overall impression of the visit.'],
  ['Food Quality','Calculated from the individual dishes and drinks you rated.'],
  ['Service','Attentiveness, friendliness, professionalism and timing.'],
  ['Value','Pricing, portions, quality and whether it felt worth it.']
];
var ME_CRITIC_CATS=['Appetizers','Entrées','Salads','Soups','Sides','Desserts','Drinks'];
var ME_CRITIC_SUGGESTIONS={
  Pizza:['Pizza','Wings','Toasted Ravioli','Garlic Bread','Pasta','House Salad'],
  Mexican:['Tacos','Burrito','Enchiladas','Fajitas','Quesadilla','Nachos','Rice','Beans','Chips & Salsa'],
  BBQ:['Brisket','Ribs','Pulled Pork','Chicken','Sausage','Baked Beans','Coleslaw','Potato Salad'],
  Steakhouse:['Steak','Prime Rib','Burger','Chicken','Pork Chop','Salmon','Baked Potato','House Salad'],
  Italian:['Pizza','Pasta','Lasagna','Chicken Parmesan','Italian Beef','Calzone','Garlic Bread','Tiramisu'],
  Chinese:['Egg Rolls','Crab Rangoon','Fried Rice','Lo Mein','General Tso Chicken','Orange Chicken','Beef & Broccoli'],
  Japanese:['Sushi','Sashimi','Ramen','Teriyaki','Tempura','Gyoza','Miso Soup'],
  Indian:['Samosas','Tandoori Chicken','Chicken Tikka Masala','Butter Chicken','Biryani','Naan','Saag'],
  Thai:['Pad Thai','Drunken Noodles','Curry','Tom Yum Soup','Fried Rice','Spring Rolls'],
  Seafood:['Fish & Chips','Grilled Fish','Fried Shrimp','Crab Cakes','Salmon','Seafood Pasta','Coleslaw'],
  Burgers:['Burger','Chicken Sandwich','Wings','Fries','Onion Rings','Tater Tots','Side Salad'],
  'Breakfast & Brunch':['Eggs','Omelet','Pancakes','Waffles','French Toast','Biscuits & Gravy','Bacon','Sausage'],
  'Bar & Grill':['Wings','Burger','Steak','Chicken','Fish','Sandwich','Pretzel','Fries','Side Salad'],
  Other:['Appetizer','Entrée','Sandwich','Burger','Pizza','Salad','Soup','Side','Dessert']
};
var ME_CRITIC_ALIASES={'American':'Other','Deli':'Other','Fast Food':'Burgers','Fine Dining':'Steakhouse','French':'Steakhouse','Korean':'Other','Mediterranean':'Other','Middle Eastern':'Other','Vietnamese':'Other','Vegetarian / Vegan':'Other','Food Truck':'Other','Bakery':'Other','Dessert / Ice Cream':'Other','Brewery / Brewpub':'Bar & Grill','Gastropub':'Bar & Grill','Sports Bar':'Bar & Grill','Cafés & Coffee':'Breakfast & Brunch'};
const fallbackNews=[
 {title:'10 St. Louis restaurants with great burgers',source:'Sauce Magazine',date:'October 1, 2026',url:'https://www.saucemagazine.com/'},
 {title:'St. Louis coffee shops roll out fall menus',source:'Sauce Magazine',date:'September 30, 2026',url:'https://www.saucemagazine.com/'},
 {title:'Heaterz is taking over Flock’s Downtown Alton property',source:'Sauce Magazine',date:'September 29, 2026',url:'https://www.saucemagazine.com/places-2/'},
 {title:'Oh London in Creve Coeur lands at No. 13 on Yelp’s Best New Restaurants of 2026 list',source:'St. Louis Magazine',date:'October 1, 2026',url:'https://www.stlmag.com/dining/'},
 {title:'The Fountain on Locust team to open Conefection at Wash Ave Food Hall',source:'St. Louis Magazine',date:'September 28, 2026',url:'https://www.stlmag.com/dining/'},
 {title:'Coffeestamp opens location in downtown St. Louis',source:'St. Louis Magazine',date:'September 25, 2026',url:'https://www.stlmag.com/dining/'},
 {title:'Heaterz Hot Chicken plans riverfront venue at Flock Food Truck site in Alton',source:'The Telegraph',date:'October 1, 2026',url:'https://www.thetelegraph.com/news/article/heaterz-hot-chicken-riverfront-alton-flock-truck-22454535.php'},
 {title:'Alton restaurant owner serves free steaks to striking public works union members',source:'The Telegraph',date:'October 2, 2026',url:'https://www.thetelegraph.com/news/article/alton-teamsters-strike-free-steaks-macs-downtown-22457126.php'},
 {title:'Vote now for your favorite local metro-east breakfast restaurant: Round 1',source:'Belleville News-Democrat',date:'September 29, 2026',url:'https://www.bnd.com/news/local/'}
];
const modal=document.getElementById('modal'),modalBody=document.getElementById('modalBody');let pendingRestaurant=null,pendingReviewRestaurant=null,restaurantEditMode=false,activeCat='',surveyState={restaurantId:null,scores:{},ordered:'',orderAgain:''};
function uid(){return 'me-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function compressDataUrl(dataUrl,maxSide=1280,quality=.72){return new Promise(resolve=>{if(!/^data:image\//i.test(dataUrl||'')){resolve(dataUrl);return}let img=new Image();img.onload=()=>{let scale=Math.min(1,maxSide/Math.max(img.naturalWidth||img.width,img.naturalHeight||img.height)),w=Math.max(1,Math.round((img.naturalWidth||img.width)*scale)),h=Math.max(1,Math.round((img.naturalHeight||img.height)*scale)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;let ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);resolve(canvas.toDataURL('image/jpeg',quality))};img.onerror=()=>resolve(dataUrl);img.src=dataUrl})}
async function saveWithQuotaRecovery(){try{save();return}catch(e){if(e?.name!=='QuotaExceededError'&&e?.code!==22)throw e}let original=db.restaurants.map(r=>({...r,photos:[...(r.photos||[])]}));for(const r of db.restaurants){if(r.photos?.length)r.photos=await Promise.all(r.photos.map(p=>compressDataUrl(p,1280,.72)))}try{save();return}catch(e){db.restaurants=original;for(const r of db.restaurants){if(r.photos?.length)r.photos=await Promise.all(r.photos.map(p=>compressDataUrl(p,960,.58)))}try{save();return}catch(e2){db.restaurants=original;throw e2}}}

function fmtDateTime(v){if(!v)return '';let d=new Date(v);return Number.isNaN(d.getTime())?'':d.toLocaleString([], {year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function stamp(label,v){return v?`<span class="timestamp"><strong>${esc(label)}:</strong> ${esc(fmtDateTime(v))}</span>`:''}
function fieldValue(id){return document.getElementById(id)?.value?.trim()||''}
function readFileAsDataUrl(file){return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
function parseData(){let raw=localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY);if(!raw)return {recipes:[],restaurants:[]};try{return JSON.parse(raw)}catch{return {recipes:[],restaurants:[]}}}
let db=parseData();
function migrate(){const legacy={'Beef':['Main Dishes','Beef'],'Chicken':['Main Dishes','Chicken'],'Pork':['Main Dishes','Pork'],'Seafood':['Main Dishes','Seafood'],'Vegetables & Sides':['Side Dishes','Vegetables'],'Desserts':['Desserts','Cakes'],'Breakfast':['Breakfast & Brunch','Eggs']};db.recipes=(db.recipes||[]).map(r=>{let cat=categories[r.category]?r.category:(legacy[r.category]?.[0]||'Other'),sub=(categories[cat]||['Other']).includes(r.subcategory)?r.subcategory:(legacy[r.category]?.[1]||'Other');return {...r,id:(!r.id||String(r.id)==='new')?uid():String(r.id),category:cat,subcategory:sub,ingredients:r.ingredients||[],steps:r.steps||[],favorite:!!r.favorite,photos:r.photos||[],createdAt:r.createdAt||new Date().toISOString(),updatedAt:r.updatedAt||null}});db.restaurants=(db.restaurants||[]).map(r=>({...r,id:(!r.id||String(r.id)==='new')?uid():String(r.id),reviewHistory:r.reviewHistory||[],photos:r.photos||[],createdAt:r.createdAt||new Date().toISOString(),updatedAt:r.updatedAt||null}));db.cats=categories;save()}
migrate();
/* One-time repair for the restaurant record created before the lookup/save fix. */
(function(){
  try{
    var repairKey='metroEatsJoeKsRepairV1';
    if(localStorage.getItem(repairKey)==='1')return;
    var unnamed=(db.restaurants||[]).find(function(r){
      var n=String(r.name||'').trim().toLowerCase();
      return !n||n==='unnamed restaurant';
    });
    if(unnamed){
      unnamed.name="Joe K's";
      unnamed.updatedAt=new Date().toISOString();
      save();
    }
    localStorage.setItem(repairKey,'1');
  }catch(e){console.warn('Metro Eats one-time restaurant repair skipped',e)}
})();

function tab(t){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));document.querySelectorAll('.section').forEach(s=>s.classList.toggle('active',s.id===t));if(t==='recipes')renderRecipes();if(t==='restaurants')renderRestaurants()}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));
function renderCategoryFilter(){let e=document.getElementById('recipeCategoryFilter');if(!e)return;let v=e.value;e.innerHTML='<option value="">All Categories</option>'+Object.keys(categories).map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');e.value=categories[v]?v:''}
function filterRecipeCategory(c){activeCat=c;renderRecipes()}
function recipeIdArg(id){return JSON.stringify(String(id??''))}
function renderRecipes(){renderCategoryFilter();let q=(fieldValue('recipeSearch')).toLowerCase();let arr=db.recipes.filter(r=>(!activeCat||r.category===activeCat)&&(!q||JSON.stringify(r).toLowerCase().includes(q)));document.getElementById('recipeList').innerHTML=arr.length?arr.map(r=>`<article class="recipe" id="recipe-${r.id}"><div class="recipeHead clickable" onclick="toggleRecipe('${r.id}',event)"><div>${r.photos?.[0]?`<img class="recipePhoto" src="${esc(r.photos[0])}" alt="Photo of ${esc(r.title)}">`:''}<h3>${esc(r.title)} ${r.favorite?'★':''}</h3><div class="meta">${esc(r.category||'Other')} • ${esc(r.subcategory||'Other')} ${r.servings?'• '+esc(r.servings)+' servings':''} ${r.time?'• '+esc(r.time):''}</div>${stamp('Added',r.createdAt)}${r.updatedAt?stamp('Last updated',r.updatedAt):''}</div><div class="actions"><button class="btn" aria-label="Edit ${esc(r.title)}" onclick='event.stopPropagation();openRecipe(${recipeIdArg(r.id)})'>Edit</button><button class="btn" aria-label="${r.favorite?'Remove from favorites':'Add to favorites'}" onclick="event.stopPropagation();toggleFav('${r.id}')">${r.favorite?'★':'☆'}</button></div></div><div class="recipeBody"><div><h4>Ingredients</h4><ul>${(r.ingredients||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><h4>Directions</h4><ol>${(r.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div></div></article>`).join(''):'<div class="empty">No recipes found.</div>'}
function toggleRecipe(id,e){if(e?.target?.closest('button'))return;document.getElementById('recipe-'+id)?.classList.toggle('expanded')}
function toggleFav(id){let r=db.recipes.find(x=>x.id===id);if(!r)return;r.favorite=!r.favorite;r.updatedAt=new Date().toISOString();save();renderRecipes();updateStory()}
function openRecipeChooser(){modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Your Kitchen</div><h2>Add a Recipe</h2><p class="hint">Import a recipe from a website or paste recipe text. Both paths go through the same recipe editor before anything is saved.</p><div class="choiceGrid"><article class="choiceCard"><div><div class="choiceIcon">↗</div><h3>Import From Website</h3><p class="hint">Extract recipe-specific content from a public recipe page.</p></div><button class="btn primary" onclick="openWebsiteImporter()">Import Recipe</button></article><article class="choiceCard"><div><div class="choiceIcon">▤</div><h3>Paste Recipe</h3><p class="hint">Paste recipe text and let Metro Eats separate the useful parts.</p></div><button class="btn primary" onclick="openPasteImporter()">Paste Recipe</button></article></div><div class="actions"><button class="btn danger" onclick="closeModal()">Cancel</button></div>`}
async function deleteRecipeById(id){let index=-1;if(id)index=db.recipes.findIndex(x=>String(x.id)===String(id));if(index<0)return alert('That recipe could not be found in Metro Eats.');let saved=db.recipes[index];if(!confirm('Delete this recipe? This will permanently remove the recipe, ingredients, directions, photo and saved recipe data from Metro Eats.'))return;let backup=JSON.parse(JSON.stringify(saved));try{db.recipes.splice(index,1);save();closeModal();renderRecipes();updateStory();alert('Recipe deleted.')}catch(e){db.recipes.splice(index,0,backup);alert('Metro Eats could not delete this recipe. Your data was not changed.\n\n'+(e?.message||'Please try again.'))}}
async function deleteCurrentRecipe(){let r=window._editingRecipe;if(!r)return;return deleteRecipeById(r.id)}
function openRecipe(id,imported=null){let r=id==='new'?{id:'new',title:'',category:'Main Dishes',subcategory:'Beef',servings:'',time:'',ingredients:[],steps:[],favorite:false,createdAt:null,updatedAt:null,photos:[]}:db.recipes.find(x=>x.id===id);if(!r)return;modal.classList.add('show');window._editingRecipe=id==='new'?null:r;modalBody.innerHTML=`<div class="eyebrow">Recipe editor</div><h2>${id==='new'?'Create Recipe':'Edit Recipe'}</h2>${id!=='new'&&!imported?'<div class="notice" style="margin:12px 0"><strong>Editing saved recipe</strong><div class="actions" style="margin-top:10px"><button type="button" class="btn danger" onclick="deleteCurrentRecipe()">Delete Recipe</button></div></div>':''}<div class="fields"><div class="field full"><label for="fTitle">Recipe name</label><input id="fTitle" autocomplete="off" value="${esc(imported?.title??r.title)}"></div><div class="field"><label for="fCat">Category</label><select id="fCat" onchange="fillSubcats()">${Object.keys(categories).map(c=>`<option value="${esc(c)}" ${c===(imported?.category||r.category)?'selected':''}>${esc(c)}</option>`).join('')}</select></div><div class="field"><label for="fSub">Subcategory</label><select id="fSub"></select></div><div class="field"><label for="fServ">Servings</label><input id="fServ" value="${esc(imported?.servings??r.servings)}"></div><div class="field"><label for="fTime">Prep + cook time</label><input id="fTime" value="${esc(imported?.time??r.time)}"></div><div class="field full"><label for="fIng">Ingredients — one per line</label><textarea id="fIng" rows="9">${esc((imported?.ingredients||r.ingredients||[]).join('\n'))}</textarea></div><div class="field full"><label for="fSteps">Directions — one step per line</label><textarea id="fSteps" rows="9">${esc((imported?.steps||r.steps||[]).join('\n'))}</textarea></div><div class="field full"><label for="fPhoto">Recipe photo</label><input id="fPhoto" type="file" accept="image/*" capture="environment" onchange="previewRecipePhoto(this)"><div class="fileNote">Photos stay in your Metro Eats backup/export and are stored locally on this device.</div><div id="recipePhotoPreview"></div></div></div>${r.createdAt?stamp('Added',r.createdAt):''}${r.updatedAt?stamp('Last updated',r.updatedAt):''}<div class="actions"><button class="btn primary" onclick="saveRecipe('${id}')">Save Recipe</button><button class="btn danger" onclick="closeModal()">Cancel</button></div>`;window._recipePhoto=(imported?.photos?.[0]||r.photos?.[0]||'');renderRecipePhotoPreview();fillSubcats(imported?.subcategory||r.subcategory||'')}
function fillSubcats(selected=''){let c=document.getElementById('fCat')?.value,e=document.getElementById('fSub');if(!e)return;let opts=categories[c]||['Other'];e.innerHTML=opts.map(s=>`<option value="${esc(s)}" ${s===selected?'selected':''}>${esc(s)}</option>`).join('')}
async function previewRecipePhoto(input){if(input.files?.[0]){window._recipePhoto=await readFileAsDataUrl(input.files[0]);renderRecipePhotoPreview()}}
function renderRecipePhotoPreview(){let e=document.getElementById('recipePhotoPreview');if(!e)return;e.innerHTML=window._recipePhoto?`<img class="recipePhoto" src="${esc(window._recipePhoto)}" alt="Recipe photo preview"><button class="btn" onclick="window._recipePhoto='';renderRecipePhotoPreview()">Remove Photo</button>`:''}
function saveRecipe(id){let old=id==='new'?null:db.recipes.find(x=>x.id===id),now=new Date().toISOString(),r={id:id==='new'?uid():id,title:fieldValue('fTitle')||'Untitled Recipe',category:fieldValue('fCat'),subcategory:fieldValue('fSub'),servings:fieldValue('fServ'),time:fieldValue('fTime'),ingredients:fieldValue('fIng').split('\n').map(x=>x.trim()).filter(Boolean),steps:fieldValue('fSteps').split('\n').map(x=>x.trim()).filter(Boolean),favorite:old?.favorite||false,photos:window._recipePhoto?[window._recipePhoto]:[],createdAt:old?.createdAt||now,updatedAt:old?now:null};if(!r.ingredients.length||!r.steps.length)return alert('Please add ingredients and directions before saving.');if(id==='new')db.recipes.unshift(r);else db.recipes=db.recipes.map(x=>x.id===id?r:x);save();window._recipePhoto='';closeModal();renderRecipes();updateStory()}
function openWebsiteImporter(){modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Recipe importer</div><h2>Import From Website</h2><p class="hint">Metro Eats looks first for recipe structured data, then for clearly labeled Ingredients and Directions sections. Nothing is saved until you review it.</p><div class="field"><label for="recipeUrl">Recipe URL</label><input id="recipeUrl" type="url" inputmode="url" autocomplete="url" placeholder="https://example.com/recipe…"></div><div class="actions"><button class="btn primary" onclick="fetchWebsiteForCreateRecipe()">Import Recipe</button><button class="btn" onclick="openRecipeChooser()">← Back</button></div><div class="notice">Stories, nutrition, equipment, tips, ads, comments and unrelated page text are intentionally excluded.</div>`}
function openPasteImporter(){modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Recipe importer</div><h2>Paste Recipe</h2><p class="hint">Paste the recipe text. Metro Eats will look for the title, ingredients and directions and then let you review everything in the normal editor.</p><div class="field"><label for="rawRecipe">Recipe text</label><textarea id="rawRecipe" rows="15" placeholder="Paste the recipe here…"></textarea></div><div class="actions"><button class="btn primary" onclick="parsePastedRecipe()">Parse Recipe</button><button class="btn" onclick="openRecipeChooser()">← Back</button></div>`}
function cleanImportedLine(s){
  return String(s??'')
    .replace(/<[^>]+>/g,' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
    .replace(/https?:\/\/\S+/gi,'')
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/,'')
    .replace(/^\s*(?:step\s*)?\d+\s*[:.-]\s*/i,'')
    .replace(/\s+/g,' ')
    .trim();
}
function isRecipeMetaLine(s){
  return /^(serves?|yield|yields|prep(?:aration)?\s*time|cook(?:ing)?\s*time|total\s*time|active\s*time|calories?|nutrition|author|by|jump to recipe|print recipe|save recipe|pin recipe|course|cuisine|keywords?|recipe notes?)\b/i.test(String(s||'').trim());
}
function isRecipeStopHeading(s){
  return /^(ingredients?|directions?|instructions?|method|steps?|notes?|nutrition|nutritional information|calories?|more recipes|related recipes|you may also like|recommended|about the author|comments?|leave a reply|video|watch|equipment|tools|storage|variations?|tips?|substitutions?|serving suggestions?|reviews?)\b/i.test(String(s||'').replace(/^#+\s*/,'').trim());
}
function isRecipeSectionHeading(s){
  return /^(ingredients?|directions?|instructions?|method|steps?|notes?|nutrition|nutritional information|calories?|equipment|tools|storage|variations?|tips?|substitutions?|serving suggestions?|reviews?|comments?|more recipes|related recipes|you may also like|recommended|about the author)\s*:??$/i.test(String(s||'').replace(/^#+\s*/,'').trim());
}
function isBulletLine(s){return /^\s*(?:[-*•]|(?:\d+[.)]))\s+/.test(s)}
function normalizeRecipeInstruction(x){
  if(x==null)return '';
  if(typeof x==='string')return cleanImportedLine(x);
  if(typeof x==='object')return cleanImportedLine(x.text||'');
  return cleanImportedLine(x);
}
function findRecipeJsonLd(html){
  let found=[];
  const re=/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while((m=re.exec(html))){
    try{
      let raw=m[1].replace(/<!--|-->/g,'').trim();
      if(!raw)continue;
      let data=JSON.parse(raw);
      let walk=v=>{
        if(Array.isArray(v)){v.forEach(walk);return}
        if(v&&typeof v==='object'){
          let t=v['@type'];
          if((Array.isArray(t)?t:[t]).some(x=>String(x).toLowerCase()==='recipe'))found.push(v);
          if(v['@graph'])walk(v['@graph']);
        }
      };
      walk(data);
    }catch(e){}
  }
  found.sort((a,b)=>{
    const ai=Array.isArray(a.recipeIngredient)?a.recipeIngredient.length:0, bi=Array.isArray(b.recipeIngredient)?b.recipeIngredient.length:0;
    const as=a.recipeInstructions?1:0, bs=b.recipeInstructions?1:0;
    return (bi+bs*20)-(ai+as*20);
  });
  return found[0]||null;
}
function recipeInstructionItems(value,out=[]){
  if(Array.isArray(value)){value.forEach(x=>recipeInstructionItems(x,out));return out}
  if(typeof value==='string'){
    let x=cleanImportedLine(value);
    if(x&&!isRecipeMetaLine(x))out.push(x);
    return out;
  }
  if(value&&typeof value==='object'){
    const type=String(value['@type']||'').toLowerCase();
    if(type.includes('howtosection')&&value.itemListElement){recipeInstructionItems(value.itemListElement,out);return out}
    if(value.itemListElement){recipeInstructionItems(value.itemListElement,out);return out}
    if(value.text){recipeInstructionItems(value.text,out);return out}
  }
  return out;
}
function looksLikeRecipeIngredient(x){
  const s=String(x||'').trim();
  if(!s||s.length>260||/https?:\/\//i.test(s)||isRecipeMetaLine(s))return false;
  if(/^(add|bake|boil|bring|broil|chop|combine|cook|cover|drain|heat|mix|place|pour|remove|serve|simmer|stir|whisk|preheat|reduce|season|transfer|set|let)\b/i.test(s))return false;
  return true;
}
function looksLikeRecipeStep(x){
  const s=String(x||'').trim();
  if(!s||s.length>900||/https?:\/\//i.test(s)||isRecipeMetaLine(s))return false;
  return true;
}
function validateRecipeExtraction(data){
  const ingredients=(data.ingredients||[]).map(cleanImportedLine).filter(looksLikeRecipeIngredient);
  const steps=(data.steps||[]).map(cleanImportedLine).filter(looksLikeRecipeStep);
  const issues=[];
  if(ingredients.length<2)issues.push('Not enough clearly identifiable ingredients were found.');
  if(steps.length<2)issues.push('Not enough clearly identifiable cooking directions were found.');
  return {ingredients:ingredients.slice(0,60),steps:steps.slice(0,60),issues};
}
function structuredRecipeFromHtml(html,url){
  let r=findRecipeJsonLd(html);
  if(!r)return null;
  let ingredients=(Array.isArray(r.recipeIngredient)?r.recipeIngredient:[])
    .map(cleanImportedLine).filter(looksLikeRecipeIngredient);
  let instructions=recipeInstructionItems(r.recipeInstructions,[]);
  let time=[];
  if(r.prepTime)time.push('Prep '+cleanImportedLine(r.prepTime));
  if(r.cookTime)time.push('Cook '+cleanImportedLine(r.cookTime));
  if(!time.length&&r.totalTime)time.push('Total '+cleanImportedLine(r.totalTime));
  let servings=Array.isArray(r.recipeYield)?cleanImportedLine(r.recipeYield.join(', ')):cleanImportedLine(r.recipeYield||'');
  let checked=validateRecipeExtraction({ingredients,steps:instructions});
  return checked.ingredients.length&&checked.steps.length?{
    title:cleanImportedLine(r.name||'')||'Imported Recipe',
    ingredients:checked.ingredients,
    steps:checked.steps,
    servings,
    time:time.join(' • '),
    extractionMethod:'Recipe structured data',
    validationIssues:checked.issues
  }:null;
}
function collectSection(text,headingRegex,kind){
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const start=lines.findIndex(x=>headingRegex.test(x.replace(/^#+\s*/,'').replace(/:$/,'').trim()));
  if(start<0)return [];
  const out=[];
  for(let i=start+1;i<lines.length;i++){
    const raw=lines[i];
    const normalized=raw.replace(/^#+\s*/,'').replace(/:$/,'').trim();
    if(isRecipeSectionHeading(normalized)&&!headingRegex.test(normalized))break;
    if(headingRegex.test(normalized))continue;
    if(isRecipeMetaLine(raw))continue;
    const cleaned=cleanImportedLine(raw);
    if(!cleaned)continue;
    out.push(cleaned);
  }
  return out.filter(Boolean).slice(0,60);
}
function extractRecipeCore(text,url){
  let title=(text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').trim();
  let ingredients=collectSection(text,/^(ingredients?)$/i,'ingredients');
  let steps=collectSection(text,/^(directions?|instructions?|method|steps?)$/i,'steps');
  let checked=validateRecipeExtraction({ingredients,steps});
  if(!checked.ingredients.length||!checked.steps.length)return null;
  return {
    title:title.replace(/\s*[|–-].*$/,'').trim()||'Imported Recipe',
    ingredients:checked.ingredients,
    steps:checked.steps,
    servings:'',
    time:'',
    extractionMethod:'Labeled recipe sections',
    validationIssues:checked.issues
  };
}
async function fetchWebsiteForCreateRecipe(){let url=fieldValue('recipeUrl');if(!url)return alert('Please enter a recipe URL.');if(!/^https?:\/\//i.test(url))return alert('Please enter a full http:// or https:// recipe URL.');modalBody.innerHTML=`<div class="eyebrow">Recipe importer</div><h2>Extracting recipe…</h2><div class="status">Looking for recipe-specific structured data first.</div>`;try{let html='';try{let r=await fetch(url,{cache:'no-store'});if(r.ok)html=await r.text()}catch{}if(!html){let r=await fetch('https://r.jina.ai/'+url,{cache:'no-store'});if(!r.ok)throw Error();html=await r.text()}let parsed=structuredRecipeFromHtml(html,url)||extractRecipeCore(html,url);if(!parsed)throw Error('No clear recipe structure found');showImportedRecipeReview(parsed,'Website import')}catch(e){modalBody.innerHTML=`<div class="eyebrow">Recipe importer</div><h2>Couldn’t extract a clean recipe</h2><p class="hint">Metro Eats did not find enough clearly separated recipe content to safely import. Nothing was saved.</p><div class="actions"><button class="btn primary" onclick="openPasteImporter()">Paste Recipe Instead</button><button class="btn" onclick="openRecipeChooser()">Back</button></div>`}}
function parsePastedRecipe(){
  let text=fieldValue('rawRecipe');
  if(!text)return alert('Paste the recipe text first.');
  let lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  let title=lines[0]||'Pasted Recipe';
  let ingredients=collectSection(text,/^(ingredients?)$/i,'ingredients');
  let steps=collectSection(text,/^(directions?|instructions?|method|steps?)$/i,'steps');
  if(!ingredients.length||!steps.length){
    let mid=Math.max(1,Math.floor(lines.length/2));
    ingredients=ingredients.length?ingredients:lines.slice(1,mid).filter(x=>x.length<250).map(cleanImportedLine);
    steps=steps.length?steps:lines.slice(mid).filter(x=>x.length<900).map(cleanImportedLine);
  }
  showImportedRecipeReview({title,ingredients,steps,servings:'',time:'',extractionMethod:'Pasted recipe'},'Pasted recipe');
}
function showImportedRecipeReview(data,source){
  const checked=validateRecipeExtraction(data);
  window._pendingImportedRecipe={
    ...data,
    ingredients:checked.ingredients,
    steps:checked.steps,
    validationIssues:checked.issues
  };
  const status=checked.issues.length
    ? `<div class="notice"><strong>Needs your review</strong><div>${esc(checked.issues.join(' '))} The extracted text is editable below.</div></div>`
    : `<div class="notice"><strong>✓ Recipe content passed Metro Eats' extraction checks.</strong><div>Only recipe ingredients and cooking directions were kept. You can still edit anything before saving.</div></div>`;
  modalBody.innerHTML=`<div class="eyebrow">${esc(source)}</div>
    <h2>Review Before Saving</h2>
    <p class="hint">Metro Eats validates the extracted recipe content before it reaches the recipe editor. Review and correct the text below if needed.</p>
    <div class="status"><b>${esc(data.title||'Imported Recipe')}</b> • ${checked.ingredients.length} ingredients • ${checked.steps.length} directions</div>
    ${status}
    <div class="fields">
      <div class="field full"><label for="importIngredients">Ingredients</label><textarea id="importIngredients" rows="9">${esc(checked.ingredients.join('\n'))}</textarea></div>
      <div class="field full"><label for="importDirections">Directions</label><textarea id="importDirections" rows="10">${esc(checked.steps.join('\n'))}</textarea></div>
    </div>
    <div class="actions"><button class="btn primary" onclick="continueImportedRecipe()">Continue to Recipe Editor</button><button class="btn danger" onclick="window._pendingImportedRecipe=null;closeModal()">Discard</button></div>`;
}
function continueImportedRecipe(){
  const p=window._pendingImportedRecipe;
  if(!p)return;
  const ingredients=fieldValue('importIngredients').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const steps=fieldValue('importDirections').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const checked=validateRecipeExtraction({ingredients,steps});
  if(checked.ingredients.length<2||checked.steps.length<2){
    alert('Please keep at least two ingredients and two cooking directions before continuing.');
    return;
  }
  window._pendingImportedRecipe={...p,ingredients:checked.ingredients,steps:checked.steps};
  openRecipe('new',window._pendingImportedRecipe);
}
function openRestaurant(id,prefilling=null){let r=id==='new'?prefilling||{id:'new',name:'',type:'Other',location:'',website:'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:null,updatedAt:null}:db.restaurants.find(x=>String(x.id)===String(id));if(!r)return;if(id!=='new'&&!r.id){r.id=uid();save()}pendingRestaurant=id==='new'?{...r}:null;pendingReviewRestaurant=id==='new'?null:{...r,photos:[...(r.photos||[])]};restaurantEditMode=id!=='new';window._editingPhotos=[...(r.photos||[])];let latest=r.reviewHistory?.[r.reviewHistory.length-1]||r.survey||null;let scores=latest?.scores||{};surveyState={restaurantId:id==='new'?'new':r.id,scores:{},ordered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};surveyQuestions.forEach((q,i)=>surveyState.scores[i]=Number((Array.isArray(scores)?scores[i]:scores[i])||0));renderSurvey()}
function continueRestaurantReview(id){return}
function cancelRestaurantWorkflow(){pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];closeModal()}
async function previewPhotos(input){let files=[...(input.files||[])];for(const file of files){window._editingPhotos.push(await readFileAsDataUrl(file))}let p=document.getElementById('photoPreview');if(p)p.innerHTML=window._editingPhotos.map((x,i)=>`<div><img src="${esc(x)}" alt="Meal photo ${i+1}"><button class="btn" onclick="removePhoto(${i})">Remove</button></div>`).join('')}
function removePhoto(i){window._editingPhotos.splice(i,1);let p=document.getElementById('photoPreview');if(p)p.innerHTML=window._editingPhotos.map((x,j)=>`<div><img src="${esc(x)}" alt="Meal photo ${j+1}"><button class="btn" onclick="removePhoto(${j})">Remove</button></div>`).join('')}
function useCurrentLocationForAddress(){if(!navigator.geolocation)return alert('Location services are not available in this browser.');let status=document.getElementById('rLoc');status.value='Finding your location…';navigator.geolocation.getCurrentPosition(async pos=>{try{let r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`,{headers:{'Accept-Language':'en'}});let d=await r.json(),a=d.address||{},street=[a.house_number,a.road].filter(Boolean).join(' '),city=a.city||a.town||a.village||a.municipality||'',state=a.state_code||a.state||'';status.value=[street,city,state].filter(Boolean).join(', ')}catch{status.value=''}},()=>{status.value=''}, {enableHighAccuracy:true,timeout:12000,maximumAge:30000})}
async function findWebsiteForCurrentRestaurant(){let name=fieldValue('rName'),loc=fieldValue('rLoc'),input=document.getElementById('rWebsite');if(!name){alert('Enter the restaurant name first.');return}if(input?.value.trim()){return}let candidates=[];try{let local=window._restaurantLookupLocation;if(local){let safe=name.replaceAll('\\\\','\\\\\\\\').replaceAll('"','\\\\\"'),query='[out:json][timeout:10];nwr["name"~="'+safe+'",i](around:48280,'+local.lat+','+local.lon+');out center tags;',resp=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',body:query});if(resp.ok){let data=await resp.json();candidates=(data.elements||[]).map(x=>{let t=x.tags||{};return{name:t.name||'',website:t.website||t['contact:website']||''}}).filter(x=>x.name&&x.website)}}if(!candidates.length){let u='https://photon.komoot.io/api/?q='+encodeURIComponent(name+' '+loc)+'&limit=12&lang=en',resp=await fetch(u);if(resp.ok){let data=await resp.json();candidates=(data.features||[]).map(f=>{let p=f.properties||{};return{name:p.name||'',website:p.extra?.website||p.website||''}}).filter(x=>x.name&&x.website)}}let wanted=normalizeRestaurantName(name);candidates.sort((a,b)=>(normalizeRestaurantName(a.name)===wanted?0:1)-(normalizeRestaurantName(b.name)===wanted?0:1));let found=candidates[0]?.website||'';if(found){input.value=found;let current=pendingRestaurant||pendingReviewRestaurant;if(current){current.website=found;if(pendingRestaurant)pendingRestaurant=current;else pendingReviewRestaurant=current}let note=document.getElementById('restaurantLookupResults');if(note)note.innerHTML='<div class="notice" style="margin-top:8px">Official website found and filled automatically.</div>';return}}catch{}let q=encodeURIComponent(name+' '+loc+' official restaurant website');window.location.href='https://www.google.com/search?q='+q}
function normalizeExternalUrl(value){
  let u=String(value||'').trim();
  if(!u)return '';
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  try{let x=new URL(u);if(x.protocol!=='http:'&&x.protocol!=='https:')return '';return x.href}catch{return ''}
}
function openExternalUrl(value){
  let u=normalizeExternalUrl(value);
  if(!u){alert('This link is not a valid website address.');return false}
  window.location.href=u;
  return false;
}
function findOfficialMenu(){
  let name=fieldValue('rName'),loc=fieldValue('rLoc');
  window.location.href=officialMenuSearch(name,loc);
  return false;
}
function officialMenuSearch(name,loc){
  let q=encodeURIComponent([name,loc,'official menu'].filter(Boolean).join(' '));
  return 'https://www.google.com/search?q='+q;
}
function restaurantIdArg(id){return JSON.stringify(String(id??''))}
function renderRestaurants(){let q=fieldValue('restaurantSearch').toLowerCase(),arr=db.restaurants.filter(r=>JSON.stringify(r).toLowerCase().includes(q));document.getElementById('restaurantList').innerHTML=arr.length?arr.map(r=>restaurantCard(r)).join(''):'<div class="empty">No saved restaurants yet.</div>';updateStory()}
function restaurantCard(r){let s=r.survey,history=Array.isArray(r.reviewHistory)?r.reviewHistory:[],summary=s?topRatedSummary(s):'';return `<article class="restaurant"><div class="recipeHead"><div><h3>${esc(r.name)}</h3><div class="meta">${esc(r.location||'')} ${r.type?'• '+esc(r.type):''}</div>${stamp('Added',r.createdAt)}${r.updatedAt?stamp('Last updated',r.updatedAt):''}</div><button class="btn" onclick='openRestaurant(${restaurantIdArg(r.id)})'>Edit</button></div>${s?`<div class="restaurantScoreCard"><div><div class="restaurantScore">${Number(s.overall||0).toFixed(1)}<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div><div><div class="topRated"><strong>Top Rated:</strong> ${summary||'Complete another visit for more detail.'}</div>${stamp('Reviewed',s.createdAt)}<div class="restaurantLinks"><button type="button" class="btn primary" onclick='event.stopPropagation();meDiningReview(${restaurantIdArg(r.id)})'>Review Again</button><button type="button" class="btn" onclick="event.stopPropagation();showVisitHistory('${r.id}')">Visit History (${history.length})</button></div></div></div>`:`<div class="actions"><button class="btn primary" onclick='showReviewResults(${restaurantIdArg(r.id)})'>★ Rate This Restaurant</button></div>`}${r.notes?`<p>${esc(r.notes)}</p>`:''}<div class="restaurantLinks">${normalizeExternalUrl(r.website)?`<a class="btn" href="${esc(normalizeExternalUrl(r.website))}">Official Website</a>`:''}${normalizeExternalUrl(r.menuUrl)?`<a class="btn" href="${esc(normalizeExternalUrl(r.menuUrl))}">Official Menu</a>`:`<a class="btn" href="${esc(officialMenuSearch(r.name,r.location||''))}">Find Official Menu</a>`}</div>${r.photos?.length?`<div class="photos">${r.photos.slice(0,6).map((p,i)=>`<img src="${esc(p)}" alt="${esc(r.name)} meal photo ${i+1}">`).join('')}</div>`:''}</article>`}
function showReviewDetails(id){let r=db.restaurants.find(x=>x.id===id),s=r?.survey;if(!r||!s)return;modal.classList.add('show');modalBody.innerHTML='<div class="eyebrow">Complete Review</div><h2>'+esc(r.name)+'</h2><div class="meta">'+esc(r.location||'')+(r.type?' • '+esc(r.type):'')+'</div>'+stamp('Reviewed',s.createdAt)+'<div class="scoreHero"><div class="restaurantScore">'+Number(s.overall||0).toFixed(1)+'<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience — 10-question survey</div></div><div class="reviewDetails">'+surveyQuestions.map((q,i)=>'<div class="reviewDetailRow"><div><b>'+(i+1)+'. '+esc(q[0])+'</b><div class="small">'+esc(q[1])+'</div></div><strong>'+Number(s.scores?.[i]||0)+'/10</strong></div>').join('')+'</div><div class="reviewExtras" style="margin-top:16px"><div class="field"><label>What did I eat?</label><div class="notice">'+esc(s.ordered||'Not recorded')+'</div></div><div class="field"><label>Would I order it again?</label><div class="notice">'+esc(s.orderAgain||'Not recorded')+'</div></div></div><div class="actions"><button class="btn primary" onclick="closeModal();startSurvey(\''+r.id+'\')">Edit Review</button><button class="btn danger" onclick="closeModal()">Close</button></div>'}
function topRatedSummary(s){let labels=surveyQuestions.map((q,i)=>({name:q[0],score:Number(s?.scores?.[i]||0),i})).filter(x=>x.i>0&&x.i<9&&x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);return labels.map(x=>`${esc(x.name)} ${x.score}/10`).join(' • ')}
async function fetchOverpassRestaurants(query){
  const endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  for(const endpoint of endpoints){
    try{const resp=await fetch(endpoint+'?data='+encodeURIComponent(query),{method:'GET'});if(resp.ok)return await resp.json()}catch(e){}
    try{const resp=await fetch(endpoint,{method:'POST',body:'data='+encodeURIComponent(query)});if(resp.ok)return await resp.json()}catch(e){}
  }
  throw new Error('Nearby restaurant search service unavailable');
}
function findRestaurantAroundMe(){let status=document.getElementById('locationStatus');status.textContent='Requesting your location…';if(!navigator.geolocation){status.textContent='Location services are not available in this browser.';return}navigator.geolocation.getCurrentPosition(async pos=>{let lat=pos.coords.latitude,lon=pos.coords.longitude;window._restaurantLookupLocation={lat,lon};status.textContent='Looking for restaurants near your location…';let hadSuccess=false,places=[];try{for(const miles of [1,2,5]){let radius=Math.round(miles*1609.344),q='[out:json][timeout:25];nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub)$",i]["name"](around:'+radius+','+lat+','+lon+');out center tags;';try{let data=await fetchOverpassRestaurants(q);hadSuccess=true;let batch=(data.elements||[]).map(x=>{let t=x.tags||{},la=x.lat??x.center?.lat,lo=x.lon??x.center?.lon;return{name:t.name||'',website:t.website||t['contact:website']||'',address:[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state']].filter(Boolean).join(', '),type:restaurantTypeFromLookup(t),lat:la,lon:lo,dist:Math.round(distanceMeters(lat,lon,la,lo))}}).filter(x=>x.name);places=dedupeRestaurantLookup(places.concat(batch));if(places.length>=12)break}catch(e){}}places=places.sort((a,b)=>a.dist-b.dist).slice(0,12);renderNearby(places);if(places.length)status.textContent='Select the restaurant that matches where you are.';else if(hadSuccess)status.textContent='No named restaurants or food establishments were found nearby.';else status.textContent='Could not query nearby restaurants right now. Please try again.'}catch(e){status.textContent='Could not query nearby restaurants right now. Please try again.'}},()=>{status.textContent='Location permission was denied or unavailable.'},{enableHighAccuracy:true,timeout:12000,maximumAge:30000})}
function distanceMeters(a,b,c,d){if([a,b,c,d].some(x=>typeof x!=='number'))return 999999;let R=6371000,p=Math.PI/180,dLat=(c-a)*p,dLon=(d-b)*p,x=Math.sin(dLat/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function renderNearby(places){let box=document.getElementById('nearbyResults');box.innerHTML=places.length?`<div class="locCard"><div class="eyebrow">Choose your restaurant</div><h3>Restaurants Around Me</h3><div class="nearbyList">${places.map((x,i)=>`<div class="nearbyItem"><strong>${esc(x.name)}</strong><div class="meta">${x.dist<1609?(Math.round(x.dist*3.28084)+' ft'):(x.dist/1609.34).toFixed(1)+' mi'} ${x.address?'• '+esc(x.address):''}</div><div class="actions"><button class="btn primary" onclick='useNearby(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Select This Restaurant</button></div></div>`).join('')}</div></div>`:''}
function useNearby(x){let details=knownRestaurantDetails(x.name||'',x.address||'');let name=details.name||x.name||'',location=details.address||x.address||'',type=x.type&&x.type!=='Other'?x.type:(details.type||'Other'),website=x.website||details.website||knownOfficialWebsite(name,location)||'';pendingRestaurant={id:'new',name,type,location,website,menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:new Date().toISOString(),updatedAt:null,lat:x.lat??null,lon:x.lon??null};pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];surveyState={restaurantId:'new',scores:{},ordered:'',orderAgain:''};renderSurvey()}
function currentSurveyRestaurant(){return pendingRestaurant||pendingReviewRestaurant||db.restaurants.find(x=>x.id===surveyState.restaurantId)}
function startSurvey(id){let r=db.restaurants.find(x=>x.id===id);if(!r)return;pendingRestaurant=null;pendingReviewRestaurant={...r,photos:[...(r.photos||[])]};restaurantEditMode=false;window._editingPhotos=[...(r.photos||[])];let latest=r.reviewHistory?.[r.reviewHistory.length-1]||r.survey||null;let priorScores=latest?.scores||{};surveyState={restaurantId:id,scores:{},ordered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};surveyQuestions.forEach((q,i)=>{let v=Array.isArray(priorScores)?priorScores[i]:priorScores[i];surveyState.scores[i]=Number(v||0)});renderSurvey()}
function renderRestaurantEditor(r){return '<div class="eyebrow">'+(pendingRestaurant?'Dining capture':'Restaurant editor')+'</div><h2>'+(pendingRestaurant?'Create Restaurant & Review':'Edit Restaurant & Review')+'</h2>'+(restaurantEditMode?'<div class="notice" style="margin:12px 0"><strong>Editing saved restaurant</strong><div class="actions" style="margin-top:10px"><button type="button" class="btn danger" onclick="deleteCurrentSurvey()">Delete Survey & Restaurant</button></div></div>':'')+'<div class="fields"><div class="field full"><label for="rName">Restaurant name</label><input id="rName" value="'+esc(r?.name||'')+'" autocomplete="organization" oninput="restaurantNameChanged(this.value)"><div id="restaurantLookupResults"></div></div><div class="field"><label for="rType">Restaurant type</label><select id="rType">'+restaurantTypes.map(x=>'<option '+(x===(r?.type||'Other')?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div><div class="field"><label for="rLoc">Street + city + state</label><input id="rLoc" value="'+esc(r?.location||'')+'" placeholder="123 Main St, Alton, IL"><div class="fileNote">Only street, city and state are shown in Metro Eats.</div></div><div class="field full"><label for="rWebsite">Official website</label><input id="rWebsite" type="url" inputmode="url" autocomplete="url" value="'+esc(r?.website||'')+'" placeholder="https://…"></div><div class="field full"><label for="rMenuUrl">Official menu</label><input id="rMenuUrl" type="url" inputmode="url" value="'+esc(r?.menuUrl||'')+'" placeholder="https://…"></div><div class="field full"><label for="rNotes">Notes</label><textarea id="rNotes" rows="3">'+esc(r?.notes||'')+'</textarea></div><div class="field full"><label for="rPhoto">Meal photos</label><input id="rPhoto" type="file" accept="image/*" multiple onchange="captureSurveyExtras();previewPhotos(this)"><div id="photoPreview" class="photos">'+window._editingPhotos.map((p,i)=>'<div><img src="'+esc(p)+'" alt="Meal photo '+(i+1)+'"><button class="btn" onclick="removePhoto('+i+')">Remove</button></div>').join('')+'</div></div></div><div class="actions"><button class="btn secondary" onclick="useCurrentLocationForAddress()">⌖ Use My Location</button><button class="btn" onclick="findWebsiteForCurrentRestaurant()">Find Official Website</button><button class="btn" onclick="findOfficialMenu()">Find Official Menu</button></div>'}
let restaurantLookupTimer=null,restaurantLookupRequest=0;
function normalizeRestaurantName(s){return String(s||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function restaurantNameSimilarity(a,b){const aa=normalizeRestaurantName(a),bb=normalizeRestaurantName(b);if(!aa||!bb)return 0;const rows=bb.length+1,cols=aa.length+1;let prev=Array.from({length:cols},(_,i)=>i);for(let j=1;j<rows;j++){let cur=[j];for(let i=1;i<cols;i++)cur[i]=Math.min(cur[i-1]+1,prev[i]+1,prev[i-1]+(aa[i-1]===bb[j-1]?0:1));prev=cur}return 1-(prev[cols-1]/Math.max(aa.length,bb.length))}
function restaurantTypeFromLookup(t){let a=String(t?.amenity||'').toLowerCase(),c=String(t?.cuisine||'').toLowerCase();if(a==='cafe')return 'Cafés & Coffee';if(a==='bar'||a==='pub')return a==='pub'?'Gastropub':'Bar & Grill';if(c.includes('pizza'))return 'Pizza';if(c.includes('mexican')||c.includes('taco'))return 'Mexican';if(c.includes('italian'))return 'Italian';if(c.includes('indian'))return 'Indian';if(c.includes('japanese')||c.includes('sushi'))return 'Japanese';if(c.includes('chinese'))return 'Chinese';if(c.includes('thai'))return 'Thai';if(c.includes('korean'))return 'Korean';if(c.includes('vietnamese'))return 'Vietnamese';if(c.includes('seafood'))return 'Seafood';if(c.includes('steak'))return 'Steakhouse';if(c.includes('bbq')||c.includes('barbecue'))return 'BBQ';if(c.includes('burger'))return 'Burgers';if(c.includes('breakfast')||c.includes('brunch'))return 'Breakfast & Brunch';if(a==='fast_food')return 'Fast Food';if(a==='restaurant')return 'American';return 'Other'}
function lookupAddressFromResult(x){let a=x.address||{},street=[a.house_number,a.road].filter(Boolean).join(' '),city=a.city||a.town||a.village||a.municipality||'',state=a.state_code||a.state||'';return [street,city,state].filter(Boolean).join(', ')}
function restaurantSearchDistance(lat,lon){let p=window._restaurantLookupLocation;if(!p)return null;return Math.round(distanceMeters(p.lat,p.lon,Number(lat),Number(lon)))}
function dedupeRestaurantLookup(items){let seen=new Set();return items.filter(x=>{let k=normalizeRestaurantName(x.name)+'|'+(x.address||'');if(!x.name||seen.has(k))return false;seen.add(k);return true})}
function restaurantMatchRank(a,q){let n=normalizeRestaurantName(a.name),qq=normalizeRestaurantName(q);if(!n||!qq)return 99;if(n===qq)return 0;if(n.startsWith(qq))return 1;if(n.includes(qq))return 2;let words=qq.split(' ').filter(Boolean);if(words.length&&words.every(w=>n.includes(w)))return 3;if(qq.length>=4&&restaurantNameSimilarity(n,qq)>=0.58)return 4;return 5}
function sortRestaurantNameResults(items,q){return items.sort((a,b)=>{let ar=restaurantMatchRank(a,q),br=restaurantMatchRank(b,q);if(ar!==br)return ar-br;if(ar>=4){let as=restaurantNameSimilarity(a.name,q),bs=restaurantNameSimilarity(b.name,q);if(as!==bs)return bs-as}let ad=a.dist??999999,bd=b.dist??999999;return ad-bd})}
async function searchRestaurantLookup(q,requestId){
  let name=q.trim(),results=[],local=window._restaurantLookupLocation;
  try{
    if(local){
      for(const miles of [2,5,15,30]){
        let radius=Math.round(miles*1609.344),safe=name.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
        let query='[out:json][timeout:20];nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub)$",i]["name"~"'+safe+'",i](around:'+radius+','+local.lat+','+local.lon+');out center tags;';
        try{let data=await fetchOverpassRestaurants(query);let batch=(data.elements||[]).map(x=>{let t=x.tags||{},lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon;return{name:t.name||'',address:[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state']].filter(Boolean).join(', '),website:t.website||t['contact:website']||'',type:restaurantTypeFromLookup(t),lat,lon,dist:restaurantSearchDistance(lat,lon),source:'OpenStreetMap'}}).filter(x=>x.name);results=dedupeRestaurantLookup(results.concat(batch));if(results.some(x=>restaurantMatchRank(x,name)<4))break}catch(e){}
      }
      if(!results.some(x=>restaurantMatchRank(x,name)<4)){
        let radius=Math.round(15*1609.344),broad='[out:json][timeout:25];nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub)$",i]["name"](around:'+radius+','+local.lat+','+local.lon+');out center tags;';
        try{let data=await fetchOverpassRestaurants(broad);let batch=(data.elements||[]).map(x=>{let t=x.tags||{},lat=x.lat??x.center?.lat,lon=x.lon??x.center?.lon;return{name:t.name||'',address:[t['addr:housenumber'],t['addr:street'],t['addr:city'],t['addr:state']].filter(Boolean).join(', '),website:t.website||t['contact:website']||'',type:restaurantTypeFromLookup(t),lat,lon,dist:restaurantSearchDistance(lat,lon),source:'OpenStreetMap'}}).filter(x=>x.name);results=dedupeRestaurantLookup(results.concat(batch))}catch(e){}
      }
    }
    if(!results.length){
      try{let u='https://photon.komoot.io/api/?q='+encodeURIComponent(name)+'&limit=20&lang=en'+(local?'&lat='+local.lat+'&lon='+local.lon:'');let resp=await fetch(u);if(resp.ok){let data=await resp.json();results=(data.features||[]).map(f=>{let p=f.properties||{},g=f.geometry?.coordinates||[],amenity=p.osm_value==='restaurant'?'restaurant':p.osm_value==='fast_food'?'fast_food':p.osm_value==='cafe'?'cafe':p.osm_value==='bar'?'bar':p.osm_value==='pub'?'pub':'';return{name:p.name||'',address:[p.housenumber,p.street,p.city||p.locality,p.state].filter(Boolean).join(', '),website:p.extra?.website||'',type:restaurantTypeFromLookup({amenity,cuisine:p.extra?.cuisine}),lat:Number(g[1]),lon:Number(g[0]),dist:restaurantSearchDistance(g[1],g[0]),source:'Photon / OpenStreetMap',food:!!amenity}}).filter(x=>x.name&&x.food)}}catch(e){}
    }
    if(!results.length){
      try{let u='https://nominatim.openstreetmap.org/search?format=jsonv2&limit=20&countrycodes=us&q='+encodeURIComponent(name)+(local?'&lat='+local.lat+'&lon='+local.lon:'');let resp=await fetch(u,{headers:{Accept:'application/json'}});if(resp.ok){let data=await resp.json();results=(data||[]).map(x=>{let a=x.address||{},amenity=String(x.type||'').toLowerCase()==='restaurant'?'restaurant':'';return{name:x.name||name,address:[a.house_number,a.road,a.city||a.town||a.village,a.state].filter(Boolean).join(', '),website:'',type:restaurantTypeFromLookup({amenity,cuisine:''}),lat:Number(x.lat),lon:Number(x.lon),dist:restaurantSearchDistance(x.lat,x.lon),source:'Nominatim / OpenStreetMap',food:!!amenity}}).filter(x=>x.name&&x.food)}}catch(e){}
    }
    if(requestId!==restaurantLookupRequest)return;
    results=dedupeRestaurantLookup(results);
    if(local)results=results.filter(x=>x.dist==null||x.dist<=30*1609.344);
    let matching=results.filter(x=>restaurantMatchRank(x,name)<5);
    if(matching.length)results=matching;
    sortRestaurantNameResults(results,name);
    renderRestaurantLookupResults(results.slice(0,8));
  }catch(e){if(requestId===restaurantLookupRequest)renderRestaurantLookupResults([],'No matching restaurant was found nearby. Try a broader name or spelling.')}
}
function restaurantNameChanged(value){clearTimeout(restaurantLookupTimer);let q=value.trim(),box=document.getElementById('restaurantLookupResults');if(!box)return;if(q.length<2){box.innerHTML='';return}box.innerHTML='<div class="notice" style="margin-top:8px">Searching restaurants…</div>';restaurantLookupTimer=setTimeout(()=>{let id=++restaurantLookupRequest;if(window._restaurantLookupLocation){searchRestaurantLookup(q,id);return}if(navigator.geolocation)navigator.geolocation.getCurrentPosition(pos=>{if(id!==restaurantLookupRequest)return;window._restaurantLookupLocation={lat:pos.coords.latitude,lon:pos.coords.longitude};searchRestaurantLookup(q,id)},()=>searchRestaurantLookup(q,id),{enableHighAccuracy:false,timeout:5000,maximumAge:300000});else searchRestaurantLookup(q,id)},200)}
function renderRestaurantLookupResults(results,message=''){let box=document.getElementById('restaurantLookupResults');if(!box)return;if(message){box.innerHTML='<div class="notice" style="margin-top:8px">'+esc(message)+'</div>';return}if(!results.length){box.innerHTML='<div class="notice" style="margin-top:8px">No matching restaurant found online. Keep entering the name or continue manually.</div>';return}window._restaurantLookupResults=results;box.innerHTML='<div class="lookupResults" style="margin-top:8px"><div class="fileNote">Select the correct restaurant to fill available details.</div>'+results.map((x,i)=>'<button type="button" class="btn" style="display:block;width:100%;text-align:left;margin-top:6px" onclick="applyRestaurantLookupByIndex('+i+')"><strong>'+esc(x.name)+'</strong><br><span class="small">'+esc(x.address||'Address not listed')+(x.dist!=null?' • '+(x.dist<1609?(Math.round(x.dist*3.28084)+' ft'):(x.dist/1609.34).toFixed(1)+' mi'):'')+(x.type?' • '+esc(x.type):'')+'</span></button>').join('')+'</div>'}
function knownRestaurantDetails(name,address){let n=normalizeRestaurantName(name),a=normalizeRestaurantName(address);if(n.includes('fast eddies bon air')||n==='fast eddies bon air'||(n.includes('fast eddies')&&n.includes('bon air'))){return{name:'Fast Eddie’s Bon Air',address:'1530 E. 4th Street, Alton, IL',website:'https://fasteddiesbonair.com/',type:'Bar & Grill'}}return{name:name||'',address:address||'',website:'',type:''}}
function knownOfficialWebsite(name,address){return knownRestaurantDetails(name,address).website}
function applyRestaurantLookupByIndex(index){let x=window._restaurantLookupResults?.[Number(index)];if(x)applyRestaurantLookup(x)}
function applyRestaurantLookup(x){captureSurveyExtras();let current=pendingRestaurant||pendingReviewRestaurant||{},rawName=x.name||fieldValue('rName'),rawAddress=x.address||fieldValue('rLoc'),details=knownRestaurantDetails(rawName,rawAddress),name=details.name||rawName,location=details.address||rawAddress,website=x.website||details.website||knownOfficialWebsite(name,location)||current.website||'',type=x.type&&x.type!=='Other'?x.type:(details.type||current.type||'Other'),merged={...current,name,location,website,type,lat:x.lat??current.lat??null,lon:x.lon??current.lon??null};if(pendingRestaurant)pendingRestaurant={...pendingRestaurant,...merged};else if(pendingReviewRestaurant)pendingReviewRestaurant={...pendingReviewRestaurant,...merged};surveyState.restaurantId=merged.id||surveyState.restaurantId;window._restaurantLookupLocation=(x.lat!=null&&x.lon!=null)?{lat:Number(x.lat),lon:Number(x.lon)}:window._restaurantLookupLocation;let nameEl=document.getElementById('rName'),locEl=document.getElementById('rLoc'),typeEl=document.getElementById('rType'),webEl=document.getElementById('rWebsite');if(nameEl)nameEl.value=name;if(locEl)locEl.value=location;if(typeEl)typeEl.value=type;if(webEl)webEl.value=website;let lookupBox=document.getElementById('restaurantLookupResults');if(lookupBox)lookupBox.innerHTML='<div class="notice" style="margin-top:8px"><strong>Restaurant selected.</strong> Review the details below before saving.</div>';renderSurvey();if(document.getElementById('rName'))document.getElementById('rName').value=name;if(document.getElementById('rLoc'))document.getElementById('rLoc').value=location;if(document.getElementById('rType'))document.getElementById('rType').value=type;if(document.getElementById('rWebsite'))document.getElementById('rWebsite').value=website}
function openRestaurant(id,prefilling=null){let r=id==='new'?prefilling||{id:'new',name:'',type:'Other',location:'',website:'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:null,updatedAt:null}:db.restaurants.find(x=>x.id===id);if(!r)return;pendingRestaurant=id==='new'?{...r}:null;pendingReviewRestaurant=id==='new'?null:{...r,photos:[...(r.photos||[])]};restaurantEditMode=id!=='new';window._editingPhotos=[...(r.photos||[])];let latest=r.reviewHistory?.[r.reviewHistory.length-1]||r.survey||null;let scores=latest?.scores||{};surveyState={restaurantId:id==='new'?'new':id,scores:{},ordered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};surveyQuestions.forEach((q,i)=>surveyState.scores[i]=Number((Array.isArray(scores)?scores[i]:scores[i])||0));renderSurvey()}
function continueRestaurantReview(id){return}
function cancelRestaurantWorkflow(){pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];closeModal()}
async function previewPhotos(input){let files=[...(input.files||[])];for(const file of files){window._editingPhotos.push(await readFileAsDataUrl(file))}let p=document.getElementById('photoPreview');if(p)p.innerHTML=window._editingPhotos.map((x,i)=>`<div><img src="${esc(x)}" alt="Meal photo ${i+1}"><button class="btn" onclick="removePhoto(${i})">Remove</button></div>`).join('')}
function removePhoto(i){window._editingPhotos.splice(i,1);let p=document.getElementById('photoPreview');if(p)p.innerHTML=window._editingPhotos.map((x,j)=>`<div><img src="${esc(x)}" alt="Meal photo ${j+1}"><button class="btn" onclick="removePhoto(${j})">Remove</button></div>`).join('')}
function useCurrentLocationForAddress(){if(!navigator.geolocation)return alert('Location services are not available in this browser.');let status=document.getElementById('rLoc');status.value='Finding your location…';navigator.geolocation.getCurrentPosition(async pos=>{try{let r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=18&addressdetails=1`,{headers:{'Accept-Language':'en'}});let d=await r.json(),a=d.address||{},street=[a.house_number,a.road].filter(Boolean).join(' '),city=a.city||a.town||a.village||a.municipality||'',state=a.state_code||a.state||'';status.value=[street,city,state].filter(Boolean).join(', ')}catch{status.value=''}},()=>{status.value=''}, {enableHighAccuracy:true,timeout:12000,maximumAge:30000})}
function findWebsiteForCurrentRestaurant(){let q=encodeURIComponent(`${fieldValue('rName')} ${fieldValue('rLoc')} official restaurant website`);window.location.href='https://www.google.com/search?q='+q}
function findOfficialMenu(){let q=encodeURIComponent(`${fieldValue('rName')} ${fieldValue('rLoc')} official menu`);window.location.href='https://www.google.com/search?q='+q}
function officialMenuSearch(name,loc){return 'https://www.google.com/search?q='+encodeURIComponent(`${name} ${loc} official menu`)}
function renderRestaurants(){let q=fieldValue('restaurantSearch').toLowerCase(),arr=db.restaurants.filter(r=>JSON.stringify(r).toLowerCase().includes(q));document.getElementById('restaurantList').innerHTML=arr.length?arr.map(r=>restaurantCard(r)).join(''):'<div class="empty">No saved restaurants yet.</div>';updateStory()}
function restaurantCard(r){let s=r.survey,history=r.reviewHistory||[],summary=s?topRatedSummary(s):'';return `<article class="restaurant"><div class="recipeHead"><div><h3>${esc(r.name)}</h3><div class="meta">${esc(r.location||'')} ${r.type?'• '+esc(r.type):''}</div>${stamp('Added',r.createdAt)}${r.updatedAt?stamp('Last updated',r.updatedAt):''}</div><button class="btn" onclick="openRestaurant('${r.id}')">Edit</button></div>${s?`<div class="restaurantScoreCard"><div><div class="restaurantScore">${Number(s.overall||0).toFixed(1)}<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div><div><div class="topRated"><strong>Top Rated:</strong> ${summary||'Complete another visit for more detail.'}</div>${stamp('Reviewed',s.createdAt)}<div class="restaurantLinks"><button class="btn primary" onclick="startSurvey('${r.id}')">Review Again</button><button class="btn" onclick="showVisitHistory('${r.id}')">Visit History (${history.length})</button></div></div></div>`:`<div class="actions"><button class="btn primary" onclick="startSurvey('${r.id}')">★ Rate This Restaurant</button></div>`}${r.notes?`<p>${esc(r.notes)}</p>`:''}<div class="restaurantLinks">${r.website?`<a class="btn" href="${esc(r.website)}" target="_blank" rel="noopener noreferrer">Official Website</a>`:''}${r.menuUrl?`<a class="btn" href="${esc(r.menuUrl)}" target="_blank" rel="noopener noreferrer">Official Menu</a>`:`<a class="btn" href="${officialMenuSearch(r.name,r.location||'')}" target="_blank" rel="noopener noreferrer">Find Official Menu</a>`}</div>${r.photos?.length?`<div class="photos">${r.photos.slice(0,6).map((p,i)=>`<img src="${esc(p)}" alt="${esc(r.name)} meal photo ${i+1}">`).join('')}</div>`:''}</article>`}
function topRatedSummary(s){let labels=surveyQuestions.map((q,i)=>({name:q[0],score:Number(s?.scores?.[i]||0),i})).filter(x=>x.i>0&&x.i<9&&x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);return labels.map(x=>`${esc(x.name)} ${x.score}/10`).join(' • ')}
async function fetchWithTimeout(url,options,timeoutMs){
  let controller=new AbortController();
  let timer=setTimeout(function(){controller.abort()},timeoutMs||8000);
  try{
    let opts=Object.assign({},options||{},{signal:controller.signal});
    return await fetch(url,opts);
  }finally{clearTimeout(timer)}
}
async function findRestaurantAroundMe(){
  let status=document.getElementById('locationStatus');
  status.textContent='Requesting your location…';
  if(!navigator.geolocation){status.textContent='Location services are not available in this browser.';return}
  navigator.geolocation.getCurrentPosition(async function(pos){
    let lat=pos.coords.latitude,lon=pos.coords.longitude;
    window._restaurantLookupLocation={lat,lon};
    status.textContent='Finding restaurants near you…';
    let all=[],seen={};
    function add(name,address,la,lo,type,website){
      if(!name||!Number.isFinite(la)||!Number.isFinite(lo))return;
      let dist=Math.round(distanceMeters(lat,lon,la,lo)); if(dist>8047)return;
      let key=(name+'|'+Math.round(la*10000)+'|'+Math.round(lo*10000)).toLowerCase();
      if(seen[key])return;seen[key]=1;
      all.push({name:name,address:address||'',lat:la,lon:lo,type:type||'Other',website:website||'',dist:dist});
    }
    let city='',state='';
    try{
      let rev='https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&zoom=10&addressdetails=1';
      let rr=await fetchWithTimeout(rev,{headers:{'Accept':'application/json','Accept-Language':'en'}},6000);
      if(rr.ok){let d=await rr.json(),a=d.address||{};city=a.city||a.town||a.village||a.municipality||'';state=a.state||''}
    }catch(e){}
    let place=[city,state].filter(Boolean).join(', ');
    try{
      let queries=[(city?'restaurants '+city+' '+state:'restaurants'),(city?'fast food '+city+' '+state:'fast food')];
      let responses=await Promise.all(queries.map(function(q){
        return fetchWithTimeout('https://photon.komoot.io/api/?q='+encodeURIComponent(q)+'&limit=50&lang=en',{},8000).catch(function(){return null});
      }));
      responses.forEach(function(resp){
        if(!resp||!resp.ok)return;
        resp.json().then(function(data){
          (data.features||[]).forEach(function(f){
            let p=f.properties||{},g=f.geometry?.coordinates||[],la=Number(g[1]),lo=Number(g[0]),name=String(p.name||'').trim();
            let address=[p.housenumber,p.street,p.city||p.town||p.village,p.state].filter(Boolean).join(', ');
            add(name,address,la,lo,restaurantTypeFromLookup(p),'');
          });
        });
      });
      await new Promise(function(resolve){setTimeout(resolve,350)});
    }catch(e){console.warn('Photon nearby search unavailable',e)}
    if(all.length<3){
      try{
        let q='restaurant '+place;
        let resp=await fetchWithTimeout('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=50&dedupe=1&q='+encodeURIComponent(q),{headers:{'Accept':'application/json','Accept-Language':'en'}},8000);
        if(resp.ok){
          let data=await resp.json();
          data.forEach(function(x){
            let a=x.address||{},la=Number(x.lat),lo=Number(x.lon),name=String(x.name||'').trim();
            let address=[a.house_number,a.road,a.city||a.town||a.village,a.state].filter(Boolean).join(', ');
            add(name,address,la,lo,restaurantTypeFromLookup(x),x.extratags?.website||x.extratags?.['contact:website']||'');
          });
        }
      }catch(e){}
    }
    all.sort(function(a,b){return a.dist-b.dist});
    let places=all.slice(0,12);
    renderNearby(places);
    status.textContent=places.length?'Select the restaurant that matches where you are.':'No named restaurants were found within 5 miles. You can add the restaurant manually.';
  },function(err){
    status.textContent=err&&err.code===1?'Location permission was denied. Please allow location access for Metro Eats in Safari settings.':'Location could not be determined. Please try again.';
  },{enableHighAccuracy:true,timeout:15000,maximumAge:30000});
}
function distanceMeters(a,b,c,d){if([a,b,c,d].some(x=>typeof x!=='number'))return 999999;let R=6371000,p=Math.PI/180,dLat=(c-a)*p,dLon=(d-b)*p,x=Math.sin(dLat/2)**2+Math.cos(a*p)*Math.cos(c*p)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function renderNearby(places){let box=document.getElementById('nearbyResults');box.innerHTML=places.length?`<div class="locCard"><div class="eyebrow">Choose your restaurant</div><h3>Restaurants Around Me</h3><div class="nearbyList">${places.map((x,i)=>`<div class="nearbyItem"><strong>${esc(x.name)}</strong><div class="meta">${x.dist<1609?(Math.round(x.dist*3.28084)+' ft'):(x.dist/1609.34).toFixed(1)+' mi'} ${x.address?'• '+esc(x.address):''}</div><div class="actions"><button class="btn primary" onclick='useNearby(${JSON.stringify(x).replace(/'/g,"&#39;")})'>Select This Restaurant</button></div></div>`).join('')}</div></div>`:''}
function useNearby(x){pendingRestaurant={id:'new',name:x.name,type:'Other',location:x.address||'',website:x.website||'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:new Date().toISOString(),updatedAt:null,lat:x.lat,lon:x.lon};pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];surveyState={restaurantId:'new',scores:{},ordered:'',orderAgain:''};renderSurvey()}
function currentSurveyRestaurant(){return pendingRestaurant||pendingReviewRestaurant||db.restaurants.find(x=>x.id===surveyState.restaurantId)}
function startSurvey(id){let r=db.restaurants.find(x=>x.id===id);if(!r)return;pendingRestaurant=null;pendingReviewRestaurant={...r,photos:[...(r.photos||[])]};restaurantEditMode=false;window._editingPhotos=[...(r.photos||[])];let latest=r.reviewHistory?.[r.reviewHistory.length-1]||r.survey||null;let priorScores=latest?.scores||{};surveyState={restaurantId:id,scores:{},ordered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};surveyQuestions.forEach((q,i)=>{let v=Array.isArray(priorScores)?priorScores[i]:priorScores[i];surveyState.scores[i]=Number(v||0)});renderSurvey()}
function renderRestaurantEditor(r){return `<div class="eyebrow">${pendingRestaurant?'Dining capture':'Restaurant editor'}</div><h2>${pendingRestaurant?'Create Restaurant & Review':'Edit Restaurant & Review'}</h2><div class="fields"><div class="field full"><label for="rName">Restaurant name</label><input id="rName" value="${esc(r?.name||'')}" autocomplete="organization" oninput="restaurantNameChanged(this.value)"><div id="restaurantLookupResults"></div></div><div class="field"><label for="rType">Restaurant type</label><select id="rType">${restaurantTypes.map(x=>`<option ${x===(r?.type||'Other')?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label for="rLoc">Street + city + state</label><input id="rLoc" value="${esc(r?.location||'')}" placeholder="123 Main St, Alton, IL"><div class="fileNote">Only street, city and state are shown in Metro Eats.</div></div><div class="field full"><label for="rWebsite">Official website</label><input id="rWebsite" type="url" inputmode="url" autocomplete="url" value="${esc(r?.website||'')}" placeholder="https://…"></div><div class="field full"><label for="rMenuUrl">Official menu</label><input id="rMenuUrl" type="url" inputmode="url" value="${esc(r?.menuUrl||'')}" placeholder="https://…"></div><div class="field full"><label for="rNotes">Notes</label><textarea id="rNotes" rows="3">${esc(r?.notes||'')}</textarea></div><div class="field full"><label for="rPhoto">Meal photos</label><input id="rPhoto" type="file" accept="image/*" multiple onchange="captureSurveyExtras();previewPhotos(this)"><div id="photoPreview" class="photos">${window._editingPhotos.map((p,i)=>`<div><img src="${esc(p)}" alt="Meal photo ${i+1}"><button class="btn" onclick="removePhoto(${i})">Remove</button></div>`).join('')}</div></div></div><div class="actions"><button class="btn secondary" onclick="useCurrentLocationForAddress()">⌖ Use My Location</button><button class="btn" onclick="findWebsiteForCurrentRestaurant()">Find Official Website</button><button class="btn" onclick="findOfficialMenu()">Find Official Menu</button>${pendingReviewRestaurant&&!pendingRestaurant?'<button class="btn danger" onclick="deleteCurrentSurvey()">Delete Survey</button>':''}</div>`}
function renderSurvey(){let r=currentSurveyRestaurant(),name=r?.name||'Restaurant Review';if(!window._editingPhotos)window._editingPhotos=[...(r?.photos||[])];modal.classList.add('show');modalBody.innerHTML=`${renderRestaurantEditor(r)}<div class="status">Survey</div><div class="scoreHero"><div class="restaurantScore">${surveyAverage()||'—'}<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Score — based on 10 ratings</div></div><div class="meta">${esc(name)}${r?.location?' • '+esc(r.location):''}</div><div class="reviewForm">${surveyQuestions.map((q,i)=>`<div class="reviewQuestion"><div class="reviewQuestionHead"><b>${i+1}. ${q[0]}</b><span>${surveyState.scores[i]?surveyState.scores[i]+'/10':'Select 1–10'}</span></div><div class="reviewScore">${[1,2,3,4,5,6,7,8,9,10].map(n=>`<button aria-label="${q[0]} score ${n}" class="${surveyState.scores[i]===n?'active':''}" onclick="setSurveyScore(${i},${n})">${n}</button>`).join('')}</div><div class="surveyScale"><span>Poor</span><span>Average</span><span>Exceptional</span></div></div>`).join('')}</div><div class="reviewExtras"><div class="field"><label for="surveyOrdered">What did I eat?</label><textarea id="surveyOrdered" class="surveyNote" rows="3" placeholder="What did you order?">${esc(surveyState.ordered)}</textarea></div><div class="field"><label>Would I order it again?</label><div class="actions"><button class="btn ${surveyState.orderAgain==='Yes'?'primary':''}" onclick="setOrderAgain('Yes')">Yes</button><button class="btn ${surveyState.orderAgain==='No'?'primary':''}" onclick="setOrderAgain('No')">No</button></div></div></div><div class="surveyActions"><button class="btn danger" onclick="cancelSurvey()">Cancel</button><button class="btn primary" onclick="saveSurvey()">Save Restaurant & Review</button></div>`}
async function deleteSurveyById(id){let index=db.restaurants.findIndex(x=>x.id===id);if(index<0){alert('That restaurant could not be found in Metro Eats.');return}let saved=db.restaurants[index];if(!confirm('Delete this survey and the entire restaurant entry? This will permanently remove the restaurant, all visit history, photos, notes and review data from Metro Eats.'))return;let backup=JSON.parse(JSON.stringify(saved));try{db.restaurants.splice(index,1);await saveWithQuotaRecovery();pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];closeModal();renderRestaurants();updateStory();alert('Survey and restaurant deleted.')}catch(e){db.restaurants.splice(index,0,backup);alert('Metro Eats could not delete this survey. Your data was not changed.\\n\\n'+(e?.message||'Please try again.'))}}
async function deleteCurrentSurvey(){let r=pendingReviewRestaurant;if(!r)return;let index=-1;if(r.id)index=db.restaurants.findIndex(x=>String(x.id)===String(r.id));if(index<0)index=db.restaurants.findIndex(x=>x===r||((x.name||'')===(r.name||'')&&(x.location||'')===(r.location||'')&&(x.createdAt||'')===(r.createdAt||'')));if(index<0){alert('That restaurant could not be found in Metro Eats.');return}if(!db.restaurants[index].id){db.restaurants[index].id=uid();save()}return deleteSurveyById(db.restaurants[index].id)}
function surveyAverage(){let vals=surveyQuestions.map((q,i)=>Number(surveyState.scores[i]||0)).filter(v=>v>0);return vals.length?(Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*10)/10).toFixed(1):''}
function setSurveyScore(i,n){captureSurveyExtras();surveyState.scores[i]=n;renderSurvey()}
function setOrderAgain(v){captureSurveyExtras();surveyState.orderAgain=v;renderSurvey()}
function captureSurveyExtras(){surveyState.ordered=document.getElementById('surveyOrdered')?.value?.trim()||surveyState.ordered}
async function saveSurvey(){captureSurveyExtras();let missing=surveyQuestions.findIndex((q,i)=>!surveyState.scores[i]);if(missing>=0){alert('Please choose a score from 1 to 10 for Question '+(missing+1)+'.');return}if(!surveyState.ordered){alert('Please tell us what you ate.');document.getElementById('surveyOrdered')?.focus();return}if(!surveyState.orderAgain){alert('Please choose Yes or No for whether you would order it again.');return}let now=new Date().toISOString(),review={scores:{...surveyState.scores},ordered:surveyState.ordered,orderAgain:surveyState.orderAgain,overall:Number(surveyAverage()),createdAt:now};let currentRestaurant=pendingRestaurant||pendingReviewRestaurant||{},restaurantFields={name:fieldValue('rName')||currentRestaurant.name||'Unnamed restaurant',type:fieldValue('rType')||currentRestaurant.type||'Other',location:fieldValue('rLoc')||currentRestaurant.location||'',website:fieldValue('rWebsite')||currentRestaurant.website||'',menuUrl:fieldValue('rMenuUrl')||currentRestaurant.menuUrl||'',notes:fieldValue('rNotes')||currentRestaurant.notes||'',photos:[...(window._editingPhotos||currentRestaurant.photos||[])],lat:currentRestaurant.lat??null,lon:currentRestaurant.lon??null};if(pendingRestaurant)pendingRestaurant={...pendingRestaurant,...restaurantFields};if(pendingReviewRestaurant)pendingReviewRestaurant={...pendingReviewRestaurant,...restaurantFields};let saveButton=document.querySelector('.surveyActions .btn.primary');if(saveButton){saveButton.disabled=true;saveButton.textContent='Saving…'}try{if(pendingRestaurant){let r={...pendingRestaurant,...restaurantFields,reviewHistory:[review],survey:review,rating:Math.max(1,Math.min(5,Math.round(review.overall/2*10)/10)),createdAt:pendingRestaurant.createdAt||now,updatedAt:now};db.restaurants.unshift(r)}else if(pendingReviewRestaurant){let r=db.restaurants.find(x=>x.id===pendingReviewRestaurant.id);if(!r)throw new Error('The restaurant could not be found in your saved restaurants.');Object.assign(r,pendingReviewRestaurant,restaurantFields);if(restaurantEditMode&&r.reviewHistory?.length){r.reviewHistory=[...(r.reviewHistory||[]).slice(0,-1),review]}else{r.reviewHistory=[...(r.reviewHistory||[]),review]}r.survey=review;r.rating=Math.max(1,Math.min(5,Math.round(review.overall/2*10)/10));r.updatedAt=now}else{let r=db.restaurants.find(x=>x.id===surveyState.restaurantId);if(!r)throw new Error('The restaurant could not be found in your saved restaurants.');Object.assign(r,restaurantFields);r.reviewHistory=[...(r.reviewHistory||[]),review];r.survey=review;r.rating=Math.max(1,Math.min(5,Math.round(review.overall/2*10)/10));r.updatedAt=now}await saveWithQuotaRecovery();pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];closeModal();renderRestaurants();showRankings()}catch(e){console.error('Metro Eats saveSurvey failed',e);if(saveButton){saveButton.disabled=false;saveButton.textContent='Save Restaurant & Review'}alert('Metro Eats could not save this review. Your entries are still on screen.\n\n'+(e?.message||'Please try again.'))}}
function cancelSurvey(){pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;closeModal()}
function showVisitHistory(id){let r=db.restaurants.find(x=>x.id===id);if(!r)return;let h=[...(r.reviewHistory||[])].reverse();modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Dining History</div><h2>${esc(r.name)}</h2><p class="hint">Each visit is kept as a separate review.</p><div class="visitHistory">${h.length?h.map((v,i)=>`<article class="visit"><div class="visitTop"><strong>Visit ${h.length-i}</strong><strong>${Number(v.overall||0).toFixed(1)}/10</strong></div>${stamp('Reviewed',v.createdAt)}<div class="small" style="margin-top:8px"><b>Ordered:</b> ${esc(v.ordered||'—')}</div><div class="small"><b>Order again:</b> ${esc(v.orderAgain||'—')}</div><div class="small" style="margin-top:8px">${topRatedSummary(v)}</div></article>`).join(''):'<div class="empty">No visit history yet.</div>'}</div><div class="actions"><button class="btn primary" onclick="closeModal();startSurvey('${r.id}')">Review Again</button><button class="btn danger" onclick="closeModal()">Close</button></div>`}
function showRankings(){let ranked=[...db.restaurants].filter(r=>r.survey).sort((a,b)=>(b.survey.overall||0)-(a.survey.overall||0));modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Dining Experience</div><h2>My Restaurant Rankings</h2><p class="hint">Rankings use only the 10 scored dining categories.</p>${ranked.length?`<div class="surveyGrid">${ranked.map((r,i)=>`<div class="surveyItem"><span class="rankBadge">#${i+1}</span><div><b>${esc(r.name)}</b><div class="small">${esc(r.location||'')} • <strong>${Number(r.survey.overall||0).toFixed(1)}/10</strong></div><div class="small">${topRatedSummary(r.survey)}</div>${stamp('Latest review',r.survey.createdAt)}</div><button class="btn" onclick="closeModal();startSurvey('${r.id}')">Review</button></div>`).join('')}</div>`:'<div class="empty">Complete a 10-question review to start your restaurant rankings.</div>'}<div class="actions"><button class="btn danger" onclick="closeModal()">Close</button></div>`}
function aiGuide(){let fav=db.recipes.filter(r=>r.favorite).map(r=>r.title).slice(0,10),visited=db.restaurants.map(r=>`${r.name} (${Number(r.rating||0).toFixed(1)}/5)`).slice(0,15),best=[...db.restaurants].filter(r=>r.survey).sort((a,b)=>b.survey.overall-a.survey.overall).slice(0,8).map(r=>`${r.name} (${r.survey.overall}/10)`),prompt=`I use an app called Metro Eats for recipes and a St. Louis / Metro East restaurant journal. Recommend 5 current restaurants that fit my tastes. Favorite recipes: ${fav.join(', ')||'none yet'}. Restaurants I have logged: ${visited.join(', ')||'none yet'}. My highest-rated visits: ${best.join(', ')||'none yet'}. Prefer restaurants I have not logged unless there is a strong reason. For each recommendation give current rating, cuisine, approximate price, why it fits, and the official website. Keep recommendations in St. Louis and the Metro East Illinois area.`;modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Personal Guide</div><h2>My Metro Eats Guide</h2><p class="hint">Your personal context is assembled below. Tap <b>Ask ChatGPT</b> to open ChatGPT with this brief, or copy it for another AI assistant.</p><div class="guideCard"><h4>What Metro Eats knows</h4><div class="tagRow">${fav.length?fav.slice(0,5).map(x=>`<span class="tag">${esc(x)}</span>`).join(''):'<span class="tag">No favorite recipes yet</span>'}</div><div class="small" style="margin-top:10px">${db.restaurants.length} saved restaurant${db.restaurants.length===1?'':'s'} • ${db.restaurants.reduce((n,r)=>n+(r.reviewHistory?.length||0),0)} visit reviews</div></div><div class="field" style="margin-top:12px"><label for="guidePrompt">Recommendation brief</label><textarea id="guidePrompt" rows="12">${esc(prompt)}</textarea></div><div class="actions"><button class="btn primary" onclick="askChatGPT()">✦ Ask ChatGPT</button><button class="btn" onclick="copyGuide()">Copy Brief</button><button class="btn danger" onclick="closeModal()">Close</button></div>`;window._guidePrompt=prompt}
function askChatGPT(){let u='https://chatgpt.com/?q='+encodeURIComponent(window._guidePrompt||'Recommend restaurants in St. Louis and Metro East.');window.open(u,'_blank','noopener')}
function copyGuide(){navigator.clipboard?.writeText(window._guidePrompt||'').then(()=>alert('Recommendation brief copied.')).catch(()=>alert('Copy is unavailable; select the text and copy it manually.'))}
function openBackup(){modal.classList.add('show');modalBody.innerHTML=`<div class="eyebrow">Metro Eats Backup</div><h2>Protect Your Journal</h2><p class="hint">Export your recipes, restaurant reviews, visit history, notes and photos to a backup file. You can restore it on this device later.</p><div class="backupGrid"><article class="featureCard"><div><h3>Export Backup</h3><p>Save a complete JSON backup of your current Metro Eats data.</p></div><button class="btn primary" onclick="exportBackup()">Export My Data</button></article><article class="featureCard"><div><h3>Restore Backup</h3><p>Replace the current local data with a Metro Eats backup file.</p></div><button class="btn" onclick="document.getElementById('restoreFile').click()">Choose Backup</button></article></div><div class="notice" style="margin-top:14px">Keep a backup somewhere safe. Browser storage can be cleared by iPhone or Safari settings.</div><div class="actions"><button class="btn danger" onclick="closeModal()">Close</button></div>`}
function exportBackup(){let payload={app:'Metro Eats',version:2,exportedAt:new Date().toISOString(),data:db},blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='metro-eats-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(url)}
document.getElementById('restoreFile').addEventListener('change',async e=>{let f=e.target.files?.[0];if(!f)return;try{let data=JSON.parse(await f.text()),next=data.data||data;if(!Array.isArray(next.recipes)||!Array.isArray(next.restaurants))throw Error();if(!confirm('Restore this Metro Eats backup? Your current local data will be replaced.'))return;db=next;migrate();alert('Metro Eats backup restored.');closeModal();renderRecipes();renderRestaurants();updateStory()}catch{alert('That file is not a valid Metro Eats backup.')}e.target.value=''})
function updateStory(){let visits=db.restaurants.reduce((n,r)=>n+(r.reviewHistory?.length||0),0),favs=db.recipes.filter(r=>r.favorite).length;let v=document.getElementById('storyVisits'),f=document.getElementById('storyFavorites');if(v)v.textContent=visits;if(f)f.textContent=favs;let h=document.getElementById('storyHeadline');if(h)h.textContent=visits?`${visits} meal${visits===1?'':'s'} in your dining story.`:'A record of where you eat.'}
function closeModal(){modal.classList.remove('show');modalBody.innerHTML='';pendingRestaurant=null;pendingReviewRestaurant=null;window._editingPhotos=[];window._pendingImportedRecipe=null}
const newsLocalTerms=/\b(st\.?\s*louis|saint\s*louis|metro\s*east|alton|godfrey|east\s*alton|wood\s*river|bethalto|grafton|edwardsville|glen\s*carbon|granite\s*city|collinsville|belleville|fairview\s*heights|shiloh|o'?fallon|ofallon|maryville|pontoon\s*beach|roxana|highland|millstadt|waterloo|columbia|creve\s*coeur|university\s*city|maplewood|kirkwood|brentwood|central\s*west\s*end|soulard|cherokee\s*street|the\s*hill)\b/i;
const newsFoodTerms=/\b(restaurant|restaurants|dining|food|drink|bar|bars|brewery|breweries|brewpub|cafe|caf[eé]|coffee|chef|menu|menus|pizza|burger|burgers|breakfast|brunch|chicken|bbq|barbecue|dessert|ice\s*cream|taco|tacos|steak|seafood|bakery|baking|culinary|eatery|eateries|opens|opening|closes|closing|reopens|reopen|food\s*truck|hospitality|wine|cocktail|cocktails|bloody\s*mary|tasting|food\s*event)\b/i;
const newsBadTerms=/\b(chicago|springfield|peoria|rockford|champaign|urbana|naperville|joliet|quad\s*cities|carbondale|decatur|indianapolis|kansas\s*city|nashville|new\s*york|los\s*angeles|miami|denver|seattle|portland|national|nationwide|travel|vacation|cruise|disney)\b/i;
function isLocalNews(x){let t=String(x.title||'');return newsFoodTerms.test(t)&&!newsBadTerms.test(t)&&(newsLocalTerms.test(t)||/^(Sauce Magazine|St\. Louis Magazine|The Telegraph|Belleville News-Democrat|EdGlenToday|RiverBender|St\. Louis Business Journal)$/.test(x.source||''))}
function dedupeNews(items){let s=new Set();return items.filter(x=>{let k=String(x.title||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();if(!k||s.has(k))return false;s.add(k);return isLocalNews(x)}).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0))}
async function loadLocalNews(){renderLocalNews(fallbackNews,'Saved stories');try{let r=await fetch('news.json?v=20261005',{cache:'no-store'});if(!r.ok)throw Error();let data=await r.json(),items=dedupeNews(data.items||[]);renderLocalNews(items.length?items:fallbackNews,data.updated||'Saved stories')}catch{}}
function renderLocalNews(items,updated){let box=document.getElementById('newsGrid'),stampEl=document.getElementById('newsUpdated');box.innerHTML=items.length?items.slice(0,10).map(x=>`<article class="newsCard"><div class="newsSource">${esc(x.source||'Local publication')}</div><h4><a href="${esc(x.url||'#')}" target="_blank" rel="noopener noreferrer">${esc(x.title||'Local story')}</a></h4><a class="newsMore" href="${esc(x.url||'#')}" target="_blank" rel="noopener noreferrer">Read Full Story →</a><div class="newsDate">${esc(x.date||'')}</div></article>`).join(''):'<div class="empty">No local stories are available right now.</div>';if(stampEl)stampEl.textContent=updated&&updated!=='Saved stories'?'Updated '+new Date(updated).toLocaleString():'Showing saved stories'}
function registerSW(){if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}
renderRecipes();renderRestaurants();updateStory();loadLocalNews();registerSW();


/* Metro Eats Food Critic survey — independent of service-worker changes */
function meCriticEnsureState(){
  if(!surveyState.foodItems)surveyState.foodItems=[];
  if(!surveyState.foodOpen)surveyState.foodOpen={};
  if(surveyState.legacyOrdered===undefined)surveyState.legacyOrdered=surveyState.ordered||'';
  if(surveyState.orderAgain===undefined)surveyState.orderAgain='';
}
function meCriticSuggestions(type){return ME_CRITIC_SUGGESTIONS[type]||ME_CRITIC_SUGGESTIONS[ME_CRITIC_ALIASES[type]]||ME_CRITIC_SUGGESTIONS.Other}
function meCriticCategory(name){
  let n=normalizeRestaurantName(name);
  if(/salad/.test(n))return'Salads';
  if(/soup|chowder|pho|ramen/.test(n))return'Soups';
  if(/dessert|cake|pie|ice cream|cookie|brownie|tiramisu|milkshake/.test(n))return'Desserts';
  if(/drink|coffee|tea|beer|wine|cocktail/.test(n))return'Drinks';
  if(/fries|potato|beans|rice|coleslaw|vegetable|bread|chips|naan/.test(n))return'Sides';
  if(/appetizer|wings|egg rolls|spring rolls|samosa|rangoon|nachos|pretzel|dumpling|gyoza/.test(n))return'Appetizers';
  return'Entrées';
}
function meCriticFoodAverage(){
  meCriticEnsureState();
  let a=surveyState.foodItems.map(x=>Number(x.rating||0)).filter(x=>x>0);
  return a.length?Math.round(a.reduce((p,c)=>p+c,0)/a.length*10)/10:0;
}
function meCriticFinalScore(){
  let a=[Number(surveyState.scores[0]||0),meCriticFoodAverage(),Number(surveyState.scores[2]||0),Number(surveyState.scores[3]||0)].filter(x=>x>0);
  return a.length?Math.round(a.reduce((p,c)=>p+c,0)/a.length*10)/10:0;
}
function meCriticCapture(){
  meCriticEnsureState();
  surveyState.legacyOrdered=document.getElementById('criticLegacyOrder')?.value?.trim()||surveyState.legacyOrdered||'';
  surveyState.foodItems.forEach(x=>{
    let n=document.getElementById('criticFood-'+x.id),note=document.getElementById('criticNote-'+x.id);
    if(n)x.name=n.value.trim()||x.name;
    if(note)x.notes=note.value.trim();
  });
}
function meCriticSetScore(i,n){meCriticCapture();surveyState.scores[i]=n;renderSurvey()}
function meCriticSetAgain(v){meCriticCapture();surveyState.orderAgain=v;renderSurvey()}
function meCriticToggleCat(c){meCriticCapture();surveyState.foodOpen[c]=!surveyState.foodOpen[c];renderSurvey()}
function meCriticAddFood(c,n=''){meCriticCapture();surveyState.foodItems.push({id:uid(),category:c,name:n,rating:0,notes:''});surveyState.foodOpen[c]=true;renderSurvey()}
function meCriticAddSuggested(c,n){meCriticEnsureState();if(!surveyState.foodItems.some(x=>x.category===c&&normalizeRestaurantName(x.name)===normalizeRestaurantName(n)))meCriticAddFood(c,n)}
function meCriticRemoveFood(id){meCriticCapture();surveyState.foodItems=surveyState.foodItems.filter(x=>x.id!==id);renderSurvey()}
function meCriticRateFood(id,n){meCriticCapture();let x=surveyState.foodItems.find(x=>x.id===id);if(x){x.rating=n;renderSurvey()}}
function meCriticFoodCard(x){
  return '<div style="border-top:1px solid var(--line);padding:10px 0"><div class="actions" style="margin:0"><input id="criticFood-'+x.id+'" class="grow" value="'+esc(x.name)+'" placeholder="What did you eat?"><button class="btn" onclick="meCriticRemoveFood(\''+x.id+'\')">Remove</button></div><div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(n=>'<button class="'+(Number(x.rating)===n?'active':'')+'" onclick="meCriticRateFood(\''+x.id+'\','+n+')">'+n+'</button>').join('')+'</div><textarea id="criticNote-'+x.id+'" rows="2" class="surveyNote" placeholder="Critic notes — taste, texture, preparation, portion…">'+esc(x.notes||'')+'</textarea></div>';
}
function meCriticFoodBlock(c,type){
  meCriticEnsureState();
  let items=surveyState.foodItems.filter(x=>x.category===c),open=!!surveyState.foodOpen[c],suggestions=meCriticSuggestions(type).filter(x=>meCriticCategory(x)===c);
  let h='<div class="surveyItem" style="margin:8px 0;padding:0"><button class="btn" style="width:100%;text-align:left" onclick="meCriticToggleCat(\''+c+'\')"><b>'+c+'</b><span style="float:right">'+(items.length||'+')+'</span></button>';
  if(open){
    h+='<div style="padding:8px">'+suggestions.map(x=>'<button class="btn secondary" style="margin:3px" onclick="meCriticAddSuggested(\''+c+'\',\''+x.replace(/'/g,'&#39;')+'\')">'+esc(x)+'</button>').join('');
    h+=items.map(meCriticFoodCard).join('');
    h+='<button class="btn primary" style="width:100%" onclick="meCriticAddFood(\''+c+'\')">＋ Add Item</button></div>';
  }
  return h+'</div>';
}
function meCriticLegacyScores(v){
  let p=v?.scores||{};
  if(Array.isArray(p))return {0:Number(p[0]||0),1:Number(p[1]||0),2:Number(p[3]||0),3:Number(p[6]||0)};
  return {0:Number(p[0]||0),1:Number(p[1]||0),2:Number(p[2]||0),3:Number(p[3]||0)};
}
function startSurvey(id){
  let r=db.restaurants.find(x=>x.id===id);if(!r)return;
  pendingRestaurant=null;pendingReviewRestaurant={...r,photos:[...(r.photos||[])]};restaurantEditMode=false;window._editingPhotos=[...(r.photos||[])] ;
  let latest=r.reviewHistory?.[r.reviewHistory.length-1]||r.survey||null;
  let items=(latest?.foodItems||[]).map(x=>({...x,id:x.id||uid()}));
  if(!items.length&&latest?.ordered)items=[{id:uid(),category:'Entrées',name:latest.ordered,rating:Number(latest?.scores?.[1]||0),notes:'Imported from an earlier review.'}];
  surveyState={restaurantId:id,scores:meCriticLegacyScores(latest),foodItems:items,foodOpen:{},legacyOrdered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};
  renderSurvey();
}
function openRestaurant(id,prefilling=null){
  let r=id==='new'?prefilling||{id:'new',name:'',type:'Other',location:'',website:'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:null,updatedAt:null}:db.restaurants.find(x=>String(x.id)===String(id));
  if(!r)return;
  if(id!=='new'&&!r.id){r.id=uid();save()}
  pendingRestaurant=id==='new'?{...r}:null;pendingReviewRestaurant=id==='new'?null:{...r,photos:[...(r.photos||[])]};restaurantEditMode=id!=='new';window._editingPhotos=[...(r.photos||[])];
  let latest=r.reviewHistory?.[r.reviewHistory.length-1]||r.survey||null;
  surveyState={restaurantId:id==='new'?'new':r.id,scores:meCriticLegacyScores(latest),foodItems:(latest?.foodItems||[]).map(x=>({...x,id:x.id||uid()})),foodOpen:{},legacyOrdered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};
  if(!surveyState.foodItems.length&&latest?.ordered)surveyState.foodItems=[{id:uid(),category:'Entrées',name:latest.ordered,rating:Number(latest?.scores?.[1]||0),notes:'Imported from an earlier review.'}];
  renderSurvey();
}
function useNearby(x){
  pendingRestaurant={id:'new',name:x.name,type:x.type||'Other',location:x.address||'',website:x.website||'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:new Date().toISOString(),updatedAt:null,lat:x.lat,lon:x.lon};
  pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];surveyState={restaurantId:'new',scores:{},foodItems:[],foodOpen:{},legacyOrdered:'',orderAgain:''};renderSurvey();
}
function renderSurvey(){
  meCriticEnsureState();
  let r=currentSurveyRestaurant(),type=r?.type||'Other',foodAvg=meCriticFoodAverage(),final=meCriticFinalScore(),name=r?.name||'Restaurant Review';
  if(!window._editingPhotos)window._editingPhotos=[...(r?.photos||[])];modal.classList.add('show');
  let h=renderRestaurantEditor(r);
  h+='<div class="status">Food Critic Review</div><div class="scoreHero"><div class="restaurantScore">'+(final||'—')+'<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Critic Score — Overall Experience, Food Quality, Service & Value</div></div>';
  h+='<div class="meta">'+esc(name)+(r?.location?' • '+esc(r.location):'')+'</div>';
  h+='<div class="reviewForm"><h3>Critic Rating</h3><p class="hint">Four ratings. Food Quality is calculated from the individual things you ate.</p>';
  ME_CRITIC_QUESTIONS.forEach((q,i)=>{
    let value=i===1?(foodAvg?foodAvg+'/10':'Calculated from food below'):(surveyState.scores[i]?surveyState.scores[i]+'/10':'Select 1–10');
    h+='<div class="reviewQuestion"><div class="reviewQuestionHead"><b>'+(i+1)+'. '+q[0]+'</b><span>'+value+'</span></div>';
    if(i===1)h+='<div class="status">'+(foodAvg?foodAvg.toFixed(1)+'/10 from '+surveyState.foodItems.filter(x=>Number(x.rating)>0).length+' rated item(s)':'Rate each item below to calculate this score.')+'</div>';
    else h+='<div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(n=>'<button aria-label="'+q[0]+' score '+n+'" class="'+(Number(surveyState.scores[i])===n?'active':'')+'" onclick="meCriticSetScore('+i+','+n+')">'+n+'</button>').join('')+'</div>';
    h+='</div>';
  });
  h+='</div><div class="reviewExtras"><h3>What I Ate</h3><p class="hint">Rate the dishes and drinks you actually had. Add critic notes for taste, texture, preparation, portion and standout details.</p>';
  h+=ME_CRITIC_CATS.map(c=>meCriticFoodBlock(c,type)).join('');
  h+='<div class="field"><label for="criticLegacyOrder">Previous order note</label><textarea id="criticLegacyOrder" rows="2" class="surveyNote" placeholder="Optional">'+esc(surveyState.legacyOrdered||'')+'</textarea></div>';
  h+='<div class="field"><label>Would I order it again?</label><div class="actions"><button class="btn '+(surveyState.orderAgain==='Yes'?'primary':'')+'" onclick="meCriticSetAgain(\'Yes\')">Yes</button><button class="btn '+(surveyState.orderAgain==='No'?'primary':'')+'" onclick="meCriticSetAgain(\'No\')">No</button></div></div></div>';
  h+='<div class="surveyActions"><button class="btn danger" onclick="cancelSurvey()">Cancel</button><button class="btn primary" onclick="saveSurvey()">Save Restaurant & Review</button></div>';
  modalBody.innerHTML=h;
}
async function saveSurvey(){
  meCriticEnsureState();meCriticCapture();
  let missing=[0,2,3].find(i=>!surveyState.scores[i]);
  if(missing!==undefined){alert('Please choose a score from 1 to 10 for Question '+(missing+1)+'.');return}
  if(!surveyState.foodItems.length||surveyState.foodItems.some(x=>!String(x.name||'').trim()||!Number(x.rating))){alert('Please add and rate every food item you ate.');return}
  if(!surveyState.orderAgain){alert('Please choose Yes or No for whether you would order it again.');return}
  let now=new Date().toISOString(),foodAvg=meCriticFoodAverage();
  let review={scores:{0:Number(surveyState.scores[0]),1:foodAvg,2:Number(surveyState.scores[2]),3:Number(surveyState.scores[3])},foodItems:surveyState.foodItems.map(x=>({category:x.category,name:String(x.name).trim(),rating:Number(x.rating),notes:String(x.notes||'').trim()})),ordered:surveyState.legacyOrdered||'',orderAgain:surveyState.orderAgain,overall:meCriticFinalScore(),createdAt:now};
  let currentRestaurant=pendingRestaurant||pendingReviewRestaurant||{},fields={name:fieldValue('rName')||currentRestaurant.name||'Unnamed restaurant',type:fieldValue('rType')||currentRestaurant.type||'Other',location:fieldValue('rLoc')||currentRestaurant.location||'',website:fieldValue('rWebsite')||currentRestaurant.website||'',menuUrl:fieldValue('rMenuUrl')||currentRestaurant.menuUrl||'',notes:fieldValue('rNotes')||currentRestaurant.notes||'',photos:[...(window._editingPhotos||currentRestaurant.photos||[])],lat:currentRestaurant.lat??null,lon:currentRestaurant.lon??null};
  if(pendingRestaurant)pendingRestaurant={...pendingRestaurant,...fields};if(pendingReviewRestaurant)pendingReviewRestaurant={...pendingReviewRestaurant,...fields};
  let saveButton=document.querySelector('.surveyActions .btn.primary');if(saveButton){saveButton.disabled=true;saveButton.textContent='Saving…'}
  try{
    if(pendingRestaurant){let r={...pendingRestaurant,...fields,reviewHistory:[review],survey:review,rating:Math.max(1,Math.min(5,Math.round(review.overall/2*10)/10)),createdAt:pendingRestaurant.createdAt||now,updatedAt:now};db.restaurants.unshift(r)}
    else if(pendingReviewRestaurant){let r=db.restaurants.find(x=>x.id===pendingReviewRestaurant.id);if(!r)throw new Error('The restaurant could not be found in your saved restaurants.');Object.assign(r,pendingReviewRestaurant,fields);r.reviewHistory=restaurantEditMode&&r.reviewHistory?.length?[...(r.reviewHistory||[]).slice(0,-1),review]:[...(r.reviewHistory||[]),review];r.survey=review;r.rating=Math.max(1,Math.min(5,Math.round(review.overall/2*10)/10));r.updatedAt=now}
    else{let r=db.restaurants.find(x=>x.id===surveyState.restaurantId);if(!r)throw new Error('The restaurant could not be found in your saved restaurants.');Object.assign(r,fields);r.reviewHistory=[...(r.reviewHistory||[]),review];r.survey=review;r.rating=Math.max(1,Math.min(5,Math.round(review.overall/2*10)/10));r.updatedAt=now}
    await saveWithQuotaRecovery();pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];closeModal();renderRestaurants();showRankings();
  }catch(e){console.error('Metro Eats food critic save failed',e);if(saveButton){saveButton.disabled=false;saveButton.textContent='Save Restaurant & Review'}alert('Metro Eats could not save this review. Your entries are still on screen.\n\n'+(e?.message||'Please try again.'))}
}
function meCriticTopFoods(s){return(s?.foodItems||[]).filter(x=>x.name&&Number(x.rating)>0).sort((a,b)=>Number(b.rating)-Number(a.rating)).slice(0,3)}
function showVisitHistory(id){
  let r=db.restaurants.find(x=>x.id===id);if(!r)return;let h=[...(r.reviewHistory||[])].reverse();modal.classList.add('show');
  modalBody.innerHTML='<div class="eyebrow">Food Critic History</div><h2>'+esc(r.name)+'</h2><p class="hint">Each visit is kept as a separate critic review.</p><div class="visitHistory">'+(h.length?h.map((v,i)=>'<article class="visit"><div class="visitTop"><strong>Visit '+(h.length-i)+'</strong><strong>'+Number(v.overall||0).toFixed(1)+'/10</strong></div>'+stamp('Reviewed',v.createdAt)+'<div class="small" style="margin-top:8px"><b>What I ate:</b> '+esc(v.ordered||'—')+'</div><div class="small"><b>Order again:</b> '+esc(v.orderAgain||'—')+'</div>'+(v.foodItems?.length?'<div class="small" style="margin-top:8px"><b>Top items:</b> '+meCriticTopFoods(v).map(x=>esc(x.name)+' '+Number(x.rating).toFixed(1)+'/10').join(' • ')+'</div>':'')+'</article>').join(''):'<div class="empty">No visit history yet.</div>')+'</div><div class="actions"><button class="btn primary" onclick="closeModal();startSurvey(\''+r.id+'\')">Review Again</button><button class="btn danger" onclick="closeModal()">Close</button></div>';
}
function showRankings(){
  let ranked=[...db.restaurants].filter(r=>r.survey).sort((a,b)=>(b.survey.overall||0)-(a.survey.overall||0));modal.classList.add('show');
  modalBody.innerHTML='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Critic Score averages Overall Experience, Food Quality, Service and Value. Food Quality comes from the dishes and drinks you rated.</p>'+(ranked.length?'<div class="surveyGrid">'+ranked.map((r,i)=>'<div class="surveyItem"><span class="rankBadge">#'+(i+1)+'</span><div><b>'+esc(r.name)+'</b><div class="small">'+esc(r.location||'')+' • <strong>'+Number(r.survey.overall||0).toFixed(1)+'/10</strong></div>'+(r.survey.foodItems?.length?'<div class="small">Top: '+meCriticTopFoods(r.survey).map(x=>esc(x.name)+' '+Number(x.rating).toFixed(1)+'/10').join(' • ')+'</div>':'')+stamp('Latest review',r.survey.createdAt)+'</div><button class="btn" onclick="closeModal();startSurvey(\''+r.id+'\')">Review</button></div>').join('')+'</div>':'<div class="empty">Complete a food critic review to start your restaurant rankings.</div>')+'<div class="actions"><button class="btn danger" onclick="closeModal()">Close</button></div>';
}


/* Metro Eats Food Critic item-card polish — independent of service-worker changes */
function meCriticFoodCard(x){
  let ratingButtons=[1,2,3,4,5,6,7,8,9,10].map(function(n){
    return '<button type="button" class="criticFoodScoreBtn '+(Number(x.rating)===n?'active':'')+'" aria-label="'+esc(x.name||'Food item')+' score '+n+'" onclick="meCriticRateFood(\''+x.id+'\','+n+')">'+n+'</button>';
  }).join('');
  return '<article class="criticFoodCard">'+
    '<div class="criticFoodTop">'+
      '<div class="criticFoodNumber">🍽</div>'+
      '<div class="criticFoodNameWrap"><label class="criticFoodLabel" for="criticFood-'+x.id+'">What did I eat?</label><input id="criticFood-'+x.id+'" class="criticFoodName" value="'+esc(x.name)+'" placeholder="Enter the dish or drink"></div>'+
      '<button type="button" class="criticRemoveBtn" aria-label="Remove '+esc(x.name||'food item')+'" onclick="meCriticRemoveFood(\''+x.id+'\')">Remove</button>'+
    '</div>'+
    '<div class="criticRatingBlock">'+
      '<div class="criticRatingHead"><b>Food Rating</b><span>'+(Number(x.rating)?Number(x.rating)+'/10':'Select 1–10')+'</span></div>'+
      '<div class="criticFoodScore">'+ratingButtons+'</div>'+
      '<div class="surveyScale"><span>Poor</span><span>Average</span><span>Exceptional</span></div>'+
    '</div>'+
    '<div class="criticNotesBlock"><label class="criticFoodLabel" for="criticNote-'+x.id+'">Critic Notes</label><textarea id="criticNote-'+x.id+'" class="criticFoodNotes" rows="3" placeholder="Taste, texture, preparation, portion, presentation, and anything that stood out…">'+esc(x.notes||'')+'</textarea></div>'+
  '</article>';
}
function meCriticFoodBlock(c,type){
  meCriticEnsureState();
  let items=surveyState.foodItems.filter(function(x){return x.category===c}),open=!!surveyState.foodOpen[c],suggestions=meCriticSuggestions(type).filter(function(x){return meCriticCategory(x)===c});
  let h='<section class="criticCategory '+(open?'isOpen':'')+'"><button type="button" class="criticCategoryHead" onclick="meCriticToggleCat(\''+c+'\')"><span><b>'+esc(c)+'</b><small>'+(items.length?(items.length+' item'+(items.length===1?'':'s')):'Add something you ate')+'</small></span><strong>'+(open?'−':'+')+'</strong></button>';
  if(open){
    if(suggestions.length) h+='<div class="criticSuggestions"><span class="criticSuggestionsLabel">Popular choices</span>'+suggestions.map(function(x){return '<button type="button" class="criticSuggestion" onclick="meCriticAddSuggested(\''+c+'\',\''+x.replace(/'/g,'&#39;')+'\')">'+esc(x)+'</button>';}).join('')+'</div>';
    h+='<div class="criticFoodList">'+items.map(meCriticFoodCard).join('')+'</div>';
    h+='<button type="button" class="criticAddItem" onclick="meCriticAddFood(\''+c+'\')"><span>＋</span> Add another item</button>';
  }
  return h+'</section>';
}

/* Metro Eats Top Restaurant Spotlight — home page feature */
function meSpotlightReview(r){return r?.survey || (r?.reviewHistory||[]).slice().sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))[0] || {}}
function meSpotlightScore(r){let s=meSpotlightReview(r);return Number(s.overall||r?.rating||0)}
function meSpotlightTopCategories(s){
  if(!s)return [];
  if(s.foodItems?.length)return s.foodItems.filter(x=>x.name&&Number(x.rating)>0).sort((a,b)=>Number(b.rating)-Number(a.rating)).slice(0,3).map(x=>({label:x.name,score:Number(x.rating),kind:'dish'}));
  return surveyQuestions.map((q,i)=>({label:q[0],score:Number(s.scores?.[i]||0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}
function meSpotlightMarkup(r){
  let s=meSpotlightReview(r),score=meSpotlightScore(r),top=meSpotlightTopCategories(s);
  let insight=top.length
    ? (s.foodItems?.length?'Your highest-rated dishes are ':'Your strongest areas are ')+top.map(x=>esc(x.label)+' ('+x.score+'/10)').join(', ')+'.'
    : 'Your critic review is the starting point for this restaurant.';
  let repeat=s.orderAgain?(' You said you would '+(s.orderAgain==='Yes'?'order it again.':'not order it again.')):'';
  return '<article class="restaurantSpotlightCard">'+
    '<div class="sectionKicker">Your #1 Restaurant</div>'+
    '<div class="restaurantSpotlightTitleRow"><div><h3>'+esc(r.name)+'</h3><div class="meta">'+esc(r.location||'')+(r.type?' • '+esc(r.type):'')+'</div></div><div class="restaurantSpotlightScore">'+score.toFixed(1)+'<small>/10</small></div></div>'+
    '<p class="restaurantSpotlightInsight"><strong>Critic insight:</strong> '+insight+esc(repeat)+'</p>'+
    (s.foodItems?.length?'<div class="restaurantSpotlightDishes"><b>Top dishes</b>'+meCriticTopFoods(s).map(x=>'<span>'+esc(x.name)+' <strong>'+Number(x.rating).toFixed(1)+'/10</strong></span>').join('')+'</div>':'')+
    '<div class="actions"><button class="btn primary" onclick="showReviewResults(\''+String(r.id).replace(/'/g,"&#39;")+'\')">View Review Results</button>'+(r.website?'<a class="btn" href="'+esc(r.website)+'" target="_blank" rel="noopener noreferrer">Official Website</a>':'')+'</div>'+
    '</article>';
}
function renderRestaurantSpotlight(){
  let box=document.getElementById('restaurantSpotlight');if(!box)return;
  let ranked=[...(db.restaurants||[])].filter(r=>meSpotlightScore(r)>0).sort((a,b)=>meSpotlightScore(b)-meSpotlightScore(a));
  if(!ranked.length){box.hidden=true;box.innerHTML='';return}
  box.hidden=false;box.innerHTML=meSpotlightMarkup(ranked[0]);
}
function updateStory(){
  try{
    let visits=(db.restaurants||[]).reduce((n,r)=>n+((r.reviewHistory&&r.reviewHistory.length)||0),0);
    let favs=(db.recipes||[]).filter(r=>r.favorite).length;
    let v=document.getElementById('storyVisits'),f=document.getElementById('storyFavorites');
    if(v)v.textContent=visits;
    if(f)f.textContent=favs;
    if(typeof renderRestaurantSpotlight==='function')renderRestaurantSpotlight();
  }catch(e){console.error('Metro Eats updateStory error',e)}
}
renderRestaurantSpotlight();

/* Metro Eats critic workflow safety net — keep review screens usable if a render error occurs */
(function(){
  function meCriticRenderFallback(){
    try{
      modal.classList.add('show');
      let r=currentSurveyRestaurant()||{}, name=r.name||'Restaurant Review';
      let h='<div class="eyebrow">Food Critic</div><h2>'+esc(name)+'</h2><p class="hint">Your review is ready. Choose your ratings below.</p>';
      [0,2,3].forEach(function(i){
        let labels={0:'Overall Experience',2:'Service',3:'Value'};
        h+='<div class="reviewQuestion"><div class="reviewQuestionHead"><b>'+labels[i]+'</b><span>'+((surveyState.scores||{})[i]||'Select 1–10')+'/10</span></div><div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" class="'+(Number(surveyState.scores[i])===n?'active':'')+'" onclick="meCriticSetScore('+i+','+n+')">'+n+'</button>'}).join('')+'</div></div>';
      });
      h+='<div class="field"><label for="criticFallbackFood">What did I eat?</label><input id="criticFallbackFood" value="'+esc((surveyState.foodItems&&surveyState.foodItems[0]?.name)||'')+'" placeholder="Enter a dish or drink"></div>';
      h+='<div class="field"><label>Food Rating</label><div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" onclick="meCriticFallbackFoodRating('+n+')">'+n+'</button>'}).join('')+'</div></div>';
      h+='<div class="field"><label>Would I order it again?</label><div class="actions"><button type="button" class="btn" onclick="meCriticSetAgain(\'Yes\')">Yes</button><button type="button" class="btn" onclick="meCriticSetAgain(\'No\')">No</button></div></div>';
      h+='<div class="surveyActions"><button class="btn danger" onclick="cancelSurvey()">Cancel</button><button class="btn primary" onclick="meCriticFallbackSave()">Save Restaurant & Review</button></div>';
      modalBody.innerHTML=h;
    }catch(e){modalBody.innerHTML='<div class="eyebrow">Metro Eats</div><h2>Review could not be opened</h2><p class="hint">Please close this window and try again.</p><div class="actions"><button class="btn danger" onclick="closeModal()">Close</button></div>'}
  }
  window.meCriticFallbackFoodRating=function(n){
    meCriticEnsureState();
    let name=document.getElementById('criticFallbackFood')?.value?.trim()||'';
    if(!surveyState.foodItems.length)surveyState.foodItems.push({id:uid(),category:'Entrées',name:name,rating:n,notes:''});
    else {surveyState.foodItems[0].name=name;surveyState.foodItems[0].rating=n}
    meCriticRenderFallback();
  };
  window.meCriticFallbackSave=function(){
    meCriticEnsureState();
    let name=document.getElementById('criticFallbackFood')?.value?.trim()||'';
    if(!surveyState.foodItems.length&&name)surveyState.foodItems.push({id:uid(),category:'Entrées',name:name,rating:0,notes:''});
    if(surveyState.foodItems[0])surveyState.foodItems[0].name=name||surveyState.foodItems[0].name;
    if(typeof saveSurvey==='function')saveSurvey();
  };
  const originalRenderSurvey=window.renderSurvey;
  if(typeof originalRenderSurvey==='function'){
    window.renderSurvey=function(){try{originalRenderSurvey()}catch(e){console.error('Metro Eats review render error',e);meCriticRenderFallback()}};
  }
  const originalShowRankings=window.showRankings;
  if(typeof originalShowRankings==='function'){
    window.showRankings=function(){try{originalShowRankings()}catch(e){console.error('Metro Eats rankings render error',e);modal.classList.add('show');modalBody.innerHTML='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Your saved reviews are still intact. The rankings screen hit a display error.</p><div class="actions"><button class="btn danger" onclick="closeModal()">Close</button></div>'}};
  }
  const originalShowVisitHistory=window.showVisitHistory;
  if(typeof originalShowVisitHistory==='function'){
    window.showVisitHistory=function(id){try{originalShowVisitHistory(id)}catch(e){console.error('Metro Eats review history render error',e);modal.classList.add('show');modalBody.innerHTML='<div class="eyebrow">Food Critic History</div><h2>Review History</h2><p class="hint">Your saved reviews are still intact. The history screen hit a display error.</p><div class="actions"><button class="btn danger" onclick="closeModal()">Close</button></div>'}};
  }
})();


/* FINAL REVIEW WORKFLOW FIX
   The restaurant editor below is intentionally self-contained. It avoids the
   previous layered renderRestaurantEditor/renderSurvey chain that could leave
   the modal blank. Service worker code is untouched. */
function meCriticFinalRestaurant(id,prefilling){
  if(id==='new')return prefilling||{id:'new',name:'',type:'Other',location:'',website:'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:null,updatedAt:null};
  return db.restaurants.find(x=>String(x.id)===String(id));
}
function meCriticFinalLoad(r){
  let latest=r?.reviewHistory?.[r.reviewHistory.length-1]||r?.survey||null;
  let items=(latest?.foodItems||[]).map(x=>({...x,id:x.id||uid()}));
  if(!items.length&&latest?.ordered)items=[{id:uid(),category:'Entrées',name:String(latest.ordered),rating:Number(latest?.scores?.[1]||0),notes:'Imported from an earlier review.'}];
  surveyState={restaurantId:r?.id==='new'?'new':r?.id||null,scores:meCriticLegacyScores(latest),foodItems:items,foodOpen:{},legacyOrdered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};
}
function openRestaurant(id,prefilling){
  let r=meCriticFinalRestaurant(id,prefilling);if(!r)return;
  pendingRestaurant=id==='new'?{...r}:null;
  pendingReviewRestaurant=id==='new'?null:{...r,photos:[...(r.photos||[])]};
  restaurantEditMode=id!=='new';
  window._editingPhotos=[...(r.photos||[])];
  meCriticFinalLoad(r);renderSurvey();
}
function startSurvey(id){openRestaurant(id)}
function useNearby(x){
  let r={id:'new',name:x?.name||'',type:x?.type||'Other',location:x?.address||'',website:x?.website||'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:new Date().toISOString(),updatedAt:null,lat:x?.lat??null,lon:x?.lon??null};
  pendingRestaurant=r;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];
  meCriticFinalLoad(r);renderSurvey();
}
function meCriticFinalEditor(r){
  let editing=!!pendingReviewRestaurant&&!pendingRestaurant;
  let opts=restaurantTypes.map(function(x){return '<option value="'+esc(x)+'" '+(x===(r?.type||'Other')?'selected':'')+'>'+esc(x)+'</option>'}).join('');
  return '<div class="eyebrow">'+(editing?'Restaurant Review':'Food Critic')+'</div>'+
    '<h2>'+(editing?'Edit Restaurant & Review':'Create Restaurant & Review')+'</h2>'+
    '<div class="fields">'+
    '<div class="field full"><label for="rName">Restaurant name</label><input id="rName" value="'+esc(r?.name||'')+'" autocomplete="organization" oninput="restaurantNameChanged(this.value)"><div id="restaurantLookupResults"></div></div>'+
    '<div class="field"><label for="rType">Restaurant type</label><select id="rType">'+opts+'</select></div>'+
    '<div class="field"><label for="rLoc">Street + city + state</label><input id="rLoc" value="'+esc(r?.location||'')+'" placeholder="123 Main St, Alton, IL"></div>'+
    '<div class="field full"><label for="rWebsite">Official website</label><input id="rWebsite" type="url" value="'+esc(r?.website||'')+'" placeholder="https://…"></div>'+
    '<div class="field full"><label for="rMenuUrl">Official menu</label><input id="rMenuUrl" type="url" value="'+esc(r?.menuUrl||'')+'" placeholder="https://…"></div>'+
    '<div class="field full"><label for="rNotes">Notes</label><textarea id="rNotes" rows="3">'+esc(r?.notes||'')+'</textarea></div>'+
    '<div class="field full"><label for="rPhoto">Meal photos</label><input id="rPhoto" type="file" accept="image/*" multiple onchange="meCriticFinalPhotos(this)"><div id="photoPreview" class="photos">'+(window._editingPhotos||[]).map(function(p,i){return '<div><img src="'+esc(p)+'" alt="Meal photo '+(i+1)+'"><button type="button" class="btn" onclick="meCriticFinalRemovePhoto('+i+')">Remove</button></div>'}).join('')+'</div></div>'+
    '</div><div class="actions"><button type="button" class="btn secondary" onclick="useCurrentLocationForAddress()">⌖ Use My Location</button><button type="button" class="btn" onclick="findWebsiteForCurrentRestaurant()">Find Official Website</button><button type="button" class="btn" onclick="findOfficialMenu()">Find Official Menu</button>'+
    (editing?'<button type="button" class="btn danger" onclick="deleteCurrentSurvey()">Delete Restaurant</button>':'')+'</div>';
}
function meCriticFinalPhotos(input){
  let files=[...(input?.files||[])];
  (async function(){for(const file of files){try{window._editingPhotos.push(await readFileAsDataUrl(file))}catch(e){}}renderSurvey()})();
}
function meCriticFinalRemovePhoto(i){window._editingPhotos.splice(i,1);renderSurvey()}
function renderSurvey(){
  meCriticEnsureState();
  let r=currentSurveyRestaurant()||{name:'New restaurant',type:'Other',location:'',photos:[]};
  window._editingPhotos=window._editingPhotos||[...(r.photos||[])];
  let avg=meCriticFoodAverage(),final=meCriticFinalScore(),h=meCriticFinalEditor(r);
  h+='<div class="status">Food Critic Review</div><div class="scoreHero"><div class="restaurantScore">'+(final||'—')+'<span style="font-size:.45em"> / 10</span></div><div class="restaurantScoreLabel">Critic Score — Overall Experience, Food Quality, Service & Value</div></div>';
  h+='<div class="meta">'+esc(r.name||'New restaurant')+(r.location?' • '+esc(r.location):'')+'</div><div class="reviewForm"><h3>Critic Rating</h3><p class="hint">Rate the visit and let the dishes you ate determine Food Quality.</p>';
  ME_CRITIC_QUESTIONS.forEach(function(q,i){
    let value=i===1?(avg?avg.toFixed(1)+'/10':'Calculated from food below'):(surveyState.scores[i]?surveyState.scores[i]+'/10':'Select 1–10');
    h+='<div class="reviewQuestion"><div class="reviewQuestionHead"><b>'+(i+1)+'. '+q[0]+'</b><span>'+value+'</span></div>';
    if(i===1)h+='<div class="status">'+(avg?avg.toFixed(1)+'/10 from '+surveyState.foodItems.filter(function(x){return Number(x.rating)>0}).length+' rated item(s)':'Rate each item below to calculate this score.')+'</div>';
    else h+='<div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" class="'+(Number(surveyState.scores[i])===n?'active':'')+'" onclick="meCriticSetScore('+i+','+n+')">'+n+'</button>'}).join('')+'</div>';
    h+='</div>';
  });
  h+='</div><div class="reviewExtras"><h3>What I Ate</h3><p class="hint">Add every dish or drink you actually had. Each gets its own 1–10 rating and critic notes.</p>';
  h+=ME_CRITIC_CATS.map(function(c){return meCriticFoodBlock(c,r.type||'Other')}).join('');
  h+='<div class="field"><label for="criticLegacyOrder">Additional order note</label><textarea id="criticLegacyOrder" rows="2" class="surveyNote" placeholder="Optional">'+esc(surveyState.legacyOrdered||'')+'</textarea></div>';
  h+='<div class="field"><label>Would I order it again?</label><div class="actions"><button type="button" class="btn '+(surveyState.orderAgain==='Yes'?'primary':'')+'" onclick="meCriticSetAgain(\'Yes\')">Yes</button><button type="button" class="btn '+(surveyState.orderAgain==='No'?'primary':'')+'" onclick="meCriticSetAgain(\'No\')">No</button></div></div></div>';
  h+='<div class="surveyActions"><button type="button" class="btn danger" onclick="cancelSurvey()">Cancel</button><button type="button" class="btn primary" onclick="saveSurvey()">Save Restaurant & Review</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}

/* FINAL STABLE DINING NAVIGATION */
/* One navigation path for every saved restaurant review. This block is deliberately
   last in app.js so older review handlers cannot win. Service worker untouched. */
function meDiningLoadReviewState(r){
  let history=Array.isArray(r?.reviewHistory)?r.reviewHistory:[];
  let latest=history.length?history[history.length-1]:(r?.survey||null);
  let rawItems=Array.isArray(latest?.foodItems)?latest.foodItems:[];
  let items=rawItems.filter(function(x){return x&&typeof x==='object'}).map(function(x){
    return {...x,id:String(x.id||uid()),category:x.category||'Entrées',name:String(x.name||''),rating:Number(x.rating||0),notes:String(x.notes||'')};
  });
  if(!items.length&&latest?.ordered){
    items=[{id:uid(),category:'Entrées',name:String(latest.ordered),rating:Number(latest?.scores?.[1]||0),notes:'Imported from an earlier review.'}];
  }
  let scores=meCriticLegacyScores(latest)||{};
  surveyState={restaurantId:r?.id==='new'?'new':r?.id||null,scores:{0:Number(scores[0]||0),1:Number(scores[1]||0),2:Number(scores[2]||0),3:Number(scores[3]||0)},foodItems:items,foodOpen:{},legacyOrdered:latest?.ordered||'',orderAgain:latest?.orderAgain||''};
}
/* FINAL REVIEW-AGAIN ROBUSTNESS FIX */
function meDiningReview(id){
  try{
    let r=(db.restaurants||[]).find(function(x){return String(x.id)===String(id)});
    if(!r){alert('That restaurant could not be found in Metro Eats.');return;}
    pendingRestaurant=null;
    pendingReviewRestaurant={...r,photos:Array.isArray(r.photos)?r.photos.slice():[]};
    restaurantEditMode=false;
    window._editingPhotos=Array.isArray(r.photos)?r.photos.slice():[];
    meDiningLoadReviewState(r);
    try{
      renderSurvey();
    }catch(renderError){
      console.error('Metro Eats review render error',renderError);
      /* Render a guaranteed-safe critic screen instead of falling back to an alert. */
      let name=String(r.name||'Restaurant Review');
      let score=function(i){return Number(surveyState.scores[i]||0)};
      let h='<div class="eyebrow">Food Critic</div><h2>'+esc(name)+'</h2><p class="hint">Review Again — your previous review has been loaded.</p>';
      [0,2,3].forEach(function(i){
        let labels={0:'Overall Experience',2:'Service',3:'Value'};
        h+='<div class="reviewQuestion"><div class="reviewQuestionHead"><b>'+labels[i]+'</b><span>'+(score(i)||'Select 1–10')+'/10</span></div><div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" class="'+(score(i)===n?'active':'')+'" onclick="meCriticSetScore('+i+','+n+')">'+n+'</button>'}).join('')+'</div></div>';
      });
      h+='<div class="reviewExtras"><h3>What I Ate</h3><p class="hint">Your saved dishes are listed below. Add or change items and ratings.</p>';
      h+=surveyState.foodItems.map(function(x){
        return '<div class="field"><label for="criticFood-'+x.id+'">Dish or drink</label><input id="criticFood-'+x.id+'" value="'+esc(x.name)+'"><div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" class="'+(Number(x.rating)===n?'active':'')+'" onclick="meCriticRateFood(\''+x.id+'\','+n+')">'+n+'</button>'}).join('')+'</div><textarea id="criticNote-'+x.id+'" rows="2" class="surveyNote">'+esc(x.notes||'')+'</textarea></div>';
      }).join('');
      h+='<div class="field"><label>Would I order it again?</label><div class="actions"><button type="button" class="btn '+(surveyState.orderAgain==='Yes'?'primary':'')+'" onclick="meCriticSetAgain(\'Yes\')">Yes</button><button type="button" class="btn '+(surveyState.orderAgain==='No'?'primary':'')+'" onclick="meCriticSetAgain(\'No\')">No</button></div></div></div>';
      h+='<div class="surveyActions"><button type="button" class="btn danger" onclick="cancelSurvey()">Cancel</button><button type="button" class="btn primary" onclick="saveSurvey()">Save Restaurant & Review</button></div>';
      modal.classList.add('show');modalBody.innerHTML=h;
    }
  }catch(e){
    console.error('Metro Eats Review Again error',e);
    alert('The review could not be opened. '+(e?.message||'Please refresh Metro Eats and try again.'));
  }
}
function meDiningOpen(id,prefilling,asNewVisit){
  let r=id==='new'
    ?(prefilling||{id:'new',name:'',type:'Other',location:'',website:'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:null,updatedAt:null})
    :db.restaurants.find(x=>String(x.id)===String(id));
  if(!r)return;
  pendingRestaurant=id==='new'?{...r}:null;
  pendingReviewRestaurant=id==='new'?null:{...r,photos:[...(r.photos||[])]};
  restaurantEditMode=id!=='new'&&!asNewVisit;
  window._editingPhotos=[...(r.photos||[])];
  meDiningLoadReviewState(r);
  renderSurvey();
}
function openRestaurant(id,prefilling){meDiningOpen(id,prefilling,false)}
function startSurvey(id){meDiningOpen(id,null,true)}
function useNearby(x){
  let r={id:'new',name:x?.name||'',type:x?.type||'Other',location:x?.address||'',website:x?.website||'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:new Date().toISOString(),updatedAt:null,lat:x?.lat??null,lon:x?.lon??null};
  pendingRestaurant=r;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];
  meDiningLoadReviewState(r);renderSurvey();
}
function meDiningCapture(){
  meCriticEnsureState();
  surveyState.legacyOrdered=document.getElementById('criticLegacyOrder')?.value?.trim()||'';
  surveyState.foodItems.forEach(x=>{
    let n=document.getElementById('criticFood-'+x.id),note=document.getElementById('criticNote-'+x.id);
    if(n)x.name=n.value.trim()||x.name;
    if(note)x.notes=note.value.trim();
  });
}
function saveSurvey(){
  meDiningCapture();
  if(!Number(surveyState.scores[0])){alert('Please rate Overall Experience from 1 to 10.');return}
  if(!Number(surveyState.scores[2])){alert('Please rate Service from 1 to 10.');return}
  if(!Number(surveyState.scores[3])){alert('Please rate Value from 1 to 10.');return}
  let rated=surveyState.foodItems.filter(x=>String(x.name||'').trim()&&Number(x.rating)>0);
  if(!rated.length){alert('Please add and rate at least one dish or drink.');return}
  if(!surveyState.orderAgain){alert('Please choose Yes or No for whether you would order it again.');return}
  let now=new Date().toISOString();
  let current=pendingRestaurant||pendingReviewRestaurant||{};
  let fields={
    name:fieldValue('rName')||current.name||'Unnamed restaurant',
    type:fieldValue('rType')||current.type||'Other',
    location:fieldValue('rLoc')||current.location||'',
    website:fieldValue('rWebsite')||current.website||'',
    menuUrl:fieldValue('rMenuUrl')||current.menuUrl||'',
    notes:fieldValue('rNotes')||current.notes||'',
    photos:[...(window._editingPhotos||current.photos||[])],
    lat:current.lat??null,lon:current.lon??null
  };
  let review={
    scores:{0:Number(surveyState.scores[0]),1:Number(meCriticFoodAverage()),2:Number(surveyState.scores[2]),3:Number(surveyState.scores[3])},
    foodItems:rated.map(x=>({...x})),
    ordered:surveyState.legacyOrdered||rated.map(x=>x.name).join(', '),
    orderAgain:surveyState.orderAgain,
    overall:Number(meCriticFinalScore()),
    createdAt:now
  };
  try{
    if(pendingRestaurant){
      let r={...pendingRestaurant,...fields,reviewHistory:[review],survey:review,rating:Math.round(review.overall)/2,createdAt:pendingRestaurant.createdAt||now,updatedAt:now};
      db.restaurants.unshift(r);
    }else if(pendingReviewRestaurant){
      let r=db.restaurants.find(x=>String(x.id)===String(pendingReviewRestaurant.id));
      if(!r)throw new Error('The restaurant could not be found.');
      Object.assign(r,pendingReviewRestaurant,fields);
      r.reviewHistory=Array.isArray(r.reviewHistory)?[...r.reviewHistory]:[];
      if(restaurantEditMode&&r.reviewHistory.length)r.reviewHistory=[...r.reviewHistory.slice(0,-1),review];
      else r.reviewHistory=[...r.reviewHistory,review];
      r.survey=review;r.rating=Math.round(review.overall)/2;r.updatedAt=now;
    }else throw new Error('No restaurant is selected.');
    save();pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];closeModal();renderRestaurants();updateStory();
  }catch(e){alert(e.message||'Unable to save this review.');}
}
function showVisitHistory(id){
  let r=db.restaurants.find(x=>String(x.id)===String(id));if(!r)return;
  let h='<div class="eyebrow">Food Critic</div><h2>'+esc(r.name)+'</h2><p class="hint">Every saved visit stays with this restaurant.</p>';
  let rows=Array.isArray(r.reviewHistory)?r.reviewHistory:[];
  if(!rows.length&&r.survey)rows=[r.survey];
  h+=rows.length?'<div class="surveyGrid">'+rows.slice().reverse().map(function(v,idx){
    return '<div class="surveyItem"><span class="rankBadge">#'+(rows.length-idx)+'</span><div><b>'+Number(v.overall||0).toFixed(1)+'/10</b><div class="small">'+esc(v.ordered||'Order not recorded')+'</div>'+stamp('Reviewed',v.createdAt)+'</div><button type="button" class="btn" onclick="closeModal();startSurvey(\''+String(r.id).replace(/'/g,'&#39;')+'\')">Review</button></div>';
  }).join('')+'</div>':'<div class="empty">No visits saved yet.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}
function showRankings(){
  let ranked=[...db.restaurants].filter(r=>r.survey).sort((a,b)=>Number(b.survey.overall||0)-Number(a.survey.overall||0));
  let h='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Rankings use your Food Critic scores.</p>';
  h+=ranked.length?'<div class="surveyGrid">'+ranked.map(function(r,i){
    return '<div class="surveyItem"><span class="rankBadge">#'+(i+1)+'</span><div><b>'+esc(r.name)+'</b><div class="small">'+esc(r.location||'')+' • <strong>'+Number(r.survey.overall||0).toFixed(1)+'/10</strong></div>'+stamp('Latest review',r.survey.createdAt)+'</div><button type="button" class="btn" onclick="closeModal();startSurvey(\''+String(r.id).replace(/'/g,'&#39;')+'\')">Review</button></div>';
  }).join('')+'</div>':'<div class="empty">Complete a Food Critic review to start your rankings.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}
function restaurantCard(r){let s=r.survey,history=Array.isArray(r.reviewHistory)?r.reviewHistory:[],summary=s?topRatedSummary(s):'';return `<article class="restaurant"><div class="recipeHead"><div><h3>${esc(r.name)}</h3><div class="meta">${esc(r.location||'')} ${r.type?'• '+esc(r.type):''}</div>${stamp('Added',r.createdAt)}${r.updatedAt?stamp('Last updated',r.updatedAt):''}</div><button class="btn" onclick='openRestaurant(${restaurantIdArg(r.id)})'>Edit</button></div>${s?`<div class="restaurantScoreCard"><div><div class="restaurantScore">${Number(s.overall||0).toFixed(1)}<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div><div><div class="topRated"><strong>Top Rated:</strong> ${summary||'Complete another visit for more detail.'}</div>${stamp('Reviewed',s.createdAt)}<div class="restaurantLinks"><button type="button" class="btn primary" onclick='event.stopPropagation();meDiningReview(${restaurantIdArg(r.id)})'>Review Again</button><button type="button" class="btn" onclick="event.stopPropagation();showVisitHistory('${r.id}')">Visit History (${history.length})</button></div></div></div>`:`<div class="actions"><button class="btn primary" onclick='showReviewResults(${restaurantIdArg(r.id)})'>★ Rate This Restaurant</button></div>`}${r.notes?`<p>${esc(r.notes)}</p>`:''}<div class="restaurantLinks">${r.website?`<a class="btn" href="${esc(r.website)}" target="_blank" rel="noopener noreferrer">Official Website</a>`:''}${r.menuUrl?`<a class="btn" href="${esc(r.menuUrl)}" target="_blank" rel="noopener noreferrer">Official Menu</a>`:`<a class="btn" href="${officialMenuSearch(r.name,r.location||'')}" target="_blank" rel="noopener noreferrer">Find Official Menu</a>`}</div>${r.photos?.length?`<div class="photos">${r.photos.slice(0,6).map((p,i)=>`<img src="${esc(p)}" alt="${esc(r.name)} meal photo ${i+1}">`).join('')}</div>`:''}</article>`}
/* FINAL STABLE REVIEW-AGAIN LINK FIX */
function meDiningReview(id){
  try{
    let r=db.restaurants.find(x=>String(x.id)===String(id));
    if(!r){alert('That restaurant could not be found in Metro Eats.');return;}
    pendingRestaurant=null;
    pendingReviewRestaurant={...r,photos:[...(r.photos||[])]};
    restaurantEditMode=false;
    window._editingPhotos=[...(r.photos||[])];
    meDiningLoadReviewState(r);
    renderSurvey();
  }catch(e){
    console.error('Metro Eats Review Again error',e);
    alert('The review could not be opened. Please refresh Metro Eats and try again.');
  }
}


/* FINAL FINAL REVIEW-AGAIN HANDLER — must remain last so it wins over legacy declarations */
function meDiningReview(id){
  try{
    let restaurants=Array.isArray(db&&db.restaurants)?db.restaurants:[];
    let r=restaurants.find(function(x){return String(x.id)===String(id)});
    if(!r){alert('That restaurant could not be found in Metro Eats.');return;}
    pendingRestaurant=null;
    pendingReviewRestaurant={...r,photos:Array.isArray(r.photos)?r.photos.slice():[]};
    restaurantEditMode=false;
    window._editingPhotos=Array.isArray(r.photos)?r.photos.slice():[];
    meDiningLoadReviewState(r);

    /* Build the review screen directly. This bypasses every older review renderer. */
    let score=function(i){return Number((surveyState.scores||{})[i]||0)};
    let foodItems=Array.isArray(surveyState.foodItems)?surveyState.foodItems:[];
    let foodAvg=foodItems.map(function(x){return Number(x.rating||0)}).filter(function(x){return x>0});
    foodAvg=foodAvg.length?Math.round(foodAvg.reduce(function(a,b){return a+b},0)/foodAvg.length*10)/10:0;
    let finalScores=[score(0),foodAvg,score(2),score(3)].filter(function(x){return x>0});
    let final=finalScores.length?Math.round(finalScores.reduce(function(a,b){return a+b},0)/finalScores.length*10)/10:0;
    let h='<div class="eyebrow">Food Critic</div><h2>Review Again: '+esc(r.name||'Restaurant')+'</h2>';
    h+='<p class="hint">Your previous review is loaded. Update the visit, dishes, ratings and notes, then save it as a new visit.</p>';
    h+='<div class="scoreHero"><div class="restaurantScore">'+(final||'—')+'<span style="font-size:.45em"> / 10</span></div><div class="restaurantScoreLabel">Critic Score</div></div>';
    h+='<div class="reviewForm"><h3>Critic Rating</h3>';
    [0,2,3].forEach(function(i){
      let labels={0:'Overall Experience',2:'Service',3:'Value'};
      h+='<div class="reviewQuestion"><div class="reviewQuestionHead"><b>'+labels[i]+'</b><span>'+(score(i)||'Select 1–10')+'/10</span></div><div class="reviewScore">';
      h+=[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" class="'+(score(i)===n?'active':'')+'" onclick="meCriticSetScore('+i+','+n+')">'+n+'</button>'}).join('');
      h+='</div></div>';
    });
    h+='</div><div class="reviewExtras"><h3>What I Ate</h3><p class="hint">Your saved dishes are loaded below. Each can be rated 1–10.</p>';
    foodItems.forEach(function(x){
      h+='<div class="criticFoodCard"><div class="field"><label for="criticFood-'+x.id+'">Dish or drink</label><input id="criticFood-'+x.id+'" value="'+esc(x.name||'')+'"></div>';
      h+='<div class="criticRatingBlock"><div class="criticRatingHead"><b>Food Rating</b><span>'+(Number(x.rating)?Number(x.rating)+'/10':'Select 1–10')+'</span></div><div class="criticFoodScore">';
      h+=[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" class="criticFoodScoreBtn '+(Number(x.rating)===n?'active':'')+'" onclick="meCriticRateFood(\''+String(x.id).replace(/'/g,'\\\'')+'\','+n+')">'+n+'</button>'}).join('');
      h+='</div></div><div class="field"><label for="criticNote-'+x.id+'">Critic Notes</label><textarea id="criticNote-'+x.id+'" class="criticFoodNotes" rows="3">'+esc(x.notes||'')+'</textarea></div></div>';
    });
    h+='<div class="field"><label for="criticLegacyOrder">Additional order note</label><textarea id="criticLegacyOrder" rows="2" class="surveyNote">'+esc(surveyState.legacyOrdered||'')+'</textarea></div>';
    h+='<div class="field"><label>Would I order it again?</label><div class="actions"><button type="button" class="btn '+(surveyState.orderAgain==='Yes'?'primary':'')+'" onclick="meCriticSetAgain(\'Yes\')">Yes</button><button type="button" class="btn '+(surveyState.orderAgain==='No'?'primary':'')+'" onclick="meCriticSetAgain(\'No\')">No</button></div></div></div>';
    h+='<div class="surveyActions"><button type="button" class="btn danger" onclick="cancelSurvey()">Cancel</button><button type="button" class="btn primary" onclick="saveSurvey()">Save Restaurant & Review</button></div>';
    modal.classList.add('show');
    modalBody.innerHTML=h;
  }catch(e){
    console.error('Metro Eats FINAL Review Again error',e);
    alert('The review could not be opened. '+(e&&e.message?e.message:'Please try again.'));
  }
}


/* FINAL RANKINGS REVIEW NAVIGATION — use the proven Review Again handler */
function showRankings(){
  let ranked=(db.restaurants||[]).filter(function(r){return r.survey}).sort(function(a,b){return Number(b.survey.overall||0)-Number(a.survey.overall||0)});
  let h='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Rankings use your Food Critic scores.</p>';
  if(ranked.length){
    h+='<div class="surveyGrid">'+ranked.map(function(r,i){
      return '<div class="surveyItem"><span class="rankBadge">#'+(i+1)+'</span><div><b>'+esc(r.name)+'</b><div class="small">'+esc(r.location||'')+' • <strong>'+Number(r.survey.overall||0).toFixed(1)+'/10</strong></div>'+stamp('Latest review',r.survey.createdAt)+'</div><button type="button" class="btn" onclick="closeModal();showReviewResults(\''+String(r.id).replace(/'/g,'&#39;')+'\')">Review</button></div>';
    }).join('')+'</div>';
  }else h+='<div class="empty">Complete a Food Critic review to start your rankings.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}


/* FINAL DINING CLICK ROUTER — all Dining actions use one event path */
(function(){
  function route(action,id){
    try{
      id=id==null?'':String(id);
      if(action==='create'){
        meDiningOpen('new',null,false);
      }else if(action==='edit'){
        meDiningOpen(id,null,false);
      }else if(action==='review'){
        showReviewResults(id);
      }else if(action==='history'){
        showVisitHistory(id);
      }else if(action==='rankings'){
        showRankings();
      }
    }catch(e){
      console.error('Metro Eats Dining action error',e);
      alert('Metro Eats could not open that Dining action. '+(e&&e.message?e.message:'Please try again.'));
    }
  }
  document.addEventListener('click',function(e){
    let el=e.target&&e.target.closest?e.target.closest('[data-me-dining-action]'):null;
    if(!el)return;
    e.preventDefault();
    e.stopPropagation();
    route(el.getAttribute('data-me-dining-action'),el.getAttribute('data-me-dining-id'));
  },true);
})();
function restaurantCard(r){
  let s=r.survey,history=Array.isArray(r.reviewHistory)?r.reviewHistory:[],summary=s?topRatedSummary(s):'';
  let id=String(r.id||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return '<article class="restaurant">'+
    '<div class="recipeHead"><div><h3>'+esc(r.name)+'</h3><div class="meta">'+esc(r.location||'')+' '+(r.type?'• '+esc(r.type):'')+'</div>'+stamp('Added',r.createdAt)+(r.updatedAt?stamp('Last updated',r.updatedAt):'')+'</div>'+
    '<button type="button" class="btn" data-me-dining-action="edit" data-me-dining-id="'+id+'">Edit</button></div>'+
    (s?'<div class="restaurantScoreCard"><div><div class="restaurantScore">'+Number(s.overall||0).toFixed(1)+'<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div><div><div class="topRated"><strong>Top Rated:</strong> '+(summary||'Complete another visit for more detail.')+'</div>'+stamp('Reviewed',s.createdAt)+
    '<div class="restaurantLinks"><button type="button" class="btn primary" data-me-dining-action="review" data-me-dining-id="'+id+'">Review Again</button><button type="button" class="btn" data-me-dining-action="history" data-me-dining-id="'+id+'">Visit History ('+history.length+')</button></div></div></div>':
    '<div class="actions"><button type="button" class="btn primary" data-me-dining-action="review" data-me-dining-id="'+id+'">★ Rate This Restaurant</button></div>')+
    (r.notes?'<p>'+esc(r.notes)+'</p>':'')+
    '<div class="restaurantLinks">'+(r.website?'<a class="btn" href="'+esc(r.website)+'" target="_blank" rel="noopener noreferrer">Official Website</a>':'')+
    (r.menuUrl?'<a class="btn" href="'+esc(r.menuUrl)+'" target="_blank" rel="noopener noreferrer">Official Menu</a>':'<a class="btn" href="'+officialMenuSearch(r.name,r.location||'')+'" target="_blank" rel="noopener noreferrer">Find Official Menu</a>')+
    '</div>'+(r.photos?.length?'<div class="photos">'+r.photos.slice(0,6).map(function(p,i){return '<img src="'+esc(p)+'" alt="'+esc(r.name)+' meal photo '+(i+1)+'">'}).join('')+'</div>':'')+
    '</article>';
}
function showRankings(){
  let ranked=(db.restaurants||[]).filter(function(r){return r.survey}).sort(function(a,b){return Number(b.survey.overall||0)-Number(a.survey.overall||0)});
  let h='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Rankings use your Food Critic scores.</p>';
  h+=ranked.length?'<div class="surveyGrid">'+ranked.map(function(r,i){
    let id=String(r.id||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return '<div class="surveyItem"><span class="rankBadge">#'+(i+1)+'</span><div><b>'+esc(r.name)+'</b><div class="small">'+esc(r.location||'')+' • <strong>'+Number(r.survey.overall||0).toFixed(1)+'/10</strong></div>'+stamp('Latest review',r.survey.createdAt)+'</div><button type="button" class="btn" data-me-dining-action="review" data-me-dining-id="'+id+'">Review</button></div>';
  }).join('')+'</div>':'<div class="empty">Complete a Food Critic review to start your rankings.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}
function showVisitHistory(id){
  let r=db.restaurants.find(function(x){return String(x.id)===String(id)});if(!r)return;
  let h='<div class="eyebrow">Food Critic</div><h2>'+esc(r.name)+'</h2><p class="hint">Every saved visit stays with this restaurant.</p>';
  let rows=Array.isArray(r.reviewHistory)?r.reviewHistory:[];if(!rows.length&&r.survey)rows=[r.survey];
  if(rows.length){
    h+='<div class="surveyGrid">'+rows.slice().reverse().map(function(v,idx){
      let rid=String(r.id||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      return '<div class="surveyItem"><span class="rankBadge">#'+(rows.length-idx)+'</span><div><b>'+Number(v.overall||0).toFixed(1)+'/10</b><div class="small">'+esc(v.ordered||'Order not recorded')+'</div>'+stamp('Reviewed',v.createdAt)+'</div><button type="button" class="btn" data-me-dining-action="review" data-me-dining-id="'+rid+'">Review</button></div>';
    }).join('')+'</div>';
  }else h+='<div class="empty">No visits saved yet.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}


(function(){
  function wireMetroDiningButtons(){
    var create=document.getElementById('meCreateRestaurantBtn');
    var add=document.getElementById('meAddRestaurantBtn');
    var around=document.getElementById('meAroundMeBtn');
    if(create)create.onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof meDiningAction==='function')meDiningAction('create');};
    if(add)add.onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof meDiningAction==='function')meDiningAction('create');};
    if(around)around.onclick=function(e){e.preventDefault();e.stopPropagation();if(typeof findRestaurantAroundMe==='function')findRestaurantAroundMe();};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wireMetroDiningButtons);else wireMetroDiningButtons();
})();

/* FINAL DINING LOOP — single explicit handler for every Dining action */
function meDiningAction(action,id){
  try{
    if(action==='create'){
      meDiningOpen('new',null,false);
      return;
    }
    if(action==='edit'){
      meDiningOpen(String(id),null,false);
      return;
    }
    if(action==='review'){
      showReviewResults(String(id));
      return;
    }
    if(action==='history'){
      showVisitHistory(String(id));
      return;
    }
    if(action==='rankings'){
      showRankings();
      return;
    }
  }catch(e){
    console.error('Metro Eats Dining action failed',action,id,e);
    alert('Metro Eats could not open this Dining screen. '+(e&&e.message?e.message:'Please try again.'));
  }
}
function restaurantCard(r){
  let s=r.survey,history=Array.isArray(r.reviewHistory)?r.reviewHistory:[],summary=s?topRatedSummary(s):'',id=restaurantIdArg(r.id);
  return '<article class="restaurant">'+
    '<div class="recipeHead"><div><h3>'+esc(r.name)+'</h3><div class="meta">'+esc(r.location||'')+' '+(r.type?'• '+esc(r.type):'')+'</div>'+stamp('Added',r.createdAt)+(r.updatedAt?stamp('Last updated',r.updatedAt):'')+'</div>'+
    '<button type="button" class="btn" onclick="meDiningAction(\'edit\','+id+')">Edit</button></div>'+
    (s?'<div class="restaurantScoreCard"><div><div class="restaurantScore">'+Number(s.overall||0).toFixed(1)+'<span style="font-size:.45em;letter-spacing:0"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div><div><div class="topRated"><strong>Top Rated:</strong> '+(summary||'Complete another visit for more detail.')+'</div>'+stamp('Reviewed',s.createdAt)+'<div class="restaurantLinks"><button type="button" class="btn primary" onclick="meDiningAction(\'review\','+id+')">Review Again</button><button type="button" class="btn" onclick="meDiningAction(\'history\','+id+')">Visit History ('+history.length+')</button></div></div></div>':
    '<div class="actions"><button type="button" class="btn primary" onclick="meDiningAction(\'review\','+id+')">★ Rate This Restaurant</button></div>')+
    (r.notes?'<p>'+esc(r.notes)+'</p>':'')+
    '<div class="restaurantLinks">'+(r.website?'<a class="btn" href="'+esc(r.website)+'">Official Website</a>':'')+(r.menuUrl?'<a class="btn" href="'+esc(r.menuUrl)+'">Official Menu</a>':'<a class="btn" href="'+officialMenuSearch(r.name,r.location||'')+'">Find Official Menu</a>')+'</div>'+
    (r.photos?.length?'<div class="photos">'+r.photos.slice(0,6).map(function(p,i){return '<img src="'+esc(p)+'" alt="'+esc(r.name)+' meal photo '+(i+1)+'">'}).join('')+'</div>':'')+
    '</article>';
}
function showRankings(){
  let ranked=(db.restaurants||[]).filter(function(r){return r.survey}).sort(function(a,b){return Number(b.survey.overall||0)-Number(a.survey.overall||0)});
  let h='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Rankings use your Food Critic scores.</p>';
  h+=ranked.length?'<div class="surveyGrid">'+ranked.map(function(r,i){
    return '<div class="surveyItem"><span class="rankBadge">#'+(i+1)+'</span><div><b>'+esc(r.name)+'</b><div class="small">'+esc(r.location||'')+' • <strong>'+Number(r.survey.overall||0).toFixed(1)+'/10</strong></div>'+stamp('Latest review',r.survey.createdAt)+'</div><button type="button" class="btn" onclick="meDiningAction(\'review\','+restaurantIdArg(r.id)+')">Review</button></div>';
  }).join('')+'</div>':'<div class="empty">Complete a Food Critic review to start your rankings.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}
function showVisitHistory(id){
  let r=(db.restaurants||[]).find(function(x){return String(x.id)===String(id)});if(!r)return;
  let rows=Array.isArray(r.reviewHistory)?r.reviewHistory.slice():[];if(!rows.length&&r.survey)rows=[r.survey];
  let h='<div class="eyebrow">Food Critic</div><h2>'+esc(r.name)+'</h2><p class="hint">Every saved visit stays with this restaurant.</p>';
  h+=rows.length?'<div class="surveyGrid">'+rows.slice().reverse().map(function(v,idx){
    return '<div class="surveyItem"><span class="rankBadge">#'+(rows.length-idx)+'</span><div><b>'+Number(v.overall||0).toFixed(1)+'/10</b><div class="small">'+esc(v.ordered||'Order not recorded')+'</div>'+stamp('Reviewed',v.createdAt)+'</div><button type="button" class="btn" onclick="meDiningAction(\'review\','+restaurantIdArg(r.id)+')">Review</button></div>';
  }).join('')+'</div>':'<div class="empty">No visits saved yet.</div>';
  h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
  modal.classList.add('show');modalBody.innerHTML=h;
}

/* METRO EATS REVIEW ENGINE V3
   Single authoritative restaurant-review path.
   This intentionally replaces the accumulated legacy review handlers above.
   It keeps the existing data model, restaurant lookup, location, website/menu,
   photo and backup helpers, but removes recursive render chains and duplicate
   navigation paths from the active runtime. */
(function(){
  var state={mode:'',restaurantId:null,pending:null,items:[],scores:{0:0,2:0,3:0},orderAgain:'',legacyOrdered:'',foodOpen:{}};

  function clonePhotos(r){return Array.isArray(r&&r.photos)?r.photos.slice():[]}
  function latestReview(r){
    var h=Array.isArray(r&&r.reviewHistory)?r.reviewHistory:[];
    return h.length?h[h.length-1]:(r&&r.survey)||null;
  }
  function load(r,mode){
    var v=latestReview(r), raw=Array.isArray(v&&v.foodItems)?v.foodItems:[];
    var items=raw.filter(function(x){return x&&typeof x==='object'}).map(function(x){
      return {id:String(x.id||uid()),category:x.category||'Entrées',name:String(x.name||''),rating:Number(x.rating||0),notes:String(x.notes||'')};
    });
    if(!items.length&&v&&v.ordered){
      items=[{id:uid(),category:'Entrées',name:String(v.ordered),rating:Number(v.scores&&v.scores[1]||0),notes:''}];
    }
    var sc=v&&v.scores||{};
    state={
      mode:mode,
      restaurantId:r&&r.id==='new'?'new':(r&&r.id)||null,
      pending:Object.assign({},r),
      items:items,
      scores:{0:Number(sc[0]||0),2:Number(sc[2]||0),3:Number(sc[3]||0)},
      orderAgain:v&&v.orderAgain||'',
      legacyOrdered:v&&v.ordered||'',
      foodOpen:{}
    };
    pendingRestaurant=mode==='new'?state.pending:null;
    pendingReviewRestaurant=mode==='new'?null:Object.assign({},r,{photos:clonePhotos(r)});
    restaurantEditMode=mode==='edit';
    window._editingPhotos=clonePhotos(r);
  }
  function current(){
    return state.pending || (db.restaurants||[]).find(function(x){return String(x.id)===String(state.restaurantId)}) || null;
  }
  function foodAverage(){
    var a=state.items.map(function(x){return Number(x.rating||0)}).filter(function(x){return x>0});
    return a.length?Math.round(a.reduce(function(p,c){return p+c},0)/a.length*10)/10:0;
  }
  function score(){
    var a=[Number(state.scores[0]||0),foodAverage(),Number(state.scores[2]||0),Number(state.scores[3]||0)].filter(function(x){return x>0});
    return a.length?Math.round(a.reduce(function(p,c){return p+c},0)/a.length*10)/10:0;
  }
  function capture(){
    var order=document.getElementById('meV3Order');
    if(order)state.legacyOrdered=order.value.trim();
    state.items.forEach(function(x){
      var n=document.getElementById('meV3Food-'+x.id),note=document.getElementById('meV3Note-'+x.id);
      if(n)x.name=n.value.trim();
      if(note)x.notes=note.value.trim();
    });
  }
  function editor(r){
    var editing=state.mode==='edit';
    var opts=restaurantTypes.map(function(x){return '<option value="'+esc(x)+'" '+(x===(r&&r.type||'Other')?'selected':'')+'>'+esc(x)+'</option>'}).join('');
    var photos=(window._editingPhotos||[]).map(function(p,i){
      return '<div><img src="'+esc(p)+'" alt="Meal photo '+(i+1)+'"><button type="button" class="btn" onclick="meV3RemovePhoto('+i+')">Remove</button></div>';
    }).join('');
    return '<div class="eyebrow">'+(editing?'Restaurant Review':'Food Critic')+'</div>'+
      '<h2>'+(editing?'Edit Restaurant & Review':'Create Restaurant & Review')+'</h2>'+
      '<div class="fields">'+
      '<div class="field full"><label for="rName">Restaurant name</label><input id="rName" value="'+esc(r&&r.name||'')+'" autocomplete="organization" oninput="restaurantNameChanged(this.value)"><div id="restaurantLookupResults"></div></div>'+
      '<div class="field"><label for="rType">Restaurant type</label><select id="rType">'+opts+'</select></div>'+
      '<div class="field"><label for="rLoc">Street + city + state</label><input id="rLoc" value="'+esc(r&&r.location||'')+'" placeholder="123 Main St, Alton, IL"></div>'+
      '<div class="field full"><label for="rWebsite">Official website</label><input id="rWebsite" type="url" inputmode="url" value="'+esc(r&&r.website||'')+'" placeholder="https://…"></div>'+
      '<div class="field full"><label for="rMenuUrl">Official menu</label><input id="rMenuUrl" type="url" inputmode="url" value="'+esc(r&&r.menuUrl||'')+'" placeholder="https://…"></div>'+
      '<div class="field full"><label for="rNotes">Notes</label><textarea id="rNotes" rows="3">'+esc(r&&r.notes||'')+'</textarea></div>'+
      '<div class="field full"><label for="rPhoto">Meal photos</label><input id="rPhoto" type="file" accept="image/*" multiple onchange="meV3Photos(this)"><div id="photoPreview" class="photos">'+photos+'</div></div>'+
      '</div>'+
      '<div class="actions"><button type="button" class="btn secondary" onclick="useCurrentLocationForAddress()">⌖ Use My Location</button><button type="button" class="btn" onclick="findWebsiteForCurrentRestaurant()">Find Official Website</button><button type="button" class="btn" onclick="findOfficialMenu()">Find Official Menu</button>'+
      (editing?'<button type="button" class="btn danger" onclick="deleteCurrentSurvey()">Delete Survey & Restaurant</button>':'')+'</div>';
  }
  function categoryBlock(cat,type){
    var items=state.items.filter(function(x){return x.category===cat}),open=!!state.foodOpen[cat];
    var suggestions=meCriticSuggestions(type).filter(function(x){return meCriticCategory(x)===cat});
    var h='<section class="criticCategory '+(open?'isOpen':'')+'"><button type="button" class="criticCategoryHead" onclick="meV3ToggleCat(\''+cat.replace(/'/g,"\\'")+'\')"><span><b>'+esc(cat)+'</b><small>'+(items.length?items.length+' item'+(items.length===1?'':'s'):'Add something you ate')+'</small></span><strong>'+(open?'−':'+')+'</strong></button>';
    if(open){
      if(suggestions.length){
        h+='<div class="criticSuggestions"><span class="criticSuggestionsLabel">Popular choices</span>'+suggestions.map(function(x){
          return '<button type="button" class="criticSuggestion" onclick="meV3AddSuggested(\''+String(cat).replace(/'/g,"\\'")+'\',\''+String(x).replace(/'/g,"\\'")+'\')">'+esc(x)+'</button>';
        }).join('')+'</div>';
      }
      h+='<div class="criticFoodList">'+items.map(function(x){
        var buttons=[1,2,3,4,5,6,7,8,9,10].map(function(n){
          return '<button type="button" class="criticFoodScoreBtn '+(Number(x.rating)===n?'active':'')+'" onclick="meV3RateFood(\''+String(x.id).replace(/'/g,"\\'")+'\','+n+')">'+n+'</button>';
        }).join('');
        return '<article class="criticFoodCard"><div class="criticFoodTop"><div class="criticFoodNumber">🍽</div><div class="criticFoodNameWrap"><label class="criticFoodLabel" for="meV3Food-'+x.id+'">What did I eat?</label><input id="meV3Food-'+x.id+'" class="criticFoodName" value="'+esc(x.name)+'" placeholder="Enter the dish or drink"></div><button type="button" class="criticRemoveBtn" onclick="meV3RemoveFood(\''+String(x.id).replace(/'/g,"\\'")+'\')">Remove</button></div><div class="criticRatingBlock"><div class="criticRatingHead"><b>Food Rating</b><span>'+(x.rating?x.rating+'/10':'Select 1–10')+'</span></div><div class="criticFoodScore">'+buttons+'</div><div class="surveyScale"><span>Poor</span><span>Average</span><span>Exceptional</span></div></div><div class="criticNotesBlock"><label class="criticFoodLabel" for="meV3Note-'+x.id+'">Critic Notes</label><textarea id="meV3Note-'+x.id+'" class="criticFoodNotes" rows="3" placeholder="Taste, texture, preparation, portion, presentation, and anything that stood out…">'+esc(x.notes)+'</textarea></div></article>';
      }).join('')+'</div>';
      h+='<button type="button" class="criticAddItem" onclick="meV3AddFood(\''+String(cat).replace(/'/g,"\\'")+'\')"><span>＋</span> Add another item</button>';
    }
    return h+'</section>';
  }
  function renderRestaurantInfo(r){
    var h=editor(r);
    h=h.replace('<div class="eyebrow">'+(state.mode==='edit'?'Restaurant Review':'Food Critic')+'</div><h2>'+(state.mode==='edit'?'Edit Restaurant & Review':'Create Restaurant & Review')+'</h2>','<div class="eyebrow">Restaurant Information</div><h2>Edit Restaurant Information</h2>');
    h+='<div class="notice" style="margin-top:14px"><strong>Restaurant information only.</strong><div class="small">Use Review Again on the restaurant card when you want to change ratings, dishes, or visit details.</div></div>';
    h+='<div class="surveyActions"><button type="button" class="btn danger" onclick="meV3Cancel()">Cancel</button><button type="button" class="btn primary" onclick="meV3SaveRestaurantInfo()">Save Restaurant Information</button></div>';
    modal.classList.add('show');modalBody.innerHTML=h;
  }
  function render(){
    meReviewV3Capture();
    var r=current()||{name:'New restaurant',type:'Other',location:'',photos:[]};
    if(state.mode==='edit')return renderRestaurantInfo(r);
    if(!window._editingPhotos)window._editingPhotos=clonePhotos(r);
    var avg=foodAverage(),final=score(),h=editor(r);
    h+='<div class="status">Food Critic Review</div><div class="scoreHero"><div class="restaurantScore">'+(final||'—')+'<span style="font-size:.45em"> / 10</span></div><div class="restaurantScoreLabel">Critic Score — Overall Experience, Food Quality, Service & Value</div></div>';
    h+='<div class="meta">'+esc(r.name||'New restaurant')+(r.location?' • '+esc(r.location):'')+'</div><div class="reviewForm"><h3>Critic Rating</h3>';
    [['Overall Experience',0],['Food Quality',1],['Service',2],['Value',3]].forEach(function(q){
      var value=q[1]===1?(avg?avg.toFixed(1)+'/10':'Calculated from food below'):(state.scores[q[1]]?state.scores[q[1]]+'/10':'Select 1–10');
      h+='<div class="reviewQuestion"><div class="reviewQuestionHead"><b>'+q[0]+'</b><span>'+value+'</span></div>';
      if(q[1]===1)h+='<div class="status">'+(avg?avg.toFixed(1)+'/10 from '+state.items.filter(function(x){return Number(x.rating)>0}).length+' rated item(s)':'Rate each item below to calculate this score.')+'</div>';
      else h+='<div class="reviewScore">'+[1,2,3,4,5,6,7,8,9,10].map(function(n){return '<button type="button" aria-label="'+q[0]+' score '+n+'" class="'+(Number(state.scores[q[1]])===n?'active':'')+'" onclick="meV3SetScore('+q[1]+','+n+')">'+n+'</button>'}).join('')+'</div>';
      h+='</div>';
    });
    h+='</div><div class="reviewExtras"><h3>What I Ate</h3>';
    h+=ME_CRITIC_CATS.map(function(c){return categoryBlock(c,r.type||'Other')}).join('');
    h+='<div class="field"><label for="meV3Order">Additional order note</label><textarea id="meV3Order" rows="2" class="surveyNote" placeholder="Optional">'+esc(state.legacyOrdered||'')+'</textarea></div>';
    h+='<div class="field"><label>Would I order it again?</label><div class="actions"><button type="button" class="btn '+(state.orderAgain==='Yes'?'primary':'')+'" onclick="meV3SetAgain(\'Yes\')">Yes</button><button type="button" class="btn '+(state.orderAgain==='No'?'primary':'')+'" onclick="meV3SetAgain(\'No\')">No</button></div></div></div>';
    h+='<div class="surveyActions"><button type="button" class="btn danger" onclick="meV3Cancel()">Cancel</button><button type="button" class="btn primary" onclick="meV3Save()">Save Restaurant & Review</button></div>';
    modal.classList.add('show');modalBody.innerHTML=h;
  }
  window.meReviewV3Capture=function(){capture()};
  window.meV3SetScore=function(i,n){capture();state.scores[i]=n;render()};
  window.meV3SetAgain=function(v){capture();state.orderAgain=v;render()};
  window.meV3ToggleCat=function(c){capture();state.foodOpen[c]=!state.foodOpen[c];render()};
  window.meV3AddFood=function(c,n){capture();state.items.push({id:uid(),category:c,name:n||'',rating:0,notes:''});state.foodOpen[c]=true;render()};
  window.meV3AddSuggested=function(c,n){capture();if(!state.items.some(function(x){return x.category===c&&normalizeRestaurantName(x.name)===normalizeRestaurantName(n)}))state.items.push({id:uid(),category:c,name:n,rating:0,notes:''});state.foodOpen[c]=true;render()};
  window.meV3RemoveFood=function(id){capture();state.items=state.items.filter(function(x){return String(x.id)!==String(id)});render()};
  window.meV3RateFood=function(id,n){capture();var x=state.items.find(function(v){return String(v.id)===String(id)});if(x)x.rating=n;render()};
  window.meV3Photos=function(input){
    capture();
    var files=[...(input&&input.files||[])];
    Promise.all(files.map(function(file){return readFileAsDataUrl(file)})).then(function(parts){
      window._editingPhotos=(window._editingPhotos||[]).concat(parts);render();
    }).catch(function(e){console.error('Metro Eats photo import failed',e)});
  };
  window.meV3RemovePhoto=function(i){capture();window._editingPhotos.splice(i,1);render()};
  window.meV3Cancel=function(){pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];state={mode:'',restaurantId:null,pending:null,items:[],scores:{0:0,2:0,3:0},orderAgain:'',legacyOrdered:'',foodOpen:{}};closeModal()};
  window.meV3Open=function(id,mode,prefill){
    var r;
    if(id==='new')r=prefill||{id:'new',name:'',type:'Other',location:'',website:'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:null,updatedAt:null};
    else r=(db.restaurants||[]).find(function(x){return String(x.id)===String(id)});
    if(!r){alert('That restaurant could not be found in Metro Eats.');return}
    load(r,mode||'edit');render();
  };
  window.meDiningReview=function(id){meV3Open(String(id),'review')};
  window.meDiningOpen=function(id,prefilling,asNewVisit){meV3Open(id,id==='new'?'new':(asNewVisit?'review':'edit'),prefilling)};
  window.openRestaurant=function(id,prefilling){meV3Open(id,id==='new'?'new':'edit',prefilling)};
  window.startSurvey=function(id){meV3Open(id,'review')};
  window.useNearby=function(x){
    var r={id:'new',name:x&&x.name||'',type:x&&x.type||'Other',location:x&&x.address||'',website:x&&x.website||'',menuUrl:'',notes:'',photos:[],survey:null,reviewHistory:[],createdAt:new Date().toISOString(),updatedAt:null,lat:x&&x.lat||null,lon:x&&x.lon||null};
    meV3Open('new','new',r);
  };
  window.renderSurvey=function(){render()};
  window.saveSurvey=function(){return window.meV3Save()};
  window.meV3SaveRestaurantInfo=async function(){
    meReviewV3Capture();
    var name=fieldValue('rName')||'';
    var location=fieldValue('rLoc')||'';
    var type=fieldValue('rType')||'Other';
    var website=fieldValue('rWebsite')||'';
    var menuUrl=fieldValue('rMenuUrl')||'';
    var notes=fieldValue('rNotes')||'';
    if(!name){alert('Please enter or select a restaurant name.');return}
    var saved=(db.restaurants||[]).find(function(x){return String(x.id)===String(state.restaurantId)});
    if(!saved){alert('That restaurant could not be found in Metro Eats.');return}
    var now=new Date().toISOString();
    var oldPhotos=Array.isArray(saved.photos)?saved.photos:[];
    var fields={name:name,type:type,location:location,website:website,menuUrl:menuUrl,notes:notes,photos:(window._editingPhotos||oldPhotos).slice(),lat:saved.lat??null,lon:saved.lon??null,updatedAt:now};
    var btn=document.querySelector('.surveyActions .btn.primary');
    if(btn){btn.disabled=true;btn.textContent='Saving…'}
    try{
      Object.assign(saved,fields);
      await saveWithQuotaRecovery();
      var persisted=parseData();
      var check=(persisted.restaurants||[]).find(function(x){return String(x.id)===String(saved.id)});
      if(!check)throw new Error('The restaurant information could not be verified in device storage.');
      if(String(check.name||'')!==String(name)||String(check.location||'')!==String(location))throw new Error('The restaurant was not saved with the selected name and address. Your entries are still on screen.');
      pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];state={mode:'',restaurantId:null,pending:null,items:[],scores:{0:0,2:0,3:0},orderAgain:'',legacyOrdered:'',foodOpen:{}};
      closeModal();renderRestaurants();updateStory();
    }catch(e){
      console.error('Metro Eats restaurant info save failed',e);
      if(btn){btn.disabled=false;btn.textContent='Save Restaurant Information'}
      alert('Metro Eats could not save the restaurant information. Your entries are still on screen.\n\n'+(e&&e.message||'Please try again.'));
    }
  };
  window.meV3Save=async function(){
    meReviewV3Capture();
    var name=fieldValue('rName')||'';
    var location=fieldValue('rLoc')||'';
    var type=fieldValue('rType')||'Other';
    var website=fieldValue('rWebsite')||'';
    var menuUrl=fieldValue('rMenuUrl')||'';
    var notes=fieldValue('rNotes')||'';
    var rated=state.items.filter(function(x){return String(x.name||'').trim()&&Number(x.rating)>0});
    if(!name){alert('Please enter or select a restaurant name.');return}
    if(!Number(state.scores[0])||!Number(state.scores[2])||!Number(state.scores[3])){alert('Please rate Overall Experience, Service and Value from 1 to 10.');return}
    if(!rated.length){alert('Please add and rate at least one dish or drink.');return}
    if(!state.orderAgain){alert('Please choose Yes or No for whether you would order it again.');return}
    var current=state.pending||(db.restaurants||[]).find(function(x){return String(x.id)===String(state.restaurantId)})||{};
    var now=new Date().toISOString();
    var fields={
      name:name,
      type:type,
      location:location,
      website:website,
      menuUrl:menuUrl,
      notes:notes,
      photos:(window._editingPhotos||current.photos||[]).slice(),
      lat:current.lat??null,
      lon:current.lon??null
    };
    var review={
      scores:{0:Number(state.scores[0]),1:Number(foodAverage()),2:Number(state.scores[2]),3:Number(state.scores[3])},
      foodItems:rated.map(function(x){return {category:x.category,name:String(x.name).trim(),rating:Number(x.rating),notes:String(x.notes||'').trim()}}),
      ordered:state.legacyOrdered||rated.map(function(x){return x.name}).join(', '),
      orderAgain:state.orderAgain,
      overall:Number(score()),
      createdAt:now
    };
    var btn=document.querySelector('.surveyActions .btn.primary');
    if(btn){btn.disabled=true;btn.textContent='Saving…'}
    try{
      var savedId;
      if(state.mode==='new'){
        savedId=uid();
        var created=Object.assign({},current,fields,{id:savedId,reviewHistory:[review],survey:review,rating:Math.round(review.overall)/2,createdAt:current.createdAt||now,updatedAt:now});
        db.restaurants.unshift(created);
        state.restaurantId=savedId;
      }else{
        var saved=(db.restaurants||[]).find(function(x){return String(x.id)===String(state.restaurantId)});
        if(!saved)throw new Error('The restaurant could not be found in your saved restaurants.');
        Object.assign(saved,fields);
        var history=Array.isArray(saved.reviewHistory)?saved.reviewHistory.slice():[];
        if(state.mode==='edit'&&history.length)history[history.length-1]=review;else history.push(review);
        saved.reviewHistory=history;saved.survey=review;saved.rating=Math.round(review.overall)/2;saved.updatedAt=now;
        savedId=saved.id;
      }
      /* Persist and verify the exact restaurant record before closing the form. */
      await saveWithQuotaRecovery();
      var persisted=parseData();
      var check=(persisted.restaurants||[]).find(function(x){return String(x.id)===String(savedId)});
      if(!check)throw new Error('The review was created in memory but could not be verified in device storage.');
      if(String(check.name||'')!==String(name)||String(check.location||'')!==String(location)){
        throw new Error('The restaurant was not saved with the selected name and address. Your entries are still on screen.');
      }
      pendingRestaurant=null;pendingReviewRestaurant=null;restaurantEditMode=false;window._editingPhotos=[];state={mode:'',restaurantId:null,pending:null,items:[],scores:{0:0,2:0,3:0},orderAgain:'',legacyOrdered:'',foodOpen:{}};
      closeModal();renderRestaurants();updateStory();
    }catch(e){
      console.error('Metro Eats V3 review save failed',e);
      if(btn){btn.disabled=false;btn.textContent='Save Restaurant & Review'}
      alert('Metro Eats could not save this review. Your entries are still on screen.\n\n'+(e&&e.message||'Please try again.'));
    }
  };
  window.showVisitHistory=function(id){
    var r=(db.restaurants||[]).find(function(x){return String(x.id)===String(id)});if(!r)return;
    var rows=Array.isArray(r.reviewHistory)?r.reviewHistory.slice():[];if(!rows.length&&r.survey)rows=[r.survey];
    var h='<div class="eyebrow">Food Critic History</div><h2>'+esc(r.name)+'</h2><p class="hint">Each visit is kept as a separate critic review.</p>';
    h+=rows.length?'<div class="surveyGrid">'+rows.slice().reverse().map(function(v,i){
      return '<div class="surveyItem"><span class="rankBadge">#'+(rows.length-i)+'</span><div><b>'+Number(v.overall||0).toFixed(1)+'/10</b><div class="small">'+esc(v.ordered||'Order not recorded')+'</div>'+stamp('Reviewed',v.createdAt)+(v.foodItems&&v.foodItems.length?'<div class="small">Top: '+v.foodItems.filter(function(x){return x.name&&Number(x.rating)>0}).sort(function(a,b){return Number(b.rating)-Number(a.rating)}).slice(0,3).map(function(x){return esc(x.name)+' '+Number(x.rating).toFixed(1)+'/10'}).join(' • ')+'</div>':'')+'</div><button type="button" class="btn" onclick="showReviewResults(\''+String(r.id).replace(/'/g,"&#39;")+'\')">Review Again</button></div>';
    }).join(''):'<div class="empty">No visits saved yet.</div>';
    h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
    modal.classList.add('show');modalBody.innerHTML=h;
  };
  window.showReviewResults=function(id){
    var r=(db.restaurants||[]).find(function(x){return String(x.id)===String(id)});
    if(!r){alert('That restaurant could not be found in Metro Eats.');return}
    var v=(Array.isArray(r.reviewHistory)&&r.reviewHistory.length)?r.reviewHistory[r.reviewHistory.length-1]:(r.survey||null);
    if(!v){alert('No saved review results are available for this restaurant.');return}
    var foods=Array.isArray(v.foodItems)?v.foodItems.filter(function(x){return x&&x.name}):[];
    var h='<div class="eyebrow">Food Critic Results</div><h2>'+esc(r.name)+'</h2><p class="hint">Read-only copy of your saved review. Nothing on this screen can be edited.</p>';
    h+='<div class="scoreHero"><div class="restaurantScore">'+Number(v.overall||0).toFixed(1)+'<span style="font-size:.45em"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div>';
    h+='<div class="reviewResultsScores">';
    h+='<div class="reviewResultsScoreCard"><span>Food Quality</span><strong>'+Number(v.scores&&v.scores[1]||0).toFixed(1)+'<small>/10</small></strong></div>';
    h+='<div class="reviewResultsScoreCard"><span>Service</span><strong>'+Number(v.scores&&v.scores[2]||0).toFixed(1)+'<small>/10</small></strong></div>';
    h+='<div class="reviewResultsScoreCard"><span>Value</span><strong>'+Number(v.scores&&v.scores[3]||0).toFixed(1)+'<small>/10</small></strong></div>';
    h+='</div>';
    h+='<div class="reviewResultsDetails">';
    if(v.createdAt)h+='<div class="reviewResultsDetailCard"><span>Reviewed</span><strong>'+esc(new Date(v.createdAt).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}))+'</strong></div>';
    if(v.ordered)h+='<div class="reviewResultsDetailCard"><span>What I Ordered</span><strong>'+esc(v.ordered)+'</strong></div>';
    h+='<div class="reviewResultsDetailCard"><span>Would I Order It Again?</span><strong>'+esc(v.orderAgain||'Not recorded')+'</strong></div>';
    h+='</div>';
    if(foods.length){
      h+='<div class="reviewResultsFoods"><h3>My Dishes & Drinks</h3>';
      h+=foods.map(function(x){
        return '<div class="reviewResultsFoodCard"><div class="reviewResultsFoodInfo"><strong>'+esc(x.name)+'</strong><span>'+esc(x.category||'')+(x.notes?' • '+esc(x.notes):'')+'</span></div><div class="reviewResultsFoodScore"><strong>'+Number(x.rating||0).toFixed(1)+'</strong><span>/10</span></div></div>';
      }).join('');
      h+='</div>';
    }
    h+='<div class="actions"><button type="button" class="btn primary" onclick="closeModal();meDiningReview(\''+String(r.id).replace(/'/g,"&#39;")+'\')">Edit Review</button><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
    modal.classList.add('show');modalBody.innerHTML=h;
  };
  window.showRankings=function(){
    var ranked=(db.restaurants||[]).filter(function(r){return r&&r.survey}).sort(function(a,b){return Number(b.survey.overall||0)-Number(a.survey.overall||0)});
    var h='<div class="eyebrow">Food Critic</div><h2>My Restaurant Rankings</h2><p class="hint">Rankings use the latest critic score for each restaurant.</p>';
    h+=ranked.length?'<div class="surveyGrid">'+ranked.map(function(r,i){
      return '<div class="surveyItem"><span class="rankBadge">#'+(i+1)+'</span><div><b>'+esc(r.name)+'</b><div class="small">'+esc(r.location||'')+' • <strong>'+Number(r.survey.overall||0).toFixed(1)+'/10</strong></div>'+stamp('Latest review',r.survey.createdAt)+'</div><button type="button" class="btn" onclick="showReviewResults(\''+String(r.id).replace(/'/g,"&#39;")+'\')">Review</button></div>';
    }).join('')+'</div>':'<div class="empty">Complete a Food Critic review to start your rankings.</div>';
    h+='<div class="actions"><button type="button" class="btn danger" onclick="closeModal()">Close</button></div>';
    modal.classList.add('show');modalBody.innerHTML=h;
  };
  window.restaurantCard=function(r){
    var s=r&&r.survey,history=Array.isArray(r&&r.reviewHistory)?r.reviewHistory:[],summary='';
    if(s&&s.foodItems&&s.foodItems.length)summary=s.foodItems.filter(function(x){return x.name&&Number(x.rating)>0}).sort(function(a,b){return Number(b.rating)-Number(a.rating)}).slice(0,3).map(function(x){return esc(x.name)+' '+Number(x.rating).toFixed(1)+'/10'}).join(' • ');
    return '<article class="restaurant"><div class="recipeHead"><div><h3>'+esc(r.name)+'</h3><div class="meta">'+esc(r.location||'')+(r.type?' • '+esc(r.type):'')+'</div>'+stamp('Added',r.createdAt)+(r.updatedAt?stamp('Last updated',r.updatedAt):'')+'</div><button type="button" class="btn" onclick="openRestaurant(\''+String(r.id).replace(/'/g,"&#39;")+'\')">Edit</button></div>'+
      (s?'<div class="restaurantScoreCard"><div><div class="restaurantScore">'+Number(s.overall||0).toFixed(1)+'<span style="font-size:.45em"> / 10</span></div><div class="restaurantScoreLabel">Overall Experience</div></div><div><div class="topRated"><strong>Top Rated:</strong> '+(summary||'Complete another visit for more detail.')+'</div>'+stamp('Reviewed',s.createdAt)+'<div class="restaurantLinks"><button type="button" class="btn primary" onclick="showReviewResults(\''+String(r.id).replace(/'/g,"&#39;")+'\')">Review Again</button><button type="button" class="btn" onclick="showVisitHistory(\''+String(r.id).replace(/'/g,"&#39;")+'\')">Visit History ('+history.length+')</button></div></div></div>':'<div class="actions"><button type="button" class="btn primary" onclick="meDiningReview(\''+String(r.id).replace(/'/g,"&#39;")+'\')">★ Rate This Restaurant</button></div>')+
      (r.notes?'<p>'+esc(r.notes)+'</p>':'')+
      '<div class="restaurantLinks">'+(r.website?'<a class="btn" href="'+esc(r.website)+'" target="_blank" rel="noopener noreferrer">Official Website</a>':'')+(r.menuUrl?'<a class="btn" href="'+esc(r.menuUrl)+'" target="_blank" rel="noopener noreferrer">Official Menu</a>':'<a class="btn" href="'+officialMenuSearch(r.name,r.location||'')+'" target="_blank" rel="noopener noreferrer">Find Official Menu</a>')+'</div>'+
      (r.photos&&r.photos.length?'<div class="photos">'+r.photos.slice(0,6).map(function(p,i){return '<img src="'+esc(p)+'" alt="'+esc(r.name)+' meal photo '+(i+1)+'">'}).join(''):'')+'</article>';
  };
  window.meDiningAction=function(action,id){
    if(action==='create')return meV3Open('new','new');
    if(action==='edit')return meV3Open(String(id),'edit');
    if(action==='review')return showReviewResults(String(id));
    if(action==='history')return showVisitHistory(String(id));
    if(action==='rankings')return showRankings();
  };
  window.deleteCurrentSurvey=function(){
    var id=state.restaurantId|| (pendingReviewRestaurant&&pendingReviewRestaurant.id);
    if(!id||id==='new'){meV3Cancel();return}
    if(!confirm('Delete this restaurant and all of its saved review history? This cannot be undone.'))return;
    var i=db.restaurants.findIndex(function(x){return String(x.id)===String(id)});
    if(i<0){alert('That restaurant could not be found in Metro Eats.');return}
    db.restaurants.splice(i,1);
    try{save();meV3Cancel();renderRestaurants();updateStory();}catch(e){alert('Metro Eats could not delete this restaurant. '+(e&&e.message||''))}
  };
  /* V3 lookup bridge: the legacy lookup renderer was re-rendering the form from stale state after selection. */
  window.applyRestaurantLookup=function(x){
    if(!x)return;
    meReviewV3Capture();
    var current=state.pending||{};
    var rawName=x.name||fieldValue('rName')||current.name||'';
    var rawAddress=x.address||fieldValue('rLoc')||current.location||'';
    var details=knownRestaurantDetails(rawName,rawAddress);
    var name=details.name||rawName;
    var location=details.address||rawAddress;
    var website=x.website||details.website||knownOfficialWebsite(name,location)||current.website||'';
    var type=(x.type&&x.type!=='Other')?x.type:(details.type||current.type||'Other');
    state.pending=Object.assign({},current,{name:name,location:location,website:website,type:type,lat:x.lat??current.lat??null,lon:x.lon??current.lon??null});
    if(state.mode!=='new')state.restaurantId=state.pending.id;
    render();
    var box=document.getElementById('restaurantLookupResults');
    if(box)box.innerHTML='<div class="notice" style="margin-top:8px">Restaurant selected. Name, address, and type were filled in.</div>';
  };
  window.applyRestaurantLookupByIndex=function(index){
    var x=window._restaurantLookupResults?.[Number(index)];
    if(x)window.applyRestaurantLookup(x);
  };
  window.meV3RunSelfCheck=function(){
    var problems=[];
    if(typeof renderRestaurants!=='function')problems.push('restaurant list renderer missing');
    if(typeof saveWithQuotaRecovery!=='function')problems.push('storage recovery missing');
    if(!Array.isArray(db.restaurants))problems.push('restaurant data is not an array');
    (db.restaurants||[]).forEach(function(r,i){
      if(!r.id)problems.push('restaurant '+i+' has no id');
      if(r.reviewHistory&&!Array.isArray(r.reviewHistory))problems.push('restaurant '+i+' reviewHistory is not an array');
      if(r.survey&&typeof r.survey!=='object')problems.push('restaurant '+i+' survey is not an object');
    });
    return problems;
  };
})();
