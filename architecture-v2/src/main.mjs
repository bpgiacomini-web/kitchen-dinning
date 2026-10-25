import { loadDataset } from "./data/repository.mjs";

const root = document.querySelector("#app");
const status = document.querySelector("#connection-state");
const recipeCount = document.querySelector("#recipe-count");
const diningCount = document.querySelector("#dining-count");
let dataset = { recipes: [], restaurants: [] };
let activeView = "home";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&#39;" })[char]);
}
function setStatus(label, kind = "") {
  status.textContent = label;
  status.className = `status ${kind}`.trim();
}
function renderHome() {
  root.innerHTML = `<section class="hero"><p class="eyebrow">St. Louis · Metro East</p><h1>Your food life,<br><span>all in one place.</span></h1><p class="lede">A cleaner foundation for the recipes you keep and the restaurants you remember.</p><div class="hero-actions"><button class="primary" data-view="recipes">Explore recipes</button><button class="secondary" data-view="dining">Explore dining</button></div></section><section class="content-panel"><div class="panel-heading"><div><p class="eyebrow">Your collection</p><h2>Saved with care</h2></div><span class="status ok">Read-only preview</span></div><div class="summary-grid"><article class="summary-card"><span class="summary-icon">✦</span><p>Recipes</p><strong>${dataset.recipes.length}</strong></article><article class="summary-card"><span class="summary-icon">⚜</span><p>Restaurants</p><strong>${dataset.restaurants.length}</strong></article></div><p class="note">This preview only reads data. It will not edit, delete, or overwrite your existing records.</p></section>`;
}
function renderList(title, eyebrow, items, kind) {
  const isRecipe = kind === "recipes";
  const rows = items.map(item => `<li><strong>${escapeHtml(isRecipe ? item.title : item.name)}</strong><small>${escapeHtml(isRecipe ? [item.category, item.ingredients.length ? `${item.ingredients.length} ingredients` : "", item.time].filter(Boolean).join(" · ") : [item.cuisine, item.address, item.rating != null ? `Rating ${item.rating}` : ""].filter(Boolean).join(" · ") || "No additional details saved")}</small></li>`).join("");
  root.innerHTML = `<section class="hero"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lede">A read-only view of your current saved ${kind}.</p></section><section class="content-panel list-panel"><div class="panel-heading"><div><p class="eyebrow">${items.length} saved</p><h2>${title}</h2></div><span class="status">Read only</span></div>${rows ? `<ul class="item-list">${rows}</ul>` : `<p class="empty">No ${kind} were found in the data source this preview can read.</p>`}<p class="note">Nothing in this screen can change or delete your existing records.</p></section>`;
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
  const button = event.target.closest("[data-view]");
  if (!button) return;
  activeView = button.dataset.view;
  render();
  root.focus({ preventScroll: true });
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
