import { restaurantReviewRecords } from "./restaurant-review.mjs";

function overallScore(review) {
  const legacyTenQuestion = review?.scores && [4, 5, 6, 7, 8, 9].some(index => review.scores[index] != null && review.scores[index] !== "");
  const score = Number(review?.overall ?? review?.scores?.overall ?? review?.experience ?? review?.scores?.[0] ?? review?.rating);
  if (!Number.isFinite(score) || score < 1 || score > 10) return null;
  return Number(review?.ratingScale) === 10 || legacyTenQuestion || score > 5 ? score : score * 2;
}

function foodScores(review) {
  const items = Array.isArray(review?.foodItems) ? review.foodItems : [];
  return items.map(item => {
    const score = Number(item?.rating);
    return { name: String(item?.name || "").trim(), score: Number(review?.ratingScale) === 5 && score <= 5 ? score * 2 : score };
  })
    .filter(item => item.name && Number.isFinite(item.score) && item.score >= 1 && item.score <= 10);
}

export function summarizeRestaurantInsights(restaurants = []) {
  const entries = (Array.isArray(restaurants) ? restaurants : []).map(restaurant => {
    const reviews = restaurantReviewRecords(restaurant);
    const scores = reviews.map(overallScore).filter(Number.isFinite);
    return {
      restaurant,
      reviews,
      average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null
    };
  });
  const visited = entries.filter(entry => entry.reviews.length > 0);
  const allScores = visited.flatMap(entry => entry.reviews.map(overallScore).filter(Number.isFinite));
  const ranked = visited.filter(entry => entry.average != null)
    .sort((a, b) => b.average - a.average || a.restaurant.name.localeCompare(b.restaurant.name));
  const mostVisited = visited.slice().sort((a, b) => b.reviews.length - a.reviews.length || a.restaurant.name.localeCompare(b.restaurant.name))[0] || null;

  const cuisineCounts = new Map();
  const dishScores = new Map();
  for (const { restaurant, reviews } of visited) {
    const cuisine = String(restaurant.cuisine || "").trim();
    if (cuisine) cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + reviews.length);
    for (const review of reviews) for (const item of foodScores(review)) {
      const key = item.name.toLocaleLowerCase();
      const existing = dishScores.get(key) || { name: item.name, sum: 0, count: 0 };
      existing.sum += item.score;
      existing.count += 1;
      dishScores.set(key, existing);
    }
  }
  const topCuisine = [...cuisineCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0] || null;
  const topDish = [...dishScores.values()].sort((a, b) => b.sum / b.count - a.sum / a.count || b.count - a.count || a.name.localeCompare(b.name))[0] || null;

  return {
    placeCount: visited.length,
    visitCount: visited.reduce((sum, entry) => sum + entry.reviews.length, 0),
    averageRating: allScores.length ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : null,
    topRestaurant: ranked[0] || null,
    mostVisited,
    topCuisine: topCuisine ? { name: topCuisine[0], visits: topCuisine[1] } : null,
    topDish: topDish ? { name: topDish.name, rating: topDish.sum / topDish.count, ratings: topDish.count } : null
  };
}
