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

/**
 * Add display aliases without discarding the original record.
 * The spread is intentional: imports and round-trip saves must retain unknown
 * legacy fields, source metadata, photos, and the original steps/review shapes.
 */
export function normalizeRecipe(record, index = 0) {
  const item = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  const ingredients = item.ingredients ?? item.recipeIngredient ?? item.ingredientList ?? [];
  const directions = item.steps ?? item.directions ?? item.recipeInstructions ?? item.instructions ?? [];
  return {
    ...item,
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
    overallRating: item.overallRating == null || item.overallRating === "" || !Number.isFinite(Number(item.overallRating)) || Number(item.overallRating) < 1 || Number(item.overallRating) > 10
      ? null : Number(item.overallRating),
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
    ...item,
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

export function normalizeFrozenPizza(record, index = 0) {
  const item = record && typeof record === "object" && !Array.isArray(record) ? record : {};
  const scores = item.scores && typeof item.scores === "object" && !Array.isArray(item.scores) ? item.scores : {};
  return {
    ...item,
    id: asText(item.id ?? item._id) || `legacy-pizza-${index}`,
    upc: asText(item.upc ?? item.barcode),
    brand: asText(item.brand),
    name: asText(item.name ?? item.productName ?? item.title),
    price: item.price == null || item.price === "" ? null : Number.isFinite(Number(item.price)) ? Number(item.price) : null,
    scores: Object.fromEntries(["taste", "crust", "sauce", "cheese", "toppings", "value", "overall"].map(key => {
      const value = scores[key];
      return [key, value == null || value === "" || !Number.isFinite(Number(value)) ? null : Number(value)];
    })),
    notes: asText(item.notes),
    createdAt: asText(item.createdAt),
    updatedAt: asText(item.updatedAt)
  };
}

export function normalizeDataset(value) {
  const data = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    ...data,
    recipes: (Array.isArray(data.recipes) ? data.recipes : []).map(normalizeRecipe),
    restaurants: (Array.isArray(data.restaurants) ? data.restaurants : []).map(normalizeRestaurant),
    pizzas: (Array.isArray(data.pizzas) ? data.pizzas : []).map(normalizeFrozenPizza),
    bars: Array.isArray(data.bars) ? data.bars : [],
    drinks: Array.isArray(data.drinks) ? data.drinks : [],
    cocktailRecipes: Array.isArray(data.cocktailRecipes) ? data.cocktailRecipes : [],
    cats: data.cats && typeof data.cats === "object" ? data.cats : []
  };
}
