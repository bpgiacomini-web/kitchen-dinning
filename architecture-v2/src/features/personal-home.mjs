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
 return `<section class="content-panel tonightPick"><h3>Tonight’s Pick</h3><button class="pickCoin" type="button" data-action="shuffle-pick" aria-label="${pick?'Reshuffle restaurant':'Flip for a restaurant'}"><span class="coinFace" aria-hidden="true">ME</span></button><span class="coinCaption">${pick?'Reshuffle':'Flip a pick'}</span><div class="pickReveal" aria-live="polite">${pick?`<button class="pickResult" type="button" data-action="open-picked-restaurant" data-item-id="${esc(pick.id)}"><strong>${esc(pick.name)}</strong><small>${esc(pick._pickSource)}</small></button>`:'<p class="hint">Reviewed · Want to Try · Around Me</p>'}</div></section>`;
}
