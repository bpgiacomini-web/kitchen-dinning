import {summarizeMetroEatsInsights} from '../domain/restaurant-insights.mjs';
import {restaurantReviewRecords,averageRestaurantVisitRating} from '../domain/restaurant-review.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const DASHBOARD_CATEGORIES=[['restaurants','Restaurants','dining'],['recipes','Recipes','recipes'],['pizzas','Pizza','pizzas'],['bars','Bars','cocktails'],['drinks','Drinks','cocktails'],['cocktailRecipes','Cocktails','cocktails']];
const number=value=>typeof value==='number'&&Number.isFinite(value)?value:null;
export function dashboardCategory(data,key){
 const stats=summarizeMetroEatsInsights(data),items=data[key]||[],s=stats[key];
 let rows=[],chartTitle='',unit='saved',count=items.length,second=s.averageRating,secondLabel='Average /10';
 const groups=new Map();
 if(key==='restaurants'){
  count=s.placeCount;unit='visited';chartTitle='Your cuisine trail';
  for(const item of items){const visits=restaurantReviewRecords(item).length;if(visits){const cuisine=item.cuisine||'Other';groups.set(cuisine,(groups.get(cuisine)||0)+visits);}}
  rows=[...groups].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([label,value])=>({label,value,suffix:value===1?'visit':'visits'}));
  const ranked=items.map(item=>({item,value:averageRestaurantVisitRating(item)})).filter(row=>number(row.value)!=null).sort((a,b)=>b.value-a.value);
  return {count,unit,second,secondLabel,favorites:s.favoriteCount,rows,chartTitle,chartMax:Math.max(1,...rows.map(row=>row.value)),standout:ranked[0],standoutLabel:'YOUR TOP TABLE',detail:s.topDish?`Standout dish · ${s.topDish.name} · ${s.topDish.rating.toFixed(1)}/10`:s.visitCount+' visits logged',collection:key};
 }
 if(key==='bars'){
  count=s.visited;unit='visited';second=s.visitCount;secondLabel='Visits';chartTitle='How your bars stack up';
  for(const [field,label] of [['atmosphere','Atmosphere'],['drinkQuality','Drinks'],['bartenders','Bartenders'],['restrooms','Restrooms']]){const values=items.flatMap(item=>item.visits||[]).map(visit=>number(visit[field])).filter(value=>value!=null);if(values.length)rows.push({label,value:values.reduce((a,b)=>a+b,0)/values.length,suffix:'/10'});}
 }else if(key==='recipes'){
  chartTitle='Inside your recipe box';for(const item of items){const category=item.category||'Other';groups.set(category,(groups.get(category)||0)+1);}rows=[...groups].sort((a,b)=>b[1]-a[1]).slice(0,4).map(([label,value])=>({label,value,suffix:value===1?'recipe':'recipes'}));
 }else{
  chartTitle=key==='pizzas'?'Your pizza podium':key==='drinks'?'Drinks worth another round':'Your cocktail shortlist';
  rows=items.map(item=>({label:item.title||[key==='pizzas'?item.brand:'',item.name].filter(Boolean).join(' · '),value:number(key==='pizzas'?item.scores?.overall:item.overallRating),id:item.id,suffix:'/10'})).filter(row=>row.value!=null).sort((a,b)=>b.value-a.value).slice(0,4);
 }
 const ranked=key==='bars'?items.filter(item=>item.visits?.length).sort((a,b)=>Number(b.favorite)-Number(a.favorite)||(b.visits?.length||0)-(a.visits?.length||0)).map(item=>({item,value:null})):items.map(item=>({item,value:number(key==='pizzas'?item.scores?.overall:item.overallRating)})).filter(row=>row.value!=null).sort((a,b)=>b.value-a.value);
 const standout=ranked[0];return {count,unit,second,secondLabel,favorites:s.favoriteCount,rows,chartTitle,chartMax:['bars','pizzas','drinks','cocktailRecipes'].includes(key)?10:Math.max(1,...rows.map(row=>row.value)),standout,standoutLabel:key==='bars'?'YOUR BARSTOOL':key==='recipes'?'A KEEPER':key==='pizzas'?'TOP SLICE':key==='drinks'?'ANOTHER ROUND':'HOUSE FAVORITE',detail:key==='bars'?'Four ratings. Each stands on its own.':items.filter(item=>number(key==='pizzas'?item.scores?.overall:item.overallRating)!=null).length+' rated · '+items.length+' saved',collection:key};
}
export function renderJournalInsights(data){
 return `<section class="insightsDashboard" aria-labelledby="dashboard-title"><header class="dashboardHeading"><span class="dashboardEyebrow">YOUR TASTE, TAKING SHAPE</span><h2 id="dashboard-title">My Insights</h2></header><div class="dashboardTabs" role="tablist" aria-label="Insight categories">${DASHBOARD_CATEGORIES.map(([key,label],index)=>`<button type="button" role="tab" id="tab-${key}" aria-controls="panel-${key}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-dashboard-tab="${key}">${label}</button>`).join('')}</div>${DASHBOARD_CATEGORIES.map(([key,label,view],index)=>{
 const model=dashboardCategory(data,key),top=model.standout;
 const name=top?.item.title||[key==='pizzas'?top?.item.brand:'',top?.item.name].filter(Boolean).join(' · ');
 return `<section class="dashboardPanel" id="panel-${key}" role="tabpanel" aria-labelledby="tab-${key}" data-dashboard-panel="${key}" ${index?'hidden':''}><div class="dashboardMetrics"><div><strong>${model.count}</strong><span>${label} ${model.unit}</span></div><div><strong>${model.second==null?'—':key==='bars'?model.second:model.second.toFixed(1)}</strong><span>${model.second==null?'Unrated':model.secondLabel}</span></div><div><strong>${model.favorites}</strong><span>${model.favorites===1?'Favorite':'Favorites'}</span></div></div><div class="dashboardStoryGrid"><article class="dashboardStandout ${key==='bars'||key==='drinks'||key==='cocktailRecipes'?'pinkStory':''}"><span class="dashboardEyebrow">${model.standoutLabel}</span>${top?`<button type="button" class="dashboardStarName" data-action="open-journal-item" data-collection="${key}" data-item-id="${esc(top.item.id)}">${esc(name)} <span aria-hidden="true">↗</span></button>${top.value==null?'':`<span class="standoutScore">${top.value.toFixed(1)}<small>/10</small></span>`}`:'<h3>Your next favorite<br>starts here.</h3>'}<p>${esc(model.detail)}</p><button type="button" class="dashboardJournalLink" data-view="${view}" ${view==='cocktails'?`data-cocktail-category="${key}"`:''}>Open ${label.toLowerCase()} <span aria-hidden="true">→</span></button></article><article class="dashboardChart"><h3>${model.chartTitle}</h3>${model.rows.length?`<div class="tasteBars" aria-label="${esc(model.chartTitle)}">${model.rows.map(row=>`<div class="tasteBar"><div class="tasteBarLabel">${row.id?`<button type="button" data-action="open-journal-item" data-collection="${key}" data-item-id="${esc(row.id)}">${esc(row.label)}</button>`:`<span>${esc(row.label)}</span>`}<strong>${row.suffix==='/10'?row.value.toFixed(1):row.value}<small>${row.suffix==='/10'?'/10':' '+row.suffix}</small></strong></div><div class="tasteBarTrack" aria-hidden="true"><span style="width:${Math.min(100,row.value/model.chartMax*100)}%"></span></div></div>`).join('')}</div>`:'<p class="dashboardEmpty">A few ratings will bring this view to life.</p>'}</article></div></section>`;
 }).join('')}<div class="dashboardMap"></div></section>`;
}
export function mountDashboard(container){
 const tabs=[...container.querySelectorAll('[data-dashboard-tab]')];
 const choose=button=>{tabs.forEach(tab=>{const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;container.querySelector('#panel-'+tab.dataset.dashboardTab).hidden=!active;});};
 tabs.forEach((button,index)=>{button.onclick=()=>choose(button);button.onkeydown=event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!=null){event.preventDefault();choose(tabs[next]);tabs[next].focus();}};});
}
