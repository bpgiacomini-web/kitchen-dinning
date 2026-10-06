import {getState, updateState, id, average, restaurantScore} from "./store.js";

const app = document.querySelector("#app");
const nav = [["home","Home"],["restaurants","My Restaurants"],["recipes","My Recipes"],["insights","My Insights"]];
const scores = [
  ["overall","Overall Experience"],["food","Food Quality"],["menu","Menu & Selection"],
  ["service","Service"],["atmosphere","Atmosphere"],["cleanliness","Cleanliness"],
  ["value","Value for Money"],["drinks","Drinks & Bar"],["location","Location & Accessibility"],
  ["returnScore","Would You Return?"]
];
const categories = ["Appetizers & Snacks","Breakfast & Brunch","Soups, Salads & Sandwiches","Main Dishes","Mexican & Latin","Italian","BBQ & Grilling","Side Dishes","Sauces, Gravies & Condiments","Bread & Baking","Desserts","Drinks","Other"];
let page = location.hash.slice(1) || "home";

function esc(value) {
  return String(value || "").replace(/[&<>"']/g, function (c) {
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c];
  });
}

function shell(active, body) {
  return '<div class="app-shell"><header class="topbar"><div class="topbar-inner"><a class="brand" href="#home"><img src="./metro-eats-logo.png" alt="Metro Eats"></a><div class="top-actions"><button class="icon-button" data-action="search" aria-label="Search">⌕</button><button class="icon-button" data-action="settings" aria-label="Settings">⚙</button></div></div><div class="nav-wrap"><nav class="nav">' +
    nav.map(function (item) { return '<button class="nav-button ' + (active === item[0] ? "active" : "") + '" data-nav="' + item[0] + '">' + item[1] + "</button>"; }).join("") +
    '</nav></div></header><main>' + body + '</main><div id="modal-root"></div></div>';
}

function home() {
  const state = getState();
  const visits = state.visits.slice(-3).reverse();
  return shell("home",
    '<section class="hero"><div class="eyebrow">Your food journal</div><h1>Eat well.<br>Remember it.</h1><p class="muted">A private record of the restaurants, meals and recipes that matter to you.</p></section>' +
    '<div class="grid grid-2"><button class="card action-card" data-action="review"><strong>Review a Restaurant</strong><span>Capture a visit in about two minutes.</span></button><button class="card action-card" data-action="recipe"><strong>Add a Recipe</strong><span>Keep recipes clean, editable and yours.</span></button></div>' +
    '<div class="section-head"><h2>Recent Visits</h2></div><section class="card">' +
    (visits.length ? '<div class="list">' + visits.map(visitRow).join("") + "</div>" : '<div class="empty">Your dining history will appear here.</div>') +
    '</section><div class="section-head"><h2>Around the Metro</h2></div><section class="card"><div class="news-item"><div class="eyebrow">St. Louis &amp; Metro East</div><strong>Food news will live here.</strong><p class="muted">The local food-news module is isolated from the core journal.</p></div></section>'
  );
}

function visitRow(visit) {
  const restaurant = getState().restaurants.find(function (item) { return item.id === visit.restaurantId; });
  return '<div class="list-row"><div><strong>' + esc(restaurant ? restaurant.name : "Restaurant") + '</strong><div class="muted">' + esc(visit.meal || "Visit") + '</div></div><span class="score">' + (Number.isFinite(Number(visit.overall)) ? Number(visit.overall).toFixed(1) : "—") + '<small>/10</small></span></div>';
}

function restaurants() {
  const state = getState();
  const list = state.restaurants.slice().sort(function (a, b) { return (restaurantScore(b.id) || -1) - (restaurantScore(a.id) || -1); });
  return shell("restaurants",
    '<section class="hero"><div class="eyebrow">My Restaurants</div><h1>Your dining history.</h1><p class="muted">Restaurants and visits remain separate, connected records.</p></section>' +
    '<div class="section-head"><h2>Restaurants</h2><button class="btn gold" data-action="review">Rate This Restaurant</button></div>' +
    '<section class="card"><div class="list">' +
    (list.length ? list.map(function (restaurant) {
      const score = restaurantScore(restaurant.id);
      return '<button class="list-row restaurant-row" data-restaurant="' + esc(restaurant.id) + '"><div><strong>' + esc(restaurant.name) + '</strong><div class="muted">' + esc([restaurant.street, restaurant.city, restaurant.state].filter(Boolean).join(", ")) + '</div></div><span class="score">' + (score ? score.toFixed(1) : "—") + '<small>/10</small></span></button>';
    }).join("") : '<div class="empty">No restaurants yet. Start with your next meal.</div>') +
    "</div></section>"
  );
}

function recipes() {
  const list = getState().recipes.slice().sort(function (a, b) { return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")); });
  return shell("recipes",
    '<section class="hero"><div class="eyebrow">My Recipes</div><h1>Recipes worth keeping.</h1><p class="muted">One standard editor for manual recipes and future imports.</p></section>' +
    '<div class="section-head"><h2>Recipes</h2><button class="btn gold" data-action="recipe">Add Recipe</button></div>' +
    '<section class="card"><div class="list">' +
    (list.length ? list.map(function (recipe) {
      return '<button class="list-row recipe-row" data-recipe="' + esc(recipe.id) + '"><div><strong>' + esc(recipe.name) + '</strong><div class="muted">' + esc(recipe.category || "Uncategorized") + '</div></div><span>›</span></button>';
    }).join("") : '<div class="empty">No recipes yet.</div>') +
    "</div></section>"
  );
}

function insights() {
  const values = getState().visits.map(function (visit) { return Number(visit.overall); }).filter(Number.isFinite);
  const state = getState();
  return shell("insights",
    '<section class="hero"><div class="eyebrow">My Insights</div><h1>See your food story.</h1><p class="muted">Your data stays personal and separate from outside ratings.</p></section>' +
    '<div class="grid grid-3"><div class="card"><div class="eyebrow">Visits</div><div class="score">' + state.visits.length + '</div></div><div class="card"><div class="eyebrow">Restaurants</div><div class="score">' + state.restaurants.length + '</div></div><div class="card"><div class="eyebrow">Average Visit</div><div class="score">' + (average(values) === null ? "—" : average(values).toFixed(1)) + '<small>/10</small></div></div></div>'
  );
}

function modal(body) {
  const root = document.querySelector("#modal-root");
  if (root) root.innerHTML = '<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true">' + body + "</section></div>";
}

function reviewModal(prefill) {
  const fields = scores.map(function (item) {
    return '<div class="field"><label>' + item[1] + '</label><select name="' + item[0] + '"><option value="">Select 1–10</option>' +
      Array.from({length: 10}, function (_, index) { return '<option value="' + (index + 1) + '">' + (index + 1) + "</option>"; }).join("") +
      "</select></div>";
  }).join("");
  return '<div class="modal-head"><h2>Rate This Restaurant</h2><button class="icon-button" data-action="close">×</button></div><form id="review-form" class="form"><div class="field"><label>Restaurant</label><input name="restaurantName" required value="' + esc(prefill || "") + '"></div><div class="grid grid-2">' + fields + '</div><div class="field"><label>What Did You Order?</label><textarea name="order" placeholder="Food items only"></textarea></div><div class="field"><label>Would You Order It Again?</label><select name="again"><option value="">Select</option><option>Yes</option><option>No</option></select></div><div class="form-actions"><button type="button" class="btn secondary" data-action="close">Cancel</button><button class="btn gold">Save Review</button></div></form>';
}

function recipeModal(recipe) {
  const r = recipe || {};
  return '<div class="modal-head"><h2>' + (r.id ? "Edit" : "Add") + ' Recipe</h2><button class="icon-button" data-action="close">×</button></div><form id="recipe-form" class="form"><input type="hidden" name="id" value="' + esc(r.id || "") + '"><div class="field"><label>Recipe Name</label><input name="name" required value="' + esc(r.name || "") + '"></div><div class="grid grid-2"><div class="field"><label>Category</label><select name="category"><option value="">Select category</option>' +
    categories.map(function (category) { return '<option value="' + esc(category) + '"' + (r.category === category ? " selected" : "") + ">" + esc(category) + "</option>"; }).join("") +
    '</select></div><div class="field"><label>Subcategory</label><input name="subcategory" value="' + esc(r.subcategory || "") + '"></div></div><div class="grid grid-2"><div class="field"><label>Servings</label><input name="servings" value="' + esc(r.servings || "") + '"></div><div class="field"><label>Total Time</label><input name="time" value="' + esc(r.time || "") + '"></div></div><div class="field"><label>Ingredients</label><textarea name="ingredients" required>' + esc(r.ingredients || "") + '</textarea></div><div class="field"><label>Directions</label><textarea name="directions" required>' + esc(r.directions || "") + '</textarea></div><div class="field"><label>Notes</label><textarea name="notes">' + esc(r.notes || "") + '</textarea></div><div class="form-actions"><button type="button" class="btn secondary" data-action="close">Cancel</button><button class="btn gold">Save Recipe</button></div></form>';
}

function searchModal() {
  modal('<div class="modal-head"><h2>Search Metro Eats</h2><button class="icon-button" data-action="close">×</button></div><div class="field"><label>Search everything</label><input id="global-search" autofocus placeholder="Restaurants, visits, recipes"></div><div id="search-results" class="list"></div>');
}

function settingsModal() {
  modal('<div class="modal-head"><h2>Settings</h2><button class="icon-button" data-action="close">×</button></div><p class="muted">Private by default. Backup, export and migration remain isolated services.</p><div class="form-actions"><button class="btn secondary" data-action="close">Close</button></div>');
}

function closeModal() {
  const root = document.querySelector("#modal-root");
  if (root) root.innerHTML = "";
}

function render() {
  const views = {home: home, restaurants: restaurants, recipes: recipes, insights: insights};
  app.innerHTML = views[page] ? views[page]() : views.home();
  window.scrollTo(0, 0);
}

app.addEventListener("click", function (event) {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) { location.hash = navButton.dataset.nav; return; }

  const action = event.target.closest("[data-action]");
  if (action) {
    if (action.dataset.action === "review") modal(reviewModal());
    if (action.dataset.action === "recipe") modal(recipeModal());
    if (action.dataset.action === "search") searchModal();
    if (action.dataset.action === "settings") settingsModal();
    if (action.dataset.action === "close") closeModal();
    return;
  }

  const restaurantButton = event.target.closest("[data-restaurant]");
  if (restaurantButton) {
    const restaurant = getState().restaurants.find(function (item) { return item.id === restaurantButton.dataset.restaurant; });
    if (restaurant) modal(reviewModal(restaurant.name));
    return;
  }

  const recipeButton = event.target.closest("[data-recipe]");
  if (recipeButton) {
    const recipe = getState().recipes.find(function (item) { return item.id === recipeButton.dataset.recipe; });
    if (recipe) modal(recipeModal(recipe));
  }
});

app.addEventListener("submit", function (event) {
  event.preventDefault();
  const form = event.target;
  if (form.id === "review-form") {
    const data = new FormData(form);
    const name = String(data.get("restaurantName") || "").trim();
    const now = new Date().toISOString();
    updateState(function (state) {
      let restaurant = state.restaurants.find(function (item) { return item.name.toLowerCase() === name.toLowerCase(); });
      if (!restaurant) { restaurant = {id: id("rest"), name: name}; state.restaurants.push(restaurant); }
      const visit = {id: id("visit"), restaurantId: restaurant.id, createdAt: now, meal: "Visit", order: String(data.get("order") || ""), orderAgain: String(data.get("again") || "")};
      scores.forEach(function (item) {
        const value = Number(data.get(item[0]));
        visit[item[0]] = Number.isFinite(value) ? value : null;
      });
      state.visits.push(visit);
    });
    closeModal();
    render();
    return;
  }
  if (form.id === "recipe-form") {
    const data = new FormData(form);
    const now = new Date().toISOString();
    updateState(function (state) {
      const recipeId = String(data.get("id") || "");
      const recipe = state.recipes.find(function (item) { return item.id === recipeId; });
      const values = {name: String(data.get("name") || "").trim(), category: String(data.get("category") || ""), subcategory: String(data.get("subcategory") || ""), servings: String(data.get("servings") || ""), time: String(data.get("time") || ""), ingredients: String(data.get("ingredients") || ""), directions: String(data.get("directions") || ""), notes: String(data.get("notes") || ""), updatedAt: now};
      if (recipe) Object.assign(recipe, values);
      else state.recipes.push(Object.assign({id: id("recipe")}, values));
    });
    closeModal();
    render();
  }
});

window.addEventListener("hashchange", function () {
  page = location.hash.slice(1) || "home";
  render();
});

render();
