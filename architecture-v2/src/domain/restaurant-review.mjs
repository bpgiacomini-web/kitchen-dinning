const scoreInRange = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 10;

/** Build the durable, Production-compatible shape for one private restaurant visit. */
export function createRestaurantReview({ visitedAt, experience, service, value, foodItems, order = "", orderAgain, notes = "", id, createdAt }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(visitedAt || "")) || Number.isNaN(Date.parse(`${visitedAt}T00:00:00Z`)) || new Date(`${visitedAt}T00:00:00Z`).toISOString().slice(0, 10) !== visitedAt) {
    throw new Error("Choose a valid visit date.");
  }
  if (![experience, service, value].every(scoreInRange)) {
    throw new Error("Overall Experience, Service, and Value must each be rated from 1 to 10.");
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
    foodItems: dishes, ordered: String(order).trim(), order: String(order).trim(), orderAgain, notes: String(notes).trim()
  };
}
