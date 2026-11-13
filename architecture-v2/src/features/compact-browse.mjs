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
  const recipes=root.querySelector('.recipeBrowseTools');
  if(recipes && !recipes.closest('.compactBrowseMenu'))wrap([recipes,root.querySelector('#recipe-favorites-only')?.closest('label')],'Search & Filters');
  const sort=root.querySelector('.restaurantSortControl');
  if(sort && !sort.closest('.compactBrowseMenu'))wrap([sort,root.querySelector('.restaurantReviewFilter'),root.querySelector('#restaurant-favorites-only')?.closest('label')],'Sort & Filters',root.querySelector('.collectionSearchToggle')||sort);
  const search=root.querySelector('.cocktailSearch');
  if(search && !search.closest('.compactBrowseMenu'))wrap([search,root.querySelector('.barGamingFilter'),root.querySelector('.barReviewFilter'),root.querySelector('#cocktail-favorites-only')?.closest('label')],'Search & Filters');
 };
 const observer=new MutationObserver(enhance);observer.observe(root,{childList:true,subtree:true});enhance();return ()=>observer.disconnect();
}
