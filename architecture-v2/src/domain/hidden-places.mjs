const placeNameKey=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const placeAddressKey=value=>String(value||'').toLowerCase().replace(/\b(street|avenue|road|boulevard|north|south|east|west|illinois|missouri)\b/g,word=>({street:'st',avenue:'ave',road:'rd',boulevard:'blvd',north:'n',south:'s',east:'e',west:'w',illinois:'il',missouri:'mo'}[word])).replace(/[^a-z0-9]/g,'');
const hiddenCoordinates=place=>typeof place?.lat==='number'&&Number.isFinite(place.lat)&&Math.abs(place.lat)<=90&&typeof place?.lon==='number'&&Number.isFinite(place.lon)&&Math.abs(place.lon)<=180;
export function hiddenPlaceDescriptor(place){
 const result={name:String(place?.name||'').trim().slice(0,180),address:String(place?.address||'').trim().slice(0,500)};
 if(place?.id)result.referenceId=String(place.id).slice(0,200);
 if(place?.lat!=null&&place?.lat!==''&&place?.lon!=null&&place?.lon!==''){const point={lat:Number(place.lat),lon:Number(place.lon)};if(hiddenCoordinates(point))Object.assign(result,point);}
 return result;
}
export function hiddenPlaceMatches(place,hidden){
 if(place?.id&&hidden.referenceId===String(place.id))return true;
 if(!placeNameKey(place?.name)||placeNameKey(place.name)!==placeNameKey(hidden.name))return false;
 const descriptor=hiddenPlaceDescriptor(place);
 if(hiddenCoordinates(descriptor)&&hiddenCoordinates(hidden))return Math.hypot((descriptor.lat-hidden.lat)*111195,(descriptor.lon-hidden.lon)*111195*Math.cos(descriptor.lat*Math.PI/180))<=100;
 const a=placeAddressKey(descriptor.address),b=placeAddressKey(hidden.address);
 return a.length>=8&&b.length>=8&&(a.startsWith(b)||b.startsWith(a));
}
export function isHiddenPlace(place,hiddenPlaces=[]){return hiddenPlaces.some(hidden=>hiddenPlaceMatches(place,hidden));}
export function filterHiddenPlaces(places,hiddenPlaces=[]){return places.filter(place=>!isHiddenPlace(place,hiddenPlaces));}
export function validHiddenPlaces(rows){
 if(rows==null)return true;
 if(!Array.isArray(rows)||rows.length>1000)return false;
 const ids=new Set();
 return rows.every(row=>{
  if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id.trim()||row.id.length>200||ids.has(row.id))return false;ids.add(row.id);
  if(typeof row.name!=='string'||!row.name.trim()||row.name.length>180||typeof row.address!=='string'||row.address.length>500)return false;
  if((row.lat!=null||row.lon!=null)&&!hiddenCoordinates(row))return false;
  if(!hiddenCoordinates(row)&&(!/\d/.test(row.address)||placeAddressKey(row.address).length<8))return false;
  if(row.referenceId!=null&&(typeof row.referenceId!=='string'||row.referenceId.length>200))return false;
  return row.reason==='closed'&&typeof row.hiddenAt==='string'&&row.hiddenAt.length<=40&&Number.isFinite(Date.parse(row.hiddenAt));
 });
}
