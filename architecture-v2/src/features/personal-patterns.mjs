import {summarizeMetroEatsInsights} from '../domain/restaurant-insights.mjs';
import {restaurantReviewRecords} from '../domain/restaurant-review.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function personalPatterns(data){
 const stats=summarizeMetroEatsInsights(data),r=stats.restaurants;
 const returnPicks=(data.restaurants||[]).filter(item=>restaurantReviewRecords(item).length && item.favorite).slice(0,3);
 const recipes=(data.recipes||[]).filter(item=>item.favorite).slice(0,3);
 const drinks=(data.drinks||[]).filter(item=>Number.isFinite(item.overallRating)).slice().sort((a,b)=>b.overallRating-a.overallRating).slice(0,3);
 return {stats,r,returnPicks,recipes,drinks};
}
export function renderPersonalPatterns(data){
 const {stats,r,returnPicks,recipes,drinks}=personalPatterns(data);
 const link=(item,collection)=>`<button type="button" class="patternEntry" data-action="open-journal-item" data-collection="${collection}" data-item-id="${esc(item.id)}">${esc(item.title||item.name)} <span aria-hidden="true">↗</span></button>`;
 const restaurants=[r.topDish?`<p>Standout dish: <strong>${esc(r.topDish.name)}</strong> · ${r.topDish.rating.toFixed(1)}/10</p>`:'',r.topCuisine?`<p>Go-to cuisine: <strong>${esc(r.topCuisine.name)}</strong> · ${r.topCuisine.visits} visits</p>`:'',r.mostVisited?.reviews.length>1?`<p>Most visited: <strong>${esc(r.mostVisited.restaurant.name)}</strong> · ${r.mostVisited.reviews.length} visits</p>`:''].join('');
 return `<details class="personalPatterns content-panel"><summary>Explore Insights</summary><section><h3>Restaurants</h3>${restaurants||'<p class="hint">Your next reviews will reveal your patterns.</p>'}${returnPicks.length?'<h4>Worth revisiting · Your favorites</h4>'+returnPicks.map(item=>link(item,'restaurants')).join(''):''}</section><section><h3>Recipes</h3>${recipes.length?'<p class="hint">Your keepers</p>'+recipes.map(item=>link(item,'recipes')).join(''):'<p class="hint">Star a recipe to build your keepers.</p>'}</section><section><h3>Drinks</h3>${drinks.length?drinks.map(item=>`<p>${link(item,'drinks')}<small>${item.overallRating.toFixed(1)}/10${item.barId?' · '+esc(data.bars?.find(bar=>bar.id===item.barId)?.name||'Saved bar'):''}</small></p>`).join(''):'<p class="hint">Rate drinks to find your standouts.</p>'}</section><section><h3>The Barstool</h3><p>${(data.bars||[]).filter(item=>item.visits?.length).length} bars visited · ${(data.bars||[]).filter(item=>item.favorite).length} ${(data.bars||[]).filter(item=>item.favorite).length===1?'favorite':'favorites'}</p><p class="hint">Atmosphere, drinks, bartenders, and restrooms stay separate.</p></section><section><h3>Frozen Pizzas</h3>${stats.pizzas.top?`<p>Top pizza: <strong>${esc(stats.pizzas.top.name)}</strong> · ${stats.pizzas.top.rating.toFixed(1)}/10</p>`:'<p class="hint">Rate a pizza to find your favorite.</p>'}</section><section><h3>My Cocktails</h3>${(data.cocktailRecipes||[]).filter(item=>item.favorite).slice(0,3).map(item=>link(item,'cocktailRecipes')).join('')||'<p class="hint">Star your home cocktails to keep them handy.</p>'}</section></details>`;
}
