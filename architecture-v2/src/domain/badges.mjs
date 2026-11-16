import {restaurantReviewRecords} from './restaurant-review.mjs';
export const BADGES=[
{id:'welcome',name:'Welcome to the Table',kind:'welcome',threshold:0},
...[[1,'Recipe Keeper'],[10,'Home Cook'],[25,'Recipe Collector'],[50,'Kitchen Curator']].map(([threshold,name])=>({id:'recipes-'+threshold,name,kind:'recipes',threshold})),
...[[1,'First Bite'],[5,'Local Explorer'],[10,'Table Regular'],[25,'Super Diner'],[50,'Dining Legend']].map(([threshold,name])=>({id:'restaurants-'+threshold,name,kind:'restaurants',threshold}))];
export function badgeCounts(data){
const recipes=new Set((data.recipes||[]).map((row,i)=>String(row.id||'row-'+i))).size;
const places=new Set((data.restaurants||[]).filter(row=>restaurantReviewRecords(row).length).map(row=>String(row.placeId||[row.name,row.address].join('|').toLowerCase().replace(/[^a-z0-9|]/g,''))));
return {welcome:1,recipes,restaurants:places.size};}
export function earnedBadges(data){const counts=badgeCounts(data);return BADGES.filter(badge=>counts[badge.kind]>=badge.threshold||data.achievements?.[badge.id]);}
export function awardBadges(data,now=new Date().toISOString()){const achievements={...(data.achievements||{})};for(const badge of earnedBadges(data))if(!achievements[badge.id])achievements[badge.id]=now;return {...data,achievements};}
export function nextBadges(data){const earned=new Set(earnedBadges(data).map(b=>b.id));return ['recipes','restaurants'].map(kind=>BADGES.find(b=>b.kind===kind&&!earned.has(b.id))).filter(Boolean);}
