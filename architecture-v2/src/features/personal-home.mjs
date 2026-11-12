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
export function pickCandidates(data,filter='all') {
 return (data.restaurants||[]).filter(item=>filter==='favorites'?item.favorite:filter==='want'?item.wantToTry:true);
}
export function renderTonightPick(data,filter='all',chosenId=null) {
 const candidates=pickCandidates(data,filter),pick=candidates.find(item=>item.id===chosenId)||candidates[0];
 return `<section class="content-panel tonightPick"><div class="sectionTitle"><h3>Tonight’s Pick</h3><button class="btn" type="button" data-action="shuffle-pick">Shuffle ↻</button></div><label class="sr-only" for="pick-filter">Pick from</label><select id="pick-filter"><option value="all"${filter==='all'?' selected':''}>Saved restaurants</option><option value="favorites"${filter==='favorites'?' selected':''}>Favorites</option><option value="want"${filter==='want'?' selected':''}>Want to Try</option></select>${pick?`<button class="pickResult" type="button" data-action="open-journal-item" data-collection="restaurants" data-item-id="${esc(pick.id)}"><strong>${esc(pick.name)}</strong><small>${esc([pick.cuisine,pick.address].filter(Boolean).join(' · '))}</small></button>`:'<p class="hint">No places in this list yet.</p>'}</section>`;
}
