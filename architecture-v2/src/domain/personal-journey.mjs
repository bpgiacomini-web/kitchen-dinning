import {restaurantReviewRecords} from './restaurant-review.mjs';
import {LOCAL_RESTAURANT_OVERRIDES} from './local-restaurant-overrides.mjs';
import {JOURNEY_DIRECTORY} from './journey-directory.mjs';
export const nameKey=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
export function reviewState(item,kind='restaurants'){
 const reviewed=kind==='bars'?(item.visits||[]).length>0:restaurantReviewRecords(item).length>0;
 return {reviewed,later:!reviewed,want:Boolean(item.wantToTry)};
}
export function matchesReviewFilter(item,filter,kind='restaurants'){
 const state=reviewState(item,kind);return filter==='all'||filter==='reviewed'&&state.reviewed||filter==='later'&&state.later||filter==='want'&&state.want;
}
export function journeyPlaces(data,filter='all'){
 const coordinates=item=>{
  const valid=(lat,lon)=>lat!=null&&lon!=null&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180;
  if(valid(item.lat,item.lon))return {lat:Number(item.lat),lon:Number(item.lon)};
  const key=nameKey(item.name),addressNumber=String(item.address||'').match(/\d+/)?.[0];
  const known=[...LOCAL_RESTAURANT_OVERRIDES,...JOURNEY_DIRECTORY].filter(place=>[place.name,...(place.aliases||[])].some(name=>nameKey(name)===key));
  const match=known.find(place=>!addressNumber||String(place.address||'').match(/\d+/)?.[0]===addressNumber);
  return match&&valid(match.lat,match.lon)?{lat:match.lat,lon:match.lon}:{};
 };
 return ['restaurants','bars'].filter(kind=>filter==='all'||kind===filter).flatMap(kind=>(data[kind]||[]).filter(item=>reviewState(item,kind).reviewed).map(item=>({...item,...coordinates(item),collection:kind})));
}
