const scoreInRange = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 10;

export const RESTAURANT_REVIEW_DIMENSIONS = [
  { key: "menuSelection", label: "Menu & Selection", description: "Variety, creativity, and choices." },
  { key: "atmosphere", label: "Atmosphere", description: "Ambiance, comfort, noise level, and vibe." },
  { key: "cleanliness", label: "Cleanliness", description: "Dining area, tables, restrooms, and overall cleanliness." },
  { key: "drinksBar", label: "Drinks & Bar", description: "Drink quality, selection, presentation, and service." },
  { key: "locationAccess", label: "Location & Accessibility", description: "Parking, access, seating, and convenience." },
  { key: "returnIntent", label: "Likelihood to Return", description: "How likely you are to visit this restaurant again." }
];

export function reviewContentSignature(review) {
  return JSON.stringify(Object.keys(review || {}).filter(key => !["id", "_id", "restaurantId"].includes(key)).sort().map(key => [key, review[key]]));
}

/**
 * Return each visit once. Distinct visit IDs always remain distinct, even when
 * the ratings and notes happen to be identical. `survey` is a compatibility
 * mirror of the latest visit; an id-less survey mirror is collapsed when its
 * content appears in visit history, while repeated history rows stay intact.
 */
export function restaurantReviewRecords(restaurant) {
  const history = Array.isArray(restaurant?.reviewHistory) ? restaurant.reviewHistory : [];
  const records = [];
  const seenIds = new Set();
  for (const review of history) {
    if (!review || typeof review !== "object" || Array.isArray(review)) continue;
    const id = String(review.id || review._id || "").trim();
    if (id && seenIds.has(id)) continue;
    if (id) seenIds.add(id);
    records.push(review);
  }
  const survey = restaurant?.survey;
  if (!survey || typeof survey !== "object" || Array.isArray(survey)) return records;
  const surveyId = String(survey.id || survey._id || "").trim();
  if (surveyId) return seenIds.has(surveyId) ? records : [...records, survey];
  if (records.includes(survey)) return records;
  const signature = reviewContentSignature(survey);
  const idlessMatches = records.filter(review => !String(review.id || review._id || "").trim() && reviewContentSignature(review) === signature);
  return idlessMatches.length > 0 ? records : [...records, survey];
}

export function averageRestaurantVisitRating(reviews = []) {
  const scores = (Array.isArray(reviews) ? reviews : []).map(review => {
    const score = Number(review?.overall ?? review?.scores?.overall ?? review?.experience ?? review?.scores?.[0] ?? review?.rating);
    if (!Number.isFinite(score) || score < 1 || score > 10) return null;
    const legacyTenQuestion = review?.scores && [4, 5, 6, 7, 8, 9].some(index => review.scores[index] != null && review.scores[index] !== "");
    return Number(review?.ratingScale) === 10 || legacyTenQuestion || score > 5 ? score : score * 2;
  }).filter(Number.isFinite);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}

function surveyMirrorsEditedReview(restaurant, editingReview) {
  const survey = restaurant?.survey;
  if (!survey) return false;
  if (survey === editingReview) return true;
  const surveyId = String(survey.id || survey._id || "").trim();
  const editingId = String(editingReview?.id || editingReview?._id || "").trim();
  if (surveyId || editingId) return Boolean(surveyId && editingId && surveyId === editingId);
  const matchingHistory = (Array.isArray(restaurant?.reviewHistory) ? restaurant.reviewHistory : [])
    .filter(item => !String(item?.id || item?._id || "").trim() && reviewContentSignature(item) === reviewContentSignature(editingReview));
  return matchingHistory.length === 1 && reviewContentSignature(survey) === reviewContentSignature(editingReview);
}

export function upsertRestaurantReview(restaurant, review, editingReview = null) {
  const reviewHistory = [...(Array.isArray(restaurant?.reviewHistory) ? restaurant.reviewHistory : [])];
  let survey = restaurant?.survey;
  if (editingReview) {
    const surveyMirrorsEdited = surveyMirrorsEditedReview(restaurant, editingReview);
    const historyIndex = reviewHistory.findIndex(item => item === editingReview || (editingReview.id && item?.id && String(item.id) === String(editingReview.id)));
    if (historyIndex >= 0) reviewHistory[historyIndex] = review;
    else reviewHistory.push(review);
    if (surveyMirrorsEdited) survey = review;
  } else {
    reviewHistory.push(review);
    survey = review;
  }
  return { ...restaurant, reviewHistory, survey };
}

/** Build the durable, Production-compatible shape for one private restaurant visit. */
export function createRestaurantReview({ visitedAt, experience, service, value, foodItems, surveyScores = {}, order = "", orderAgain, notes = "", id, createdAt }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(visitedAt || "")) || Number.isNaN(Date.parse(`${visitedAt}T00:00:00Z`)) || new Date(`${visitedAt}T00:00:00Z`).toISOString().slice(0, 10) !== visitedAt) {
    throw new Error("Choose a valid visit date.");
  }
  if (![experience, service, value].every(scoreInRange)) {
    throw new Error("Overall Experience, Service, and Value must each be rated from 1 to 10.");
  }
  if (!surveyScores || typeof surveyScores !== "object" || Array.isArray(surveyScores)) {
    throw new Error("Additional visit ratings must be valid 1 to 10 scores.");
  }
  const optionalScores = Object.fromEntries(RESTAURANT_REVIEW_DIMENSIONS
    .map(({ key }) => [key, surveyScores[key] == null || surveyScores[key] === "" ? null : Number(surveyScores[key])])
    .filter(([, score]) => score != null));
  if (RESTAURANT_REVIEW_DIMENSIONS.some(({ key }) => optionalScores[key] != null && !scoreInRange(optionalScores[key]))) {
    throw new Error("Additional visit ratings must be whole numbers from 1 to 10.");
  }
  if (!Array.isArray(foodItems) || !foodItems.length) throw new Error("Add and rate at least one dish or drink.");
  const dishes = foodItems.map(item => ({
    category: String(item?.category || "Entrées").trim(),
    name: String(item?.name || "").trim(),
    rating: Number(item?.rating),
    notes: String(item?.notes || "").trim()
  }));
  if (dishes.some(item => !item.category || !item.name || !scoreInRange(item.rating))) {
    throw new Error("Give every dish a name and a rating from 1 to 10.");
  }
  if (!["Yes", "No"].includes(orderAgain)) throw new Error("Choose Yes or No for whether you would order it again.");
  const food = Math.round(dishes.reduce((sum, item) => sum + item.rating, 0) / dishes.length * 10) / 10;
  const overall = Math.round((Number(experience) + food + Number(service) + Number(value)) / 4 * 10) / 10;
  return {
    id, visitedAt, createdAt, ratingScale: 10,
    scores: { 0: Number(experience), 1: food, 2: Number(service), 3: Number(value) },
    experience: Number(experience), food, service: Number(service), value: Number(value), overall,
    foodItems: dishes, surveyScores: optionalScores,
    ordered: String(order).trim(), order: String(order).trim(), orderAgain, notes: String(notes).trim()
  };
}
