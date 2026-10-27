import { loadDataset } from "./data/repository.mjs";
import { parsePastedRecipeText, parseRecipeJsonLd } from "./features/recipes/import-parser.mjs";

const root = document.querySelector("#app");
const status = document.querySelector("#previewNotice");
let dataset = { recipes: [], restaurants: [], cats: [] };
let activeView = "home";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function setStatus(label, kind = "") {
  status.textContent = label;
  status.className = `status ${kind}`.trim();
}
function renderHome() {
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">St. Louis • Metro East</div><h2>Metro Eats<br><span class="fl">⚜</span> Recipes & Dining</h2><p>Your personal recipe book and restaurant journal — built around the food you actually love.</p><div class="homeFeatureButtons"><button class="homeFeatureButton recipeButton" data-view="recipes"><span class="homeFeatureIcon">✦</span><span><strong>Recipes</strong><small>Your Kitchen</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton diningButton" data-view="dining"><span class="homeFeatureIcon">⚜</span><span><strong>Dining Experience</strong><small>Your Restaurants & Reviews</small></span><span class="homeFeatureArrow">→</span></button></div></div></section><div class="homeColumns"><article class="featureCard"><div><div class="sectionKicker">Your Collection</div><h3>Saved with care</h3><p>Your recipes and restaurant notes, kept together in one place.</p></div><div class="actions"><button class="btn primary" data-view="recipes">Open Recipes →</button><button class="btn" data-view="dining">Open Dining →</button></div></article><article class="featureCard accent"><div><div class="sectionKicker">Safety First</div><h3>Existing data stays safe.</h3><p>This preview reads available records only. No recipe, restaurant, or review can be changed or overwritten here.</p></div><span class="status">Read only</span></article></div><section class="localNewsPanel" aria-labelledby="local-news-title"><div class="panel-heading"><div><p class="eyebrow">St. Louis • Metro East</p><h2 id="local-news-title">Local Food News</h2></div><span class="status">Food & restaurants</span></div><p class="newsIntro">Restaurant openings, local food stories, dining news, and Sauce Magazine highlights.</p><div id="local-food-news" class="localNewsList" aria-live="polite"><p class="hint">Loading local food stories…</p></div><p class="hint" id="local-news-updated"></p></section>`;
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
    <p class="importIntro">Import from a public recipe URL, paste recipe text, or paste webpage HTML / JSON-LD. Metro Eats extracts recipe-specific fields instead of copying the surrounding article.</p>
    <div class="field"><label for="import-mode">Import source</label>
    <select id="import-mode" class="importMode"><option value="text">Pasted recipe text</option><option value="jsonld">Pasted webpage HTML / JSON-LD</option><option value="url">Recipe webpage URL</option></select></div>
    <div id="import-text-fields" class="field"><label for="import-source">Recipe content</label><textarea id="import-source" class="importSource" rows="9" maxlength="250000" placeholder="Paste a recipe with Ingredients and Directions sections…"></textarea></div>
    <div id="import-url-fields" class="field is-hidden"><label for="import-url">Public recipe webpage URL</label><input id="import-url" class="importUrl" type="url" inputmode="url" autocomplete="url" maxlength="2048" placeholder="https://example.com/recipe"></div>
    <div class="actions importActions"><button class="btn primary" type="button" data-action="parse-recipe">Extract recipe</button><button class="btn" type="button" data-action="clear-recipe">Clear</button></div>
    <p id="import-feedback" class="importFeedback" role="status" aria-live="polite">Nothing has been extracted yet.</p>
    <div id="import-preview" class="importPreview"></div>
    <p class="hint">Safety checkpoint: extraction only. Nothing is saved or overwritten. URL fetching is server-side, validates redirects, pins checked public IPv4 addresses, times out, and limits response size.</p>
  </section>`;
}
function renderList(title, eyebrow, items, kind) {
  const isRecipe = kind === "recipes";
  const rows = items.map(item => {
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
      return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
    };
    const displayValue = (value, key = "") => {
      if (value == null || value === "") return "";
      if (Array.isArray(value)) return value.map(item => displayValue(item)).filter(Boolean).join(", ");
      if (typeof value === "object") return escapeHtml(value.text ?? value.name ?? value.value ?? "");
      if (/^(createdAt|updatedAt|reviewDate|date|timestamp)$/i.test(key) && typeof value === "string") return escapeHtml(formatDateTime(value));
      return escapeHtml(value);
    };
    const fieldLabel = key => ({ createdAt: "Review date", updatedAt: "Last updated", orderAgain: "Order again" }[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()));
    const reviewRecords = [...(Array.isArray(item.reviewHistory) ? item.reviewHistory : []), ...(item.survey ? [item.survey] : [])];
    const reviewFields = reviewRecords.map((review, reviewIndex) => {
      if (!review || typeof review !== "object") return "";
      const ignored = new Set(["id", "_id", "restaurantId", "photos", "image", "images"]);
      const fields = Object.entries(review).filter(([key, value]) => !ignored.has(key) && value != null && value !== "" && typeof value !== "object" && !Array.isArray(value));
      return fields.length ? `<section class="restaurantDetailBlock"><h4>${reviewRecords.length > 1 ? `Review ${reviewIndex + 1}` : "Saved review"}</h4><dl>${fields.map(([key, value]) => `<div><dt>${escapeHtml(fieldLabel(key))}</dt><dd>${displayValue(value)}</dd></div>`).join("")}</dl></section>` : "";
    }).join("");
    const restaurantPhotos = Array.isArray(item.photos) ? item.photos : [];
    const reviewSummary = item.reviewCount ? `${item.reviewCount} saved review${item.reviewCount === 1 ? "" : "s"}` : "";
    const restaurantDetails = !isRecipe ? `<details><summary>View restaurant details</summary><section class="restaurantDetailBlock"><h4>Restaurant information</h4><dl>${[["Address",item.address],["Cuisine",item.cuisine],["Rating",item.rating],["Favorite",item.favorite ? "Yes" : ""],["Notes",item.notes],["Website",item.website],["Last updated",item.updatedAt ? formatDateTime(item.updatedAt) : ""]].filter(([,value])=>value!==""&&value!=null).map(([label,value])=>`<div><dt>${label}</dt><dd>${label === "Website" && /^https?:\/\//i.test(String(value)) ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>` : displayValue(value)}</dd></div>`).join("")}</dl></section>${reviewRecords.length ? reviewFields : `<p class="hint">No saved review details were found for this restaurant.</p>`}${restaurantPhotos.length ? `<section class="restaurantDetailBlock"><h4>Photos</h4><ul>${restaurantPhotos.map(photo=>`<li>${displayValue(photo)}</li>`).join("")}</ul></section>` : ""}</details>` : "";
    return `<article class="readOnlyItem"><strong>${escapeHtml(isRecipe ? item.title : item.name)}</strong><small>${escapeHtml(isRecipe ? [item.category, item.subcategory, ingredients.length ? `${ingredients.length} ingredients` : "", ...timeParts].filter(Boolean).join(" · ") : [item.cuisine, item.address, item.rating != null ? `Rating ${item.rating}` : "", item.favorite ? "Favorite" : "", reviewSummary].filter(Boolean).join(" · ") || "No additional details saved")}</small>${isRecipe && (ingredients.length || directions.length) ? `<details><summary>View recipe</summary>${ingredients.length ? `<section class="recipeDetailBlock"><h4>Ingredients</h4><ul>${ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join("")}</ul></section>` : `<p class="hint">No ingredients were found for this recipe.</p>`}${directions.length ? `<section class="recipeDetailBlock"><h4>Directions</h4><ol>${directions.map(step => `<li>${escapeHtml(cleanStep(step))}</li>`).join("")}</ol></section>` : ""}</details>` : restaurantDetails}</article>`;
  }).join("");
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">${eyebrow}</div><h2>${title}</h2><p>A read-only view of your current saved ${kind}.</p></div></section>${isRecipe ? renderImportPanel() : ""}<section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${items.length} saved</div><h3>${title}</h3></div><span class="status">Read only</span></div>${rows ? `<div class="readOnlyList">${rows}</div>` : `<div class="empty">No ${kind} were found in the data source this preview can read.</div>`}<p class="hint">Nothing in this screen can change or delete your existing records.</p></section>`;
}
function renderImportPreview(recipe) {
  const preview = document.querySelector("#import-preview");
  if (!preview) return;
  if (!recipe) { preview.innerHTML = ""; return; }
  const metadata = [["Servings", recipe.servings], ["Prep time", recipe.prepTime], ["Cook time", recipe.cookTime], ["Total time", recipe.totalTime]].filter(([, value]) => value);
  preview.innerHTML = `<article class="parsedRecipe"><p class="sectionKicker">Extracted recipe</p><h3>${escapeHtml(recipe.title)}</h3>${metadata.length ? `<dl>${metadata.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}${recipe.source ? `<p class="note">Source: ${escapeHtml(recipe.source)}</p>` : ""}<div class="parsedColumns"><section><h4>Ingredients · ${recipe.ingredients.length}</h4><ul>${recipe.ingredients.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section><h4>Directions · ${recipe.directions.length}</h4><ol>${recipe.directions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section></div></article>`;
}
function render() {
  root.classList.add("section", "active");
  root.classList.remove("recipeSection", "diningSection");
  if (activeView === "recipes") root.classList.add("recipeSection");
  if (activeView === "dining") root.classList.add("diningSection");
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.dataset.view === activeView;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
  });
  if (activeView === "recipes") renderList("Recipes", "Your kitchen", dataset.recipes, "recipes");
  else if (activeView === "dining") renderList("Dining", "Your restaurants", dataset.restaurants, "dining");
  else renderHome();
}
function syncImportMode() {
  const mode = document.querySelector("#import-mode")?.value || "text";
  document.querySelector("#import-text-fields")?.classList.toggle("is-hidden", mode === "url");
  document.querySelector("#import-url-fields")?.classList.toggle("is-hidden", mode !== "url");
  const label = document.querySelector("#import-source");
  if (label) label.placeholder = mode === "jsonld" ? "Paste webpage HTML containing Recipe JSON-LD…" : "Paste a recipe with Ingredients and Directions sections…";
}
document.addEventListener("change", event => {
  if (event.target?.id === "import-mode") syncImportMode();
});
document.addEventListener("click", async event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    event.preventDefault();
    activeView = viewButton.dataset.view;
    render();
    root.focus({ preventScroll: true });
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
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
    const mode = document.querySelector("#import-mode")?.value || "text";
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
  if (result.source.startsWith("local:")) setStatus("Loaded from this device", "ok");
  else if (result.source === "cloud") setStatus("Loaded from cloud", "ok");
  else setStatus(result.staleFallback ? "Data source unavailable" : "No saved data found", "warn");
  render();
  if (activeView === "home") loadLocalFoodNews();
} catch {
  setStatus("Data unavailable", "warn");
  render();
  if (activeView === "home") loadLocalFoodNews();
}
