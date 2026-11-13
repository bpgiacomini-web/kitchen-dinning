const detailKey=detail=>{
 if(detail.id)return 'id:'+detail.id;
 const article=detail.closest('article');
 const owner=article?.dataset.restaurantEntry||article?.id||article?.querySelector('[data-recipe-id],[data-pizza-id]')?.getAttribute('data-recipe-id')||article?.textContent.trim().slice(0,80)||'';
 const summary=detail.querySelector(':scope > summary');
 return owner+'|'+(summary?.getAttribute('aria-label')||summary?.textContent.trim());
};
export function captureReturnPosition(root){
 return {scrollY:window.scrollY,
  open:new Set([...root.querySelectorAll('details[open]')].filter(node=>!node.classList.contains('cardOptions')).map(detailKey)),
  fields:[...root.querySelectorAll('input[id],select[id]')].filter(node=>node.type==='search'||node.tagName==='SELECT').map(node=>({id:node.id,value:node.value,hidden:node.hidden})),
  tabs:[...root.querySelectorAll('[role="tab"][aria-selected="true"]')].map(node=>node.textContent.trim()),
  nearby:[...root.querySelectorAll('#nearby-results,[data-bar-results],[data-bars-nearby]')].map(node=>({selector:node.id?'#'+node.id:node.hasAttribute('data-bar-results')?'[data-bar-results]':'[data-bars-nearby]',visible:node.querySelectorAll(':scope > article:not([hidden]),:scope > .lookupMatch:not([hidden])').length}))};
}
export function restoreReturnPosition(root,state){
 for(const name of state.tabs){const tab=[...root.querySelectorAll('[role="tab"]')].find(node=>node.textContent.trim()===name);if(tab?.getAttribute('aria-selected')!=='true')tab?.click();}
 for(const field of state.fields){const node=document.getElementById(field.id);if(node){node.value=field.value;node.hidden=field.hidden;}}
 root.querySelector('input[type="search"]')?.dispatchEvent(new Event('input',{bubbles:true}));
 let stopped=false;
 const apply=()=>{
  if(stopped)return;
  for(const detail of root.querySelectorAll('details'))if(state.open.has(detailKey(detail)))detail.open=true;
  for(const list of state.nearby){const container=root.querySelector(list.selector);if(!container)continue;let more=container.querySelector('.nearbyShowMore');while(more&&container.querySelectorAll(':scope > article:not([hidden]),:scope > .lookupMatch:not([hidden])').length<list.visible){more.click();more=container.querySelector('.nearbyShowMore');}}
  window.scrollTo({top:state.scrollY,left:0,behavior:'instant'});
 };
 apply();requestAnimationFrame(apply);
 const observer=new MutationObserver(apply);observer.observe(root,{childList:true,subtree:true});
 let timer;const cleanup=()=>{stopped=true;clearTimeout(timer);observer.disconnect();for(const event of ['wheel','touchstart','keydown'])window.removeEventListener(event,cleanup);};
 for(const event of ['wheel','touchstart','keydown'])window.addEventListener(event,cleanup,{once:true,passive:true});
 timer=setTimeout(cleanup,20000);return cleanup;
}
