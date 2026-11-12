import { importCocktailUrl } from "./cocktail-import.mjs";
import { recipeImageUrl } from "./recipes/import-parser.mjs";
export async function optimizePhoto(file) {
 if(!file || file.size>25_000_000 || !file.type.startsWith('image/'))throw new Error('Choose a photograph under 25 MB.');
 let bitmap;
 try{bitmap=await createImageBitmap(file);}catch{throw new Error('This photo format cannot be read. Try JPEG, PNG, or WebP.');}
 try {
  let scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
  for(let attempt=0;attempt<5;attempt++) {
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));context.drawImage(bitmap,0,0,canvas.width,canvas.height);
   for(const quality of [.82,.7,.58,.46]) {
    let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
    if(!blob || blob.type!=='image/webp')blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
    if(!blob || !['image/webp','image/jpeg'].includes(blob.type))throw new Error('This browser could not compress the photo.');
    if(blob.size<=200_000)return {blob,width:canvas.width,height:canvas.height};
   }
   scale*=.8;
  }
  throw new Error('This image could not be reduced below 200 KB.');
 }finally{bitmap.close?.();}
}
const encode=blob=>new Promise((resolve,reject)=>{const reader=new window.FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createJournalPhotos({root,getData,save}) {
 const cache=new Map();let pending=false,epoch=0;
 async function request(mode,body) {
  const token=await globalThis.metroGetAccessToken?.();if(!token)throw new Error('Sign in again.');
  const response=await fetch('/api/user-data?mode='+mode,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Photos unavailable.');return payload;
 }
 function clear(){epoch++;for(const value of cache.values())if(typeof value==='string')URL.revokeObjectURL(value);cache.clear();}
 window.addEventListener('metro-signed-out',clear);window.addEventListener('metro-authenticated',clear);
 async function imageUrl(path){
  if(cache.has(path))return await cache.get(path);
  const version=epoch;
  const promise=(async()=>{const token=await globalThis.metroGetAccessToken?.();if(!token)return null;const response=await fetch('/api/user-data?mode=photo-read&path='+encodeURIComponent(path),{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)return null;return URL.createObjectURL(await response.blob());})();
  cache.set(path,promise);const result=await promise;if(version!==epoch){if(result)URL.revokeObjectURL(result);cache.delete(path);return null;}cache.set(path,result);return result;
 }
 function identify(card){
  if(card.classList.contains('cocktailCard')){const id=card.id.slice('cocktail-'.length);for(const key of ['bars','drinks','cocktailRecipes'])if(getData()[key]?.some(item=>item.id===id))return [key,id];}
  for(const [key,attribute] of [['recipes','data-recipe-id'],['restaurants','data-restaurant-id'],['pizzas','data-pizza-id']]) {const node=card.querySelector('['+attribute+']');if(node)return [key,node.getAttribute(attribute)];}
  return [];
 }
 function enhance(){
  for(const card of root.querySelectorAll('.readOnlyItem')){
   const [collection,id]=identify(card);if(!collection)continue;const item=getData()[collection]?.find(item=>String(item.id)===id);if(!item)continue;
   if(['recipes','cocktailRecipes'].includes(collection) && !card.querySelector('.visibleRecipePhotoButton')){const button=document.createElement('button');button.type='button';button.className='btn visibleRecipePhotoButton';button.textContent=item.photoRefs?.length || item.sourceImageUrl?'Change Photo':'Add Photo';button.dataset.photoAction='open';button.dataset.collection=collection;button.dataset.itemId=id;card.append(button);}
   if(!card.querySelector('.cardOptionsList [data-photo-action]')){const menu=card.querySelector('.cardOptionsList');if(menu){const button=document.createElement('button');button.className='btn';button.type='button';button.textContent='Photos';button.dataset.photoAction='open';button.dataset.collection=collection;button.dataset.itemId=id;menu.append(button);}}
   if(!card.querySelector('.journalPhotoStrip') && !item.photoRefs?.length && recipeImageUrl(item.sourceImageUrl)) {
    const strip=document.createElement('div');strip.className='journalPhotoStrip sourceRecipePhoto';card.append(strip);
    const image=new window.Image();image.alt=item.title||item.name||'Recipe photo';image.referrerPolicy='no-referrer';image.onload=()=>{if(!strip.isConnected)return;strip.append(image);if(item.source){const credit=document.createElement('a');try{const url=new URL(item.source);if(['https:','http:'].includes(url.protocol)&&!url.username&&!url.password){credit.href=url.href;credit.target='_blank';credit.rel='noopener noreferrer';credit.className='sourcePhotoCredit';credit.textContent='Recipe source ↗';strip.append(credit);}}catch{}}};image.src=recipeImageUrl(item.sourceImageUrl);
   }
   if(!card.querySelector('.journalPhotoStrip') && item.photoRefs?.length){const strip=document.createElement('div');strip.className='journalPhotoStrip';card.append(strip);for(const ref of item.photoRefs){if(typeof ref.path!=='string')continue;void imageUrl(ref.path).then(src=>{if(!src||!strip.isConnected)return;const image=new window.Image();image.alt=ref.label||item.name||item.title||'Journal photo';image.decoding='async';image.onload=()=>{if(strip.isConnected)strip.append(image);};image.src=src;});}}
  }
  for(const entry of root.querySelectorAll('.recentEntry')){
   if(entry.dataset.photoLoading || entry.querySelector('.recentThumb'))continue;
   const item=getData()[entry.dataset.collection]?.find(item=>String(item.id)===entry.dataset.itemId);if(!item)continue;
   const visits=[...(item.reviewHistory||item.visits||[])].reverse();
   const path=visits.find(visit=>visit.photoRefs?.length)?.photoRefs?.[0]?.path || item.photoRefs?.[0]?.path;
   const source=recipeImageUrl(item.sourceImageUrl);if(!path&&!source)continue;entry.dataset.photoLoading='true';
   void (path?imageUrl(path):Promise.resolve(source)).then(src=>{if(!src||!entry.isConnected)return;const image=new window.Image();image.className='recentThumb';image.alt='';image.referrerPolicy='no-referrer';image.onload=()=>{if(entry.isConnected)entry.append(image);};image.src=src;});
  }
 }
 const observer=new window.MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;enhance();});}});observer.observe(root,{childList:true,subtree:true});
 root.addEventListener('click',event=>{const button=event.target.closest('[data-photo-action]');if(!button)return;if(button.dataset.photoAction==='open')open(button.dataset.collection,button.dataset.itemId);});
 function open(collection,id){
  const item=getData()[collection]?.find(row=>String(row.id)===id);if(!item)return;root.querySelector('.photoEditor')?.remove();
  const panel=document.createElement('section');panel.className='content-panel photoEditor';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Entry photos');
  const max=['restaurants','pizzas','bars'].includes(collection)?4:1;let uploaded=null;
  panel.innerHTML=`<h3>Photos · ${esc(item.title||item.name)}</h3><p class="hint">${max===1?'One cover photo.':'Up to four photos.'} Optimized automatically.</p><div class="actions"><button class="btn" type="button" data-upload-choice>Upload Photo</button><button class="btn" type="button" data-camera-choice>Take Photo</button>${["recipes","cocktailRecipes"].includes(collection) && item.source ? `<button class="btn" type="button" data-use-source>Use Recipe Photo</button>` : ""}</div><input data-upload type="file" accept="image/*" hidden><input data-camera type="file" accept="image/*" capture="environment" hidden><button class="btn" type="button" data-attach hidden>Save Photo</button><div class="photoRefList">${(item.photoRefs||[]).map((ref,index)=>`<button class="btn" type="button" data-remove="${index}">Remove photo ${index+1}</button>`).join('')}</div><button class="btn" type="button" data-close>Close</button><p role="status" aria-live="polite"></p>`;
  root.prepend(panel);panel.scrollIntoView({block:'center',behavior:'smooth'});
  const feedback=panel.querySelector('[role="status"]');
  const attach=async()=>{const data=getData(),entry=data[collection].find(row=>String(row.id)===id);if(!entry)throw Error('Entry no longer available.');const refs=max===1?[uploaded]:[...(entry.photoRefs||[]),uploaded];if(refs.length>max)throw Error('Remove a photo before adding another.');await save({...data,[collection]:data[collection].map(row=>String(row.id)===id?{...row,photoRefs:refs}:row)});root.dispatchEvent(new window.CustomEvent('metro-photo-saved',{bubbles:true}));panel.remove();};
  for(const [choice,input] of [['[data-upload-choice]','[data-upload]'],['[data-camera-choice]','[data-camera]']]){panel.querySelector(choice).onclick=()=>panel.querySelector(input).click();panel.querySelector(input).onchange=async event=>{const file=event.target.files?.[0];if(!file)return;const current=getData()[collection]?.find(row=>String(row.id)===id);if(max>1 && (current?.photoRefs?.length||0)>=max){feedback.textContent='Remove a photo before adding another.';return;}feedback.textContent='Optimizing…';panel.querySelectorAll('.actions button').forEach(button=>button.disabled=true);try{const optimized=await optimizePhoto(file);if(!panel.isConnected)return;feedback.textContent='Uploading…';const result=await request('photo-upload',{collection,id,image:await encode(optimized.blob),width:optimized.width,height:optimized.height});uploaded=result.photo;if(panel.isConnected)await attach();}catch(error){if(panel.isConnected){feedback.textContent=error.message;panel.querySelector('[data-attach]').hidden=!uploaded;}}finally{panel.querySelectorAll('.actions button').forEach(button=>button.disabled=false);}};}
  panel.querySelector('[data-attach]').onclick=()=>void attach().catch(error=>feedback.textContent=error.message);
  panel.querySelector('[data-use-source]')?.addEventListener('click',async event=>{
    event.currentTarget.disabled=true;feedback.textContent='Checking recipe photo…';
    try{const draft=await importCocktailUrl(item.source);const sourceImageUrl=recipeImageUrl(draft.sourceImageUrl);if(!sourceImageUrl)throw Error('No usable source photo found. Upload or take a photo instead.');if(!panel.isConnected)return;const data=getData();await save({...data,[collection]:data[collection].map(row=>String(row.id)===id?{...row,sourceImageUrl,photoRefs:[]}:row)});root.dispatchEvent(new window.CustomEvent('metro-photo-saved',{bubbles:true}));panel.remove();}
    catch(error){if(panel.isConnected){feedback.textContent=error.message;panel.querySelector('[data-use-source]').disabled=false;}}
  });
  panel.querySelector('[data-close]').onclick=()=>panel.remove();
  panel.querySelectorAll('[data-remove]').forEach(button=>button.onclick=async()=>{try{const data=getData();await save({...data,[collection]:data[collection].map(row=>String(row.id)===id?{...row,photoRefs:(row.photoRefs||[]).filter((_,index)=>index!==Number(button.dataset.remove))}:row)});root.dispatchEvent(new CustomEvent('metro-photo-saved',{bubbles:true}));panel.remove();}catch(error){feedback.textContent=error.message;}});
 }
 async function usage(container){container.textContent='Checking photo storage…';try{const result=await request('photo-usage');container.innerHTML=`<label>Photo storage <progress max="${result.limit}" value="${result.used}"></progress></label><small>${(result.used/1e6).toFixed(1)} / ${(result.limit/1e6).toFixed(0)} MB safety limit</small><p>${result.warning?'Storage is nearing the free limit.':'Within the free storage budget.'}</p>`;}catch(error){container.textContent=error.message;}}
 return {enhance,usage,clear};
}
