import {averageRestaurantVisitRating,restaurantReviewRecords} from "../domain/restaurant-review.mjs";
import {journeyPlaces} from '../domain/personal-journey.mjs';
import {mapMenuMarkup} from './map-menu.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let leafletReady;
function leaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(!leafletReady)leafletReady=new Promise((resolve,reject)=>{if(!document.querySelector('[data-journey-css]')){const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('../../vendor/leaflet.css',import.meta.url).href;link.dataset.journeyCss='';document.head.append(link);}const script=document.createElement('script');script.src=new URL('../../vendor/leaflet.js',import.meta.url).href;script.onload=()=>resolve(window.L);script.onerror=()=>{leafletReady=null;script.remove();reject(Error('Map unavailable'));};document.head.append(script);});return leafletReady;
}
export function mountJourney(root,data,{embedded=false}={}){
 let filter='all',map=null,version=0;
 const draw=async()=>{
  version++;const current=version;map?.remove();map=null;
  const places=journeyPlaces(data,filter),pinned=places.filter(place=>Number.isFinite(place.lat)&&Number.isFinite(place.lon));
  root.innerHTML=`<section class="${embedded?'embeddedJourney':'content-panel'} journeyPage"><div class="sectionTitle"><div><span class="dashboardEyebrow">YOUR CITY. YOUR STOPS.</span><h2>${embedded?'Your places':'Your Journey'}</h2></div>${embedded?'':'<button class="btn" data-view="home">Back</button>'}</div><div class="journeyFilters" aria-label="Journey categories">${[['all','All'],['restaurants','Restaurants'],['bars','Bars']].map(([key,label])=>`<button class="btn" type="button" data-journey-filter="${key}" aria-pressed="${filter===key}">${label}</button>`).join('')}</div><p class="hint">${pinned.length} of ${places.length} reviewed places pinned</p>${pinned.length?'<div class="journeyMap" aria-label="Map of reviewed places"></div>':''}<p class="hint" data-map-status role="status">${pinned.length?'Loading map…':'Saved places need a matching address to appear on the map.'}</p><details class="journeyPlaceDisclosure"><summary>Reviewed places (${places.length})</summary><div class="journeyPlaces">${places.map(place=>`<article class="journeyPlace"><button class="recentEntry" data-action="open-journal-item" data-collection="${place.collection}" data-item-id="${esc(place.id)}"><small>${place.collection==='bars'?'Bar':'Restaurant'}${Number.isFinite(place.lat)?'':' · Not pinned'}</small><strong>${esc(place.name)}</strong></button>${mapMenuMarkup(place)}</article>`).join('')||'<p class="hint">Your first reviewed place starts the journey.</p>'}</div></details></section>`;
  root.querySelectorAll('[data-journey-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.journeyFilter;void draw();});
  if(!pinned.length)return;
  try{const L=await leaflet();if(current!==version||!root.querySelector('.journeyMap'))return;
   map=L.map(root.querySelector('.journeyMap'),{scrollWheelZoom:false});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
   for(const place of pinned){const popup=document.createElement('div');popup.className='journeyPopup';const title=document.createElement('strong');title.textContent=place.name;popup.append(title);const rating=place.collection==='restaurants'?averageRestaurantVisitRating(restaurantReviewRecords(place)):null;const detail=document.createElement('small');detail.textContent=rating!=null?'Your rating · '+rating.toFixed(1)+'/10':(place.visits?.length||0)+' bar visits';popup.append(detail);const button=document.createElement('button');button.type='button';button.className='btn';button.textContent='View Review';Object.assign(button.dataset,{action:'open-journal-item',collection:place.collection,itemId:place.id});popup.append(button);L.marker([place.lat,place.lon],{title:place.name,alt:place.name,icon:L.divIcon({className:'journeyPin '+place.collection,html:'<span></span>',iconSize:[24,24],iconAnchor:[12,12]})}).bindPopup(popup,{maxWidth:270,minWidth:190}).addTo(map);}
   map.fitBounds(pinned.map(place=>[place.lat,place.lon]),{padding:[28,28],maxZoom:14});root.querySelector('[data-map-status]').textContent='Tap a pin to open its review.';
  }catch{if(current===version&&root.querySelector('[data-map-status]'))root.querySelector('[data-map-status]').textContent='Map unavailable. Your reviewed places are listed below.';}
 };
 void draw();return()=>{version++;map?.remove();};
}
