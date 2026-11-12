import { parsePastedRecipeText } from './recipes/import-parser.mjs';
import { safeWebUrl } from '../domain/cocktails.mjs';
export function cocktailRecipeDraft(recipe) {
  const ingredients = recipe?.ingredients;
  const directions = recipe?.directions;
  if (!recipe?.title || !Array.isArray(ingredients) || !ingredients.length || !Array.isArray(directions) || !directions.length) throw new Error('No complete recipe found. Paste ingredients and directions instead.');
  return {name:String(recipe.title).slice(0,180),ingredients:ingredients.map(String),directions:directions.map(String),source:safeWebUrl(recipe.source)};
}
export function parseCocktailText(text) { return cocktailRecipeDraft(parsePastedRecipeText(text)); }
export async function importCocktailUrl(url, { getToken = () => globalThis.metroGetAccessToken?.(), fetcher = fetch } = {}) {
  if (!safeWebUrl(url)) throw new Error('Enter a complete public recipe URL.');
  const token = await getToken();
  if (!token) throw new Error('Sign in again to import a cocktail.');
  const response = await fetcher('/api/import-recipe-v2',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({url})});
  const payload = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(payload.error || 'Import unavailable. Paste the recipe text instead.');
  return cocktailRecipeDraft(payload.recipe);
}
