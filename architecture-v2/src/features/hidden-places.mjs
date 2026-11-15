import {hiddenPlaceDescriptor,isHiddenPlace,validHiddenPlaces} from '../domain/hidden-places.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createHiddenPlaces({root,getData,save,refresh}){
 let pending=null,trigger=null,dialog=null,saving=false;
 const descriptors=new WeakMap();
 const control=place=>{const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.hiddenAction='mark';const hidden=isHiddenPlace(place,getData().hiddenPlaces||[]);button.textContent=hidden?'Marked closed':'Mark as closed';button.disabled=hidden;descriptors.set(button,hiddenPlaceDescriptor(place));return button;};
 const enhance=()=>{
  for(const card of root.querySelectorAll('.restaurantCard,.cocktailCard')){
   const id=card.dataset.restaurantEntry||card.id.replace(/^cocktail-/,'');
   const place=(card.classList.contains('restaurantCard')?getData().restaurants:getData().bars)?.find(item=>String(item.id)===id);
   const menu=card.querySelector('.cardOptionsList');if(place&&menu&&!menu.querySelector('[data-hidden-action]'))menu.append(control(place));
  }
  for(const row of root.querySelectorAll('.nearbyPlace,.lookupMatch[data-hidden-place],.pickInfo[data-hidden-place]')){
   if(row.querySelector('.placeMoreMenu'))continue;
   let place;try{place=JSON.parse(row.dataset.hiddenPlace||row.querySelector('[data-nearby]')?.dataset.nearby||'null');}catch{}if(!place)continue;
   const menu=document.createElement('details');menu.className='cardOptions placeMoreMenu';menu.innerHTML='<summary class="cardOptionsTrigger" aria-label="More options for '+esc(place.name)+'">More</summary><div class="cardOptionsList"></div>';menu.querySelector('div').append(control(place));
   (row.querySelector('.nearbyPlaceActions')||row).append(menu);
  }
 };
 const observer=new MutationObserver(enhance);observer.observe(root,{childList:true,subtree:true});enhance();
 const close=()=>{dialog?.close();dialog?.remove();dialog=null;pending=null;saving=false;trigger?.focus({preventScroll:true});trigger=null;};
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-hidden-action]');if(!button)return;
  const action=button.dataset.hiddenAction;
  if(action==='cancel'){if(!saving)close();return;}
  if(action==='mark'){
   if(dialog)return;pending=descriptors.get(button);if(!pending)return;trigger=button;
   dialog=document.createElement('dialog');dialog.className='hiddenPlaceConfirm';dialog.setAttribute('aria-labelledby','hidden-place-confirm-title');
   dialog.innerHTML='<h2 id="hidden-place-confirm-title">Mark as closed?</h2><strong>'+esc(pending.name)+'</strong><p>'+esc(pending.address)+'</p><p>Hide this location from nearby results and dinner picks. Your reviews stay.</p><div class="actions"><button class="btn" type="button" data-hidden-action="cancel">Cancel</button><button class="btn primary" type="button" data-hidden-action="confirm">Mark as closed</button></div><p role="status"></p>';
   dialog.addEventListener('cancel',event=>{event.preventDefault();if(!saving)close();});document.body.append(dialog);dialog.showModal();return;
  }
  if(action==='confirm'){
   if(!pending||!dialog||saving)return;const record={...pending,id:crypto.randomUUID(),reason:'closed',hiddenAt:new Date().toISOString()},next=[...(getData().hiddenPlaces||[]),record];
   const status=dialog.querySelector('[role="status"]');if(!validHiddenPlaces(next)){status.textContent='An address or precise venue location is needed. Add an address before marking it closed.';return;}
   saving=true;dialog.querySelectorAll('button').forEach(node=>{node.disabled=true;});
   try{await save({...getData(),hiddenPlaces:next});close();refresh();}catch(error){saving=false;if(dialog){status.textContent=error.message||'Could not save. Nothing was hidden.';dialog.querySelectorAll('button').forEach(node=>{node.disabled=false;});}}return;
  }
  if(action==='restore'){
   button.disabled=true;try{await save({...getData(),hiddenPlaces:(getData().hiddenPlaces||[]).filter(item=>item.id!==button.dataset.hiddenId)});refresh();}catch(error){button.disabled=false;const status=root.querySelector('[data-hidden-status]');if(status)status.textContent=error.message||'Could not restore this location.';}
  }
 });
 return {render(){
  const rows=getData().hiddenPlaces||[];root.innerHTML='<section class="content-panel hiddenPlacesPage"><div class="sectionTitle"><h2>Hidden places</h2><button class="btn" type="button" data-view="home">Done</button></div><p class="hint">Hidden from your nearby results and dinner picks. Reviews stay in your journal.</p>'+rows.map(item=>'<article class="hiddenPlaceRow"><div><strong>'+esc(item.name)+'</strong><small>'+esc(item.address)+'</small></div><button class="btn" type="button" data-hidden-action="restore" data-hidden-id="'+esc(item.id)+'">Restore</button></article>').join('')+(rows.length?'':'<p>No hidden places.</p>')+'<p role="status" data-hidden-status></p></section>';
 }};
}
