import { createUserDatasetClient } from "./data/user-dataset-client.mjs";
import { normalizeDataset } from "./domain/normalize.mjs";
import { importedRecipeCategory, recipeEditorCategories, RECIPE_CATEGORIES } from "./features/recipes/categories.mjs";
import { parsePastedRecipeText, parseRecipeJsonLd } from "./features/recipes/import-parser.mjs";
import { createRestaurantReview, RESTAURANT_REVIEW_DIMENSIONS, reviewContentSignature, upsertRestaurantReview } from "./domain/restaurant-review.mjs";
import { sortRestaurantItems } from "./domain/restaurant-sort.mjs";
import { searchNearbyRestaurants as lookupNearbyRestaurants, searchRestaurantNames } from "./domain/restaurant-lookup.mjs";
import { normalizeScannedUpc } from "./domain/pizza-barcode.mjs";

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
let activeReviewIndex = null;
let activePizzaId = null;
let pizzaScannerControls = null;
let pizzaScannerGeneration = 0;
let restaurantSort = "recent";
let extractedRecipe = null;
let newRestaurantPrefill = null;
let restaurantDraft = null;
let restaurantLookupTimer = null;
let restaurantLookupRequest = 0;
let restaurantLookupLocation = null;
let restaurantLookupLocationRequested = false;
let restaurantLookupResults = [];
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
    const signature = reviewContentSignature(review);
    if (signatures.has(signature)) return false;
    signatures.add(signature);
    return true;
  });
}
const RESTAURANT_REVIEW_CATEGORIES = ["Appetizers", "Entrées", "Salads", "Soups", "Sides", "Desserts", "Drinks"];
function reviewScoreButtons(score, itemId = "", scoreKey = "", label = "Overall Experience", required = false) {
  return `<div class="reviewScore" role="group" aria-label="${escapeHtml(label)} rating from 1 to 10"${required ? ' aria-required="true"' : ""}>${Array.from({ length: 10 }, (_, index) => index + 1).map(value => `<button type="button" data-action="set-review-score" data-review-item-id="${escapeHtml(itemId)}" data-score-key="${escapeHtml(scoreKey)}" aria-label="${escapeHtml(label)}: ${value} out of 10" aria-pressed="${Number(score) === value}" class="${Number(score) === value ? "active" : ""}">${value}</button>`).join("")}</div>`;
}
function reviewScaleGuide() {
  return `<div class="reviewScaleGuide"><span>1 · Poor</span><span>5 · Average</span><span>10 · Exceptional</span></div>`;
}
const PIZZA_REVIEW_DIMENSIONS = [
  { key: "taste", label: "Taste", required: true, description: "Flavor and seasoning." },
  { key: "crust", label: "Crust", required: true, description: "Texture, bake, and structure." },
  { key: "sauce", label: "Sauce", description: "Flavor, amount, and balance." },
  { key: "cheese", label: "Cheese", description: "Flavor, coverage, and melt." },
  { key: "toppings", label: "Toppings", description: "Quality, amount, and distribution." },
  { key: "value", label: "Value", required: true, description: "Quality for the price." }
];
function pizzaReviewScoreButtons(score, key, label, required = false) {
  const selected = score == null ? 0 : Math.round(Number(score));
  return `<div class="reviewScore pizzaReviewScore" role="group" aria-label="${escapeHtml(label)} rating from 1 to 10"${required ? ' aria-required="true"' : ""}>${Array.from({ length: 10 }, (_, index) => index + 1).map(value => `<button type="button" data-action="set-pizza-score" data-pizza-score-key="${escapeHtml(key)}" aria-label="${escapeHtml(label)}: ${value} out of 10" aria-pressed="${selected === value}" class="${selected === value ? "active" : ""}">${value}</button>`).join("")}</div>`;
}
function updatePizzaRatingSummary() {
  const fields = PIZZA_REVIEW_DIMENSIONS.map(({ key }) => ({ key, value: Number(root.querySelector(`[data-pizza-score-key="${key}"].active`)?.textContent || 0) }));
  const rated = fields.filter(({ value }) => value >= 1 && value <= 10);
  const requiredCount = fields.filter(({ key, value }) => PIZZA_REVIEW_DIMENSIONS.find(item => item.key === key)?.required && value >= 1 && value <= 10).length;
  const average = rated.length ? (rated.reduce((sum, item) => sum + item.value, 0) / rated.length).toFixed(1) : "—";
  const overall = root.querySelector("#pizza-overall-value");
  const count = root.querySelector("#pizza-rating-count");
  const progress = root.querySelector("#pizza-rating-progress");
  if (overall) overall.textContent = average;
  if (count) count.textContent = `${requiredCount} of 3 core ratings complete · ${rated.length} of 6 categories rated`;
  if (progress) progress.value = requiredCount;
  fields.forEach(({ key, value }) => {
    const label = root.querySelector(`[data-pizza-score-label="${key}"]`);
    if (label) label.textContent = value >= 1 && value <= 10 ? `${value}/10` : "Select 1–10";
  });
}
function stopPizzaScanner() {
  pizzaScannerGeneration += 1;
  try { pizzaScannerControls?.stop(); } catch { /* The camera may already be closed. */ }
  pizzaScannerControls = null;
  const video = root.querySelector("#pizza-scanner-video");
  if (video) {
    video.pause();
    for (const track of video.srcObject?.getTracks?.() || []) track.stop();
    video.srcObject = null;
  }
  const scanner = root.querySelector("#pizza-scanner");
  if (scanner) scanner.hidden = true;
}
async function startPizzaScanner() {
  const statusLine = root.querySelector("#pizza-upc-status");
  const scanner = root.querySelector("#pizza-scanner");
  const video = root.querySelector("#pizza-scanner-video");
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    if (statusLine) statusLine.textContent = "Camera scanning needs a secure HTTPS connection and a supported browser. You can enter the UPC manually.";
    return;
  }
  const BrowserMultiFormatReader = globalThis.ZXingBrowser?.BrowserMultiFormatReader;
  if (!BrowserMultiFormatReader) {
    if (statusLine) statusLine.textContent = "The barcode scanner could not load. You can enter the UPC manually.";
    return;
  }
  if (!scanner || !video) return;
  const generation = ++pizzaScannerGeneration;
  scanner.hidden = false;
  if (statusLine) statusLine.textContent = "Allow camera access in your browser, then center the barcode in the frame.";
  try {
    const reader = new BrowserMultiFormatReader();
    const controls = await reader.decodeFromConstraints(
      { audio: false, video: { facingMode: { ideal: "environment" } } },
      video,
      result => {
        if (generation !== pizzaScannerGeneration || !result) return;
        const upc = normalizeScannedUpc(result.getText());
        if (!upc) return;
        const upcField = root.querySelector("#pizza-upc");
        if (!upcField) { stopPizzaScanner(); return; }
        upcField.value = upc;
        if (statusLine) statusLine.textContent = "Barcode scanned. Looking up the product…";
        stopPizzaScanner();
        root.querySelector('[data-action="lookup-pizza-upc"]')?.click();
      }
    );
    if (generation !== pizzaScannerGeneration || !video.isConnected) {
      controls.stop();
      return;
    }
    pizzaScannerControls = controls;
    if (statusLine) statusLine.textContent = "Point your camera at the pizza barcode and hold it steady.";
  } catch (error) {
    if (generation !== pizzaScannerGeneration) return;
    stopPizzaScanner();
    const message = error?.name === "NotAllowedError"
      ? "Camera access was not allowed. Allow camera access for this site in your browser settings, then try again."
      : error?.name === "NotFoundError"
        ? "No camera was found on this device. You can enter the UPC manually."
        : error?.name === "NotReadableError"
          ? "The camera is busy in another app. Close it and try again."
          : "The camera could not start. Check browser permissions and try again.";
    if (statusLine) statusLine.textContent = message;
  }
}
function reviewFoodItems(review) {
  if (Array.isArray(review?.foodItems)) return review.foodItems;
  const order = String(review?.order || review?.ordered || "").trim();
  return order ? [{ category: "Entrées", name: order, rating: reviewRating(review, "food"), notes: "" }] : [];
}
function topReviewFoods(restaurant) {
  return restaurantReviewRecords(restaurant).flatMap(reviewFoodItems)
    .filter(item => item?.name && Number(item.rating) > 0)
    .sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 3);
}
function restaurantLastVisit(restaurant) {
  const visits = restaurantReviewRecords(restaurant).map(review => Date.parse(review.visitedAt || review.reviewDate || review.createdAt || "")).filter(Number.isFinite);
  return visits.length ? Math.max(...visits) : 0;
}
function restaurantAverageRating(restaurant) {
  const scores = restaurantReviewRecords(restaurant).map(review => reviewRating(review, "overall") ?? reviewRating(review, "rating")).filter(Number.isFinite);
  return scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
}
function renderRestaurants(items) {
  const rows = sortRestaurantItems(items, restaurantSort, { lastVisit: restaurantLastVisit, averageRating: restaurantAverageRating }).map(restaurant => {
    const reviews = restaurantReviewRecords(restaurant);
    const rating = restaurant.rating == null ? null : (restaurant.ratingScale === 10 ? Number(restaurant.rating) : Number(restaurant.rating) <= 5 ? Number(restaurant.rating) * 2 : Number(restaurant.rating));
    const reviewRows = reviews.slice().reverse().map((review, index) => {
      const reviewIndex = reviews.length - index - 1;
      const reviewDate = review.visitedAt || review.createdAt || review.reviewDate || "";
      const dateText = reviewDate && !Number.isNaN(new Date(reviewDate).getTime()) ? new Date(reviewDate).toLocaleDateString() : reviewDate;
      const scores = [["Overall", reviewRating(review, "overall") ?? reviewRating(review, "rating")], ["Food", reviewRating(review, "food")], ["Service", reviewRating(review, "service")], ["Value", reviewRating(review, "value")]]
        .filter(([, value]) => value != null && value !== "")
        .map(([label, value]) => `<span>${label}: ${escapeHtml(value)}/10</span>`).join("");
      const additionalScores = RESTAURANT_REVIEW_DIMENSIONS
        .map(({ key, label }) => ({ label, score: reviewSurveyScore(review, key) }))
        .filter(({ score }) => score != null)
        .map(({ label, score }) => `<span>${escapeHtml(label)}: ${escapeHtml(score)}/10</span>`).join("");
      const foodItems = reviewFoodItems(review);
      const dishRows = foodItems.filter(item => item?.name).map(item => `<li><strong>${escapeHtml(item.name)}</strong>${Number(item.rating) > 0 ? ` · ${escapeHtml(item.rating)}/10` : ""}${item.notes ? `<span>${escapeHtml(item.notes)}</span>` : ""}</li>`).join("");
      return `<article class="savedReview"><div class="savedReviewHeading"><strong>${dateText ? escapeHtml(dateText) : `Visit ${reviews.length - index}`}</strong><button class="btn" type="button" data-action="edit-restaurant-review" data-restaurant-id="${escapeHtml(restaurant.id)}" data-review-index="${reviewIndex}">Edit review</button>${scores ? `<div class="reviewScores">${scores}</div>` : ""}</div>${additionalScores ? `<div class="reviewScores reviewAdditionalScores">${additionalScores}</div>` : ""}${review.order || review.ordered ? `<p><strong>What you ordered:</strong> ${escapeHtml(review.order || review.ordered)}</p>` : ""}${dishRows ? `<div class="savedReviewDishes"><strong>Food &amp; drink ratings</strong><ul>${dishRows}</ul></div>` : ""}${review.orderAgain ? `<p><strong>Order again:</strong> ${escapeHtml(review.orderAgain)}</p>` : ""}${review.notes ? `<p class="savedReviewNotes">${escapeHtml(review.notes)}</p>` : ""}</article>`;
    }).join("");
    const details = [["Cuisine", restaurant.cuisine], ["Address", restaurant.address], ["Website", restaurant.website], ["Menu", restaurant.menuUrl], ["Notes", restaurant.notes], ["Favorite", restaurant.favorite ? "Yes" : ""]]
      .filter(([, value]) => value != null && value !== "")
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${["Website", "Menu"].includes(label) && /^https?:\/\//i.test(String(value)) ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>` : escapeHtml(value)}</dd></div>`).join("");
    const bestDishes = topReviewFoods(restaurant);
    return `<article class="readOnlyItem restaurantCard" data-search="${escapeHtml(JSON.stringify(restaurant).toLowerCase())}"><div class="recipeCardHeader"><strong>${escapeHtml(restaurant.name)}</strong><div class="recipeCardActions"><button class="btn" type="button" data-action="toggle-restaurant-favorite" data-restaurant-id="${escapeHtml(restaurant.id)}" aria-pressed="${restaurant.favorite ? "true" : "false"}">${restaurant.favorite ? "★ Favorite" : "☆ Add to Favorites"}</button><button class="btn" type="button" data-action="edit-restaurant" data-restaurant-id="${escapeHtml(restaurant.id)}">Edit</button><button class="btn primary" type="button" data-action="add-restaurant-review" data-restaurant-id="${escapeHtml(restaurant.id)}">＋ Rate a Visit (1–10)</button><button class="btn danger" type="button" data-action="delete-restaurant" data-restaurant-id="${escapeHtml(restaurant.id)}">Delete</button></div></div><small>${escapeHtml([restaurant.cuisine, restaurant.address, rating == null ? null : `Rating ${rating.toFixed(1)}/10`, restaurant.favorite ? "Favorite" : "", `${reviews.length} ${reviews.length === 1 ? "visit" : "visits"}`].filter(Boolean).join(" · ") || "No additional details saved")}</small>${reviews.length === 0 ? `<p class="hint restaurantReviewPrompt">No visit ratings yet. Add a visit to rate your experience, service, value, and dishes from 1 to 10.</p>` : ""}${bestDishes.length ? `<p class="restaurantTopDishes"><strong>Top rated dishes:</strong> ${bestDishes.map(item => `${escapeHtml(item.name)} ${escapeHtml(item.rating)}/10`).join(" · ")}</p>` : ""}<details><summary>Restaurant details and visit history</summary><section class="restaurantDetailBlock"><h4>Restaurant information</h4><dl>${details || `<div><dt>Details</dt><dd>No additional details saved.</dd></div>`}</dl></section><section class="restaurantDetailBlock"><h4>Visit history</h4>${reviewRows || `<p class="hint">No visits or reviews yet. Add a visit to start your personal history.</p>`}</section></details><p class="edit-status" role="status" aria-live="polite"></p></article>`;
  }).join("");
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal</div><h2>My Restaurants</h2><p>Keep restaurant details and visit-by-visit food critic reviews together in your private Metro Eats account.</p></div></section><section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${items.length} saved</div><h3>Your restaurants &amp; reviews</h3></div><div class="diningActions"><label class="restaurantSortControl" for="restaurant-sort">Sort by <select id="restaurant-sort"><option value="recent"${restaurantSort === "recent" ? " selected" : ""}>Last visited · newest first</option><option value="highest"${restaurantSort === "highest" ? " selected" : ""}>Highest rated</option><option value="lowest"${restaurantSort === "lowest" ? " selected" : ""}>Lowest rated</option><option value="name"${restaurantSort === "name" ? " selected" : ""}>Name · A to Z</option></select></label><button class="btn" type="button" data-action="open-rankings">★ My Rankings</button><button class="btn primary" type="button" data-action="new-restaurant">＋ Add a Restaurant</button></div></div><section class="nearbyPanel"><div><h3>Restaurants Around Me</h3><p class="hint">Nearby places load automatically when you open this page. Location is used only for this search, never saved. If device location is unavailable, Metro Eats uses an approximate area.</p></div><p class="edit-status" id="nearby-status" role="status" aria-live="polite">Nearby restaurant search will start automatically.</p><details class="nearbyDisclosure" id="nearby-disclosure" open hidden><summary id="nearby-summary">Nearby restaurants</summary><div class="nearbyResults" id="nearby-results"></div></details></section><label class="restaurantSearchLabel" for="restaurant-search">Search your restaurants</label><input id="restaurant-search" class="restaurantSearch" type="search" placeholder="Name, cuisine, address, dish, or note" autocomplete="off"><p class="hint" id="restaurant-search-count" aria-live="polite">Showing ${items.length} ${items.length === 1 ? "restaurant" : "restaurants"}.</p><div class="readOnlyList" id="restaurant-list">${rows || `<div class="empty">No restaurants saved yet. Add one to start your private dining journal.</div>`}</div><p class="hint">Restaurant search, critic scores, rated dishes, and every visit review are saved to your signed-in Preview account. Existing shared baseline records stay unchanged.</p></section>`;
  const searchLabel = root.querySelector(".restaurantSearchLabel");
  if (searchLabel) searchLabel.textContent = "Search saved restaurants or find a new one";
  root.querySelector("#restaurant-search")?.insertAdjacentHTML("afterend", '<p class="hint">Online restaurant matches will appear here too. Select one to start a restaurant record and visit review.</p><p class="edit-status" id="restaurant-search-status" role="status" aria-live="polite"></p><div id="restaurant-search-results" class="restaurantLookupResults"></div>');
}
function renderRestaurantEditor(restaurantId = null) {
  const restaurant = restaurantId ? cloudDataset.restaurants.find(item => String(item.id) === String(restaurantId)) : restaurantDraft || newRestaurantPrefill;
  if (restaurantId && !restaurant) { activeView = "dining"; render(); return; }
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal</div><h2>${restaurantId ? "Edit Restaurant" : "Add a Restaurant"}</h2><p>${restaurantId ? "Update the details or continue straight to a new visit review." : "Choose the restaurant, then complete its details and visit review in one flow. The record is saved when the review is finished."}</p></div></section><section class="content-panel restaurantEditorPage"><div class="restaurantEditPanel"><label>Restaurant name<input id="restaurant-name" required maxlength="180" value="${escapeHtml(restaurant?.name || "")}" placeholder="Start typing a restaurant name" autocomplete="organization"></label><div class="restaurantLookupTools"><p class="hint">Nearby matches use your device location automatically when your browser allows it. Location is never saved. Restaurant websites fill in when the map listing has one.</p></div><div id="restaurant-lookup-status" role="status" aria-live="polite" class="restaurantLookupStatus"></div><div id="restaurant-lookup-results" class="restaurantLookupResults"></div><div class="restaurantEditorGrid"><label>Cuisine<input id="restaurant-cuisine" maxlength="120" value="${escapeHtml(restaurant?.cuisine || restaurant?.type || "")}" placeholder="e.g. Italian"></label><label>Website<input id="restaurant-website" type="url" maxlength="500" value="${escapeHtml(restaurant?.website || "")}" placeholder="Filled automatically when available"></label></div><label>Menu link<input id="restaurant-menu" type="url" maxlength="500" value="${escapeHtml(restaurant?.menuUrl || "")}" placeholder="https://"></label><label>Address<input id="restaurant-address" maxlength="300" value="${escapeHtml(restaurant?.address || "")}" placeholder="Street, city"></label><label>Notes<textarea id="restaurant-notes" rows="3" maxlength="5000" placeholder="Anything you want to remember">${escapeHtml(restaurant?.notes || "")}</textarea></label><label class="inlineCheck"><input id="restaurant-favorite" type="checkbox"${restaurant?.favorite ? " checked" : ""}> Favorite</label><div class="recipeEditActions"><button class="btn" type="button" data-action="cancel-restaurant-edit">Cancel</button><button class="btn" type="button" data-action="save-restaurant" data-restaurant-id="${escapeHtml(restaurant?.id || "")}">${restaurantId ? "Save Details Only" : "Save Without Review"}</button><button class="btn primary" type="button" data-action="start-restaurant-review" data-restaurant-id="${escapeHtml(restaurant?.id || "")}">Continue to Visit Review →</button></div><p class="edit-status" role="status" aria-live="polite"></p></div></section>`;
  if (!restaurantLookupLocation || restaurantLookupLocation.source !== "device") requestDeviceRestaurantLocation();
}
function renderRestaurantReviewForm(restaurantId) {
  const savedRestaurant = restaurantId ? cloudDataset.restaurants.find(item => String(item.id) === String(restaurantId)) : null;
  const restaurant = { ...(savedRestaurant || {}), ...(restaurantDraft || {}) };
  const reviewRecords = restaurantReviewRecords(restaurant);
  const editingReview = activeReviewIndex == null ? null : reviewRecords[activeReviewIndex] || null;
  if (!restaurantId && !restaurantDraft || restaurantId && !savedRestaurant) { activeView = "dining"; render(); return; }
  if (activeReviewIndex != null && !editingReview) { activeReviewIndex = null; activeView = "dining"; render(); return; }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const coreQuestions = [["overall", "Overall Experience"], ["service", "Service"], ["value", "Value"]];
  const coreRatings = coreQuestions.map(([key, label]) => { const value = reviewRating(editingReview, key) || 0; return `<div class="reviewQuestion"><div class="reviewQuestionHead"><b>${label}<span class="requiredMark" aria-label="required">*</span></b><span data-score-label="${key}">${value ? `${value}/10` : "Select 1–10"}</span></div>${reviewScoreButtons(value, "", key, label, true)}</div>`; }).join("");
  const optionalRatings = RESTAURANT_REVIEW_DIMENSIONS.map(({ key, label, description }) => { const value = reviewSurveyScore(editingReview, key) || 0; return `<div class="reviewQuestion"><div class="reviewQuestionHead"><b>${escapeHtml(label)}</b><span data-score-label="${key}">${value ? `${value}/10` : "Optional"}</span></div><p class="hint">${escapeHtml(description)}</p>${reviewScoreButtons(value, "", key, label)}</div>`; }).join("");
  const savedDishes = reviewFoodItems(editingReview);
  const renderSavedDish = dish => {
    const itemId = crypto.randomUUID();
    const rating = reviewRating({ rating: dish.rating, ratingScale: editingReview?.ratingScale }, "rating") || 0;
    return `<article class="reviewDish" data-review-dish-id="${itemId}" data-rating="${rating}"><div class="reviewDishHead"><label>Dish or drink<input data-dish-name maxlength="180" value="${escapeHtml(dish.name || "")}" placeholder="e.g. toasted ravioli"></label><button class="btn danger" type="button" data-action="remove-review-dish" aria-label="Remove dish">Remove</button></div><div class="reviewQuestionHead"><b>Food rating</b><span data-dish-rating-label>${rating ? `${rating}/10` : "Select 1–10"}</span></div>${reviewScoreButtons(rating, itemId, "", "Dish or drink", true)}${reviewScaleGuide()}<label>Dish notes <span class="optionalMark">Optional</span><textarea data-dish-notes rows="2" maxlength="1200" placeholder="Taste, texture, preparation, portion…">${escapeHtml(dish.notes || "")}</textarea></label></article>`;
  };
  const categories = RESTAURANT_REVIEW_CATEGORIES.map(category => `<details class="reviewCategory"${category === "Entrées" || savedDishes.some(dish => (dish.category || "Entrées") === category) ? " open" : ""}><summary>${category}</summary><div class="reviewCategoryBody" data-review-category="${category}"><p class="hint">Add the dishes or drinks you tried in this category.</p><div class="reviewDishList">${savedDishes.filter(dish => (dish.category || "Entrées") === category).map(renderSavedDish).join("")}</div><button class="btn" type="button" data-action="add-review-dish" data-category="${category}">＋ Add ${category === "Drinks" ? "a drink" : "a dish"}</button></div></details>`).join("");
  const hasSavedOptionalRatings = RESTAURANT_REVIEW_DIMENSIONS.some(({ key }) => reviewSurveyScore(editingReview, key) != null);
  root.innerHTML = `
    <section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal · Food Critic</div><h2>${editingReview ? "Edit Visit Review" : "Rate a Visit"}</h2><p>${editingReview ? `Update the saved review for ${escapeHtml(restaurant.name)}. Your current ratings, dishes, visit date, and notes have been loaded.` : `Review your visit to <strong>${escapeHtml(restaurant.name)}</strong>. Your restaurant details and review are saved together when you finish.`}</p></div></section>
    <section class="content-panel restaurantEditorPage">
      <div class="restaurantEditPanel">
        <section class="reviewRestaurantSummary"><strong>${escapeHtml(restaurant.name)}</strong><span>${escapeHtml([restaurant.cuisine, restaurant.address].filter(Boolean).join(" · ") || "Restaurant details added" )}</span>${restaurant.website ? `<a href="${escapeHtml(restaurant.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(restaurant.website)}</a>` : ""}<label class="inlineCheck"><input id="review-restaurant-favorite" type="checkbox"${restaurant.favorite ? " checked" : ""}> Mark as a favorite</label><button class="btn" type="button" data-action="back-to-restaurant-details">← Back to restaurant details</button></section>
        <section class="reviewLiveSummary" aria-labelledby="review-live-title">
          <div class="reviewLiveScore"><span id="review-live-title">Current Food Critic score</span><strong id="review-overall-average">—<small>/10</small></strong></div>
          <div class="reviewProgress"><progress id="review-completion-progress" max="5" value="0" aria-label="Review completion"></progress><p id="review-completion" role="status" aria-live="polite">0 of 5 required parts complete. Notes are optional.</p></div>
        </section>
        <label>Visit date<input id="review-visited-at" type="date" value="${escapeHtml(String(editingReview?.visitedAt || editingReview?.reviewDate || editingReview?.createdAt || today).slice(0, 10))}" required></label>
        <section class="surveyCard reviewCoreCard">
          <h3>Your 1–10 ratings</h3>
          <p class="hint">Rate each item from 1 (poor) to 10 (exceptional). Overall Experience, Service, Value, one rated dish or drink, and “Would you order it again?” are required. Food Quality is calculated from dish ratings.</p>
          <div class="reviewScaleLegend"><span>1 · Poor</span><span>5 · Average</span><span>10 · Exceptional</span></div>
          ${coreRatings}
          <div class="reviewQuestion reviewFoodAverage"><div class="reviewQuestionHead"><b>Food Quality</b><span id="review-food-average">Calculated from dishes</span></div><p class="hint">Average of the dish and drink ratings below.</p></div>
        </section>
        <details class="reviewOptionalRatings"${hasSavedOptionalRatings ? " open" : ""}><summary>More visit ratings <span>Optional · 6 categories</span></summary><p class="hint">Add extra detail when it applies to your visit. These scores are saved with this visit.</p>${reviewScaleGuide()}${optionalRatings}</details>
        <section class="reviewFoodSection"><h3>Food &amp; drink ratings</h3><p class="hint">Add everything you tried, then tap its score from 1 to 10. Every item you add needs a name and rating. Notes on each dish are optional.</p>${categories}</section>
        <label>What else did you order? <span class="optionalMark">Optional</span><input id="review-order" maxlength="500" value="${escapeHtml(editingReview?.order || editingReview?.ordered || "")}" placeholder="For example, shared plates or drinks"></label>
        <label>Would you order it again? <span class="requiredMark" aria-label="required">*</span><select id="review-order-again" required><option value="">Choose Yes or No</option><option${editingReview?.orderAgain === "Yes" ? " selected" : ""}>Yes</option><option${editingReview?.orderAgain === "No" ? " selected" : ""}>No</option></select></label>
        <label>Visit notes <span class="optionalMark">Optional</span><textarea id="review-notes" rows="4" maxlength="5000" placeholder="What stood out about this visit?">${escapeHtml(editingReview?.notes || "")}</textarea></label>
        <div class="recipeEditActions"><button class="btn" type="button" data-action="back-to-restaurant-details">Back to details</button><button class="btn primary" type="button" data-action="save-restaurant-review" data-restaurant-id="${escapeHtml(restaurantId || "")}">${editingReview ? "Save Review Changes" : restaurantId ? "Save Visit Review" : "Save Restaurant & Visit Review"}</button></div>
        <p class="edit-status" role="status" aria-live="polite"></p>
      </div>
    </section>`;
  updateReviewSurveySummary();
}
function renderRestaurantRankings() {
  const ranked = dataset.restaurants.map(restaurant => {
    const reviews = restaurantReviewRecords(restaurant);
    const scores = reviews.map(review => reviewRating(review, "overall") ?? reviewRating(review, "rating")).filter(Number.isFinite);
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    return { restaurant, reviews, average };
  }).filter(item => item.average != null).sort((a, b) => b.average - a.average || a.restaurant.name.localeCompare(b.restaurant.name));
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your dining journal · Food Critic</div><h2>My Restaurant Rankings</h2><p>Restaurants are ranked by your average overall score across saved visits.</p></div></section><section class="content-panel"><div class="sectionTitle"><h3>Your highest rated restaurants</h3><button class="btn" type="button" data-view="dining">← My Restaurants</button></div><div class="restaurantRankings">${ranked.length ? ranked.map(({ restaurant, reviews, average }, index) => `<article class="restaurantRanking"><span class="rankBadge">#${index + 1}</span><div><strong>${escapeHtml(restaurant.name)}</strong><small>${escapeHtml([restaurant.cuisine, `${reviews.length} ${reviews.length === 1 ? "visit" : "visits"}`].filter(Boolean).join(" · "))}</small>${topReviewFoods(restaurant).length ? `<p>Top dishes: ${topReviewFoods(restaurant).map(item => `${escapeHtml(item.name)} ${escapeHtml(item.rating)}/10`).join(" · ")}</p>` : ""}</div><strong class="rankingScore">${average.toFixed(1)}<small>/10</small></strong></article>`).join("") : `<div class="empty">Complete a restaurant visit review to start your rankings.</div>`}</div></section>`;
}
async function searchNearbyRestaurants() {
  const statusLine = root.querySelector("#nearby-status");
  const results = root.querySelector("#nearby-results");
  const disclosure = root.querySelector("#nearby-disclosure");
  const summary = root.querySelector("#nearby-summary");
  if (!statusLine || !results) return;
  statusLine.textContent = "Finding your area…";
  results.innerHTML = "";
  if (disclosure) disclosure.hidden = true;
  const search = async location => {
    statusLine.textContent = "Searching nearby restaurants…";
    try {
      const response = await lookupNearbyRestaurants({ location });
      restaurantLookupLocation = response.location || location;
      if (!response.places.length) {
        statusLine.textContent = "No named restaurants appeared within about five miles. Try the name search below.";
        return;
      }
      if (disclosure) { disclosure.hidden = false; disclosure.open = true; }
      if (summary) summary.textContent = `Nearby restaurants (${response.places.length})`;
      const placeLabel = response.location?.source === "network"
        ? `Showing places near the approximate area Vercel detected${response.location.city ? ` (${response.location.city})` : ""}. Allow precise location for a closer match.`
        : `Found ${response.places.length} nearby places. Select one to fill in its details and continue to a visit review.`;
      statusLine.textContent = placeLabel;
      results.innerHTML = response.places.map(place => `<article class="nearbyPlace"><div><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml([place.cuisine, place.distance == null ? "" : place.distance < 1609 ? `${Math.round(place.distance * 3.28084)} ft` : `${(place.distance / 1609.34).toFixed(1)} mi`, place.address].filter(Boolean).join(" · ") || "Nearby food place")}</small></div><button class="btn" type="button" data-action="use-nearby" data-nearby="${escapeHtml(JSON.stringify(place))}">Review this restaurant</button></article>`).join("");
    } catch (error) {
      if (disclosure) disclosure.hidden = true;
      statusLine.textContent = error.message || "Nearby restaurant search is unavailable right now. Try the name search below.";
    }
  };
  if (!navigator.geolocation) { await search(null); return; }
  navigator.geolocation.getCurrentPosition(position => {
    search({ lat: position.coords.latitude, lon: position.coords.longitude });
  }, () => { search(null); }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 });
}
function renderRestaurantLookupResults(results, message = "", target = {}) {
  const statusId = target.statusId || "restaurant-lookup-status";
  const resultsId = target.resultsId || "restaurant-lookup-results";
  const statusLine = root.querySelector(`#${statusId}`);
  const container = root.querySelector(`#${resultsId}`);
  if (!container || !statusLine) return;
  restaurantLookupResults = results;
  container.innerHTML = "";
  if (message) { statusLine.textContent = message; return; }
  if (!results.length) {
    statusLine.textContent = restaurantLookupLocation
      ? `No matching restaurant found near ${restaurantLookupLocation.city || "your location"}. Add a city or state to search another area, or enter the restaurant manually.`
      : "No matches found. Try adding the city or state, or enter the restaurant manually.";
    return;
  }
  statusLine.textContent = `Choose a match to fill available details${restaurantLookupLocation ? "; closest places appear first" : ""}.`;
  container.innerHTML = results.map((place, index) => `<button class="restaurantLookupResult" type="button" data-action="select-restaurant-lookup" data-result-index="${index}"><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml([place.cuisine, place.address, place.distance == null ? "" : place.distance < 1609 ? `${Math.round(place.distance * 3.28084)} ft away` : `${(place.distance / 1609.34).toFixed(1)} mi away`].filter(Boolean).join(" · ") || "Address not listed")}</small></button>`).join("");
}
function searchRestaurantName(query, target = {}) {
  clearTimeout(restaurantLookupTimer);
  const value = query.trim();
  const statusId = target.statusId || "restaurant-lookup-status";
  const resultsId = target.resultsId || "restaurant-lookup-results";
  const statusLine = root.querySelector(`#${statusId}`);
  if (value.length < 2) { restaurantLookupRequest += 1; restaurantLookupResults = []; root.querySelector(`#${resultsId}`)?.replaceChildren(); if (statusLine) statusLine.textContent = ""; return; }
  if (!restaurantLookupLocation && !restaurantLookupLocationRequested) requestDeviceRestaurantLocation();
  statusLine && (statusLine.textContent = "Searching restaurant names on OpenStreetMap…");
  const requestId = ++restaurantLookupRequest;
  restaurantLookupTimer = setTimeout(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const { places, location } = await searchRestaurantNames(value, { location: restaurantLookupLocation, signal: controller.signal });
      if (requestId === restaurantLookupRequest) {
        restaurantLookupLocation = location || restaurantLookupLocation;
        renderRestaurantLookupResults(places, "", { statusId, resultsId });
      }
    } catch {
      if (requestId === restaurantLookupRequest) renderRestaurantLookupResults([], "Online restaurant search is unavailable right now. You can still enter the details manually.", { statusId, resultsId });
    } finally { clearTimeout(timeout); }
  }, 300);
}
function requestDeviceRestaurantLocation() {
  if (!navigator.geolocation || restaurantLookupLocationRequested) return;
  restaurantLookupLocationRequested = true;
  const activeTarget = () => activeView === "restaurant-edit"
    ? { inputId: "restaurant-name", statusId: "restaurant-lookup-status", resultsId: "restaurant-lookup-results" }
    : activeView === "dining"
      ? { inputId: "restaurant-search", statusId: "restaurant-search-status", resultsId: "restaurant-search-results" }
      : { inputId: "home-restaurant-search", statusId: "home-restaurant-search-status", resultsId: "home-restaurant-search-results" };
  const target = activeTarget();
  const statusLine = root.querySelector(`#${target.statusId}`);
  if (statusLine && !restaurantLookupLocation) statusLine.textContent = "Finding nearby matches using your device location…";
  navigator.geolocation.getCurrentPosition(position => {
    restaurantLookupLocation = { lat: position.coords.latitude, lon: position.coords.longitude, source: "device" };
    const current = activeTarget();
    const query = root.querySelector(`#${current.inputId}`)?.value || "";
    if (query.trim().length >= 2) searchRestaurantName(query, current);
    else if (statusLine?.isConnected) statusLine.textContent = "Nearby matching is ready. Start typing a restaurant name.";
  }, error => {
    if (statusLine?.isConnected && !root.querySelector("#restaurant-lookup-results")?.childElementCount) {
      statusLine.textContent = error?.code === 1
        ? "Device location is blocked. Name search will use an approximate area when available."
        : "Device location is unavailable. Name search will use an approximate area when available.";
    }
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
}
function updateReviewFoodAverage() {
  const dishes = [...root.querySelectorAll("[data-review-dish-id]")];
  const ratings = dishes.map(dish => Number(dish.dataset.rating)).filter(value => Number.isFinite(value) && value >= 1 && value <= 10);
  const label = root.querySelector("#review-food-average");
  if (label) label.textContent = ratings.length ? `${(ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)}/10 from ${ratings.length} rated ${ratings.length === 1 ? "dish" : "dishes"}` : "Calculated from dishes";
  updateReviewSurveySummary();
}
function updateReviewSurveySummary() {
  const progress = root.querySelector("#review-completion-progress");
  const summary = root.querySelector("#review-completion");
  const overallLabel = root.querySelector("#review-overall-average");
  if (!progress || !summary || !overallLabel) return;
  const score = key => Number(root.querySelector(`[data-score-key="${key}"]`)?.closest(".reviewScore")?.querySelector("button.active")?.textContent || 0);
  const dishes = [...root.querySelectorAll("[data-review-dish-id]")];
  const foodRatings = dishes.map(dish => Number(dish.dataset.rating)).filter(value => Number.isFinite(value) && value >= 1 && value <= 10);
  const foodAverage = foodRatings.length ? foodRatings.reduce((sum, value) => sum + value, 0) / foodRatings.length : 0;
  const coreScores = [score("overall"), score("service"), score("value")];
  const currentScore = coreScores.every(value => value >= 1 && value <= 10) && foodAverage > 0
    ? (coreScores.reduce((sum, value) => sum + value, 0) + foodAverage) / 4
    : null;
  overallLabel.innerHTML = currentScore == null ? `—<small>/10</small>` : `${currentScore.toFixed(1)}<small>/10</small>`;

  const foodsComplete = dishes.length > 0 && dishes.every(dish => {
    const name = dish.querySelector("[data-dish-name]")?.value.trim();
    const rating = Number(dish.dataset.rating || 0);
    return Boolean(name) && rating >= 1 && rating <= 10;
  });
  const orderAgain = root.querySelector("#review-order-again")?.value || "";
  const completed = [coreScores[0] >= 1 && coreScores[0] <= 10, coreScores[1] >= 1 && coreScores[1] <= 10, coreScores[2] >= 1 && coreScores[2] <= 10, foodsComplete, ["Yes", "No"].includes(orderAgain)].filter(Boolean).length;
  progress.value = completed;
  summary.textContent = completed === 5
    ? "Review ready to save. Your notes are optional."
    : `${completed} of 5 required parts complete. Finish the ratings and choices below; notes are optional.`;
}
function renderHome() {
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">St. Louis • Metro East</div><h2>Metro Eats<br><span class="fl">⚜</span> Recipes & Dining</h2><p class="heroTagline">Good eats. Keeper recipes, local spots, and pizza rankings.</p><details class="homeAppsDisclosure"><summary><span>My Metro Eats Journal</span><span class="homeAppsCount">3 pages</span><span class="homeJournalPen" aria-hidden="true">✎</span></summary><div class="homeFeatureButtons"><button class="homeFeatureButton recipeButton" data-view="recipes"><span class="homeFeatureIcon">✦</span><span><strong>My Recipes</strong><small>Your go-to recipes</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton diningButton" data-view="dining"><span class="homeFeatureIcon" aria-hidden="true">⚜</span><span><strong>My Restaurants</strong><small>Local spots, your way</small></span><span class="homeFeatureArrow">→</span></button><button class="homeFeatureButton pizzaButton" data-view="pizzas"><span class="homeFeatureIcon pizzaIcon" aria-hidden="true"></span><span><strong>My Frozen Pizzas</strong><small>Rank your freezer faves</small></span><span class="homeFeatureArrow">→</span></button></div></details></div></section><section class="localNewsPanel" aria-labelledby="local-news-title"><div class="panel-heading"><div><p class="eyebrow">St. Louis • Metro East</p><h2 id="local-news-title">Local Food News</h2></div><span class="liveNewsBadge"><span class="liveNewsDot" aria-hidden="true"></span>LIVE · LOCAL FEED</span></div><p class="newsIntro">Fresh openings, good bites, and food stories from across the bi-state.</p><div id="local-food-news" class="localNewsList" aria-live="polite"><p class="hint">Loading local food stories…</p></div><p class="hint" id="local-news-updated"></p></section><div class="homeColumns"><article class="featureCard"><div><div class="sectionKicker">Your Collection</div><h3>Saved with care</h3><p>Your recipes, restaurant visits, and frozen-pizza ratings stay with your account.</p></div><div class="actions"><button class="btn primary" data-view="recipes">Open My Recipes →</button><button class="btn" data-view="dining">Open My Restaurants →</button><button class="btn" data-view="pizzas">Open My Frozen Pizzas →</button></div></article><article class="featureCard accent"><div><div class="sectionKicker">Safety First</div><h3>Existing data stays safe.</h3><p>Shared baseline records stay read-only. Your signed-in Preview account saves its own recipes, reviews, and pizza ratings.</p></div><span class="status">Private account</span></article></div>`;
  root.querySelector(".localNewsPanel")?.insertAdjacentHTML("afterend", '<section class="content-panel homeRestaurantFinder"><section class="nearbyPanel"><div><div class="sectionKicker">Local dining</div><h3>Restaurants Around Me</h3><p class="hint">Nearby spots load automatically. Location is used for this search and never saved.</p></div><p class="edit-status" id="nearby-status" role="status" aria-live="polite">Nearby restaurant search will start automatically.</p><details class="nearbyDisclosure" id="nearby-disclosure" open hidden><summary id="nearby-summary">Nearby restaurants</summary><div class="nearbyResults" id="nearby-results"></div></details><div class="homeNameSearch"><label for="home-restaurant-search">Looking for somewhere specific?</label><input id="home-restaurant-search" class="restaurantSearch" type="search" placeholder="Search restaurant names" autocomplete="off"><p class="hint">Search by name if it is not in the nearby list.</p><p class="edit-status" id="home-restaurant-search-status" role="status" aria-live="polite"></p><div id="home-restaurant-search-results" class="restaurantLookupResults"></div></div></section></section>');
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
    if (updated && payload.updated) { const date = new Date(payload.updated); if (!Number.isNaN(date.getTime())) updated.textContent = "Stories refreshed " + date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) + "."; }
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
  const scores = review?.scores;
  const legacyTenQuestion = scores && [4, 5, 6, 7, 8, 9].some(index => scores[index] != null && scores[index] !== "");
  const legacyScoreIndex = legacyTenQuestion
    ? { experience: 0, food: 1, menuSelection: 2, service: 3, atmosphere: 4, ambiance: 4, cleanliness: 5, value: 6, drinksBar: 7, locationAccess: 8, returnIntent: 9 }
    : { experience: 0, food: 1, service: 2, value: 3 };
  const value = review?.[key] ?? (key === "overall" ? scores?.overall : undefined) ?? (key === "overall" ? review?.experience ?? scores?.[legacyScoreIndex.experience] : undefined) ?? (key === "rating" || key === "overall" ? review?.rating ?? scores?.overall : undefined) ?? (legacyScoreIndex[key] != null ? scores?.[legacyScoreIndex[key]] : undefined);
  const number = Number(value);
  if (value == null || value === "" || !Number.isFinite(number)) return null;
  return review?.ratingScale === 10 || legacyTenQuestion || number > 5 ? number : number * 2;
}
function reviewSurveyScore(review, key) {
  const value = review?.surveyScores?.[key];
  return value == null ? reviewRating(review, key) : reviewRating({ ...review, [key]: value, ratingScale: 10 }, key);
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
    const scoreLine = PIZZA_REVIEW_DIMENSIONS.filter(({ key }) => itemScores[key] != null).map(({ key, label }) => `${label} ${Number(itemScores[key]).toFixed(1)}`).join(" · ");
    const reviewedAt = item.reviewedAt || item.updatedAt || item.createdAt;
    return `<article class="readOnlyItem pizzaCard"><div class="recipeCardHeader"><strong>${escapeHtml([item.brand,item.name].filter(Boolean).join(" · "))}</strong><div class="recipeCardActions"><button class="btn" type="button" data-action="edit-pizza" data-pizza-id="${escapeHtml(item.id)}">Edit review</button><button class="btn danger" type="button" data-action="delete-pizza" data-pizza-id="${escapeHtml(item.id)}">Delete</button></div></div><div class="pizzaSavedSummary"><strong>${itemScores.overall == null ? "—" : Number(itemScores.overall).toFixed(1)}<small>/10</small></strong><span>Overall rating</span></div><small>${escapeHtml([reviewedAt ? `Reviewed ${String(reviewedAt).slice(0, 10)}` : "", item.upc ? `UPC ${item.upc}` : "", item.price == null ? "" : `$${Number(item.price).toFixed(2)}`].filter(Boolean).join(" · ") || "No purchase details saved")}</small>${scoreLine ? `<p class="pizzaScoreLine">${escapeHtml(scoreLine)}</p>` : `<p class="hint">No category ratings saved yet.</p>`}${item.wouldBuyAgain ? `<p class="pizzaSavedBuyAgain"><strong>Would buy again:</strong> ${item.wouldBuyAgain === "yes" ? "Yes" : "No"}</p>` : ""}${item.notes ? `<p>${escapeHtml(item.notes)}</p>` : ""}</article>`;
  }).join("");
  const scoreFields = PIZZA_REVIEW_DIMENSIONS.map(({ key, label, required, description }) => {
    const score = scores[key] == null ? null : Math.round(Number(scores[key]));
    return `<article class="pizzaRatingField"><div class="reviewQuestionHead"><b>${label}${required ? '<span class="requiredMark" aria-label="required">*</span>' : ' <span class="optionalMark">Optional</span>'}</b><span data-pizza-score-label="${key}">${score >= 1 && score <= 10 ? `${score}/10` : "Select 1–10"}</span></div><p>${description}</p>${pizzaReviewScoreButtons(score, key, label, required)}</article>`;
  }).join("");
  const initialRatings = PIZZA_REVIEW_DIMENSIONS.map(({ key }) => Number(scores[key])).filter(value => Number.isFinite(value) && value >= 1 && value <= 10);
  const initialOverall = initialRatings.length ? (initialRatings.reduce((sum, value) => sum + value, 0) / initialRatings.length).toFixed(1) : "—";
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const reviewedAt = pizza?.reviewedAt || pizza?.updatedAt?.slice(0, 10) || today;
  root.innerHTML = `<section class="hero"><div class="heroIn"><div class="eyebrow">Your freezer • Your ratings</div><h2>My Frozen Pizzas <span class="pizzaHeadingIcon" aria-hidden="true"><svg viewBox="0 0 64 64" focusable="false"><circle cx="32" cy="32" r="25"/><circle cx="32" cy="32" r="21"/><path d="M32 11 L49 46 Q32 39 15 46 Z"/><circle cx="29" cy="25" r="2.3"/><circle cx="35" cy="32" r="2.3"/><circle cx="29" cy="36" r="2.3"/></svg></span></h2><p>Give each frozen pizza the same clear 1–10 rating treatment as your restaurant reviews, then compare your overall scores.</p></div></section>
  <section class="content-panel"><div class="sectionTitle"><div><div class="sectionKicker">${(dataset.pizzas || []).length} saved</div><h3>Your frozen-pizza reviews</h3></div></div><div class="pizzaCollection">${pizzaRows || `<div class="empty">No frozen pizzas saved yet. Add one below to start your ratings.</div>`}</div></section>
  <section class="content-panel pizzaEditorPanel"><div class="sectionTitle"><div><div class="sectionKicker">${pizza ? "Edit saved review" : "Your next review"}</div><h3>${pizza ? "Update a Frozen Pizza Review" : "Review a Frozen Pizza"}</h3></div></div><p class="hint">Rate Taste, Crust, and Value to complete a review. Add Sauce, Cheese, or Toppings when they apply. Your overall score updates from the categories you rate.</p>
    <div class="pizzaLiveSummary"><div class="pizzaLiveScore"><span>Overall rating</span><strong><span id="pizza-overall-value">${initialOverall}</span><small>/10</small></strong></div><div class="pizzaRatingProgress"><progress id="pizza-rating-progress" max="3" value="${PIZZA_REVIEW_DIMENSIONS.filter(({ key, required }) => required && Number(scores[key]) >= 1 && Number(scores[key]) <= 10).length}"></progress><p id="pizza-rating-count">${PIZZA_REVIEW_DIMENSIONS.filter(({ key, required }) => required && Number(scores[key]) >= 1 && Number(scores[key]) <= 10).length} of 3 core ratings complete · ${initialRatings.length} of 6 categories rated</p></div></div>
    <div class="pizzaEditForm"><div class="restaurantEditorGrid"><label>Brand<input id="pizza-brand" maxlength="120" required value="${escapeHtml(pizza?.brand || "")}" placeholder="e.g. DiGiorno"></label><label>Pizza name / variety<input id="pizza-name" maxlength="180" required value="${escapeHtml(pizza?.name || "")}" placeholder="e.g. Rising Crust Pepperoni"></label></div><div class="restaurantEditorGrid pizzaUpcRow"><label>UPC barcode <span class="optionalMark">Optional</span><input id="pizza-upc" inputmode="numeric" autocomplete="off" maxlength="14" value="${escapeHtml(pizza?.upc || "")}" placeholder="8–14 digits"></label><div class="pizzaUpcActions"><button class="btn" type="button" data-action="scan-pizza-upc">Scan barcode</button><button class="btn" type="button" data-action="lookup-pizza-upc">Look up UPC</button></div></div><section class="pizzaScanner" id="pizza-scanner" aria-label="Pizza barcode scanner" hidden><div class="pizzaScannerHeader"><strong>Scan the pizza barcode</strong><button class="btn" type="button" data-action="close-pizza-scanner">Close camera</button></div><div class="pizzaScannerViewport"><video id="pizza-scanner-video" autoplay muted playsinline aria-label="Live camera preview for barcode scanning"></video><span class="pizzaScannerGuide" aria-hidden="true"></span></div><p>Hold the barcode inside the frame. Scanning stops as soon as a code is read.</p></section><p class="edit-status pizzaUpcStatus" id="pizza-upc-status" role="status" aria-live="polite"></p><p class="hint pizzaUpcHint">On a phone, tap Scan barcode and allow camera access. You can also enter the UPC manually. If no product match is found, enter the brand and name yourself.</p><div class="restaurantEditorGrid"><label>Review date<input id="pizza-reviewed-at" type="date" value="${escapeHtml(reviewedAt)}" required></label><label>Purchase price <span class="optionalMark">Optional</span><input id="pizza-price" type="number" inputmode="decimal" min="0" step=".01" value="${pizza?.price ?? ""}" placeholder="0.00"></label></div>
    <div class="reviewScaleLegend pizzaScaleLegend"><span>1 · Poor</span><span>5 · Average</span><span>10 · Exceptional</span></div><div class="pizzaScoreGrid" aria-label="Frozen pizza ratings">${scoreFields}</div><fieldset class="pizzaBuyAgain"><legend>Would you buy this pizza again? <span class="optionalMark">Optional</span></legend><label><input type="radio" name="pizza-would-buy-again" value="yes"${pizza?.wouldBuyAgain === "yes" ? " checked" : ""}> Yes</label><label><input type="radio" name="pizza-would-buy-again" value="no"${pizza?.wouldBuyAgain === "no" ? " checked" : ""}> No</label></fieldset><label>Review notes <span class="optionalMark">Optional</span><textarea id="pizza-notes" rows="3" maxlength="5000" placeholder="What stood out about the taste, texture, or value?">${escapeHtml(pizza?.notes || "")}</textarea></label><div class="recipeEditActions"><button class="btn" type="button" data-action="cancel-pizza-edit">${pizza ? "Cancel" : "Clear"}</button><button class="btn primary" type="button" data-action="save-pizza" data-pizza-id="${escapeHtml(pizza?.id || "")}">${pizza ? "Save Review" : "Save Pizza Review"}</button></div><p class="edit-status" role="status" aria-live="polite"></p></div><p class="hint">Your private pizza reviews are included in automatic restore points.</p></section>`;
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
  stopPizzaScanner();
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
  else if (activeView === "restaurant-rankings") renderRestaurantRankings();
  else if (activeView === "pizzas") renderFrozenPizzas();
  else renderHome();
}
let importMode = "text";
document.addEventListener("input", event => {
  if (event.target.id === "restaurant-name" && activeView === "restaurant-edit") searchRestaurantName(event.target.value);
  if (event.target.id === "home-restaurant-search") searchRestaurantName(event.target.value, { statusId: "home-restaurant-search-status", resultsId: "home-restaurant-search-results" });
  if (event.target.id === "restaurant-search") {
    const query = event.target.value.trim().toLocaleLowerCase();
    const cards = [...root.querySelectorAll(".restaurantCard[data-search]")];
    let visible = 0;
    cards.forEach(card => { const matches = card.dataset.search.includes(query); card.hidden = !matches; if (matches) visible += 1; });
    const count = root.querySelector("#restaurant-search-count");
    if (count) count.textContent = query ? `Showing ${visible} of ${cards.length} ${cards.length === 1 ? "restaurant" : "restaurants"}.` : `Showing ${visible} ${visible === 1 ? "restaurant" : "restaurants"}.`;
    searchRestaurantName(event.target.value, { statusId: "restaurant-search-status", resultsId: "restaurant-search-results" });
  }
  if (event.target.matches("[data-dish-name], [data-dish-notes]")) updateReviewFoodAverage();
  if (event.target.matches("#review-visited-at, #review-order-again")) updateReviewSurveySummary();
});
document.addEventListener("keydown", event => {
  if (event.target.id === "pizza-upc" && event.key === "Enter") {
    event.preventDefault();
    root.querySelector('[data-action="lookup-pizza-upc"]')?.click();
  }
});
document.addEventListener("change", event => {
  if (event.target.id === "restaurant-sort") {
    restaurantSort = event.target.value;
    render();
  }
  if (event.target.matches("#review-visited-at, #review-order-again")) updateReviewSurveySummary();
});
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
    if (activeView === "dining" || activeView === "home") searchNearbyRestaurants();
    // Every explicit section navigation starts at the top of the new page.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    root.focus({ preventScroll: true });
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  if (actionButton.dataset.action === "scan-pizza-upc") {
    void startPizzaScanner();
    return;
  }
  if (actionButton.dataset.action === "close-pizza-scanner") {
    stopPizzaScanner();
    const statusLine = root.querySelector("#pizza-upc-status");
    if (statusLine) statusLine.textContent = "Camera closed. You can enter the UPC manually.";
    return;
  }
  if (actionButton.dataset.action === "lookup-pizza-upc") {
    const upcField = root.querySelector("#pizza-upc");
    const brandField = root.querySelector("#pizza-brand");
    const nameField = root.querySelector("#pizza-name");
    const statusLine = root.querySelector("#pizza-upc-status");
    const upc = String(upcField?.value || "").replace(/\D/g, "");
    if (!/^\d{8,14}$/.test(upc)) { if (statusLine) statusLine.textContent = "Enter an 8 to 14 digit barcode first."; upcField?.focus(); return; }
    actionButton.disabled = true;
    if (statusLine) statusLine.textContent = "Looking up product…";
    try {
      const token = await globalThis.metroGetAccessToken?.();
      if (!token) throw new Error("Sign in again to look up a UPC.");
      const response = await fetch("/api/restaurant-lookup", {
        method: "POST", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode: "pizza-upc", upc })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || `Product lookup returned HTTP ${response.status}.`);
      if (upcField?.value.replace(/\D/g, "") !== upc) return;
      upcField.value = payload.product.upc || upc;
      if (payload.product.brand && brandField) brandField.value = payload.product.brand;
      if (payload.product.name && nameField) nameField.value = payload.product.name;
      if (statusLine) statusLine.textContent = `Found in ${payload.product.source}. Check the details before saving.`;
    } catch (error) {
      if (statusLine) statusLine.textContent = error?.message || "Product lookup failed. Enter the brand and name manually.";
    } finally { actionButton.disabled = false; }
    return;
  }
  if (actionButton.dataset.action === "open-rankings") { activeView = "restaurant-rankings"; render(); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); return; }
  if (actionButton.dataset.action === "toggle-restaurant-favorite") {
    const id = actionButton.dataset.restaurantId;
    const restaurant = cloudDataset.restaurants.find(item => String(item.id) === String(id));
    if (!restaurant) return;
    actionButton.disabled = true;
    const updated = { ...restaurant, favorite: !restaurant.favorite, updatedAt: new Date().toISOString() };
    try {
      await saveCloudDataset({ ...cloudDataset, restaurants: cloudDataset.restaurants.map(item => String(item.id) === String(id) ? updated : item) });
      render();
    } catch (error) {
      actionButton.disabled = false;
      const statusLine = actionButton.closest(".restaurantCard")?.querySelector(".edit-status");
      if (statusLine) statusLine.textContent = error?.message || "Favorite could not be saved.";
    }
    return;
  }
  if (actionButton.dataset.action === "select-restaurant-lookup") {
    const place = restaurantLookupResults[Number(actionButton.dataset.resultIndex)];
    if (!place) return;
    if (activeView !== "restaurant-edit" || !root.querySelector("#restaurant-name")) {
      newRestaurantPrefill = { name: place.name, cuisine: place.cuisine, address: place.address, website: place.website };
      restaurantDraft = null;
      activeRestaurantId = null;
      activeView = "restaurant-edit";
      render();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    const fields = [["restaurant-name", place.name], ["restaurant-cuisine", place.cuisine], ["restaurant-address", place.address], ["restaurant-website", place.website]];
    fields.forEach(([id, value]) => { const field = root.querySelector(`#${id}`); if (field && value) field.value = value; });
    restaurantLookupRequest += 1;
    clearTimeout(restaurantLookupTimer);
    restaurantLookupResults = [];
    root.querySelector("#restaurant-lookup-results")?.replaceChildren();
    const statusLine = root.querySelector("#restaurant-lookup-status");
    if (statusLine) statusLine.textContent = "Restaurant details filled in. Check them and save when ready.";
    return;
  }
  if (actionButton.dataset.action === "use-nearby") {
    try { newRestaurantPrefill = JSON.parse(actionButton.dataset.nearby); } catch { newRestaurantPrefill = null; }
    activeRestaurantId = null; activeReviewIndex = null; activeView = "restaurant-edit"; render(); window.scrollTo({ top: 0, left: 0, behavior: "instant" }); return;
  }
  if (actionButton.dataset.action === "add-review-dish") {
    const category = actionButton.dataset.category;
    const list = actionButton.closest("[data-review-category]")?.querySelector(".reviewDishList");
    if (!list) return;
    const id = crypto.randomUUID();
    const dish = document.createElement("article");
    dish.className = "reviewDish";
    dish.dataset.reviewDishId = id;
    dish.innerHTML = `<div class="reviewDishHead"><label>Dish or drink<input data-dish-name maxlength="180" placeholder="e.g. toasted ravioli"></label><button class="btn danger" type="button" data-action="remove-review-dish" aria-label="Remove dish">Remove</button></div><div class="reviewQuestionHead"><b>Food rating</b><span data-dish-rating-label>Select 1–10</span></div>${reviewScoreButtons(0, id, "", "Dish or drink", true)}${reviewScaleGuide()}<label>Dish notes <span class="optionalMark">Optional</span><textarea data-dish-notes rows="2" maxlength="1200" placeholder="Taste, texture, preparation, portion…"></textarea></label>`;
    list.append(dish);
    actionButton.closest("details").open = true;
    updateReviewFoodAverage();
    dish.querySelector("[data-dish-name]")?.focus();
    return;
  }
  if (actionButton.dataset.action === "remove-review-dish") { actionButton.closest("[data-review-dish-id]")?.remove(); updateReviewFoodAverage(); return; }
  if (actionButton.dataset.action === "set-pizza-score") {
    const group = actionButton.closest(".pizzaReviewScore");
    group?.querySelectorAll("button").forEach(button => {
      const selected = button === actionButton;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    updatePizzaRatingSummary();
    return;
  }
  if (actionButton.dataset.action === "set-review-score") {
    const group = actionButton.closest(".reviewScore");
    group?.querySelectorAll("button").forEach(button => { const selected = button === actionButton; button.classList.toggle("active", selected); button.setAttribute("aria-pressed", String(selected)); });
    const value = Number(actionButton.textContent);
    if (actionButton.dataset.reviewItemId) {
      const dish = actionButton.closest("[data-review-dish-id]");
      if (dish) dish.dataset.rating = String(value);
      const label = dish?.querySelector("[data-dish-rating-label]"); if (label) label.textContent = `${value}/10`;
      updateReviewFoodAverage();
    } else {
      const key = actionButton.dataset.scoreKey;
      const label = root.querySelector(`[data-score-label="${key}"]`); if (label) label.textContent = `${value}/10`;
    }
    updateReviewSurveySummary();
    return;
  }
  if (actionButton.dataset.action === "new-restaurant") {
    newRestaurantPrefill = null;
    restaurantDraft = null;
    activeRestaurantId = null;
    activeReviewIndex = null;
    activeView = "restaurant-edit";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "edit-restaurant") {
    restaurantDraft = null;
    newRestaurantPrefill = null;
    activeReviewIndex = null;
    activeRestaurantId = actionButton.dataset.restaurantId;
    activeView = "restaurant-edit";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "add-restaurant-review") {
    restaurantDraft = null;
    activeReviewIndex = null;
    activeRestaurantId = actionButton.dataset.restaurantId;
    activeView = "restaurant-review";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "edit-restaurant-review") {
    restaurantDraft = null;
    newRestaurantPrefill = null;
    activeRestaurantId = actionButton.dataset.restaurantId;
    activeReviewIndex = Number(actionButton.dataset.reviewIndex);
    activeView = "restaurant-review";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "start-restaurant-review") {
    const statusLine = actionButton.closest(".restaurantEditPanel")?.querySelector(".edit-status");
    const id = actionButton.dataset.restaurantId;
    const existing = id ? cloudDataset.restaurants.find(item => String(item.id) === String(id)) : null;
    const name = root.querySelector("#restaurant-name")?.value.trim() || "";
    const cuisine = root.querySelector("#restaurant-cuisine")?.value.trim() || "";
    const address = root.querySelector("#restaurant-address")?.value.trim() || "";
    const website = root.querySelector("#restaurant-website")?.value.trim() || "";
    const menuUrl = root.querySelector("#restaurant-menu")?.value.trim() || "";
    const notes = root.querySelector("#restaurant-notes")?.value.trim() || "";
    const favorite = Boolean(root.querySelector("#restaurant-favorite")?.checked);
    activeReviewIndex = null;
    if (!name) { if (statusLine) statusLine.textContent = "Enter a restaurant name before continuing to the visit review."; return; }
    for (const [label, value] of [["website", website], ["menu", menuUrl]]) if (value) {
      try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) throw new Error(); }
      catch { if (statusLine) statusLine.textContent = `Enter a complete http:// or https:// ${label} address.`; return; }
    }
    const now = new Date().toISOString();
    restaurantDraft = { ...(existing || newRestaurantPrefill || {}), id: existing?.id, name, cuisine, address, website, menuUrl, notes, favorite, ratingScale: 10, createdAt: existing?.createdAt || now, updatedAt: now };
    activeRestaurantId = existing?.id || null;
    activeView = "restaurant-review";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "back-to-restaurant-details") {
    activeView = "restaurant-edit";
    render();
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    return;
  }
  if (actionButton.dataset.action === "cancel-restaurant-edit") {
    activeRestaurantId = null;
    activeReviewIndex = null;
    newRestaurantPrefill = null;
    restaurantDraft = null;
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
    const menuUrl = document.querySelector("#restaurant-menu")?.value.trim() || "";
    const notes = document.querySelector("#restaurant-notes")?.value.trim() || "";
    const favorite = Boolean(document.querySelector("#restaurant-favorite")?.checked);
    if (!name) { if (statusLine) statusLine.textContent = "Enter a restaurant name before saving."; return; }
    for (const [label, value] of [["website", website], ["menu", menuUrl]]) if (value) {
      try { const url = new URL(value); if (!/^https?:$/.test(url.protocol)) throw new Error(); }
      catch { if (statusLine) statusLine.textContent = `Enter a complete http:// or https:// ${label} address.`; return; }
    }
    const id = actionButton.dataset.restaurantId;
    const existing = id ? cloudDataset.restaurants.find(item => String(item.id) === String(id)) : null;
    if (id && !existing) { if (statusLine) statusLine.textContent = "This restaurant is no longer in your account. Reload before saving."; return; }
    const now = new Date().toISOString();
    const restaurant = { ...(existing || {}), id: existing?.id || `metro-restaurant-${crypto.randomUUID()}`, name, cuisine, address, website, menuUrl, notes, favorite, ratingScale: 10, createdAt: existing?.createdAt || now, updatedAt: now };
    const restaurants = existing
      ? cloudDataset.restaurants.map(item => String(item.id) === String(id) ? restaurant : item)
      : [...cloudDataset.restaurants, restaurant];
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, restaurants });
      activeRestaurantId = null;
      restaurantDraft = null;
      newRestaurantPrefill = null;
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
    const savedRestaurant = id ? cloudDataset.restaurants.find(item => String(item.id) === String(id)) : null;
    const restaurant = { ...(savedRestaurant || {}), ...(restaurantDraft || {}) };
    const editingReview = activeReviewIndex == null ? null : restaurantReviewRecords(restaurant)[activeReviewIndex] || null;
    if (!restaurant.name || id && !savedRestaurant || !id && !restaurantDraft) { if (statusLine) statusLine.textContent = "This restaurant is no longer available. Go back and review its details before saving."; return; }
    const visitedAt = document.querySelector("#review-visited-at")?.value || "";
    const score = key => Number(root.querySelector(`[data-score-key="${key}"]`)?.closest(".reviewScore")?.querySelector("button.active")?.textContent || 0);
    const experience = score("overall");
    const service = score("service");
    const value = score("value");
    const surveyScores = Object.fromEntries(RESTAURANT_REVIEW_DIMENSIONS.map(({ key }) => [key, score(key) || null]));
    const dishes = [...root.querySelectorAll("[data-review-dish-id]")].map(dish => ({
      category: dish.closest("[data-review-category]")?.dataset.reviewCategory || "Entrées",
      name: dish.querySelector("[data-dish-name]")?.value.trim() || "",
      rating: Number(dish.dataset.rating || 0),
      notes: dish.querySelector("[data-dish-notes]")?.value.trim() || ""
    }));
    const order = document.querySelector("#review-order")?.value.trim() || "";
    const orderAgain = document.querySelector("#review-order-again")?.value || "";
    const notes = document.querySelector("#review-notes")?.value.trim() || "";
    const now = new Date().toISOString();
    let review;
    try {
      const savedReview = createRestaurantReview({ id: editingReview?.id || editingReview?._id || `metro-review-${crypto.randomUUID()}`, createdAt: editingReview?.createdAt || now, visitedAt, experience, service, value, foodItems: dishes, surveyScores, order, orderAgain, notes });
      review = { ...(editingReview || {}), ...savedReview, updatedAt: now };
    }
    catch (error) { if (statusLine) statusLine.textContent = error?.message || "Review values are incomplete or invalid."; return; }
    const reviewState = upsertRestaurantReview(restaurant, review, editingReview);
    const allScores = restaurantReviewRecords(reviewState).map(item => reviewRating(item, "overall") ?? reviewRating(item, "rating")).filter(Number.isFinite);
    const updated = { ...reviewState, id: savedRestaurant?.id || `metro-restaurant-${crypto.randomUUID()}`, favorite: Boolean(root.querySelector("#review-restaurant-favorite")?.checked), rating: allScores.length ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length : null, ratingScale: 10, updatedAt: now };
    const restaurants = savedRestaurant
      ? cloudDataset.restaurants.map(item => String(item.id) === String(id) ? updated : item)
      : [...cloudDataset.restaurants, updated];
    actionButton.disabled = true;
    try {
      await saveCloudDataset({ ...cloudDataset, restaurants });
      activeRestaurantId = null;
      activeReviewIndex = null;
      restaurantDraft = null;
      newRestaurantPrefill = null;
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
    const reviewedAt = document.querySelector("#pizza-reviewed-at")?.value || "";
    const priceRaw = document.querySelector("#pizza-price")?.value ?? "";
    const notes = document.querySelector("#pizza-notes")?.value.trim() || "";
    const wouldBuyAgain = document.querySelector('[name="pizza-would-buy-again"]:checked')?.value || "";
    const scores = Object.fromEntries(PIZZA_REVIEW_DIMENSIONS.map(({ key }) => {
      const active = root.querySelector(`[data-pizza-score-key="${key}"].active`);
      return [key, active ? Number(active.textContent) : null];
    }));
    const componentScores = PIZZA_REVIEW_DIMENSIONS.map(({ key }) => scores[key]).filter(value => value != null);
    if (!brand || !name) { if (statusLine) statusLine.textContent = "Enter both a brand and a pizza name."; return; }
    if (upc && !/^\d{8,14}$/.test(upc)) { if (statusLine) statusLine.textContent = "Enter 8 to 14 UPC digits, or leave the barcode blank."; return; }
    const parsedReviewDate = /^\d{4}-\d{2}-\d{2}$/.test(reviewedAt) ? new Date(`${reviewedAt}T00:00:00.000Z`) : null;
    if (!parsedReviewDate || Number.isNaN(parsedReviewDate.getTime()) || parsedReviewDate.toISOString().slice(0, 10) !== reviewedAt) { if (statusLine) statusLine.textContent = "Choose a valid review date."; return; }
    const price = priceRaw === "" ? null : Number(priceRaw);
    if (price != null && (!Number.isFinite(price) || price < 0)) { if (statusLine) statusLine.textContent = "Enter a valid nonnegative price."; return; }
    if (componentScores.some(value => !Number.isInteger(value) || value < 1 || value > 10)) { if (statusLine) statusLine.textContent = "Choose a whole-number rating from 1 to 10 for each category."; return; }
    if (!["taste", "crust", "value"].every(key => scores[key] >= 1 && scores[key] <= 10)) { if (statusLine) statusLine.textContent = "Rate Taste, Crust, and Value to complete your review."; return; }
    scores.overall = Math.round(componentScores.reduce((sum, value) => sum + value, 0) / componentScores.length * 10) / 10;
    const id = actionButton.dataset.pizzaId;
    const existing = id ? cloudDataset.pizzas.find(item => String(item.id) === String(id)) : null;
    if (id && !existing) { if (statusLine) statusLine.textContent = "This pizza is no longer in your account. Reload before saving."; return; }
    const now = new Date().toISOString();
    const pizza = { ...(existing || {}), id: existing?.id || `metro-pizza-${crypto.randomUUID()}`, upc, brand, name, price, scores, notes, reviewedAt, wouldBuyAgain, ratingScale: 10, createdAt: existing?.createdAt || now, updatedAt: now };
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
    if (activeView === "home") { loadLocalFoodNews(); searchNearbyRestaurants(); }
  } catch (error) {
    cloudReady = false;
    setStatus(error?.message || "Data unavailable", "warn");
    render();
    if (activeView === "home") { loadLocalFoodNews(); searchNearbyRestaurants(); }
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
