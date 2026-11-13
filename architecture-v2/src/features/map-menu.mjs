import {restaurantNavigationOptions} from '../domain/restaurant-directions.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountMenuDismissal(root){
 const menus=()=>root.querySelectorAll('details.nearbyNavigationMenu[open],details.cardOptions[open]');
 const dismiss=event=>{for(const menu of menus())if(!menu.contains(event.target)||event.target.closest('a[href]'))menu.open=false;};
 const escape=event=>{if(event.key!=='Escape')return;const open=[...menus()];for(const menu of open)menu.open=false;open.at(-1)?.querySelector('summary')?.focus({preventScroll:true});};
 document.addEventListener('click',dismiss,true);document.addEventListener('keydown',escape);
 return()=>{document.removeEventListener('click',dismiss,true);document.removeEventListener('keydown',escape);};
}
export function mapMenuMarkup(place){return `<details class="nearbyNavigationMenu"><summary class="btn nearbyDirectionsButton" aria-label="Choose a map app for ${esc(place.name)}" title="Maps"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13Z"/><circle cx="12" cy="9" r="2"/></svg></summary><div class="nearbyNavigationOptions">${restaurantNavigationOptions(place).map(item=>`<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join('')}</div></details>`;}
