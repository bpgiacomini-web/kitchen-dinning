import { averageRestaurantVisitRating, restaurantReviewRecords, reviewContentSignature, RESTAURANT_REVIEW_DIMENSIONS } from './restaurant-review.mjs';

export const visitId = review => String(review?.id || review?._id || '');
export const visitDate = review => String(review?.visitedAt || review?.reviewDate || review?.createdAt || '');
export function chronologicalVisits(restaurant) {
  return restaurantReviewRecords(restaurant).slice().sort((a,b) => visitDate(b).localeCompare(visitDate(a)) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || visitId(a).localeCompare(visitId(b)));
}

// Deterministic legacy IDs allow reads without a migration write. Save them on
// the next explicit visit mutation. Preserve identical, distinct history rows.
export function prepareRestaurantVisits(restaurant, makeId = index => `legacy-visit-${index}`) {
  const history = Array.isArray(restaurant.reviewHistory) ? restaurant.reviewHistory : [];
  const survey = restaurant.survey;
  let records = restaurantReviewRecords(restaurant);
  if (survey && !visitId(survey)) {
    const matches = history.filter(row => reviewContentSignature(row) === reviewContentSignature(survey));
    if (matches.length === 1) records = records.filter(row => row !== survey || history.includes(row));
  }
  const seen = new Set(records.map(visitId).filter(Boolean));
  const reviewHistory = records.map((row,index) => {
    const id = visitId(row);
    let assigned = id || makeId(index);
    if (!id) { while (seen.has(assigned)) assigned += '-legacy'; }
    const result = { ...row, id: assigned };
    seen.add(result.id);
    return result;
  });
  return { ...restaurant, reviewHistory, survey: chronologicalVisits({ reviewHistory })[0] || null };
}

export function categoryScore(review, key) {
  const legacyTen = review?.scores && [4,5,6,7,8,9].some(i => review.scores[i] != null && review.scores[i] !== '');
  const indexes = legacyTen
    ? { experience:0, food:1, menuSelection:2, service:3, atmosphere:4, cleanliness:5, value:6, drinksBar:7, locationAccess:8, returnIntent:9 }
    : { experience:0, food:1, service:2, value:3 };
  const raw = review?.[key] ?? review?.surveyScores?.[key] ?? (key in indexes ? review?.scores?.[indexes[key]] : null);
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 10) return null;
  if (review?.surveyScores?.[key] != null) return n;
  return Number(review.ratingScale) === 10 || legacyTen || n > 5 ? n : n * 2;
}

export function restaurantGallery(restaurant) {
  const visits = chronologicalVisits(restaurant);
  const seen = new Set();
  const legacyPhotos = value => (Array.isArray(value) ? value : value ? [value] : []).map(ref => typeof ref === 'string' ? {url:ref} : ref);
  return [...(restaurant.photoRefs || []), ...visits.flatMap(row => [...(row.photoRefs || []), ...legacyPhotos(row.photos)]), ...legacyPhotos(restaurant.photos)]
    .filter(ref => {
      const key = ref?.path || ref?.url;
      if (typeof key !== 'string' || !key || seen.has(key)) return false;
      seen.add(key); return true;
    });
}

export function summarizeRestaurantProfile(restaurant) {
  const visits = chronologicalVisits(prepareRestaurantVisits(restaurant));
  const categories = [ ['experience','Experience'], ['food','Food'], ['service','Service'], ['value','Value'], ...RESTAURANT_REVIEW_DIMENSIONS.map(({key,label}) => [key,label]) ].map(([key,label]) => {
    const scores = visits.map(row => categoryScore(row,key)).filter(Number.isFinite);
    return { key, label, count: scores.length, average: scores.length ? scores.reduce((a,b)=>a+b,0)/scores.length : null };
  });
  const answered = visits.filter(row => ['yes','no'].includes(String(row.orderAgain || '').toLowerCase()));
  const yes = answered.filter(row => String(row.orderAgain).toLowerCase() === 'yes').length;
  const gallery = restaurantGallery(restaurant);
  const primaryPhoto = gallery.find(ref => (ref.path || ref.url) === restaurant.primaryPhoto) || gallery[0] || null;
  return { visits, count: visits.length, average: averageRestaurantVisitRating(visits), lastVisit: visits.length ? visitDate(visits[0]) : '', categories, yes, answered: answered.length, orderAgainPercent: answered.length ? Math.round(100*yes/answered.length) : null, gallery, primaryPhoto };
}

export function removeRestaurantVisit(restaurant, id) {
  const prepared = prepareRestaurantVisits(restaurant);
  if (!prepared.reviewHistory.some(row => visitId(row) === id)) throw new Error('This visit is no longer available. Reload before trying again.');
  const removed = prepared.reviewHistory.find(row => visitId(row) === id);
  const reviewHistory = prepared.reviewHistory.filter(row => visitId(row) !== id);
  const remainingPaths = new Set(reviewHistory.flatMap(row => row.photoRefs || []).map(ref => ref.path));
  const removedPaths = new Set((removed.photoRefs || []).map(ref => ref.path));
  const photoRefs = (prepared.photoRefs || []).filter(ref => !removedPaths.has(ref.path) || remainingPaths.has(ref.path));
  const next = { ...prepared, reviewHistory, survey: chronologicalVisits({ reviewHistory })[0] || null, photoRefs, ratingScale: 10 };
  next.rating = summarizeRestaurantProfile(next).average;
  if (!restaurantGallery(next).some(ref => (ref.path || ref.url) === next.primaryPhoto)) next.primaryPhoto = '';
  return next;
}

const nameKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g,'');
const addressKey = value => String(value || '').toLowerCase().replace(/\b(street|avenue|road|boulevard)\b/g,w=>({street:'st',avenue:'ave',road:'rd',boulevard:'blvd'}[w])).replace(/[^a-z0-9]/g,'');
export function duplicateRestaurant(candidate, restaurants) {
  return restaurants.find(row => String(row.id) !== String(candidate.id) && (
    candidate.placeId && row.placeId && candidate.placeId === row.placeId ||
    nameKey(candidate.name) && nameKey(candidate.name) === nameKey(row.name) && addressKey(candidate.address).length >= 8 && addressKey(candidate.address) === addressKey(row.address)
  )) || null;
}

/** Explicit, user-reviewed merge within the caller's account dataset. */
export function mergeRestaurantProfiles(target, source) {
  if (!target?.id || !source?.id || target.id === source.id) throw new Error('Choose two different saved restaurants.');
  const left = prepareRestaurantVisits(target), right = prepareRestaurantVisits(source);
  const reviewHistory = [...left.reviewHistory];
  const ids = new Map(reviewHistory.map(row => [visitId(row), row]));
  for (const row of right.reviewHistory) {
    let id = visitId(row);
    // Only collapse the exact same identified visit, never equal ratings alone.
    if (ids.has(id) && reviewContentSignature(ids.get(id)) === reviewContentSignature(row) && visitId(source.reviewHistory?.find(v=>visitId(v)===id))) continue;
    while (ids.has(id)) id += '-merged';
    const merged = { ...row, id };
    ids.set(id,merged); reviewHistory.push(merged);
  }
  const sourceInfo = { ...source }; delete sourceInfo.reviewHistory; delete sourceInfo.survey;
  const next = { ...source, ...target, reviewHistory, survey:null,
    notes:[target.notes,source.notes].filter((v,i,a)=>v && a.indexOf(v)===i).join('\n\n'),
    photos:[...new Set([...(target.photos||[]),...(source.photos||[])])],
    photoRefs:[...new Map([...(target.photoRefs||[]),...(source.photoRefs||[])].map(ref=>[ref.path,ref])).values()],
    favorite:Boolean(target.favorite||source.favorite),
    mergedRestaurantSources:[...(target.mergedRestaurantSources||[]),...(source.mergedRestaurantSources||[]),sourceInfo],
    ratingScale:10
  };
  for (const key of ['address','cuisine','website','menuUrl','phone','lat','lon','primaryPhoto']) if(next[key]==null || next[key]==='') next[key]=source[key];
  next.survey=chronologicalVisits({reviewHistory})[0]||null;
  next.rating=summarizeRestaurantProfile(next).average;
  return next;
}
