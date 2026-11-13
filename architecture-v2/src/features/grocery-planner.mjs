const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function groceryAisle(line){
 if(/\b(paste|bouillon|powder|ground pepper|black pepper|cayenne|chili powder|canned|dried|paprika|cumin|oregano|seasoning)\b/i.test(line))return 'Pantry & Other';
 if(/\b(milk|cream|cheese|butter|yogurt|eggs?)\b/i.test(line))return 'Dairy & Eggs';
 if(/\b(chicken|beef|ground chuck|chorizo|pork|bacon|sausage|shrimp|salmon|tuna|turkey|fish)\b/i.test(line))return 'Meat & Seafood';
 if(/\b(jalapeno|jalapeño|onions?|garlic|tomato|tomatoes|lettuce|spinach|carrots?|potatoes?|lemon|lime|cilantro|parsley|basil|avocado|pepper|celery|cucumber|mushroom)\b/i.test(line)&&! /\b(dried|powder|ground|canned)\b/i.test(line))return 'Produce';
 if(/\bfrozen\b/i.test(line))return 'Frozen';
 return 'Pantry & Other';
}
export function groceryRows(recipes,selected){return recipes.filter(recipe=>selected.has(String(recipe.id))).flatMap(recipe=>(recipe.ingredients||[]).map((text,index)=>({key:JSON.stringify([String(recipe.id),index,String(text)]),text:String(text),recipe:recipe.title||recipe.name,aisle:groceryAisle(String(text))})));}
export function createGroceryPlanner(){
 const selected=new Set(),checked=new Set();let chooserOpen=false;
 return {reset(){selected.clear();checked.clear();chooserOpen=false;},render(root,recipes){
  const paint=()=>{const rows=groceryRows(recipes,selected);const groups=[...new Set(rows.map(row=>row.aisle))].sort();
   root.innerHTML=`<section class="content-panel groceryPlanner"><div class="sectionTitle"><h2>Grocery List</h2><button class="btn" type="button" data-view="recipes">Done</button></div><details${chooserOpen?' open':''}><summary>Choose recipes · ${selected.size}</summary>${recipes.map(recipe=>`<label class="inlineCheck"><input type="checkbox" data-grocery-recipe="${esc(recipe.id)}"${selected.has(String(recipe.id))?' checked':''}>${esc(recipe.title||recipe.name)}</label>`).join('')}</details><p class="hint">${rows.length} items · check off what you have</p>${groups.map(group=>`<section><h3>${group}</h3>${rows.filter(row=>row.aisle===group).map(row=>`<label class="groceryItem${checked.has(row.key)?' purchased':''}"><input type="checkbox" data-grocery-item="${esc(row.key)}"${checked.has(row.key)?' checked':''}><span>${esc(row.text)}<small>${esc(row.recipe)}</small></span></label>`).join('')}</section>`).join('')||'<p>Choose recipes to build your list.</p>'}<div class="actions"><button class="btn primary" type="button" data-grocery-share${rows.length?'':' disabled'}>Share List</button><button class="btn" type="button" data-grocery-clear>Clear</button></div><p role="status"></p></section>`;
   root.querySelector('details').addEventListener('toggle',event=>{chooserOpen=event.target.open;});
   root.querySelectorAll('[data-grocery-recipe]').forEach(input=>input.addEventListener('change',()=>{input.checked?selected.add(input.dataset.groceryRecipe):selected.delete(input.dataset.groceryRecipe);chooserOpen=true;paint();}));
   root.querySelectorAll('[data-grocery-item]').forEach(input=>input.addEventListener('change',()=>{input.checked?checked.add(input.dataset.groceryItem):checked.delete(input.dataset.groceryItem);input.closest('label').classList.toggle('purchased',input.checked);}));
   root.querySelector('[data-grocery-clear]').addEventListener('click',()=>{selected.clear();checked.clear();paint();});
   root.querySelector('[data-grocery-share]').addEventListener('click',async()=>{const remaining=rows.filter(row=>!checked.has(row.key));const text='Metro Eats · Grocery List\n'+groups.map(group=>{const items=remaining.filter(row=>row.aisle===group);return items.length?group+'\n'+items.map(row=>'☐ '+row.text).join('\n'):'';}).filter(Boolean).join('\n\n');const status=root.querySelector('[role="status"]');try{if(navigator.share)await navigator.share({title:'Grocery List',text});else{await navigator.clipboard.writeText(text);status.textContent='List copied.';}}catch(error){if(error.name!=='AbortError'){status.textContent='Copy your list below.';const area=document.createElement('textarea');area.value=text;area.readOnly=true;status.append(area);area.select();}}});
  };paint();
 }};
}
