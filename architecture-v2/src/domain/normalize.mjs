/** Defensive, non-mutating adapters for the actual legacy Metro Eats record shapes. */
export function asText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(", ");
  if (typeof value === "object") return asText(value.text ?? value.name ?? value.value ?? "");
  return "";
}

function asList(value) {
  if (value == null || value === "") return [];
  return (Array.isArray(value) ? value : [value]).map(asText).filter(Boolean);
}

function instructionList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(instructionList);
  if (typeof value === "object") {
    if (value.text != null) return instructionList(value.text);
    if (value.itemListElement != null) return instructionList(value.itemListElement);
    if (value.name != null) return instructionList(value.name);
    return [];
  }
  return asList(value);
}

export function normalizeRecipe(record, index = 0) {
  const item = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  const ingredients = item.ingredients ?? item.recipeIngredient ?? item.ingredientList ?? [];
  // Metro Eats stores saved recipe instructions under "steps"; imported Schema.org data uses recipeInstructions.
  const directions = item.steps ?? item.directions ?? item.recipeInstructions ?? item.instructions ?? [];
  return {
    id: asText(item.id ?? item._id) || `legacy-recipe-${index}`,
    title: asText(item.title ?? item.name ?? item.recipeName) || "Untitled recipe",
    category: asText(item.category),
    subcategory: asText(item.subcategory),
    ingredients: asList(ingredients),
    directions: instructionList(directions),
    servings: asText(item.servings ?? item.yield),
    time: asText(item.time ?? item.totalTime ?? item.cookTime),
    prepTime: asText(item.prepTime ?? item.prep_time),
    cookTime: asText(item.cookTime ?? item.cook_time),
    totalTime: asText(item.totalTime ?? item.total_time),
    favorite: item.favorite === true || item.isFavorite === true,
    source: asText(item.source ?? item.url),
    photos: asList(item.photos),
    createdAt: asText(item.createdAt),
    updatedAt: asText(item.updatedAt)
  };
}

export function normalizeRestaurant(record, index = 0) {
  const item = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  const address = item.location ?? item.address ?? "";
  const history = Array.isArray(item.reviewHistory) ? item.reviewHistory : [];
  const reviewCount = history.length || (item.survey ? 1 : 0);
  return {
    id: asText(item.id ?? item._id) || `legacy-restaurant-${index}`,
    name: asText(item.name ?? item.title) || "Unnamed restaurant",
    cuisine: asText(item.type ?? item.cuisine ?? item.category),
    address: asText(typeof address === "object" && !Array.isArray(address)
      ? [address.street, address.city, address.state].filter(Boolean).join(", ")
      : address),
    rating: Number.isFinite(Number(item.rating)) && item.rating !== "" && item.rating != null ? Number(item.rating) : null,
    favorite: item.favorite === true || item.isFavorite === true,
    reviewCount,
    latestReviewAt: asText(item.survey?.createdAt ?? history.at(-1)?.createdAt),
    website: asText(item.website),
    notes: asText(item.notes),
    photos: asList(item.photos),
    survey: item.survey && typeof item.survey === "object" ? item.survey : null,
    reviewHistory: history,
    createdAt: asText(item.createdAt),
    updatedAt: asText(item.updatedAt)
  };
}

export function normalizeDataset(value) {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    recipes: (Array.isArray(data.recipes) ? data.recipes : []).map(normalizeRecipe),
    restaurants: (Array.isArray(data.restaurants) ? data.restaurants : []).map(normalizeRestaurant),
    cats: data.cats && typeof data.cats === "object" ? data.cats : []
  };
}
