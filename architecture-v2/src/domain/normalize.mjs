/** Defensive adapters for the legacy Metro Eats data shape. Inputs are never mutated. */
export function asText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") return asText(value.text ?? value.name ?? value.value ?? "");
  return "";
}

export function normalizeRecipe(record, index = 0) {
  const item = record && typeof record === "object" ? record : {};
  const ingredients = item.ingredients ?? item.recipeIngredient ?? item.ingredientList ?? [];
  const directions = item.directions ?? item.steps ?? item.recipeInstructions ?? item.instructions ?? [];
  return {
    id: asText(item.id ?? item._id) || `legacy-recipe-${index}`,
    title: asText(item.title ?? item.name ?? item.recipeName) || "Untitled recipe",
    category: asText(item.category ?? item.subcategory),
    ingredients: (Array.isArray(ingredients) ? ingredients : [ingredients]).map(asText).filter(Boolean),
    directions: (Array.isArray(directions) ? directions : [directions]).map(asText).filter(Boolean),
    servings: asText(item.servings ?? item.yield),
    time: asText(item.time ?? item.totalTime ?? item.cookTime),
    favorite: item.favorite === true || item.isFavorite === true,
    source: asText(item.source ?? item.url)
  };
}

export function normalizeRestaurant(record, index = 0) {
  const item = record && typeof record === "object" ? record : {};
  const address = item.address ?? item.location ?? "";
  return {
    id: asText(item.id ?? item._id) || `legacy-restaurant-${index}`,
    name: asText(item.name ?? item.title) || "Unnamed restaurant",
    cuisine: asText(item.cuisine ?? item.type ?? item.category),
    address: asText(typeof address === "object" ? [address.street, address.city, address.state].filter(Boolean).join(", ") : address),
    rating: Number.isFinite(Number(item.rating)) && item.rating !== "" ? Number(item.rating) : null,
    favorite: item.favorite === true || item.isFavorite === true,
    reviewCount: Array.isArray(item.reviewHistory) ? item.reviewHistory.length : (item.survey ? 1 : 0)
  };
}

export function normalizeDataset(value) {
  const data = value && typeof value === "object" ? value : {};
  return {
    recipes: (Array.isArray(data.recipes) ? data.recipes : []).map(normalizeRecipe),
    restaurants: (Array.isArray(data.restaurants) ? data.restaurants : []).map(normalizeRestaurant)
  };
}
