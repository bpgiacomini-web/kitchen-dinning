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
 return `<div class="journalHighlights"><h3>Recent Activity</h3>${recent.map(item=>`<button class="recentEntry" type="button" data-action="open-journal-item" data-collection="${item.collection}" data-item-id="${esc(item.id)}"><small>${item.label}</small><strong>${esc(item.name)}</strong></button>`).join('')||'<p class="hint">Your next memory starts here.</p>'}</div>`;
}
export function pickCandidates(data,filter='all',nearby=[]) {
 const owned=(data.restaurants||[]).filter(item=>filter==='favorites'?item.favorite:filter==='want'?item.wantToTry:filter==='nearby'?false:item.wantToTry || item.reviewHistory?.length || item.reviews?.length || item.rating!=null).map(item=>({...item,_pickSource:item.wantToTry?'Want to Try':'Reviewed'}));
 const local=['all','nearby'].includes(filter)?nearby.map(item=>({...item,id:'nearby:'+item.name+'|'+item.address,_pickSource:'Around Me'})):[];
 const seen=new Set(),key=item=>[item.name,item.address].join(' ').toLowerCase().replace(/[^a-z0-9]/g,'');
 return [...owned,...local].filter(item=>{const value=key(item);if(seen.has(value))return false;seen.add(value);return true;});
}
export function renderTonightPick(data,filter='all',chosenId=null,nearby=[]) {
 const candidates=pickCandidates(data,filter,nearby),pick=candidates.find(item=>item.id===chosenId);
 return `<section class="content-panel tonightPick"><h3>Tonight’s Pick</h3><button class="pickCoin" type="button" data-action="shuffle-pick" aria-label="${pick?'Reshuffle restaurant':'Flip for a restaurant'}"><svg class="coinToken" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><path id="metro-coin-lettering" d="M 15,50 A 35,35 0 1,1 85,50 A 35,35 0 1,1 15,50"/></defs><circle class="coinReeding" cx="50" cy="50" r="46"/><circle class="coinInnerRim" cx="50" cy="50" r="28"/><text class="coinLettering"><textPath href="#metro-coin-lettering" startOffset="25%" text-anchor="middle">METRO EATS</textPath></text><text class="coinMint" x="50" y="86" text-anchor="middle">★  FLIP A PICK  ★</text><path class="coinLily" d="M50 22C43 31 40 37 44 46L48 55H43C43 42 32 37 27 44C22 52 29 59 37 55C34 51 36 48 39 51C41 54 40 58 39 61H47V66H42V71H47L50 78L53 71H58V66H53V61H61C60 58 59 54 61 51C64 48 66 51 63 55C71 59 78 52 73 44C68 37 57 42 57 55H52L56 46C60 37 57 31 50 22Z"/></svg></button><span class="coinCaption">${pick?'Reshuffle':'Flip a pick'}</span><div class="pickReveal" aria-live="polite">${pick?`<button class="pickResult" type="button" data-action="open-picked-restaurant" data-item-id="${esc(pick.id)}"><strong>${esc(pick.name)}</strong><small>${esc(pick._pickSource)}</small></button>`:'<p class="hint">Reviewed · Want to Try · Around Me</p>'}</div></section>`;
}
