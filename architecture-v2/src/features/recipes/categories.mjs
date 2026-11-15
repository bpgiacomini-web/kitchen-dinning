export const RECIPE_CATEGORIES = [
  "Appetizers & Snacks",
  "Breakfast & Brunch",
  "Soups, Salads & Sandwiches",
  "Main Dishes",
  "Mexican & Latin",
  "Italian",
  "BBQ & Grilling",
  "Side Dishes",
  "Sauces, Gravies & Condiments",
  "Bread & Baking",
  "Desserts",
  "Drinks",
  "Other"
];

export function importedRecipeCategory(value) {
  return RECIPE_CATEGORIES.includes(value) ? value : "Other";
}

export function recipeEditorCategories(currentValue) {
  const current = String(currentValue ?? "").trim();
  return current && !RECIPE_CATEGORIES.includes(current)
    ? [...RECIPE_CATEGORIES, current]
    : RECIPE_CATEGORIES;
}
