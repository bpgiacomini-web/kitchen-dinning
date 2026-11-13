import {businessPhone} from "../domain/business-phone.mjs";
import {matchingSavedRestaurants} from "../domain/nearby-personal-rating.mjs";
import {restaurantNavigationOptions} from "../domain/restaurant-directions.mjs";
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function recentJournalEntries(data) {
 const entries=[];
 for(const [collection,label] of [['recipes','Recipe'],['restaurants','Restaurant'],['pizzas','Pizza'],['bars','Bar'],['drinks','Drink'],['cocktailRecipes','Cocktail']]) {
  for(const item of data[collection]||[]) {
   const dates=[item.updatedAt,item.createdAt,...(item.reviewHistory||[]).map(row=>row.updatedAt||row.createdAt||row.visitedAt),...(item.visits||[]).map(row=>row.updatedAt||row.createdAt||row.visitedAt)].map(value=>Date.parse(value||'')).filter(Number.isFinite);
   if(dates.length)entries.push({collection,id:item.id,name:item.title||item.name,label,date:Math.max(...dates)});
  }
 }
 return entries.sort((a,b)=>b.date-a.date).slice(0,3);
}
export function renderRecentActivity(data) {
 const recent=recentJournalEntries(data);
 return `<div class="journalHighlights">${recent.map(item=>`<button class="recentEntry" type="button" data-action="open-journal-item" data-collection="${item.collection}" data-item-id="${esc(item.id)}"><small>${item.label}</small><strong>${esc(item.name)}</strong></button>`).join('')||'<p class="hint">Your next memory starts here.</p>'}</div>`;
}
export function pickCandidates(data,filter='all',nearby=[]) {
 const local=nearby.filter(item=>item.distance==null||item.distance<=32187).map(item=>({...item,id:"nearby:"+item.name+"|"+item.address}));
 const seen=new Set(),key=item=>[item.name,item.address].join(' ').toLowerCase().replace(/[^a-z0-9]/g,'');
 return local.filter(item=>{const value=key(item);if(seen.has(value))return false;seen.add(value);return true;});
}
export function renderTonightPick(data,filter='all',chosenId=null,nearby=[]) {
 const candidates=pickCandidates(data,filter,nearby),pick=candidates.find(item=>item.id===chosenId);
 const phone=businessPhone(pick?.phone)||matchingSavedRestaurants(pick||{},data.restaurants||[]).map(item=>businessPhone(item.phone)).find(Boolean);
 return `<section class="content-panel tonightPick"><h3>Take a Chance on Dinner</h3><button class="pickCoin" type="button" data-action="shuffle-pick" aria-label="${pick?'Reshuffle restaurant':'Flip for a restaurant'}"><svg class="coinToken" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><path id="metro-coin-lettering" d="M 15,50 A 35,35 0 1,1 85,50 A 35,35 0 1,1 15,50"/></defs><circle class="coinReeding" cx="50" cy="50" r="46"/><circle class="coinInnerRim" cx="50" cy="50" r="28"/><text class="coinLettering"><textPath href="#metro-coin-lettering" startOffset="25%" text-anchor="middle">METRO EATS</textPath></text><text class="coinMint" x="50" y="86" text-anchor="middle">★  FLIP A PICK  ★</text><path class="coinLily" d="M50 22C43 31 40 37 44 46L48 55H43C43 42 32 37 27 44C22 52 29 59 37 55C34 51 36 48 39 51C41 54 40 58 39 61H47V66H42V71H47L50 78L53 71H58V66H53V61H61C60 58 59 54 61 51C64 48 66 51 63 55C71 59 78 52 73 44C68 37 57 42 57 55H52L56 46C60 37 57 31 50 22Z"/></svg></button><span class="coinCaption">${pick?'Tap coin to flip again':'Tap coin to pick'}</span><div class="pickReveal" aria-live="polite">${pick?`<details class="pickInfo"><summary class="pickResult" aria-label="More info for ${esc(pick.name)}"><strong>${esc(pick.name)}</strong></summary><details class="pickNavigation nearbyNavigationMenu"><summary class="pickAddress" aria-label="Choose a map app for ${esc(pick.name)}">${esc(pick.address||pick.name)}</summary><div class="pickNavigationOptions nearbyNavigationOptions" aria-label="Navigation apps">${restaurantNavigationOptions(pick).map(option=>`<a href="${esc(option.url)}" target="_blank" rel="noopener noreferrer">${option.label}</a>`).join("")}</div></details>${phone?`<a class="pickPhone" href="${esc(phone.href)}" aria-label="Call ${esc(pick.name)}">${esc(phone.label)}</a>`:""}</details>`:'<p class="hint">Find your next nearby favorite</p>'}</div></section>`;
}
