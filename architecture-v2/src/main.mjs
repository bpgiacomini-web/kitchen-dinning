import { loadDataset } from "./data/repository.mjs";
import { parsePastedRecipeText, parseRecipeJsonLd } from "./features/recipes/import-parser.mjs";

const root = document.querySelector("#app");
const status = document.querySelector("#connection-state");
const recipeCount = document.querySelector("#recipe-count");
const diningCount = document.querySelector("#dining-count");
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
  root.innerHTML = `<section class="hero"><p class="eyebrow">St. Louis · Metro East</p><h1>Your food life,<br><span>all in one place.</span></h1><p class="lede">A cleaner foundation for the recipes you keep and the restaurants you remember.</p><div class="hero-actions"><button class="primary" data-view="recipes">Explore recipes</button><button class="secondary" data-view="dining">Explore dining</button></div></section><section class="content-panel"><div class="panel-heading"><div><p class="eyebrow">Your collection</p><h2>Saved with care</h2></div><span class="status ok">Read-only preview</span></div><div class="summary-grid"><article class="summary-card"><span class="summary-icon">✦</span><p>Recipes</p><strong>${dataset.recipes.length}</strong></article><article class="summary-card"><span class="summary-icon">⚜</span><p>Restaurants</p><strong>${dataset.restaurants.length}</strong></article></div><p class="note">This preview only reads data. It will not edit, delete, or overwrite your existing records.</p></section>`;
}
function renderImportPanel() {
  return `<section class="content-panel import-panel" aria-labelledby="import-title">
    <div class="panel-heading"><div><p class="eyebrow">Recipe tools · Early preview</p><h2 id="import-title">Import a recipe</h2></div><span class="status">Preview only</span></div>
    <p class="import-intro">Paste recipe text or the page's JSON-LD recipe data. Metro Eats will extract the title, ingredients, directions, and basic metadata without copying the surrounding article.</p>
    <label class="field-label" for="import-mode">What are you pasting?</label>
    <select id="import-mode" class="import-select"><option value="text">Recipe text</option><option value="jsonld">Recipe webpage HTML / JSON-LD</option></select>
    <label class="field-label" for="import-source">Recipe content</label>
    <textarea id="import-source" class="import-source" rows="9" maxlength="250000" placeholder="Paste a recipe with Ingredients and Directions sections…"></textarea>
    <div class="hero-actions import-actions"><button class="primary" type="button" data-action="parse-recipe">Extract recipe</button><button class="secondary" type="button" data-action="clear-recipe">Clear</button></div>
    <p id="import-feedback" class="import-feedback" role="status" aria-live="polite">Nothing has been extracted yet.</p>
    <div id="import-preview" class="import-preview"></div>
    <p class="note">Safety checkpoint: this preview does not save or overwrite recipes. Direct URL fetching is intentionally not connected until the server-side fetcher has redirect and response-size protections.</p>
  </section>`;
}
function renderList(title, eyebrow, items, kind) {
  const isRecipe = kind === "recipes";
  const rows = items.map(item => `<li><strong>${escapeHtml(isRecipe ? item.title : item.name)}</strong><small>${escapeHtml(isRecipe ? [item.category, item.subcategory, item.ingredients.length ? `${item.ingredients.length} ingredients` : "", item.time].filter(Boolean).join(" · ") : [item.cuisine, item.address, item.rating != null ? `Rating ${item.rating}` : ""].filter(Boolean).join(" · ") || "No additional details saved")}</small>${isRecipe && item.directions.length ? `<details><summary>View directions</summary><ol>${item.directions.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol></details>` : ""}</li>`).join("");
  root.innerHTML = `<section class="hero"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lede">A read-only view of your current saved ${kind}.</p></section>${isRecipe ? renderImportPanel() : ""}<section class="content-panel list-panel"><div class="panel-heading"><div><p class="eyebrow">${items.length} saved</p><h2>${title}</h2></div><span class="status">Read only</span></div>${rows ? `<ul class="item-list">${rows}</ul>` : `<p class="empty">No ${kind} were found in the data source this preview can read.</p>`}<p class="note">Nothing in this screen can change or delete your existing records.</p></section>`;
}
function renderImportPreview(recipe) {
  const preview = document.querySelector("#import-preview");
  if (!preview) return;
  if (!recipe) { preview.innerHTML = ""; return; }
  const metadata = [["Servings", recipe.servings], ["Prep time", recipe.prepTime], ["Cook time", recipe.cookTime], ["Total time", recipe.totalTime]].filter(([,value]) => value);
  preview.innerHTML = `<article class="parsed-recipe"><p class="eyebrow">Extracted recipe</p><h3>${escapeHtml(recipe.title)}</h3>${metadata.length ? `<dl>${metadata.map(([label,value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}<div class="parsed-columns"><section><h4>Ingredients · ${recipe.ingredients.length}</h4><ul>${recipe.ingredients.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section><h4>Directions · ${recipe.directions.length}</h4><ol>${recipe.directions.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ol></section></div></article>`;
}
function render() {
  document.querySelectorAll("[data-view]").forEach(button => {
    const active = button.classList.contains("tab") && button.dataset.view === activeView;
    button.classList.toggle("is-active", active);
    if (button.classList.contains("tab")) {
      if (active) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    }
  });
  if (activeView === "recipes") renderList("Recipes", "Your kitchen", dataset.recipes, "recipes");
  else if (activeView === "dining") renderList("Dining", "Your restaurants", dataset.restaurants, "dining");
  else renderHome();
}
document.addEventListener("click", event => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    activeView = viewButton.dataset.view;
    render();
    root.focus({ preventScroll: true });
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  if (actionButton.dataset.action === "clear-recipe") {
    const source = document.querySelector("#import-source");
    const feedback = document.querySelector("#import-feedback");
    if (source) source.value = "";
    if (feedback) feedback.textContent = "Content cleared. Nothing was saved.";
    renderImportPreview(null);
    return;
  }
  if (actionButton.dataset.action === "parse-recipe") {
    const source = document.querySelector("#import-source")?.value || "";
    const mode = document.querySelector("#import-mode")?.value || "text";
    const feedback = document.querySelector("#import-feedback");
    const result = mode === "jsonld" ? parseRecipeJsonLd(source) : parsePastedRecipeText(source);
    if (feedback) feedback.textContent = result
      ? "Recipe fields extracted. Review them below; nothing has been saved."
      : mode === "jsonld"
        ? "No complete recipe was found in the pasted HTML/JSON-LD. Try copying the recipe text instead."
        : "Couldn't identify both ingredients and directions. Include clear Ingredients and Directions headings and try again.";
    renderImportPreview(result);
  }
});

try {
  const result = await loadDataset();
  dataset = result.data;
  recipeCount.textContent = String(dataset.recipes.length);
  diningCount.textContent = String(dataset.restaurants.length);
  if (result.source.startsWith("local:")) setStatus("Loaded from this device", "ok");
  else if (result.source === "cloud") setStatus("Loaded from cloud", "ok");
  else setStatus(result.staleFallback ? "Data source unavailable" : "No saved data found", "warn");
  render();
} catch {
  setStatus("Data unavailable", "warn");
  render();
}
