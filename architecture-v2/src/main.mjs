import { loadDataset } from "./data/repository.mjs";
import { parsePastedRecipeText, parseRecipeJsonLd } from "./features/recipes/import-parser.mjs";

const root = document.querySelector("#app");
const status = document.querySelector("#previewNotice");
let dataset = { recipes: [], restaurants: [], cats: [] };
let activeView = "home";
let extractedRecipe = null;
const RECIPE_CATEGORIES = ["Appetizers & Snacks", "Breakfast & Brunch", "Soups, Salads & Sandwiches", "Main Dishes", "Mexican & Latin", "Italian", "BBQ & Grilling", "Side Dishes", "Sauces, Gravies & Condiments", "Bread & Baking", "Desserts", "Drinks", "Other"];
const PREVIEW_RECIPE_STORAGE_KEY = "metro_eats_architecture_preview_recipes_v1";
function readPreviewSavedRecipes() {
  try { const value = JSON.parse(localStorage.getItem(PREVIEW_RECIPE_STORAGE_KEY) || "[]"); return Array.isArray(value) ? value.filter(item => item && typeof item === "object" && item.id && item.title) : []; } catch { return []; }
}
function mergePreviewSavedRecipes() {
  const saved = readPreviewSavedRecipes();
  const ids = new Set(saved.map(item => String(item.id)));
  dataset.recipes = [...dataset.recipes.filter(item => !ids.has(String(item.id))), ...saved];
}
function ensureBgChiliPreviewTest() {
  const saved = readPreviewSavedRecipes();
  if (saved.some(item => String(item.title || "").toLowerCase() === "bg’s chili — save test".toLowerCase())) return;
  const now = new Date().toISOString();
  const recipe = {
    id: "preview-recipe-bg-chili-seeded-test",
    title: "BG’s Chili — Save Test",
    category: "Main Dishes",
    subcategory: "Beef",
    ingredients: [
      "3 ¼ lbs ground chuck",
      "1 lb chorizo",
      "4 Hands CPB Stout, for deglazing",
      "½ large onion",
      "1 bell pepper",
      "1–2 jalapeños",
      "3 garlic cloves",
      "3 Roma tomatoes",
      "¼ cup tomato paste",
      "5 tbsp chili powder (2 Mexene, 3 Gebhardt)",
      "3 tsp smoked paprika",
      "2 tsp cumin",
      "½ tsp oregano",
      "1 tsp cayenne pepper",
      "1 tbsp coarse salt",
      "2 tbsp black pepper",
      "1 packet Sazon",
      "2 tbsp olive oil",
      "½ onion, chopped",
      "¼ cup carrots, chopped",
      "¼ cup celery, chopped",
      "2 tbsp Better Than Bouillon roasted beef",
      "2 tbsp cornstarch, if needed",
      "1 tbsp harissa"
    ],
    directions: [
      "Cook ground chuck in batches over high heat.",
      "Deglaze each batch with stout and combine the meat and liquid in a Dutch oven.",
      "Add enough water to cover the meat, bring to a boil, then simmer.",
      "Sauté the vegetables and add them to the meat.",
      "Sauté the onion, carrots, and celery in olive oil for the mirepoix.",
      "Add the seasonings and Sazon.",
      "Stir in the roasted beef Better Than Bouillon.",
      "Thicken with cornstarch if needed.",
      "Finish with harissa."
    ],
    createdAt: now,
    updatedAt: now,
    source: ""
  };
  try { localStorage.setItem(PREVIEW_RECIPE_STORAGE_KEY, JSON.stringify([...saved, recipe])); } catch {}
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function setStatus(label, kind = "") {
  status.textContent = label;
  status.className = `status ${kind}`.trim();
}
function renderHome() {
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">St. Louis • Metro East</div><h2>Metro Eats<br><span class="fl">⚜</span> Recipes & Dining</h2><p>Your personal recipe book and restaurant journal — built around the food you actually love.</p><div class="homeFeatureButtons"><button class="homeFeatureButton recipeButton" data-view="recipes"><span class="homeFeatureIcon">✦</span><span><strong>My Recipes</strong><small>Your Kitchen</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton diningButton" data-view="dining"><span class="homeFeatureIcon" aria-hidden="true">⚜</span><span><strong>My Restaurants</strong><small>Your Restaurants & Reviews</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton pizzaButton" data-view="pizzas"><span class="homeFeatureIcon pizzaIcon" aria-hidden="true"></span><span><strong>My Frozen Pizzas</strong><small>Scan, rate, and compare</small></span><span class="homeFeatureArrow">→</span></button></div></div></section><section class="localNewsPanel" aria-labelledby="local-news-title"><div class="panel-heading"><div><p class="eyebrow">St. Louis • Metro East</p><h2 id="local-news-title">Local Food News</h2></div><span class="status">Food & restaurants</span></div><p class="newsIntro">Restaurant openings, local food stories, dining news, and Sauce Magazine highlights.</p><div id="local-food-news" class="localNewsList" aria-live="polite"><p class="hint">Loading local food stories…</p></div><p class="hint" id="local-news-updated"></p></section><div class="homeColumns"><article class="featureCard"><div><div class="sectionKicker">Your Collection</div><h3>Saved with care</h3><p>Your recipes and restaurant notes, kept together in one place.</p></div><div class="actions"><button class="btn primary" data-view="recipes">Open My Recipes →</button><button class="btn" data-view="dining">Open My Restaurants →</button><button class="btn" data-view="pizzas">Open My Frozen Pizzas →</button></div></article><article class="featureCard accent"><div><div class="sectionKicker">Safety First</div><h3>Existing data stays safe.</h3><p>This preview reads available records only. No recipe, restaurant, or review can be changed or overwritten here.</p></div><span class="status">Read only</span></article></div>`;
}
async function loadLocalFoodNews() {
  const list = document.querySelector("#local-food-news");
  const updated = document.querySelector("#local-news-updated");
  if (!list) return;
  try {
    const response = await fetch("../news.json", { headers: { Accept: "application/json" }, cache: "no-cache" });
    if (!response.ok) throw new Error("News feed unavailable");
    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items.filter(item => {
      if (!item || !item.title || !item.url) return false;
      try { const u = new URL(item.url); return u.protocol === "https:" || u.protocol === "http:"; } catch { return false; }
    }).slice(0, 8) : [];
    if (!items.length) { list.innerHTML = '<p class="empty">No local food stories are available right now. Please check back soon.</p>'; return; }
    list.innerHTML = items.map(item => '<article class="localNewsItem"><div class="newsMeta">' + escapeHtml(item.source || "Local food news") + (item.date ? " · " + escapeHtml(item.date) : "") + '</div><a href="' + escapeHtml(item.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(item.title) + '</a></article>').join("");
    if (updated && payload.updated) { const date = new Date(payload.updated); if (!Number.isNaN(date.getTime())) updated.textContent = "Feed last updated " + date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) + "."; }
  } catch { list.innerHTML = '<p class="empty">Local food news could not be loaded. Your recipes and restaurant data are unaffected.</p>'; }
}
function renderImportPanel() {
  return `<section class="importPanel" aria-labelledby="import-title">
    <div class="panel-heading"><div><p class="eyebrow">Recipe tools · Early preview</p><h2 id="import-title">Import a recipe</h2></div><span class="status">Preview only</span></div>
    <p class="importIntro">Paste recipe text or import from a public recipe URL. If URL extraction doesn't work, copy the recipe text from the website and paste it here. Advanced HTML / JSON-LD is available above if needed.</p>
    <div class="field is-hidden"><span class="fieldLabel" id="import-mode-label">Choose import method</span>
    <div class="importModeChoices" role="group" aria-labelledby="import-mode-label">
      <button class="importModeChoice active" type="button" data-import-mode="text" aria-pressed="true">Paste Recipe Text</button>
      <button class="importModeChoice" type="button" data-import-mode="url" aria-pressed="false">Import Webpage URL</button>
      <button class="importModeChoice" type="button" data-import-mode="jsonld" aria-pressed="false">Paste Webpage HTML</button>
    </div></div>
    <div id="import-text-fields" class="field"><label id="import-source-label" for="import-source">Recipe content</label><textarea id="import-source" class="importSource" rows="9" maxlength="250000" placeholder="Paste a recipe with Ingredients and Directions sections…"></textarea></div>
    <div id="import-url-fields" class="field is-hidden"><label for="import-url">Public recipe webpage URL</label><input id="import-url" class="importUrl" type="url" inputmode="url" autocomplete="url" maxlength="2048" placeholder="https://example.com/recipe"></div>
    <div class="actions importActions"><button class="btn primary" type="button" data-action="parse-recipe">Extract recipe</button><button class="btn" type="button" data-action="clear-recipe">Clear</button></div>
    <p id="import-feedback" class="importFeedback" role="status" aria-live="polite">Nothing has been extracted yet.</p>
    <div id="import-preview" class="importPreview"></div>
    <p class="hint">Preview save test: recipes saved here are stored only in this browser on this device. They do not sync to the cloud or other devices. Existing recipes and restaurant records are not overwritten. URL fetching is server-side and uses redirect and network-safety checks.</p>
  </section>`;
}
function ratingValue(value, key = "") {
  const number = Number(value);
  if (value == null || value === "" || !Number.isFinite(number)) return value;
  if (!/^(rating|overall)$/i.test(key)) return value;
  // Convert legacy restaurant/review ratings on a 5-point scale for display only.
  return number >= 0 && number <= 5 ? number * 2 : number;
}
function renderList(title, eyebrow, items, kind) {
  const isRecipe = kind === "recipes";
  const visibleItems = isRecipe ? items.filter(item => !/^PREVIEW TEST\b/i.test(String(item.title || ""))) : items;
  const rows = visibleItems.map(item => {
    const ingredients = Array.isArray(item.ingredients) ? item.ingredients : [];
    const directions = Array.isArray(item.directions) ? item.directions : [];
    const timeParts = isRecipe
      ? [item.prepTime ? `Prep ${item.prepTime}` : "", item.cookTime ? `Cook ${item.cookTime}` : "", item.totalTime ? `Total ${item.totalTime}` : (!item.prepTime && !item.cookTime && !item.totalTime ? item.time : "")]
      : [];
    const cleanStep = step => String(step ?? "").replace(/^(?:\s*(?:[•●▪‣-]\s*)|\s*\d+[.)]\s*)+/g, "").trim();
    const formatDateTime = value => {
      if (typeof value !== "string" || !value.trim()) return "";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return value;
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
    };
    const displayValue = (value, key = "") => {
      if (value == null || value === "") return "";
      if (Array.isArray(value)) return value.map(item => displayValue(item)).filter(Boolean).join(", ");
      if (typeof value === "object") return escapeHtml(value.text ?? value.name ?? value.value ?? "");
      if (/^(createdAt|updatedAt|reviewDate|date|timestamp)$/i.test(key) && typeof value === "string") return escapeHtml(formatDateTime(value));
      return escapeHtml(value);
    };
    const fieldLabel = key => ({ createdAt: "Review date", updatedAt: "Last updated", orderAgain: "Order again" }[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()));
    const allReviewRecords = [...(Array.isArray(item.reviewHistory) ? item.reviewHistory : []), ...(item.survey ? [item.survey] : [])];
    // Legacy data may expose the same saved review in both reviewHistory and survey.
    // Deduplicate identical review payloads for display only; never mutate stored data.
    const reviewSignature = review => review && typeof review === "object"
      ? JSON.stringify(Object.keys(review).filter(key => !["id", "_id", "restaurantId"].includes(key)).sort().map(key => [key, review[key]]))
      : String(review);
    const seenReviewSignatures = new Set();
    const reviewRecords = allReviewRecords.filter(review => {
      const signature = reviewSignature(review);
      if (seenReviewSignatures.has(signature)) return false;
      seenReviewSignatures.add(signature);
      return true;
    });
    const reviewFields = reviewRecords.map((review, reviewIndex) => {
      if (!review || typeof review !== "object") return "";
      const ignored = new Set(["id", "_id", "restaurantId", "photos", "image", "images"]);
      const fields = Object.entries(review).filter(([key, value]) => !ignored.has(key) && value != null && value !== "" && typeof value !== "object" && !Array.isArray(value));
      return fields.length ? `<section class="restaurantDetailBlock"><h4>${reviewRecords.length > 1 ? `Review ${reviewIndex + 1}` : "Saved review"}</h4><dl>${fields.map(([key, value]) => `<div><dt>${escapeHtml(/^(overall|rating)$/i.test(key) ? "Overall score" : fieldLabel(key))}</dt><dd>${displayValue(ratingValue(value, key), key)}${/^(overall|rating)$/i.test(key) ? "/10" : ""}</dd></div>`).join("")}</dl></section>` : "";
    }).join("");
    const restaurantPhotos = Array.isArray(item.photos) ? item.photos : [];
    const reviewSummary = item.reviewCount ? `${item.reviewCount} saved review${item.reviewCount === 1 ? "" : "s"}` : "";
    const restaurantRating = item.rating == null ? null : (Number(item.rating) <= 5 ? Number(item.rating) * 2 : Number(item.rating));
    const restaurantDetails = !isRecipe ? `<details><summary>View restaurant details</summary><section class="restaurantDetailBlock"><h4>Restaurant information</h4><dl>${[["Address",item.address],["Cuisine",item.cuisine],["Rating",restaurantRating == null ? "" : `${restaurantRating.toFixed(1)}/10`],["Favorite",item.favorite ? "Yes" : ""],["Notes",item.notes],["Website",item.website],["Last updated",item.updatedAt ? formatDateTime(item.updatedAt) : ""]].filter(([,value])=>value!==""&&value!=null).map(([label,value])=>`<div><dt>${label}</dt><dd>${label === "Website" && /^https?:\/\//i.test(String(value)) ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>` : displayValue(value)}</dd></div>`).join("")}</dl></section>${reviewRecords.length ? reviewFields : `<p class="hint">No saved review details were found for this restaurant.</p>`}${restaurantPhotos.length ? `<section class="restaurantDetailBlock"><h4>Photos</h4><ul>${restaurantPhotos.map(photo=>`<li>${displayValue(photo)}</li>`).join("")}</ul></section>` : ""}</details>` : "";
    return `<article class="readOnlyItem" data-category="${escapeHtml(item.category || "")}"><strong>${escapeHtml(isRecipe ? item.title : item.name)}</strong><small>${escapeHtml(isRecipe ? [item.category, item.subcategory, ingredients.length ? `${ingredients.length} ingredients` : "", ...timeParts].filter(Boolean).join(" · ") : [item.cuisine, item.address, restaurantRating != null ? `Rating ${restaurantRating.toFixed(1)}/10` : "", item.favorite ? "Favorite" : "", reviewSummary].filter(Boolean).join(" · ") || "No additional details saved")}</small>${isRecipe && (item.createdAt || item.updatedAt) ? `<p class="recipeSavedDate">Saved ${escapeHtml(formatDateTime(item.createdAt || item.updatedAt))}</p>` : ""}${isRecipe && String(item.id || "").startsWith("preview-recipe-") ? `<details class="recipeEditPanel"><summary>Edit recipe</summary><label>Title<input data-edit-field="title" value="${escapeHtml(item.title)}"></label><label>Ingredients, one per line<textarea data-edit-field="ingredients" rows="6">${escapeHtml(ingredients.join("\n"))}</textarea></label><label>Directions, one per line<textarea data-edit-field="directions" rows="6">${escapeHtml(directions.join("\n"))}</textarea></label><div class="recipeEditActions"><button class="btn primary" type="button" data-action="save-recipe-edit" data-recipe-id="${escapeHtml(item.id)}">Save Changes</button><button class="btn danger" type="button" data-action="delete-recipe" data-recipe-id="${escapeHtml(item.id)}">Delete Recipe</button></div><p class="edit-status" role="status" aria-live="polite"></p></details>` : ""}${isRecipe && (ingredients.length || directions.length) ? `<details><summary>View recipe</summary>${ingredients.length ? `<section class="recipeDetailBlock"><h4>Ingredients</h4><ul>${ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join("")}</ul></section>` : `<p class="hint">No ingredients were found for this recipe.</p>`}${directions.length ? `<section class="recipeDetailBlock"><h4>Directions</h4><ol>${directions.map(step => `<li>${escapeHtml(cleanStep(step))}</li>`).join("")}</ol></section>` : ""}</details>` : restaurantDetails}</article>`;
  }).join("");
  if (isRecipe) {
    const categories = RECIPE_CATEGORIES;
    root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your kitchen</div><h2>My Recipes</h2><p>Your saved recipes first. Search, browse categories, and open a recipe whenever you're ready to cook.</p></div></section>
      <section class="content-panel recipeCollectionPanel">
        <div class="sectionTitle"><div><div class="sectionKicker">Your collection</div><h3>Saved recipes</h3></div><button class="btn primary" type="button" data-view="add-recipe">＋ Add a Recipe</button></div>
        <div class="recipeBrowseTools"><div class="field"><label for="recipe-search">Search your recipes</label><input id="recipe-search" type="search" placeholder="Search by name, ingredient, or direction"></div><div class="field"><label for="recipe-category">Category</label><select id="recipe-category"><option value="">All categories</option>${categories.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></div></div>
        <div id="recipe-collection-list" class="readOnlyList">${rows ? rows : `<div class="empty">No recipes were found in the data source this preview can read.</div>`}</div>
        <p class="hint">Preview storage: recipes saved in this browser stay on this device and this preview address. They do not sync to other devices or a cloud account. Existing production data is not changed.</p>
      </section>`;
    const search = document.querySelector("#recipe-search");
    const category = document.querySelector("#recipe-category");
    const applyFilter = () => {
      const query = (search?.value || "").trim().toLocaleLowerCase();
      const selected = category?.value || "";
      const cards = [...document.querySelectorAll("#recipe-collection-list .readOnlyItem")];
      let visible = 0;
      cards.forEach(card => {
        const text = card.textContent.toLocaleLowerCase();
        const matchesQuery = !query || text.includes(query);
        const matchesCategory = !selected || (card.dataset.category || "") === selected;
        card.hidden = !(matchesQuery && matchesCategory);
        if (!card.hidden) visible++;
      });
      let empty = document.querySelector("#recipe-filter-empty");
      if (!empty) {
        empty = document.createElement("p");
        empty.id = "recipe-filter-empty";
        empty.className = "empty";
        empty.textContent = "No saved recipes match those filters.";
        document.querySelector("#recipe-collection-list")?.append(empty);
      }
      empty.hidden = visible > 0;
    };
    search?.addEventListener("input", applyFilter);
    category?.addEventListener("change", applyFilter);
    return;
  }
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2><p>A read-only view of your current saved ${kind}.</p></div></section><section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${items.length} saved</div><h3>${title}</h3></div><span class="status">Read only</span></div>${rows ? `<div class="readOnlyList">${rows}</div>` : `<div class="empty">No ${kind} were found in the data source this preview can read.</div>`}<p class="hint">Nothing in this screen can change or delete your existing records.</p></section>`;
}
function renderAddRecipe() {
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your kitchen</div><h2>Add a Recipe</h2><p>Choose the easiest way to bring a recipe into Metro Eats. If a webpage import fails, copying the recipe text from the site and pasting it here is a perfectly good fallback.</p><div class="actions"><button class="btn" type="button" data-view="recipes">← Back to My Recipes</button></div></div></section>
    <section class="content-panel addRecipeIntro"><div class="sectionTitle"><div><div class="sectionKicker">Choose an import method</div><h3>How would you like to add it?</h3></div><span class="status">Preview only</span></div><p>We'll extract the recipe fields for you to review. Nothing is saved by this preview yet.</p>
      <div class="addRecipeChoices"><button class="addRecipeChoice" type="button" data-import-mode="text"><span class="choiceIcon">✎</span><span><strong>Paste Recipe Text</strong><small>Copy the ingredients and directions from any website, then paste them here.</small></span><span aria-hidden="true">→</span></button><button class="addRecipeChoice" type="button" data-import-mode="url"><span class="choiceIcon">↗</span><span><strong>Import from URL</strong><small>Paste a public recipe webpage link and let Metro Eats try to extract the recipe.</small></span><span aria-hidden="true">→</span></button><details class="advancedImport"><summary>Advanced options</summary><p>If a supported recipe page contains structured recipe data, you can paste its HTML / JSON-LD here. Most people will never need this.</p><button class="btn" type="button" data-import-mode="jsonld">Paste Webpage HTML / JSON-LD</button></details></div>
      ${renderImportPanel()}
    </section>`;
  syncImportMode("text");
}
function renderFrozenPizzas() {
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your freezer • Your ratings</div><h2>My Frozen Pizzas <span class="pizzaHeadingIcon" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><circle cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="21"/><path d="M32 11 L49 46 Q32 39 15 46 Z"/><circle cx="29" cy="25" r="2.3"/><circle cx="35" cy="32" r="2.3"/><circle cx="29" cy="36" r="2.3"/></svg></span></h2><p>Build your personal frozen-pizza rankings with product details, category scores, photos, and an overall rating out of 10.</p></div></section>
  <section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">Product lookup</div><h3>Find a frozen pizza</h3></div><span class="status">Preview concept</span></div>
  <p>Barcode lookup is planned to fill in brand and product details when a matching UPC is available. Live barcode scanning and product lookup are not connected in this preview yet.</p>
  <div class="field"><label for="pizza-upc">UPC barcode (manual fallback)</label><input id="pizza-upc" inputmode="numeric" autocomplete="off" placeholder="Enter UPC digits"></div>
  <div class="field"><label for="pizza-brand">Brand</label><input id="pizza-brand" placeholder="e.g. DiGiorno"></div>
  <div class="field"><label for="pizza-name">Pizza name / variety</label><input id="pizza-name" placeholder="e.g. Rising Crust Pepperoni"></div>
  <div class="field"><label for="pizza-price">Purchase price</label><input id="pizza-price" inputmode="decimal" placeholder="$"></div>
  <div class="pizzaScoreGrid"><div class="field"><label for="pizza-taste">Taste (0–10)</label><input id="pizza-taste" type="number" min="0" max="10" step=".1"></div><div class="field"><label for="pizza-crust">Crust (0–10)</label><input id="pizza-crust" type="number" min="0" max="10" step=".1"></div><div class="field"><label for="pizza-sauce">Sauce (0–10)</label><input id="pizza-sauce" type="number" min="0" max="10" step=".1"></div><div class="field"><label for="pizza-cheese">Cheese (0–10)</label><input id="pizza-cheese" type="number" min="0" max="10" step=".1"></div><div class="field"><label for="pizza-toppings">Toppings (0–10)</label><input id="pizza-toppings" type="number" min="0" max="10" step=".1"></div><div class="field"><label for="pizza-value">Value (0–10)</label><input id="pizza-value" type="number" min="0" max="10" step=".1"></div></div>
  <div class="field"><label for="pizza-overall">Overall score (0–10)</label><input id="pizza-overall" type="number" min="0" max="10" step=".1"></div>
  <div class="field"><label for="pizza-notes">Review notes</label><textarea id="pizza-notes" rows="3" placeholder="What stood out? Would you buy it again?"></textarea></div>
  <p class="hint">This is a layout prototype only. It does not save data, change existing records, or connect to a barcode database. We will wire up scanning, product lookup, and private account storage separately.</p></section>`;
}
function formatRecipeDuration(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  // Humanize ISO-8601 recipe durations (e.g. PT10M, PT1H30M) without changing source data.
  const match = raw.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!match) return raw;
  const days = Number(match[1] || 0);
  const hours = Number(match[2] || 0) + Math.floor(Number(match[3] || 0) / 60);
  const minutes = Number(match[3] || 0) % 60;
  const seconds = Number(match[4] || 0);
  const parts = [];
  if (days) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);
  if (seconds) parts.push(`${seconds} second${seconds === 1 ? "" : "s"}`);
  return parts.join(" ");
}
function cleanImportedIngredient(value) {
  return String(value ?? "")
    .replace(/\s*\(\s*\$\s*\d+(?:\.\d{1,2})?\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function renderImportPreview(recipe) {
  extractedRecipe = recipe ? { ...recipe, ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(cleanImportedIngredient) : [], directions: Array.isArray(recipe.directions) ? recipe.directions : [] } : null;
  recipe = extractedRecipe;
  const preview = document.querySelector("#import-preview");
  if (!preview) return;
  if (!recipe) { preview.innerHTML = ""; return; }
  const metadata = [["Servings", recipe.servings], ["Prep time", formatRecipeDuration(recipe.prepTime)], ["Cook time", formatRecipeDuration(recipe.cookTime)], ["Total time", formatRecipeDuration(recipe.totalTime)]].filter(([, value]) => value);
  const ingredients = (Array.isArray(recipe.ingredients) ? recipe.ingredients : []).map(cleanImportedIngredient);
  const directions = Array.isArray(recipe.directions) ? recipe.directions : [];
  preview.innerHTML = `<article class="parsedRecipe"><p class="sectionKicker">Review before saving</p><div class="field"><label for="review-recipe-title">Recipe title</label><input id="review-recipe-title" maxlength="180" value="${escapeHtml(recipe.title)}"></div>${metadata.length ? `<dl>${metadata.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}${recipe.source ? `<p class="note"><a class="recipeSourceLink" href="${escapeHtml(recipe.source)}" target="_blank" rel="noopener noreferrer">Recipe link ↗</a></p>` : ""}<div class="field"><label for="review-recipe-ingredients">Ingredients (one per line)</label><textarea id="review-recipe-ingredients" rows="8" maxlength="30000">${escapeHtml(ingredients.join("\n"))}</textarea></div><div class="field"><label for="review-recipe-directions">Directions (one step per line)</label><textarea id="review-recipe-directions" rows="8" maxlength="30000">${escapeHtml(directions.join("\n"))}</textarea></div><div class="actions"><button class="btn primary" type="button" data-action="save-recipe">Save to My Recipes</button></div><p id="recipe-save-status" class="importFeedback" role="status" aria-live="polite"></p></article>`;
}
function render() {
  document.querySelector(".app > .top")?.classList.toggle("homeStickyHeader", activeView === "home");
  root.classList.add("section", "active");
  root.classList.remove("recipeSection", "diningSection");
  if (activeView === "recipes") root.classList.add("recipeSection");
  if (activeView === "dining") root.classList.add("diningSection");
  if (activeView === "pizzas") root.classList.add("pizzaSection");
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === activeView;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  if (activeView === "recipes") renderList("My Recipes", "Your kitchen", dataset.recipes, "recipes");
  else if (activeView === "add-recipe") renderAddRecipe();
  else if (activeView === "dining") renderList("My Restaurants", "Your restaurants", dataset.restaurants, "dining");
  else if (activeView === "pizzas") renderFrozenPizzas();
  else renderHome();
}
let importMode = "text";
function syncImportMode(mode = importMode) {
  importMode = mode;
  document.querySelectorAll("[data-import-mode]").forEach(button => {
    const active = button.dataset.importMode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelector("#import-text-fields")?.classList.toggle("is-hidden", mode === "url");
  document.querySelector("#import-url-fields")?.classList.toggle("is-hidden", mode !== "url");
  document.querySelector("#import-source")?.closest(".field")?.classList.toggle("is-hidden", mode === "url");
  document.querySelector("#import-source-label")?.closest(".field")?.classList.toggle("is-hidden", mode === "url");
  const label = document.querySelector("#import-source-label");
  const source = document.querySelector("#import-source");
  if (label) label.textContent = mode === "jsonld" ? "Webpage HTML / JSON-LD" : "Recipe content";
  if (source) source.placeholder = mode === "jsonld" ? "Paste webpage HTML containing Recipe JSON-LD…" : "Paste a recipe with Ingredients and Directions sections…";
}

document.addEventListener("click", async event => {
  const importModeButton = event.target.closest("[data-import-mode]");
  if (importModeButton) {
    event.preventDefault();
    syncImportMode(importModeButton.dataset.importMode);
    const sourceField = document.querySelector("#import-url-fields input")?.closest(".field");
    const textField = document.querySelector("#import-source")?.closest(".field");
    (importMode === "url" ? sourceField : textField)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    event.preventDefault();
    activeView = viewButton.dataset.view;
    render();
    // Every explicit section navigation starts at the top of the new page.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    root.focus({ preventScroll: true });
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  if (actionButton.dataset.action === "delete-recipe") {
    const id = actionButton.dataset.recipeId;
    const saved = readPreviewSavedRecipes();
    const recipe = saved.find(item => String(item.id) === String(id));
    if (!recipe) return;
    if (!window.confirm(`Delete “${recipe.title}” from this preview on this device? This cannot be undone here.`)) return;
    try {
      localStorage.setItem(PREVIEW_RECIPE_STORAGE_KEY, JSON.stringify(saved.filter(item => String(item.id) !== String(id))));
      mergePreviewSavedRecipes();
      render();
    } catch {
      const status = actionButton.closest(".recipeEditPanel")?.querySelector(".edit-status");
      if (status) status.textContent = "Could not delete this recipe from browser storage. Nothing was removed.";
    }
    return;
  }
  if (actionButton.dataset.action === "save-recipe-edit") {
    const id = actionButton.dataset.recipeId;
    const panel = actionButton.closest(".recipeEditPanel");
    const title = panel?.querySelector('[data-edit-field="title"]')?.value.trim() || "";
    const ingredients = (panel?.querySelector('[data-edit-field="ingredients"]')?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    const directions = (panel?.querySelector('[data-edit-field="directions"]')?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    const status = panel?.querySelector(".edit-status");
    if (!title || !ingredients.length || !directions.length) {
      if (status) status.textContent = "Please enter a title, at least one ingredient, and at least one direction.";
      return;
    }
    try {
      const saved = readPreviewSavedRecipes();
      const index = saved.findIndex(item => String(item.id) === String(id));
      if (index < 0) {
        if (status) status.textContent = "Could not find this preview-saved recipe. Nothing was changed.";
        return;
      }
      saved[index] = { ...saved[index], title, ingredients, directions, updatedAt: new Date().toISOString() };
      localStorage.setItem(PREVIEW_RECIPE_STORAGE_KEY, JSON.stringify(saved));
      mergePreviewSavedRecipes();
      render();
      return;
    } catch {
      if (status) status.textContent = "Could not save your changes in this browser. Please try again.";
    }
    return;
  }
  if (actionButton.dataset.action === "save-recipe") {
    const feedback = document.querySelector("#import-feedback");
    if (!extractedRecipe || !extractedRecipe.title || !extractedRecipe.ingredients.length || !extractedRecipe.directions.length) {
      if (feedback) feedback.textContent = "A complete recipe is required before saving.";
      return;
    }
    const title = document.querySelector("#review-recipe-title")?.value.trim() || "";
    const ingredients = (document.querySelector("#review-recipe-ingredients")?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    const directions = (document.querySelector("#review-recipe-directions")?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    if (!title || !ingredients.length || !directions.length) { if (feedback) feedback.textContent = "Please provide a title, at least one ingredient, and at least one direction."; return; }
    const saved = readPreviewSavedRecipes();
    const normalize = value => String(value || "").trim().toLocaleLowerCase();
    const duplicate = saved.find(item =>
      normalize(item.title) === normalize(title) &&
      normalize(item.source) === normalize(extractedRecipe.source) &&
      JSON.stringify(item.ingredients || []) === JSON.stringify(ingredients) &&
      JSON.stringify(item.directions || []) === JSON.stringify(directions)
    );
    const inlineStatus = document.querySelector("#recipe-save-status");
    if (duplicate) {
      if (inlineStatus) inlineStatus.textContent = "Already saved on this device. You can find this recipe in My Recipes; no duplicate was added.";
      actionButton.textContent = "Already Saved ✓";
      actionButton.disabled = true;
      if (feedback) feedback.textContent = "This recipe was already saved. No duplicate was added.";
      return;
    }
    const recipe = { ...extractedRecipe, id: "preview-recipe-" + Date.now(), title, ingredients, directions, category: "Imported", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(PREVIEW_RECIPE_STORAGE_KEY, JSON.stringify([...saved, recipe]));
      dataset.recipes = [...dataset.recipes, recipe];
      const message = "Saved successfully to My Recipes on this device. You can leave this screen now; the recipe is available in My Recipes. This preview does not sync to the cloud.";
      if (inlineStatus) inlineStatus.textContent = message;
      if (feedback) feedback.textContent = message;
      actionButton.textContent = "Saved ✓";
      actionButton.disabled = true;
    } catch {
      if (inlineStatus) inlineStatus.textContent = "Save failed. Browser storage was unavailable; please try again.";
      if (feedback) feedback.textContent = "Browser storage was unavailable. Nothing was saved.";
    }
    return;
  }
  if (actionButton.dataset.action === "clear-recipe") {
    const source = document.querySelector("#import-source");
    const url = document.querySelector("#import-url");
    const feedback = document.querySelector("#import-feedback");
    if (source) source.value = "";
    if (url) url.value = "";
    if (feedback) feedback.textContent = "Content cleared. Nothing was saved.";
    renderImportPreview(null);
    return;
  }
  if (actionButton.dataset.action === "parse-recipe") {
    const mode = importMode;
    const source = document.querySelector("#import-source")?.value || "";
    const url = document.querySelector("#import-url")?.value.trim() || "";
    const feedback = document.querySelector("#import-feedback");
    let result = null;
    actionButton.disabled = true;
    const previousLabel = actionButton.textContent;
    actionButton.textContent = mode === "url" ? "Fetching safely…" : "Extracting…";
    if (feedback) feedback.textContent = mode === "url" ? "Checking the webpage and extracting recipe fields. Nothing is being saved." : "Extracting recipe-specific fields…";
    try {
      if (mode === "url") {
        if (!url) throw new Error("Enter a recipe webpage URL first.");
        const response = await fetch("/api/import-recipe-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ url })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Recipe import failed. Nothing was saved.");
        result = payload.recipe || null;
      } else {
        result = mode === "jsonld" ? parseRecipeJsonLd(source) : parsePastedRecipeText(source);
      }
      if (feedback) feedback.textContent = result
        ? "Recipe fields extracted. Review them below; nothing has been saved."
        : mode === "jsonld"
          ? "No complete recipe was found in the pasted HTML/JSON-LD. Try copying the recipe text instead."
          : "Couldn't identify both ingredients and directions. Include clear Ingredients and Directions headings and try again.";
    } catch (error) {
      if (feedback) feedback.textContent = error?.message || "Couldn't import that recipe. Nothing was saved.";
    } finally {
      actionButton.disabled = false;
      actionButton.textContent = previousLabel;
    }
    renderImportPreview(result);
  }
});

try {
  const result = await loadDataset();
  dataset = result.data;
  ensureBgChiliPreviewTest();
  mergePreviewSavedRecipes();
  if (result.source.startsWith("local:")) {
    const hasRecords = result.data.recipes.length > 0 || result.data.restaurants.length > 0;
    setStatus(hasRecords ? "Loaded from this device" : "This device has no saved records", hasRecords ? "ok" : "warn");
  } else if (result.source === "cloud") {
    const hasRecords = result.data.recipes.length > 0 || result.data.restaurants.length > 0;
    setStatus(hasRecords ? "Preview data connected" : "Preview connected · no preview records yet", hasRecords ? "ok" : "warn");
  } else {
    setStatus(result.staleFallback ? "Data source unavailable" : "No saved data found", "warn");
  }
  render();
  if (activeView === "home") loadLocalFoodNews();
} catch {
  setStatus("Data unavailable", "warn");
  render();
  if (activeView === "home") loadLocalFoodNews();
}
