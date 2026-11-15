import {averageRestaurantVisitRating,restaurantReviewRecords} from './restaurant-review.mjs';
const nameKey=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const addressKey=value=>String(value||'').toLowerCase().replace(/\b(street|avenue|road|boulevard|illinois|missouri)\b/g,word=>({street:'st',avenue:'ave',road:'rd',boulevard:'blvd',illinois:'il',missouri:'mo'}[word])).replace(/[^a-z0-9]/g,'');
const coordinates=place=>place.lat!=null&&place.lat!==''&&place.lon!=null&&place.lon!==''&&Number.isFinite(Number(place.lat))&&Number.isFinite(Number(place.lon));
export function matchingSavedRestaurants(place,restaurants=[]){
 return restaurants.filter(saved=>{
  if(nameKey(saved.name)!==nameKey(place.name))return false;
  if(coordinates(saved)&&coordinates(place)){
   const lat=Number(place.lat)*Math.PI/180;
   return Math.hypot((Number(saved.lat)-Number(place.lat))*111195,(Number(saved.lon)-Number(place.lon))*111195*Math.cos(lat))<=200;
  }
  const a=addressKey(saved.address),b=addressKey(place.address);
  return a.length>=8&&b.length>=8&&(a.startsWith(b)||b.startsWith(a));
 }).sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
}
export function nearbyPersonalRating(place,restaurants=[]){
 for(const saved of matchingSavedRestaurants(place,restaurants)){
  const average=averageRestaurantVisitRating(restaurantReviewRecords(saved));if(average!=null)return average;
  if(saved.rating!=null&&saved.rating!==''&&Number.isFinite(Number(saved.rating))){const rating=Number(saved.rating);if(rating>=1&&rating<=10)return Number(saved.ratingScale)===10||rating>5?rating:rating*2;}
 }
 return null;
}
