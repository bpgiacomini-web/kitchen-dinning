import { parsePastedRecipeText, parseRecipeJsonLd, recipeImageUrl } from './recipes/import-parser.mjs';
import { safeWebUrl } from '../domain/cocktails.mjs';
export function cleanCocktailFields(ingredients=[],directions=[]) {
 const result=[];let quantity='';
 for(const raw of ingredients){const line=String(raw).trim();if(/^(?:step[- ]by[- ]step|how to make)\b/i.test(line))break;if(/^(?:metric|parts|us customary|ingredients|1x|2x|3x)$/i.test(line))continue;if(/^\d+(?:[./]\d+)?\s*(?:parts?|oz|ml|cl|cups?|tsp|tbsp)$/i.test(line)){if(quantity)result.push(quantity);quantity=line;continue;}result.push([quantity,line].filter(Boolean).join(' '));quantity='';}if(quantity)result.push(quantity);
 return {ingredients:result,directions:directions.map(String).filter(line=>!/^a (?:bold|refreshing|delicious)|^cheers$|^step[- ]by[- ]step$|^how to make$/i.test(line.trim()))};
}
export function cocktailRecipeDraft(recipe) {
  const {ingredients,directions}=cleanCocktailFields(recipe?.ingredients,recipe?.directions);
  if (!recipe?.title || !Array.isArray(ingredients) || !ingredients.length || !Array.isArray(directions) || !directions.length) throw new Error('No complete recipe found. Paste ingredients and directions instead.');
  return {name:String(recipe.title).slice(0,180),ingredients:ingredients.map(String),directions:directions.map(String),source:safeWebUrl(recipe.source),sourceImageUrl:recipeImageUrl(recipe.sourceImageUrl)};
}
export function parseCocktailText(text) {
 const structured=parseRecipeJsonLd(text);if(structured)return cocktailRecipeDraft(structured);
 const lines=String(text||'').replace(/<br\s*\/?\s*>|<\/(?:p|li|h[1-6]|div)>/gi,'\n').replace(/<[^>]*>/g,' ').split(/\r?\n/).map(line=>line.replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').trim()).filter(Boolean);
 const start=lines.findIndex(line=>/^ingredients\s*[:：]?$/i.test(line));
 const noise=/^(?:parts$|jump to|print|pin|save|rate|share|subscribe|sign in|home|recipes|menu|search|skip to|updated|published|by |\d+(?:\.\d+)?\s*(?:from|out of)|prep time|total time|cook time|servings|nutrition|equipment|us customary|metric|1x|2x|3x|cook mode|prevent your screen)/i;
 const before=lines.slice(0,start<0?0:start).filter(line=>!noise.test(line)&&!/^https?:/.test(line)&&line.length<150);
 const title=before.find(line=>/\b(?:tea|shot|cocktail|margarita|martini|mule|sour|punch|spritz|old fashioned)\b/i.test(line))||before[0]||'Imported Cocktail';
 let body=(start>=0?lines.slice(start):lines).filter(line=>!noise.test(line));
 const end=body.findIndex(line=>/^(?:nutrition|notes|comments|reviews|related|you may also|leave a|did you make|frequently asked|more recipes)\b/i.test(line));if(end>=0)body=body.slice(0,end);
 body=body.map(line=>/^(?:step[- ]by[- ]step|how to make(?: .*?)?)[:：]?$/i.test(line)?'Directions':line.replace(/^▢\s*/,''));
 body=body.flatMap((line,index)=>{if(index&&/^\d+(?:[./]\d+)?\s*(?:parts?|oz|ml|cl|cups?|tsp|tbsp)$/i.test(body[index-1]))return [];return /^\d+(?:[./]\d+)?\s*(?:parts?|oz|ml|cl|cups?|tsp|tbsp)$/i.test(line)&&body[index+1]?[line+' '+body[index+1]]:[line];});
 const parsed=parsePastedRecipeText(['Title: '+title,...body].join('\n'));
 if(parsed&&lines.some(line=>/^step[- ]by[- ]step$/i.test(line))){parsed.directions=parsed.directions.filter(line=>/^(?:pour|add|mix|shake|strain|stir|combine|fill|serve|garnish|top|squeeze|muddle|build|chill|blend|place)\b/i.test(line)&&! /^(?:build the base|add the flavor|shake it up|pour & serve)$/i.test(line));}
 return cocktailRecipeDraft(parsed);
}
export async function importCocktailUrl(url, { getToken = () => globalThis.metroGetAccessToken?.(), fetcher = fetch } = {}) {
  if (!safeWebUrl(url)) throw new Error('Enter a complete public recipe URL.');
  const token = await getToken();
  if (!token) throw new Error('Sign in again to import a cocktail.');
  const response = await fetcher('/api/import-recipe-v2',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({url})});
  const payload = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(payload.error || 'Import unavailable. Paste the recipe text instead.');
  return cocktailRecipeDraft(payload.recipe);
}
