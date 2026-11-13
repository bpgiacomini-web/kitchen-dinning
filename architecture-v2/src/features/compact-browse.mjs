/** Move existing controls without replacing their listeners or values. */
export function mountCompactBrowse(root){
 const wrap=(nodes,label,before)=>{
  const controls=nodes.filter(Boolean);if(!controls.length || controls.some(node=>node.closest('.compactBrowseMenu')))return;
  const details=document.createElement('details');details.className='compactBrowseMenu';
  const summary=document.createElement('summary');summary.textContent=label;details.append(summary);
  const body=document.createElement('div');body.className='compactBrowseBody';details.append(body);
  (before||controls[0]).before(details);controls.forEach(node=>body.append(node));
 };
 const enhance=()=>{
  for(const host of root.querySelectorAll(".nearbyPanel,.homeRestaurantFinder,.barDiscovery"))for(const panel of host.querySelectorAll(":scope > details")){if(!panel.querySelector("[data-map-credit]")){const credit=document.createElement("small");credit.dataset.mapCredit="";credit.className="mapCredit";const link=document.createElement("a");link.href="https://www.openstreetmap.org/copyright";link.target="_blank";link.rel="noopener noreferrer";link.textContent="Map data © OpenStreetMap";credit.append(link);panel.append(credit);}}
  for(const [selector,filterId] of [['.restaurantReviewFilter','restaurant-review-filter'],['.barReviewFilter','bar-review-filter']]){const control=root.querySelector(selector);if(control&&!root.querySelector('[data-review-later="'+filterId+'"]')){const chip=document.createElement('button');chip.type='button';chip.className='btn reviewLaterChip';chip.dataset.reviewLater=filterId;const select=control.querySelector('select');chip.textContent='Review Later';chip.setAttribute('aria-pressed',String(select.value==='later'));chip.addEventListener('click',()=>{select.value=select.value==='later'?'all':'later';select.dispatchEvent(new Event('change',{bubbles:true}));chip.setAttribute('aria-pressed',String(select.value==='later'));});const cards=root.querySelector(selector.includes('restaurant')?'.readOnlyList':'.cocktailCards');(cards||control).before(chip);}}
  const recipes=root.querySelector('.recipeBrowseTools');
  if(recipes && !recipes.closest('.compactBrowseMenu'))wrap([recipes,root.querySelector('#recipe-favorites-only')?.closest('label')],'Search & Filters');
  const sort=root.querySelector('.restaurantSortControl');
  if(sort && !sort.closest('.compactBrowseMenu'))wrap([sort,root.querySelector('.restaurantReviewFilter'),root.querySelector('#restaurant-favorites-only')?.closest('label')],'Sort & Filters',root.querySelector('.collectionSearchToggle')||sort);
  const search=root.querySelector('.cocktailSearch');
  if(search && !search.closest('.compactBrowseMenu'))wrap([search,root.querySelector('.cocktailSort'),root.querySelector('.barGamingFilter'),root.querySelector('.barReviewFilter'),root.querySelector('#cocktail-favorites-only')?.closest('label')],'Search & Filters');
 };
 const collapse=event=>{const panel=event.target;if(!(panel instanceof HTMLDetailsElement)||!panel.open||panel.classList.contains('cardOptions'))return;requestAnimationFrame(()=>{if(!panel.isConnected||!panel.open||panel.scrollHeight<450||panel.querySelector(':scope > .collapseBottom'))return;const button=document.createElement('button');button.type='button';button.className='collapseBottom';button.setAttribute('aria-label','Collapse '+(panel.querySelector(':scope > summary')?.textContent.replace(/[▸▾▼▶]/g,'').trim()||'section'));button.title='Collapse';button.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';button.addEventListener('click',()=>collapseInPlace(panel,button));panel.append(button);});};
 root.addEventListener('toggle',collapse,true);
 const observer=new MutationObserver(enhance);observer.observe(root,{childList:true,subtree:true});enhance();return ()=>{observer.disconnect();root.removeEventListener('toggle',collapse,true);};
}

/** Keep the closed heading at the collapse control's screen position, without a smooth trip through removed content. */
export function collapseInPlace(panel,button){
 const summary=panel.querySelector(':scope > summary');if(!summary){panel.open=false;return;}
 const anchorTop=button.getBoundingClientRect().top;
 const page=document.documentElement,previousAnchor=page.style.overflowAnchor,previousBehavior=page.style.scrollBehavior;
 page.style.overflowAnchor='none';page.style.scrollBehavior='auto';
 panel.open=false;summary.focus({preventScroll:true});
 const align=()=>window.scrollTo({top:Math.max(0,window.scrollY+summary.getBoundingClientRect().top-anchorTop),behavior:'auto'});
 align();requestAnimationFrame(()=>{align();page.style.overflowAnchor=previousAnchor;page.style.scrollBehavior=previousBehavior;});
}
