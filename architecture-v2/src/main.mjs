import { createUserDatasetClient } from "./data/user-dataset-client.mjs";
import { normalizeDataset } from "./domain/normalize.mjs";
import { importedRecipeCategory, recipeEditorCategories, RECIPE_CATEGORIES } from "./features/recipes/categories.mjs";
import { parsePastedRecipeText, parseRecipeJsonLd } from "./features/recipes/import-parser.mjs";

const root = document.querySelector("#app");
const status = document.querySelector("#previewNotice");
let dataset = { recipes: [], restaurants: [], pizzas: [], cats: [] };
let cloudDataset = { recipes: [], restaurants: [], pizzas: [], cats: [] };
let cloudRevision = 0;
let cloudClient = null;
let cloudReady = false;
let cloudRecipeIds = new Set();
let activeView = "home";
let activeRecipeId = null;
let activeRestaurantId = null;
let activePizzaId = null;
let extractedRecipe = null;
function mergeVisibleDataset() {
  cloudRecipeIds = new Set(cloudDataset.recipes.map(item => String(item.id)));
  dataset = { ...cloudDataset };
}

async function saveCloudDataset(nextDataset) {
  if (!cloudClient || !cloudReady) throw new Error("Secure cloud storage is not ready. Nothing was saved.");
  const result = await cloudClient.save(nextDataset, cloudRevision);
  cloudRevision = result.revision;
  window.metroDatasetRevision = cloudRevision;
  cloudDataset = nextDataset;
  mergeVisibleDataset();
  return result;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function setStatus(label, kind = "") {
  status.textContent = label;
  status.className = `status ${kind}`.trim();
}
function restaurantReviewRecords(restaurant) {
  const records = [...(Array.isArray(restaurant?.reviewHistory) ? restaurant.reviewHistory : []), ...(restaurant?.survey ? [restaurant.survey] : [])];
  const signatures = new Set();
  return records.filter(review => {
    if (!review || typeof review !== "object" || Array.isArray(review)) return false;
    const signature = JSON.stringify(Object.keys(review).filter(key => !["id", "_id", "restaurantId"].includes(key)).sort().map(key => [key, review[key]]));
    if (signatures.has(signature)) return false;
    signatures.add(signature);
    return true;
  });
}
function renderRestaurants(items) {
  const rows = items.map(restaurant => {
    const reviews = restaurantReviewRecords(restaurant);
    const rating = restaurant.rating == null ? null : (restaurant.ratingScale === 10 ? Number(restaurant.rating) : Number(restaurant.rating) <= 5 ? Number(restaurant.rating) * 2 : Number(restaurant.rating));
    const reviewRows = reviews.slice().reverse().map((review, index) => {
      const reviewDate = review.visitedAt || review.createdAt || review.reviewDate || "";
      const dateText = reviewDate && !Number.isNaN(new Date(reviewDate).getTime()) ? new Date(reviewDate).toLocaleDateString() : reviewDate;
      const scores = [["Overall", reviewRating(review, "overall") ?? reviewRating(review, "rating")], ["Food", reviewRating(review, "food")], ["Service", reviewRating(review, "service")], ["Value", reviewRating(review, "value")], ["Ambiance", reviewRating(review, "ambiance")]]
        .filter(([, value]) => value != null && value !== "")
        .map(([label, value]) => `<span>${label}: ${escapeHtml(value)}/10</span>`).join("");
      return `<article class="savedReview"><div class="savedReviewHeading"><strong>${dateText ? escapeHtml(dateText) : `Visit ${reviews.length - index}`}</strong>${scores ? `<div class="reviewScores">${scores}</div>` : ""}</div>${review.order ? `<p><strong>What you ordered:</strong> ${escapeHtml(review.order)}</p>` : ""}${review.notes ? `<p>${escapeHtml(review.notes)}</p>` : ""}</article>`;
    }).join("");
    const details = [["Cuisine", restaurant.cuisine], ["Address", restaurant.address], ["Website", restaurant.website], ["Notes", restaurant.notes], ["Favorite", restaurant.favorite ? "Yes" : ""]]
      .filter(([, value]) => value != null && value !== "")
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${label === "Website" && /^https?:\/\//i.test(String(value)) ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>` : escapeHtml(value)}</dd></div>`).join("");
    return `<article class="readOnlyItem restaurantCard"><div class="recipeCardHeader"><strong>${escapeHtml(restaurant.name)}</strong><div class="recipeCardActions"><button class="btn" type="button" data-action="edit-restaurant" data-restaurant-id="${escapeHtml(restaurant.id)}">Edit</button><button class="btn" type="button" data-action="add-restaurant-review" data-restaurant-id="${escapeHtml(restaurant.id)}">Add visit / review</button><button class="btn danger" type="button" data-action="delete-restaurant" data-restaurant-id="${escapeHtml(restaurant.id)}">Delete</button></div></div><small>${escapeHtml([restaurant.cuisine, restaurant.address, rating == null ? "" : `Rating ${rating.toFixed(1)}/10`, restaurant.favorite ? "Favorite" : "", `${reviews.length} ${reviews.length === 1 ? "visit" : "visits"}`].filter(Boolean).join(" · ") || "No additional details saved")}</small><details><summary>Restaurant details and visit history</summary><section class="restaurantDetailBlock"><h4>Restaurant information</h4><dl>${details || `<div><dt>Details</dt><dd>No additional details saved.</dd></div>`}</dl></section><section class="restaurantDetailBlock"><h4>Visit history</h4>${reviewRows || `<p class="hint">No visits or reviews yet. Add a visit to start your personal history.</p>`}</section></details></article>`;
  }).join("");
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal</div><h2>My Restaurants</h2><p>Keep your restaurant details and visit-by-visit reviews together in your private Metro Eats account.</p></div></section><section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${items.length} saved</div><h3>Your restaurants &amp; reviews</h3></div><button class="btn primary" type="button" data-action="new-restaurant">＋ Add a Restaurant</button></div><div class="readOnlyList">${rows || `<div class="empty">No restaurants saved yet. Add one to start your private dining journal.</div>`}</div><p class="hint">Restaurants and every visit review are saved to your signed-in Preview account. Existing shared baseline records stay unchanged.</p></section>`;
}
function renderRestaurantEditor(restaurantId = null) {
  const restaurant = restaurantId ? cloudDataset.restaurants.find(item => String(item.id) === String(restaurantId)) : null;
  if (restaurantId && !restaurant) { activeView = "dining"; render(); return; }
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal</div><h2>${restaurant ? "Edit Restaurant" : "Add a Restaurant"}</h2><p>Save restaurant details once, then add a separate review for each visit.</p></div></section><section class="content-panel restaurantEditorPage"><div class="restaurantEditPanel"><label>Restaurant name<input id="restaurant-name" required maxlength="180" value="${escapeHtml(restaurant?.name || "")}" placeholder="e.g. Main Street Cafe"></label><div class="restaurantEditorGrid"><label>Cuisine<input id="restaurant-cuisine" maxlength="120" value="${escapeHtml(restaurant?.cuisine || "")}" placeholder="e.g. Italian"></label><label>Website<input id="restaurant-website" type="url" maxlength="500" value="${escapeHtml(restaurant?.website || "")}" placeholder="https://"></label></div><label>Address<input id="restaurant-address" maxlength="300" value="${escapeHtml(restaurant?.address || "")}" placeholder="Street, city"></label><label>Notes<textarea id="restaurant-notes" rows="3" maxlength="5000" placeholder="Anything you want to remember">${escapeHtml(restaurant?.notes || "")}</textarea></label><label class="inlineCheck"><input id="restaurant-favorite" type="checkbox"${restaurant?.favorite ? " checked" : ""}> Favorite</label><div class="recipeEditActions"><button class="btn" type="button" data-action="cancel-restaurant-edit">Cancel</button><button class="btn primary" type="button" data-action="save-restaurant" data-restaurant-id="${escapeHtml(restaurant?.id || "")}">${restaurant ? "Save Changes" : "Save Restaurant"}</button></div><p class="edit-status" role="status" aria-live="polite"></p></div></section>`;
}
function renderRestaurantReviewForm(restaurantId) {
  const restaurant = cloudDataset.restaurants.find(item => String(item.id) === String(restaurantId));
  if (!restaurant) { activeView = "dining"; render(); return; }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal · Visit review</div><h2>Add a Visit</h2><p>For ${escapeHtml(restaurant.name)}. Each visit is saved separately so your history stays intact.</p></div></section><section class="content-panel restaurantEditorPage"><div class="restaurantEditPanel"><label>Visit date<input id="review-visited-at" type="date" value="${today}" required></label><div class="pizzaScoreGrid restaurantScoreGrid">${[["overall","Overall"],["food","Food"],["service","Service"],["value","Value"],["ambiance","Ambiance"]].map(([key,label])=>`<label>${label} (0–10)<input id="review-${key}" type="number" min="0" max="10" step=".1" inputmode="decimal"></label>`).join("")}</div><label>What you ordered<input id="review-order" maxlength="500" placeholder="Dishes or drinks"></label><label>Notes<textarea id="review-notes" rows="4" maxlength="5000" placeholder="What stood out? Would you return?"></textarea></label><div class="recipeEditActions"><button class="btn" type="button" data-action="cancel-restaurant-edit">Cancel</button><button class="btn primary" type="button" data-action="save-restaurant-review" data-restaurant-id="${escapeHtml(restaurant.id)}">Save Visit Review</button></div><p class="edit-status" role="status" aria-live="polite"></p></div></section>`;
}
function renderHome() {
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">St. Louis • Metro East</div><h2>Metro Eats<br><span class="fl">⚜</span> Recipes & Dining</h2><p>Your personal recipe book and restaurant journal — built around the food you actually love.</p><div class="homeFeatureButtons"><button class="homeFeatureButton recipeButton" data-view="recipes"><span class="homeFeatureIcon">✦</span><span><strong>My Recipes</strong><small>Your Kitchen</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton diningButton" data-view="dining"><span class="homeFeatureIcon" aria-hidden="true">⚜</span><span><strong>My Restaurants</strong><small>Your Restaurants & Reviews</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton pizzaButton" data-view="pizzas"><span class="homeFeatureIcon pizzaIcon" aria-hidden="true"></span><span><strong>My Frozen Pizzas</strong><small>Rate and compare</small></span><span class="homeFeatureArrow">→</span></button></div></div></section><section class="localNewsPanel" aria-labelledby="local-news-title"><div class="panel-heading"><div><p class="eyebrow">St. Louis • Metro East</p><h2 id="local-news-title">Local Food News</h2></div><span class="status">Food & restaurants</span></div><p class="newsIntro">Restaurant openings, local food stories, dining news, and Sauce Magazine highlights.</p><div id="local-food-news" class="localNewsList" aria-live="polite"><p class="hint">Loading local food stories…</p></div><p class="hint" id="local-news-updated"></p></section><div class="homeColumns"><article class="featureCard"><div><div class="sectionKicker">Your Collection</div><h3>Saved with care</h3><p>Your recipes, restaurant visits, and frozen-pizza ratings stay with your account.</p></div><div class="actions"><button class="btn primary" data-view="recipes">Open My Recipes →</button><button class="btn" data-view="dining">Open My Restaurants →</button><button class="btn" data-view="pizzas">Open My Frozen Pizzas →</button></div></article><article class="featureCard accent"><div><div class="sectionKicker">Safety First</div><h3>Existing data stays safe.</h3><p>Shared baseline records stay read-only. Your signed-in Preview account saves its own recipes, reviews, and pizza ratings.</p></div><span class="status">Private account</span></article></div>`;
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
    <p class="hint">Recipes are saved to your signed-in Metro Eats Preview cloud account. Shared baseline records remain unchanged. URL fetching is server-side and uses redirect and network-safety checks.</p>
  </section>`;
}
function ratingValue(value, key = "") {
  const number = Number(value);
  if (value == null || value === "" || !Number.isFinite(number)) return value;
  if (!/^(rating|overall)$/i.test(key)) return value;
  // Convert legacy restaurant/review ratings on a 5-point scale for display only.
  return number >= 0 && number <= 5 ? number * 2 : number;
}
function reviewRating(review, key) {
  const value = review?.[key];
  const number = Number(value);
  if (value == null || value === "" || !Number.isFinite(number)) return null;
  return review?.ratingScale === 10 || number > 5 ? number : number * 2;
}
function renderList(title, eyebrow, items, kind) {
  if (kind === "dining") { renderRestaurants(items); return; }
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
    return `<article class="readOnlyItem" data-category="${escapeHtml(item.category || "")}">${isRecipe ? `<div class="recipeCardHeader"><strong>${escapeHtml(item.title)}</strong>${cloudRecipeIds.has(String(item.id)) ? `<div class="recipeCardActions"><button class="btn recipeEditButton" type="button" data-action="open-recipe-edit" data-recipe-id="${escapeHtml(item.id)}">Edit</button><button class="btn" type="button" data-action="print-recipe" data-recipe-id="${escapeHtml(item.id)}">Print / PDF</button><button class="btn" type="button" data-action="share-recipe" data-recipe-id="${escapeHtml(item.id)}">Create share link</button><button class="btn" type="button" data-action="revoke-share" data-recipe-id="${escapeHtml(item.id)}">Revoke link</button></div>` : ""}</div>` : `<strong>${escapeHtml(item.name)}</strong>`}<small>${escapeHtml(isRecipe ? [item.category, item.subcategory, ingredients.length ? `${ingredients.length} ingredients` : "", ...timeParts].filter(Boolean).join(" · ") : [item.cuisine, item.address, restaurantRating != null ? `Rating ${restaurantRating.toFixed(1)}/10` : "", item.favorite ? "Favorite" : "", reviewSummary].filter(Boolean).join(" · ") || "No additional details saved")}</small>${isRecipe && (item.createdAt || item.updatedAt) ? `<p class="recipeSavedDate">Saved ${escapeHtml(formatDateTime(item.updatedAt || item.createdAt))}</p>` : ""}${isRecipe && (ingredients.length || directions.length) ? `<details><summary>View recipe</summary>${ingredients.length ? `<section class="recipeDetailBlock"><h4>Ingredients</h4><ul>${ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join("")}</ul></section>` : `<p class="hint">No ingredients were found for this recipe.</p>`}${directions.length ? `<section class="recipeDetailBlock"><h4>Directions</h4><ol>${directions.map(step => `<li>${escapeHtml(cleanStep(step))}</li>`).join("")}</ol></section>` : ""}</details>` : restaurantDetails}</article>`;
  }).join("");
  if (isRecipe) {
    const categories = RECIPE_CATEGORIES;
    root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your kitchen</div><h2>My Recipes</h2><p>Good food. Great stories. Recipes worth keeping.</p></div></section>
      <section class="content-panel recipeCollectionPanel">
        <div class="sectionTitle"><div><div class="sectionKicker">Your collection</div><h3>Saved recipes</h3></div><button class="btn primary" type="button" data-view="add-recipe">＋ Add a Recipe</button></div>
        <div class="recipeBrowseTools"><div class="field"><label for="recipe-search">Search your recipes</label><input id="recipe-search" type="search" placeholder="Search by name, ingredient, or direction"></div><div class="field"><label for="recipe-category">Category</label><select id="recipe-category"><option value="">All categories</option>${categories.map(category=>`<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("")}</select></div></div>
        <div id="recipe-collection-list" class="readOnlyList">${rows ? rows : `<div class="empty">No recipes were found in the data source this preview can read.</div>`}</div>
        <p class="hint">Recipes saved to your account are stored in secure Preview cloud storage and can sync across devices. Shared baseline records and Production data are not changed.</p>
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
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2><p>A read-only view of your current saved ${kind}.</p></div></section><section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${items.length} saved</div><h3>${title}</h3></div><span class="status">${kind === "recipes" ? "Cloud account" : "Read only"}</span></div>${rows ? `<div class="readOnlyList">${rows}</div>` : `<div class="empty">No ${kind} were found in the data source this preview can read.</div>`}<p class="hint">Shared baseline records are read-only. Recipe changes are available only for records saved to your signed-in Preview cloud account.</p></section>`;
}
function renderRecipeEditor(recipeId) {
  const recipe = dataset.recipes.find(item => String(item.id) === String(recipeId));
  if (!recipe || !cloudRecipeIds.has(String(recipe.id))) {
    activeView = "recipes";
    render();
    return;
  }
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const directions = Array.isArray(recipe.directions) ? recipe.directions : [];
  const currentCategory = String(recipe.category || "Other");
  const editorCategories = recipeEditorCategories(currentCategory);
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your kitchen · Recipe editor</div><h2>Edit Recipe</h2><p>Update your recipe details, then save to return to your recipe list.</p></div></section>
    <section class="content-panel recipeEditorPage"><form class="recipeEditPanel recipeEditorForm" data-recipe-id="${escapeHtml(recipe.id)}">
      <div class="sectionTitle"><div><div class="sectionKicker">Editing recipe</div><h3>${escapeHtml(recipe.title)}</h3></div></div>
      <label>Recipe title<input data-edit-field="title" value="${escapeHtml(recipe.title)}" required maxlength="180"></label>
      <div class="recipeEditorTaxonomy"><label>Recipe category<select data-edit-field="category">${editorCategories.map(category => `<option value="${escapeHtml(category)}"${currentCategory === category ? " selected" : ""}>${escapeHtml(category)}</option>`).join("")}</select></label><label>Subcategory<input data-edit-field="subcategory" value="${escapeHtml(recipe.subcategory || "")}" placeholder="e.g. Beef"></label></div>
      <label>Ingredients, one per line<textarea data-edit-field="ingredients" rows="8" required>${escapeHtml(ingredients.join("\n"))}</textarea></label>
      <label>Directions, one step per line<textarea data-edit-field="directions" rows="8" required>${escapeHtml(directions.join("\n"))}</textarea></label>
      <div class="recipeEditActions"><button class="btn" type="button" data-view="recipes">Cancel</button><button class="btn primary" type="button" data-action="save-recipe-edit" data-recipe-id="${escapeHtml(recipe.id)}">Save Changes</button><button class="btn danger" type="button" data-action="delete-recipe" data-recipe-id="${escapeHtml(recipe.id)}">Delete Recipe</button></div><p class="edit-status" role="status" aria-live="polite"></p>
    </form></section>`;
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
  const pizza = activePizzaId ? cloudDataset.pizzas.find(item => String(item.id) === String(activePizzaId)) : null;
  if (activePizzaId && !pizza) activePizzaId = null;
  const scores = pizza?.scores || {};
  const pizzaRows = [...(dataset.pizzas || [])].sort((a, b) => Number(b.scores?.overall ?? -1) - Number(a.scores?.overall ?? -1) || String(a.name).localeCompare(String(b.name))).map(item => {
    const itemScores = item.scores || {};
    const scoreLine = [["Overall",itemScores.overall],["Taste",itemScores.taste],["Crust",itemScores.crust],["Sauce",itemScores.sauce],["Cheese",itemScores.cheese],["Toppings",itemScores.toppings],["Value",itemScores.value]].filter(([,value])=>value!=null).map(([label,value])=>`${label} ${Number(value).toFixed(1)}`).join(" · ");
    return `<article class="readOnlyItem pizzaCard"><div class="recipeCardHeader"><strong>${escapeHtml([item.brand,item.name].filter(Boolean).join(" · "))}</strong><div class="recipeCardActions"><button class="btn" type="button" data-action="edit-pizza" data-pizza-id="${escapeHtml(item.id)}">Edit</button><button class="btn danger" type="button" data-action="delete-pizza" data-pizza-id="${escapeHtml(item.id)}">Delete</button></div></div><small>${escapeHtml([item.upc ? `UPC ${item.upc}` : "", item.price == null ? "" : `$${Number(item.price).toFixed(2)}`].filter(Boolean).join(" · ") || "No barcode or price saved")}</small>${scoreLine ? `<p class="pizzaScoreLine">${escapeHtml(scoreLine)}</p>` : `<p class="hint">No ratings saved yet.</p>`}${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ""}</article>`;
  }).join("");
  const scoreFields = [["taste","Taste"],["crust","Crust"],["sauce","Sauce"],["cheese","Cheese"],["toppings","Toppings"],["value","Value"],["overall","Overall score"]]
    .map(([key,label])=>`<label>${label} (0–10)<input id="pizza-${key}" type="number" min="0" max="10" step=".1" inputmode="decimal" value="${scores[key] ?? ""}"></label>`).join("");
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your freezer • Your ratings</div><h2>My Frozen Pizzas <span class="pizzaHeadingIcon" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><circle cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="21"/><path d="M32 11 L49 46 Q32 39 15 46 Z"/><circle cx="29" cy="25" r="2.3"/><circle cx="35" cy="32" r="2.3"/><circle cx="29" cy="36" r="2.3"/></svg></span></h2><p>Save and compare your frozen-pizza ratings in your private Metro Eats account.</p></div></section>
  <section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${(dataset.pizzas || []).length} saved</div><h3>Your frozen-pizza ratings</h3></div></div><div class="pizzaCollection">${pizzaRows || `<div class="empty">No frozen pizzas saved yet. Add one below to start your rankings.</div>`}</div></section>
  <section class="content-panel pizzaEditorPanel"><div class="sectionTitle"><div><div class="sectionKicker">${pizza ? "Edit saved pizza" : "Your next review"}</div><h3>${pizza ? "Update a Frozen Pizza" : "Add a Frozen Pizza"}</h3></div></div><p class="hint">Enter a UPC by hand if you have it. Camera scanning and automatic product lookup are not connected yet.</p><div class="pizzaEditForm"><div class="restaurantEditorGrid"><label>UPC barcode<input id="pizza-upc" inputmode="numeric" autocomplete="off" maxlength="14" value="${escapeHtml(pizza?.upc || "")}" placeholder="8–14 digits"></label><label>Brand<input id="pizza-brand" maxlength="120" required value="${escapeHtml(pizza?.brand || "")}" placeholder="e.g. DiGiorno"></label></div><label>Pizza name / variety<input id="pizza-name" maxlength="180" required value="${escapeHtml(pizza?.name || "")}" placeholder="e.g. Rising Crust Pepperoni"></label><label>Purchase price<input id="pizza-price" type="number" inputmode="decimal" min="0" step=".01" value="${pizza?.price ?? ""}" placeholder="0.00"></label><div class="pizzaScoreGrid">${scoreFields}</div><label>Review notes<textarea id="pizza-notes" rows="3" maxlength="5000" placeholder="What stood out? Would you buy it again?">${escapeHtml(pizza?.notes || "")}</textarea></label><div class="recipeEditActions"><button class="btn" type="button" data-action="cancel-pizza-edit">${pizza ? "Cancel" : "Clear"}</button><button class="btn primary" type="button" data-action="save-pizza" data-pizza-id="${escapeHtml(pizza?.id || "")}">${pizza ? "Save Changes" : "Save Pizza & Ratings"}</button></div><p class="edit-status" role="status" aria-live="polite"></p></div><p class="hint">Pizza entries are private to your account and are included in automatic restore points.</p></section>`;
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
  preview.innerHTML = `<article class="parsedRecipe"><p class="sectionKicker">Review before saving</p><div class="field"><label for="review-recipe-title">Recipe title</label><input id="review-recipe-title" maxlength="180" value="${escapeHtml(recipe.title)}"></div><div class="field"><label for="review-recipe-category">Recipe category</label><select id="review-recipe-category">${RECIPE_CATEGORIES.map(category => `<option value="${escapeHtml(category)}"${category === "Other" ? " selected" : ""}>${escapeHtml(category)}</option>`).join("")}</select></div>${metadata.length ? `<dl>${metadata.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}${recipe.source ? `<p class="note"><a class="recipeSourceLink" href="${escapeHtml(recipe.source)}" target="_blank" rel="noopener noreferrer">Recipe link ↗</a></p>` : ""}<div class="field"><label for="review-recipe-ingredients">Ingredients (one per line)</label><textarea id="review-recipe-ingredients" rows="8" maxlength="30000">${escapeHtml(ingredients.join("\n"))}</textarea></div><div class="field"><label for="review-recipe-directions">Directions (one step per line)</label><textarea id="review-recipe-directions" rows="8" maxlength="30000">${escapeHtml(directions.join("\n"))}</textarea></div><div class="actions"><button class="btn primary" type="button" data-action="save-recipe">Save to My Recipes</button></div><p id="recipe-save-status" class="importFeedback" role="status" aria-live="polite"></p></article>`;
}
function render() {
  document.querySelector(".app > .top")?.classList.toggle("homeStickyHeader", activeView === "home");
  root.classList.add("section", "active");
  root.classList.remove("recipeSection", "diningSection", "pizzaSection");
  if (activeView === "recipes") root.classList.add("recipeSection");
  if (activeView === "dining" || activeView.startsWith("restaurant-")) root.classList.add("diningSection");
  if (activeView === "pizzas") root.classList.add("pizzaSection");
  document.querySelectorAll("[data-view]").forEach(button => {
    const currentSection = activeView.startsWith("restaurant-") ? "dining" : activeView;
    const active = button.dataset.view === currentSection;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  if (activeView === "recipes") renderList("My Recipes", "Your kitchen", dataset.recipes, "recipes");
  else if (activeView === "add-recipe") renderAddRecipe();
  else if (activeView === "edit-recipe") renderRecipeEditor(activeRecipeId);
  else if (activeView === "dining") renderList("My Restaurants", "Your restaurants", dataset.restaurants, "dining");
  else if (activeView === "restaurant-edit") renderRestaurantEditor(activeRestaurantId);
  else if (activeView === "restaurant-review") renderRestaurantReviewForm(activeRestaurantId);
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
  if (actionButton.dataset.action === "new-restaurant") {
    activeRestaurantId = null;
    activeView = "restaurant-edit";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "edit-restaurant") {
    activeRestaurantId = actionButton.dataset.restaurantId;
    activeView = "restaurant-edit";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "add-restaurant-review") {
    activeRestaurantId = actionButton.dataset.restaurantId;
    activeView = "restaurant-review";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "cancel-restaurant-edit") {
    activeRestaurantId = null;
    activeView = "dining";
    render();
    return;
  }
  if (actionButton.dataset.action === "save-restaurant") {
    const statusLine = actionButton.closest(".restaurantEditPanel")?.querySelector(".edit-status");
    const name = document.querySelector("#restaurant-name")?.value.trim() || "";
    const cuisine = document.querySelector("#restaurant-cuisine")?.value.trim() || "";
    const address = document.querySelector("#restaurant-address")?.value.trim() || "";
    const website = document.querySelector("#restaurant-website")?.value.trim() || "";
    const notes = document.querySelector("#restaurant-notes")?.value.trim() || "";
    const favorite = Boolean(document.querySelector("#restaurant-favorite")?.checked);
    if (!name) { if (statusLine) statusLine.textContent = "Enter a restaurant name before saving."; return; }
    if (website) {
      try { const url = new URL(website); if (!/^https?:$/.test(url.protocol)) throw new Error(); }
      catch { if (statusLine) statusLine.textContent = "Enter a complete http:// or https:// website address."; return; }
    }
    const id = actionButton.dataset.restaurantId;
    const existing = id ? cloudDataset.restaurants.find(item => String(item.id) === String(id)) : null;
    if (id && !existing) { if (statusLine) statusLine.textContent = "This restaurant is no longer in your account. Reload before saving."; return; }
    const now = new Date().toISOString();
    const restaurant = { ...(existing || {}), id: existing?.id || `metro-restaurant-${crypto.randomUUID()}`, name, cuisine, address, website, notes, favorite, ratingScale: 10, createdAt: existing?.createdAt || now, updatedAt: now };
    const restaurants = existing
      ? cloudDataset.restaurants.map(item => String(item.id) === String(id) ? restaurant : item)
      : [...cloudDataset.restaurants, restaurant];
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, restaurants });
      activeRestaurantId = null;
      activeView = "dining";
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (error) {
      if (statusLine) statusLine.textContent = error?.message || "Cloud save failed. The restaurant was not reported as saved.";
      actionButton.disabled = false;
    }
    return;
  }
  if (actionButton.dataset.action === "save-restaurant-review") {
    const statusLine = actionButton.closest(".restaurantEditPanel")?.querySelector(".edit-status");
    const id = actionButton.dataset.restaurantId;
    const restaurant = cloudDataset.restaurants.find(item => String(item.id) === String(id));
    if (!restaurant) { if (statusLine) statusLine.textContent = "This restaurant is no longer in your account. Reload before saving."; return; }
    const visitedAt = document.querySelector("#review-visited-at")?.value || "";
    const scores = Object.fromEntries(["overall", "food", "service", "value", "ambiance"].map(key => {
      const raw = document.querySelector(`#review-${key}`)?.value ?? "";
      return [key, raw === "" ? null : Number(raw)];
    }));
    const order = document.querySelector("#review-order")?.value.trim() || "";
    const notes = document.querySelector("#review-notes")?.value.trim() || "";
    if (!visitedAt || scores.overall == null || !Number.isFinite(scores.overall) || scores.overall < 0 || scores.overall > 10) {
      if (statusLine) statusLine.textContent = "Choose a visit date and an overall rating from 0 to 10.";
      return;
    }
    if (Object.values(scores).some(value => value != null && (!Number.isFinite(value) || value < 0 || value > 10))) {
      if (statusLine) statusLine.textContent = "Every rating must be between 0 and 10.";
      return;
    }
    const now = new Date().toISOString();
    const review = { id: `metro-review-${crypto.randomUUID()}`, visitedAt, createdAt: now, ...scores, order, notes, ratingScale: 10 };
    const reviewHistory = [...(Array.isArray(restaurant.reviewHistory) ? restaurant.reviewHistory : []), review];
    const previousScores = restaurantReviewRecords(restaurant).map(item => reviewRating(item, "overall") ?? reviewRating(item, "rating")).filter(value => Number.isFinite(Number(value))).map(Number);
    const allScores = [...previousScores, scores.overall];
    const updated = { ...restaurant, reviewHistory, rating: allScores.reduce((sum, value) => sum + value, 0) / allScores.length, ratingScale: 10, updatedAt: now };
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, restaurants: cloudDataset.restaurants.map(item => String(item.id) === String(id) ? updated : item) });
      activeRestaurantId = null;
      activeView = "dining";
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (error) {
      if (statusLine) statusLine.textContent = error?.message || "Cloud save failed. No visit was reported as saved.";
      actionButton.disabled = false;
    }
    return;
  }
  if (actionButton.dataset.action === "delete-restaurant") {
    const id = actionButton.dataset.restaurantId;
    const restaurant = cloudDataset.restaurants.find(item => String(item.id) === String(id));
    if (!restaurant || !window.confirm(`Delete “${restaurant.name}” and its visit history from your Preview account?`)) return;
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, restaurants: cloudDataset.restaurants.filter(item => String(item.id) !== String(id)) });
      render();
    } catch (error) {
      actionButton.disabled = false;
      const card = actionButton.closest(".restaurantCard");
      let statusLine = card?.querySelector(".edit-status");
      if (!statusLine && card) { statusLine = document.createElement("p"); statusLine.className = "edit-status"; statusLine.setAttribute("role", "status"); card.append(statusLine); }
      if (statusLine) statusLine.textContent = error?.message || "Cloud delete failed. Nothing was removed.";
    }
    return;
  }
  if (actionButton.dataset.action === "save-pizza") {
    const statusLine = actionButton.closest(".pizzaEditorPanel")?.querySelector(".edit-status");
    const brand = document.querySelector("#pizza-brand")?.value.trim() || "";
    const name = document.querySelector("#pizza-name")?.value.trim() || "";
    const upc = document.querySelector("#pizza-upc")?.value.trim() || "";
    const priceRaw = document.querySelector("#pizza-price")?.value ?? "";
    const notes = document.querySelector("#pizza-notes")?.value.trim() || "";
    const scores = Object.fromEntries(["taste", "crust", "sauce", "cheese", "toppings", "value", "overall"].map(key => {
      const raw = document.querySelector(`#pizza-${key}`)?.value ?? "";
      return [key, raw === "" ? null : Number(raw)];
    }));
    const componentScores = ["taste", "crust", "sauce", "cheese", "toppings", "value"].map(key => scores[key]).filter(value => value != null);
    if (!brand || !name) { if (statusLine) statusLine.textContent = "Enter both a brand and a pizza name."; return; }
    if (upc && !/^\d{8,14}$/.test(upc)) { if (statusLine) statusLine.textContent = "Enter 8 to 14 UPC digits, or leave the barcode blank."; return; }
    const price = priceRaw === "" ? null : Number(priceRaw);
    if (price != null && (!Number.isFinite(price) || price < 0)) { if (statusLine) statusLine.textContent = "Enter a valid nonnegative price."; return; }
    if (Object.values(scores).some(value => value != null && (!Number.isFinite(value) || value < 0 || value > 10))) { if (statusLine) statusLine.textContent = "Every rating must be between 0 and 10."; return; }
    if (scores.overall == null) {
      if (!componentScores.length) { if (statusLine) statusLine.textContent = "Enter at least one category rating or an overall rating."; return; }
      scores.overall = Math.round(componentScores.reduce((sum, value) => sum + value, 0) / componentScores.length * 10) / 10;
    }
    const id = actionButton.dataset.pizzaId;
    const existing = id ? cloudDataset.pizzas.find(item => String(item.id) === String(id)) : null;
    if (id && !existing) { if (statusLine) statusLine.textContent = "This pizza is no longer in your account. Reload before saving."; return; }
    const now = new Date().toISOString();
    const pizza = { ...(existing || {}), id: existing?.id || `metro-pizza-${crypto.randomUUID()}`, upc, brand, name, price, scores, notes, createdAt: existing?.createdAt || now, updatedAt: now };
    const pizzas = existing
      ? cloudDataset.pizzas.map(item => String(item.id) === String(id) ? pizza : item)
      : [...(cloudDataset.pizzas || []), pizza];
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, pizzas });
      activePizzaId = null;
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (error) {
      if (statusLine) statusLine.textContent = error?.message || "Cloud save failed. The pizza was not reported as saved.";
      actionButton.disabled = false;
    }
    return;
  }
  if (actionButton.dataset.action === "edit-pizza") {
    activePizzaId = actionButton.dataset.pizzaId;
    render();
    document.querySelector(".pizzaEditorPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (actionButton.dataset.action === "cancel-pizza-edit") {
    activePizzaId = null;
    render();
    return;
  }
  if (actionButton.dataset.action === "delete-pizza") {
    const id = actionButton.dataset.pizzaId;
    const pizza = cloudDataset.pizzas.find(item => String(item.id) === String(id));
    if (!pizza || !window.confirm(`Delete “${pizza.brand} ${pizza.name}” from your Preview account?`)) return;
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, pizzas: cloudDataset.pizzas.filter(item => String(item.id) !== String(id)) });
      render();
    } catch (error) {
      actionButton.disabled = false;
      const card = actionButton.closest(".pizzaCard");
      let statusLine = card?.querySelector(".edit-status");
      if (!statusLine && card) { statusLine = document.createElement("p"); statusLine.className = "edit-status"; statusLine.setAttribute("role", "status"); card.append(statusLine); }
      if (statusLine) statusLine.textContent = error?.message || "Cloud delete failed. Nothing was removed.";
    }
    return;
  }
  if (actionButton.dataset.action === "print-recipe") {
    const card = actionButton.closest(".readOnlyItem");
    card?.querySelectorAll("details").forEach(item => { item.open = true; });
    window.print();
    return;
  }
  if (["share-recipe", "revoke-share"].includes(actionButton.dataset.action)) {
    const status = document.createElement("p");
    status.className = "recipeShareStatus";
    status.setAttribute("role", "status");
    actionButton.closest(".readOnlyItem")?.append(status);
    actionButton.disabled = true;
    try {
      const token = await globalThis.metroGetAccessToken?.();
      if (!token) throw new Error("Sign in again to manage sharing.");
      const create = actionButton.dataset.action === "share-recipe";
      const response = await fetch("/api/recipe-share", {
        method: create ? "POST" : "DELETE",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        ...(create ? { body: JSON.stringify({ recipeId: actionButton.dataset.recipeId }) } : { body: JSON.stringify({ recipeId: actionButton.dataset.recipeId }) })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Could not update the share link.");
      if (create) {
        const shareUrl = new URL("/share-recipe/", location.origin);
        shareUrl.searchParams.set("token", result.token);
        status.textContent = "Private recipe link created: ";
        const link = document.createElement("a");
        link.href = shareUrl.href;
        link.textContent = "Open shared recipe";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        status.append(link);
        if (navigator.clipboard?.writeText) {
          try { await navigator.clipboard.writeText(shareUrl.href); status.textContent += " (copied)"; } catch { /* Keep the visible link usable if clipboard access is unavailable. */ }
        }
      } else status.textContent = "Any existing link for this recipe has been revoked.";
    } catch (error) { status.textContent = error?.message || "Could not update the share link."; }
    finally { actionButton.disabled = false; }
    return;
  }
  if (actionButton.dataset.action === "open-recipe-edit") {
    activeRecipeId = actionButton.dataset.recipeId;
    activeView = "edit-recipe";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    root.focus({ preventScroll: true });
    return;
  }
  if (actionButton.dataset.action === "delete-recipe") {
    const id = actionButton.dataset.recipeId;
    const recipe = cloudDataset.recipes.find(item => String(item.id) === String(id));
    if (!recipe) return;
    if (!window.confirm(`Delete “${recipe.title}” from your Metro Eats Preview account? This cannot be undone here.`)) return;
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, recipes: cloudDataset.recipes.filter(item => String(item.id) !== String(id)) });
      render();
    } catch (error) {
      const status = actionButton.closest(".recipeEditPanel")?.querySelector(".edit-status");
      if (status) status.textContent = error?.message || "Cloud delete failed. Nothing was removed.";
      actionButton.disabled = false;
    }
    return;
  }
  if (actionButton.dataset.action === "save-recipe-edit") {
    const id = actionButton.dataset.recipeId;
    const panel = actionButton.closest(".recipeEditPanel");
    const title = panel?.querySelector('[data-edit-field="title"]')?.value.trim() || "";
    const category = panel?.querySelector('[data-edit-field="category"]')?.value || "Other";
    const subcategory = panel?.querySelector('[data-edit-field="subcategory"]')?.value.trim() || "";
    const ingredients = (panel?.querySelector('[data-edit-field="ingredients"]')?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    const directions = (panel?.querySelector('[data-edit-field="directions"]')?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    const status = panel?.querySelector(".edit-status");
    if (!title || !ingredients.length || !directions.length) {
      if (status) status.textContent = "Please enter a title, at least one ingredient, and at least one direction.";
      return;
    }
    try {
      const index = cloudDataset.recipes.findIndex(item => String(item.id) === String(id));
      if (index < 0) {
        if (status) status.textContent = "This recipe is not in your cloud account. Nothing was changed.";
        return;
      }
      const recipes = cloudDataset.recipes.slice();
      recipes[index] = { ...recipes[index], title, category, subcategory, ingredients, directions, updatedAt: new Date().toISOString() };
      actionButton.disabled = true;
      await saveCloudDataset({ ...cloudDataset, recipes });
      activeView = "recipes";
      activeRecipeId = null;
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    } catch (error) {
      if (status) status.textContent = error?.message || "Cloud save failed. Your previous recipe remains unchanged.";
      actionButton.disabled = false;
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
    const category = importedRecipeCategory(document.querySelector("#review-recipe-category")?.value);
    const ingredients = (document.querySelector("#review-recipe-ingredients")?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    const directions = (document.querySelector("#review-recipe-directions")?.value || "").split("\n").map(value => value.trim()).filter(Boolean);
    if (!title || !ingredients.length || !directions.length) { if (feedback) feedback.textContent = "Please provide a title, at least one ingredient, and at least one direction."; return; }
    const duplicate = cloudDataset.recipes.find(item =>
      String(item.title || "").trim().toLocaleLowerCase() === title.trim().toLocaleLowerCase() &&
      String(item.source || "").trim().toLocaleLowerCase() === String(extractedRecipe.source || "").trim().toLocaleLowerCase() &&
      JSON.stringify(item.ingredients || []) === JSON.stringify(ingredients) &&
      JSON.stringify(item.directions || item.steps || []) === JSON.stringify(directions)
    );
    const inlineStatus = document.querySelector("#recipe-save-status");
    if (duplicate) {
      if (inlineStatus) inlineStatus.textContent = "Already saved in your cloud account. No duplicate was added.";
      if (feedback) feedback.textContent = "This recipe is already saved in your cloud account.";
      return;
    }
    const recipe = { ...extractedRecipe, id: "metro-recipe-" + crypto.randomUUID(), title, ingredients, directions, category, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, recipes: [...cloudDataset.recipes, recipe] });
      const message = "Saved to your Metro Eats Preview account. Your recipe is now stored in cloud storage.";
      if (inlineStatus) inlineStatus.textContent = message;
      if (feedback) feedback.textContent = message;
      actionButton.textContent = "Saved ✓";
      actionButton.disabled = true;
    } catch (error) {
      if (inlineStatus) inlineStatus.textContent = error?.message || "Cloud save failed. Nothing was reported as saved.";
      if (feedback) feedback.textContent = error?.message || "Cloud save failed. Nothing was reported as saved.";
      actionButton.disabled = false;
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
        const token = await globalThis.metroGetAccessToken?.();
        if (!token) throw new Error("Sign in again to import a recipe.");
        const response = await fetch("/api/import-recipe-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json", Authorization: `Bearer ${token}` },
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

async function refreshDataset() {
  try {
    cloudReady = false;
    cloudDataset = { recipes: [], restaurants: [], pizzas: [], cats: [] };
    cloudRevision = 0;
    try {
      cloudClient = createUserDatasetClient({ getAccessToken: () => globalThis.metroGetAccessToken?.() });
      const cloud = await cloudClient.load();
      cloudDataset = normalizeDataset(cloud.data);
      cloudRevision = cloud.revision;
      window.metroDatasetRevision = cloudRevision;
      cloudReady = true;
    } catch (error) {
      cloudClient = null;
      console.warn("Metro Eats cloud storage is not ready:", error?.message || "Unavailable");
    }
    mergeVisibleDataset();
    const hasRecords = dataset.recipes.length > 0 || dataset.restaurants.length > 0;
    if (cloudReady) {
      setStatus("Signed in · secure cloud storage ready", "ok");
    } else {
      setStatus(hasRecords ? "Preview records loaded · cloud storage unavailable" : "Cloud storage is not ready", "warn");
    }
    render();
    if (activeView === "home") loadLocalFoodNews();
  } catch (error) {
    cloudReady = false;
    setStatus(error?.message || "Data unavailable", "warn");
    render();
    if (activeView === "home") loadLocalFoodNews();
  }
}

// Authentication is initialized by the following module in index.html. Do not
// block this module with a top-level await: loadDataset waits for metroAuthReady,
// which the auth module resolves. Blocking here can prevent that auth module from
// running, leaving the user trapped on the sign-in screen.
window.addEventListener("metro-authenticated", () => { void refreshDataset(); });
// The auth bootstrap in index.html can finish before this module downloads.
// If it already authenticated the page, recover here instead of missing the event.
if (document.body.classList.contains("metro-authenticated")) void refreshDataset();
