import { mapMenuMarkup } from "./map-menu.mjs";
import { lookupBars } from "./bar-lookup.mjs";
import { importCocktailUrl, parseCocktailText } from "./cocktail-import.mjs";
import { COCKTAIL_ICON, COCKTAIL_TYPES, optionalRating, safeWebUrl, summarizeCocktailCollection, drinksForVisit, saveBarVisit } from "../domain/cocktails.mjs";
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const score = value => value == null ? "Unrated" : `${Number(value).toFixed(1)}/10`;
const tabs = { bars: "The Barstool", drinks: "Top Drinks", cocktailRecipes: "My Cocktails" };
export function createCocktailJournal({ root, getData, save }) {
  let tab = "bars", editing = null, visitBar = null, editingVisit = null, editorOpen = false;
  let favoritesOnly=false,gamingFilter="all";
  let nearby = [], nearbyLoaded = false, nearbyMessage = '', searchResults = [], location = null, searchTimer, searchController, prefill = null, generation = 0;
  const field = (name, label, value = "", attributes = "") => `<label>${label}<input name="${name}" value="${esc(value)}" ${attributes}></label>`;
  const area = (name, label, value = "", required = false) => `<label>${label}<textarea name="${name}" rows="3" maxlength="10000"${required ? " required" : ""}>${esc(value)}</textarea></label>`;
  const ratingField = (name, label, value) => `<div class="cocktailRatingField"><div class="reviewQuestionHead"><b>${esc(label)}</b><span data-cocktail-score-label>${value ? score(value) : ""}</span></div><input type="hidden" name="${esc(name)}" value="${value ?? ""}"><div class="cocktailScoreButtons" role="group" aria-label="${esc(label)} rating from 1 to 10">${Array.from({length:10},(_,i)=>`<button type="button" data-cocktail-action="score" data-value="${i+1}" aria-label="${esc(label)}: ${i+1} out of 10" aria-pressed="${Number(value)===i+1}">${i+1}</button>`).join("")}</div></div>`;
  const notesField = (name,label,value) => `<details class="entryDetails"><summary>${label}</summary>${area(name,label,value).replace('maxlength="10000"','maxlength="5000"')}</details>`;
  function drinkRow(drink={}) { return `<article class="visitDrinkRow" data-visit-drink="${esc(drink.id || crypto.randomUUID())}"><div class="reviewDishHead">${field("drinkName","Drink",drink.name,'maxlength="180"')}${action("×","remove-drink","",'aria-label="Remove drink"')}</div>${ratingField("drinkRating","Drink rating",drink.overallRating)}${notesField("drinkNotes","Notes",drink.notes)}</article>`; }
  const scale = '<div class="reviewScaleLegend"><span>1 · Poor</span><span>5 · Average</span><span>10 · Exceptional</span></div>';
  function visitOptions(data,barId,visitId) {return '<option value="">No visit linked</option>' + (data.bars.find(bar=>bar.id===barId)?.visits || []).map(visit=>`<option value="${esc(visit.id)}"${visit.id===visitId?' selected':''}>${esc(visit.visitedAt)}${visit.overallRating==null?"":` · ${score(visit.overallRating)}`}</option>`).join('');}
  const types = (value = "") => `<label>Base / style<select name="base"><option value="">Choose a style</option>${COCKTAIL_TYPES.map(type => `<option${type === value ? " selected" : ""}>${esc(type)}</option>`).join("")}</select></label>`;
  const action = (label, kind, id = "", extra = "") => `<button class="btn" type="button" data-cocktail-action="${kind}" data-id="${esc(id)}" ${extra}>${label}</button>`;
  function setTab(next) { generation++; clearTimeout(searchTimer);searchController?.abort();prefill=null;if (tabs[next]) tab = next; editing = null; visitBar = null; editorOpen = false; }
  function render() {
    const data = getData();
    const rows = data[tab] || [];
    const stats = summarizeCocktailCollection(rows, { visits: tab === "bars" });
    root.innerHTML = `<section class="hero cocktailHero"><div class="heroIn"><div class="eyebrow">Your drinks journal</div><h2><span class="cocktailMark">${COCKTAIL_ICON}</span> Cocktails &amp; Bars</h2><p>Great places, memorable drinks, and cocktails worth making at home.</p></div></section><section class="content-panel cocktailJournal"><nav class="cocktailTabs" aria-label="Cocktails and bars categories">${Object.entries(tabs).map(([key,label]) => `<button type="button" data-cocktail-tab="${key}" aria-pressed="${tab === key}">${label}</button>`).join("")}</nav><div class="sectionTitle"><div><div class="sectionKicker">${rows.length} saved · ${stats.favoriteCount} favorites</div><h3>${tabs[tab]}</h3></div>${action(tab === "bars" ? "＋ Add a Bar" : tab === "drinks" ? "＋ Rate a Drink" : "＋ Add a Cocktail", "new")}</div><p class="hint">${tab === "bars" ? "Rate the visit. Add the drinks." : tab === "drinks" ? "Your drinks, linked to bars and visits." : "Import a recipe or add your own."}</p><p class="cocktailAverage">${tab === "bars" ? "Four ratings. Your experience." : score(stats.averageRating)} <small>${tab === "bars" ? "" : stats.ratedCount ? `average across ${stats.ratedCount} ${tab === "bars" ? "rated visits" : "rated entries"}` : "Add a rating when you’re ready"}</small></p><label class="cocktailSearch">${tab === "bars" ? "Search saved spots" : `Search ${tabs[tab].toLowerCase()}`}<input id="cocktail-search" type="search" placeholder="Search name, style, venue, or notes"></label><p id="cocktail-search-count" class="hint" aria-live="polite">${rows.length} entries</p>${tab === "bars" ? `<label class="barGamingFilter">Features<select id="bar-gaming-filter">${[["all","All saved spots"],["videoGaming","Video Gaming"],["keno","Keno"]].map(([key,label])=>`<option value="${key}"${gamingFilter===key?" selected":""}>${label}</option>`).join("")}</select></label>` : ""}${tab === "bars" && !editorOpen ? `<section class="barDiscovery"><details><summary><span aria-hidden="true">▸</span> Around Me</summary><p class="hint" data-bars-nearby-status>${esc(nearbyMessage || "Finding nearby bars…")}</p>${action("Use my location","locate-bars")}<div data-bars-nearby>${barResults(nearby,"nearby")}</div></details></section>` : ""}<label class="inlineCheck"><input id="cocktail-favorites-only" type="checkbox"${favoritesOnly?" checked":""}> Favorites only</label>${editorOpen ? renderEditor(data) : ""}<div class="cocktailCards">${rows.filter(item=>(!favoritesOnly||item.favorite) && (tab!=="bars" || gamingFilter==="all" || item[gamingFilter]===true)).slice().sort((a,b) => (tab === "drinks" ? (b.overallRating ?? -1) - (a.overallRating ?? -1) : 0) || Number(Boolean(b.favorite))-Number(Boolean(a.favorite)) || a.name.localeCompare(b.name)).map(item => renderCard(item,data)).join("") || `<p class="empty">${tab === "bars" ? "No spots saved yet." : tab === "drinks" ? "No drinks rated yet." : "No cocktails saved yet."}</p>`}</div><p class="hint">Private to your account. Ratings in this section never change your restaurant, recipe, or frozen-pizza scores.</p></section>`;
    if(tab === "bars" && !nearbyLoaded) {
      if(navigator.geolocation)navigator.geolocation.getCurrentPosition(position=>{location={lat:position.coords.latitude,lon:position.coords.longitude,source:"device"};void loadNearby();},()=>{void loadNearby();},{timeout:8000,maximumAge:300000});
      else void loadNearby();
      nearbyLoaded=true;
    }
    root.querySelector("#cocktail-search").addEventListener("input", event => {
      const query = event.target.value.trim().toLocaleLowerCase(); let count = 0;
      root.querySelectorAll("[data-cocktail-search]").forEach(card => { card.hidden = !card.dataset.cocktailSearch.includes(query); if (!card.hidden) count++; });
      root.querySelector("#cocktail-search-count").textContent = `${count} matching ${count === 1 ? "entry" : "entries"}`;
    });
    root.querySelector("#cocktail-editor")?.addEventListener("submit", submit);
    root.querySelector('[name="barId"]')?.addEventListener("change", event=> { root.querySelector('[name="visitId"]').innerHTML=visitOptions(getData(),event.target.value,""); });
    root.querySelector("#cocktail-favorites-only")?.addEventListener("change",event=>{favoritesOnly=event.target.checked;render();});
    root.querySelector("#bar-gaming-filter")?.addEventListener("change",event=>{gamingFilter=event.target.value;render();});
    const nameInput=root.querySelector('#cocktail-editor [name="name"]');
    if(tab === 'bars' && nameInput) nameInput.addEventListener('input',()=>{
      clearTimeout(searchTimer);searchController?.abort();const query=nameInput.value.trim(),version=++generation;
      const status=root.querySelector('[data-bar-search-status]'),results=root.querySelector('[data-bar-search-results]');
      results.innerHTML='';if(query.length<2){status.textContent='';return;}
      status.textContent='Searching…';searchTimer=setTimeout(async()=>{
        searchController=new AbortController();
        try {const found=await lookupBars({query,location,signal:searchController.signal});if(version!==generation || !nameInput.isConnected)return;searchResults=found.places;status.textContent=searchResults.length?'Select a match.':'No match. Enter details below.';results.innerHTML=barResults(searchResults,'search');}
        catch(error){if(error.name!=='AbortError' && version===generation && nameInput.isConnected)status.textContent='Search unavailable. Enter details below.';}
      },350);
    });
    root.querySelector("#cocktail-editor input")?.focus({preventScroll:true});
  }
  function barResults(places,source) {return places.map((place,index)=>`<div class="lookupMatch"><button type="button" class="barMatch" data-cocktail-action="choose-bar" data-source="${source}" data-index="${index}"><strong>${esc(place.name)}</strong><small>${esc([place.address,place.distance == null ? '' : `${(place.distance/1609.34).toFixed(1)} mi`].filter(Boolean).join(' · '))}</small></button>${mapMenuMarkup(place)}</div>`).join('');}
  async function loadNearby() {
    nearbyLoaded=true;
    try {const found=await lookupBars({location});nearby=found.places;location=found.location;nearbyMessage=nearby.length ? (location?.source==='device' ? 'Nearby bars & pubs.' : `Approximate area${location?.city ? ` · ${location.city}` : ''}. Use location for closer results.`) : 'No nearby bars found. Search by name when adding a spot.';}
    catch(error){nearbyMessage='Nearby lookup unavailable. Search by name or add a spot.';nearby=[];}
    const status=root.querySelector('[data-bars-nearby-status]'),list=root.querySelector('[data-bars-nearby]');if(status)status.textContent=nearbyMessage;if(list)list.innerHTML=barResults(nearby,'nearby');
  }
  function renderCard(item,data) {
    const bar = data.bars?.find(bar => bar.id === item.barId);
    const stats = tab === "bars" ? summarizeCocktailCollection([item],{visits:true}) : null;
    const details = tab === "bars" ? `<p>${esc(item.address)}</p>${safeWebUrl(item.website) ? `<a href="${esc(safeWebUrl(item.website))}" target="_blank" rel="noopener noreferrer">Venue website ↗</a>` : ""}<h4>Visit history · ${item.visits?.length || 0}</h4>${(item.visits || []).slice().reverse().map(visit => `<article class="cocktailVisit"><strong>${esc(visit.visitedAt)} · ${score(visit.overallRating)}</strong><p class="hint">${[["Atmosphere",visit.atmosphere],["Drinks",visit.drinkQuality],["Bartenders",visit.bartenders],["Restrooms",visit.restrooms]].filter(([,value])=>value!=null).map(([label,value])=>`${label} ${score(value)}`).join(" · ")}</p><p>${esc(visit.notes)}</p>${drinksForVisit(data,item.id,visit.id).map(drink=>`<div class="visitDrinkSummary"><strong>${esc(drink.name)} · ${score(drink.overallRating)}</strong>${action("Edit drink","edit-linked-drink",drink.id)}</div>`).join("")}${action("Edit visit", "edit-visit", item.id, `data-visit-id="${esc(visit.id)}"`)}</article>`).join("") || '<p class="hint">No visits recorded yet.</p>'}` : tab === "cocktailRecipes" ? `<p>${esc([item.base,item.glassware,item.garnish && `Garnish: ${item.garnish}`].filter(Boolean).join(" · "))}</p><h4>Ingredients</h4><ul>${item.ingredients.map(line=>`<li>${esc(line)}</li>`).join("")}</ul><h4>Preparation</h4><ol>${item.directions.map(line=>`<li>${esc(line)}</li>`).join("")}</ol>${safeWebUrl(item.source) ? `<a href="${esc(safeWebUrl(item.source))}" target="_blank" rel="noopener noreferrer">Recipe source ↗</a>` : ""}` : `<p>${esc([bar?.name,item.visitId ? `Visit ${bar?.visits.find(visit=>visit.id===item.visitId)?.visitedAt || ""}` : "",item.base,item.triedAt,item.price != null ? `$${Number(item.price).toFixed(2)}` : ""].filter(Boolean).join(" · "))}</p>`;
    return `<article class="readOnlyItem cocktailCard" id="cocktail-${esc(item.id)}" data-cocktail-search="${esc(JSON.stringify([item,bar?.name]).toLocaleLowerCase())}"><div class="recipeCardHeader"><div><h3>${item.favorite ? '<span aria-label="Favorite">★</span> ' : ""}${esc(item.name)}</h3><span class="cocktailRating">${stats ? "Your spot" : score(item.overallRating)}</span>${stats ? `<small>${[item.videoGaming?"Video Gaming":"",item.keno?"Keno":""].filter(Boolean).join(" · ")}</small><small>${stats.visitCount} visits</small><small>Drink quality · ${score(summarizeCocktailCollection(data.drinks.filter(drink=>drink.barId===item.id)).averageRating)}</small>` : ""}</div><div class="recipeCardActions"><details class="cardOptions"><summary class="cardOptionsTrigger" aria-label="Options for ${esc(item.name)}" title="Options"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div class="cardOptionsList">${action("Edit","edit",item.id)}${tab === "bars" ? action("＋ Rate a visit","visit",item.id) : ""}</div></details></div></div><details><summary>${tab === "bars" ? "Venue details & visit history" : tab === "cocktailRecipes" ? "View cocktail recipe" : "Drink details"}</summary>${details}${item.notes ? `<p class="cocktailNotes">${esc(item.notes)}</p>` : ""}</details></article>`;
  }
  function renderEditor(data) {
    const item = editing ? data[tab].find(row=>row.id===editing) : prefill;
    const bar = visitBar ? data.bars.find(row=>row.id===visitBar) : null;
    const visit = bar?.visits?.find(row=>row.id===editingVisit);
    let content;
    if (bar) content = `<details class="entryDetails"><summary>Change visit date</summary>${field("visitedAt","Visit date",visit?.visitedAt || today(),'type="date" required')}</details>${scale}${ratingField("atmosphere","Atmosphere",visit?.atmosphere)}${ratingField("drinkQuality","Drinks",visit?.drinkQuality)}${ratingField("bartenders","Bartenders",visit?.bartenders)}${ratingField("restrooms","Restrooms",visit?.restrooms)}<section class="visitDrinks"><h4>Drinks</h4><p class="hint">Also appears in Top Drinks.</p><div data-visit-drinks>${visit ? drinksForVisit(data,bar.id,visit.id).map(drinkRow).join('') : ''}</div>${action("＋ Add a drink","add-drink")}</section>${notesField("notes","Visit notes",visit?.notes)}`;

    else {
      content = tab === "cocktailRecipes" ? `<section class="cocktailImport"><label>Recipe URL<input name="importUrl" type="url" placeholder="https://"></label>${action("Import URL","import-url")}<details class="entryDetails"><summary>Paste recipe text</summary>${area("importText","Recipe text","",false)}${action("Use recipe text","import-text")}</details><p class="hint" data-import-feedback role="status" aria-live="polite">Review before saving.</p></section>` : "";
      content += field("name",tab === "bars" ? "Spot name" : "Cocktail name",item?.name,'required maxlength="180"');
      if(tab === "bars") content += `<p class="hint" data-bar-search-status role="status" aria-live="polite"></p><div data-bar-search-results></div>` + field("address","Address",item?.address,'maxlength="300"') + field("website","Website",item?.website,'type="url" maxlength="2000" placeholder="https://"') + `<details class="entryDetails"><summary>Features</summary><p class="hint">Mark what you’ve confirmed.</p><label class="inlineCheck"><input type="checkbox" name="videoGaming"${item?.videoGaming?" checked":""}> Video Gaming</label><label class="inlineCheck"><input type="checkbox" name="keno"${item?.keno?" checked":""}> Keno</label></details>`;
      else {
        content += types(item?.base) + scale + ratingField("overallRating","Overall rating",item?.overallRating);
        if(tab === "drinks") content += `<label>Venue <small>Optional</small><select name="barId"><option value="">No venue / other</option>${data.bars.map(bar=>`<option value="${esc(bar.id)}"${item?.barId===bar.id?' selected':''}>${esc(bar.name)}</option>`).join("")}</select></label><label>Visit <small>Optional</small><select name="visitId">${visitOptions(data,item?.barId,item?.visitId)}</select></label><div class="cocktailFormGrid"><details class="entryDetails"><summary>Change date</summary>${field("triedAt","Date tried",item?.triedAt || today(),'type="date"')}</details>${field("price","Price ($)",item?.price,'type="number" min="0" step="0.01" inputmode="decimal"')}</div>`;
        else content += `${area("ingredients","Ingredients & quantities (one per line)",item?.ingredients?.join("\n"),true)}${area("directions","Preparation (one step per line)",item?.directions?.join("\n"),true)}<div class="cocktailFormGrid">${field("glassware","Glassware",item?.glassware,'maxlength="300"')}${field("garnish","Garnish",item?.garnish,'maxlength="300"')}</div>${field("source","Recipe source URL",item?.source,'type="url" maxlength="2000" placeholder="https://"')}`;
      }
      content += notesField("notes","Notes",item?.notes) + `<label class="inlineCheck"><input name="favorite" type="checkbox"${item?.favorite?' checked':''}> Favorite</label>`;
    }
    return `<form id="cocktail-editor" class="cocktailEditor"><h3>${bar ? `${visit ? "Edit visit to" : "Rate a visit to"} ${esc(bar.name)}` : `${editing ? "Edit" : "Add"} ${tab === "bars" ? "a spot" : tab === "drinks" ? "a drink rating" : "a home cocktail"}`}</h3>${content}<div class="actions">${action("Cancel","cancel")}${tab === "bars" && !bar ? `<button class="btn" type="submit">Save &amp; Review Later</button><button class="btn primary" type="submit" data-review-now="true">Review Now</button>` : `<button class="btn primary" type="submit">Save ${bar ? "visit" : "entry"}</button>`}${(editing || visit) ? action("Delete",visit ? "delete-visit" : "delete",item?.id || bar.id,visit ? `data-visit-id="${esc(visit.id)}"` : "") : ""}</div><p class="edit-status" role="status" aria-live="polite"></p></form>`;
  }
  async function submit(event) {
    event.preventDefault(); const form=event.currentTarget, button=form.querySelector('[type="submit"]'), feedback=form.querySelector('[role="status"]');
    const values=new FormData(form), value=key=>String(values.get(key)||"").trim(), now=new Date().toISOString();
    button.disabled=true;
    try {
      const data=getData(); let next, savedVenueId;
      if(visitBar) {
        const bar=data.bars.find(row=>row.id===visitBar); if(!bar) throw new Error("This venue is no longer available. Reload before saving.");
        const existing=bar.visits.find(row=>row.id===editingVisit);
        if(editingVisit && !existing) throw new Error("This visit is no longer available. Reload before saving.");
        const visit={...existing,id:existing?.id || crypto.randomUUID(),visitedAt:value("visitedAt"),overallRating:existing?.overallRating ?? null,service:existing?.service ?? null,value:existing?.value ?? null,atmosphere:optionalRating(value("atmosphere")),drinkQuality:optionalRating(value("drinkQuality")),bartenders:optionalRating(value("bartenders")),restrooms:optionalRating(value("restrooms")),notes:value("notes"),createdAt:existing?.createdAt || now,updatedAt:now};
        const drinks=[...form.querySelectorAll('[data-visit-drink]')].map(row=>{
          const old=data.drinks.find(drink=>drink.id===row.dataset.visitDrink);
          return {...old,id:row.dataset.visitDrink,name:row.querySelector('[name="drinkName"]').value.trim(),overallRating:optionalRating(row.querySelector('[name="drinkRating"]').value),notes:row.querySelector('[name="drinkNotes"]').value.trim(),createdAt:old?.createdAt || now,updatedAt:now};
        });
        next=saveBarVisit(data,bar.id,visit,drinks);
      } else {
        const existing=editing ? data[tab].find(row=>row.id===editing) : null;
        if(editing && !existing) throw new Error("This entry is no longer available. Reload before saving.");
        const item={...existing,id:existing?.id || crypto.randomUUID(),name:value("name"),notes:value("notes"),favorite:values.has("favorite"),createdAt:existing?.createdAt || now,updatedAt:now};
        if(tab === "bars") { savedVenueId=item.id; Object.assign(item,{videoGaming:values.has("videoGaming"),keno:values.has("keno"),address:value("address"),website:value("website"),visits:existing?.visits || []}); }
        else Object.assign(item,{base:value("base"),overallRating:optionalRating(value("overallRating"))});
        if(tab === "drinks") Object.assign(item,{barId:value("barId"),visitId:value("visitId"),triedAt:value("triedAt"),price:value("price")===""?null:Number(value("price"))});
        if(tab === "drinks" && item.visitId) {
          const linkedVisit=data.bars.find(bar=>bar.id===item.barId)?.visits.find(visit=>visit.id===item.visitId);
          if(!linkedVisit) throw new Error("Choose an existing visit.");
          item.triedAt=linkedVisit.visitedAt;
        }
        if(tab === "cocktailRecipes") Object.assign(item,{ingredients:value("ingredients").split(/\r?\n/).map(line=>line.trim()).filter(Boolean),directions:value("directions").split(/\r?\n/).map(line=>line.trim()).filter(Boolean),glassware:value("glassware"),garnish:value("garnish"),source:value("source")});
        for(const key of ["website","source"]) if(item[key] && !safeWebUrl(item[key])) throw new Error("Use a complete http:// or https:// address.");
        next={...data,[tab]:existing ? data[tab].map(row=>row.id===existing.id?item:row) : [...data[tab],item]};
      }
      await save(next); prefill=null;editing=null;editingVisit=null;visitBar=event.submitter?.dataset.reviewNow ? savedVenueId : null;editorOpen=Boolean(visitBar);render();
    } catch(error) { feedback.textContent=error.message || "Save failed. Your entry was not reported as saved.";button.disabled=false; }
  }
  async function handleClick(event) {
    const tabButton=event.target.closest('[data-cocktail-tab]');
    if(tabButton){setTab(tabButton.dataset.cocktailTab);render();return true;}
    const button=event.target.closest('[data-cocktail-action]');if(!button)return false;
    const kind=button.dataset.cocktailAction,id=button.dataset.id;
    if(kind==="locate-bars") {
      if(!navigator.geolocation){root.querySelector('[data-bars-nearby-status]').textContent='Location unavailable.';return true;}
      button.disabled=true;
      navigator.geolocation.getCurrentPosition(position=>{location={lat:position.coords.latitude,lon:position.coords.longitude,source:'device'};void loadNearby().finally(()=>{if(button.isConnected)button.disabled=false;});},()=>{if(button.isConnected){button.disabled=false;root.querySelector('[data-bars-nearby-status]').textContent='Location unavailable. Showing approximate results.';}},{timeout:8000,maximumAge:300000});return true;
    }
    if(kind==="choose-bar") {
      const place=(button.dataset.source==='nearby'?nearby:searchResults)[Number(button.dataset.index)];if(!place)return true;
      generation++;clearTimeout(searchTimer);searchController?.abort();
      const existing=getData().bars.find(bar=>bar.name.toLowerCase()===place.name.toLowerCase() && bar.address===place.address);
      if(existing){editing=null;visitBar=existing.id;editingVisit=null;editorOpen=true;render();return true;}
      if(editorOpen && tab==='bars' && !visitBar){const form=root.querySelector('#cocktail-editor');for(const key of ['name','address','website'])if(place[key])form.elements[key].value=place[key];root.querySelector('[data-bar-search-results]').innerHTML='';root.querySelector('[data-bar-search-status]').textContent='Details filled in.';}
      else {prefill=place;editing=null;visitBar=null;editingVisit=null;editorOpen=true;render();root.querySelector('#cocktail-editor')?.scrollIntoView({block:'start',behavior:'smooth'});}
      return true;
    }
    if(kind==="score") {const group=button.closest('.cocktailRatingField');group.querySelector('input').value=button.dataset.value;group.querySelector('[data-cocktail-score-label]').textContent=score(button.dataset.value);group.querySelectorAll('button').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));return true;}
    if(kind==="add-drink") {root.querySelector('[data-visit-drinks]').insertAdjacentHTML('beforeend',drinkRow());return true;}
    if(kind==="remove-drink") {button.closest('[data-visit-drink]').remove();return true;}
    if(kind==="edit-linked-drink") {setTab('drinks');editing=id;editorOpen=true;render();root.querySelector('#cocktail-editor')?.scrollIntoView({block:'start',behavior:'smooth'});return true;}
    if(kind==="import-url" || kind==="import-text") {
      const form=button.closest('form'),feedback=form.querySelector('[data-import-feedback]');button.disabled=true;feedback.textContent='Importing…';
      try {const draft=kind==='import-url' ? await importCocktailUrl(form.elements.importUrl.value.trim()) : parseCocktailText(form.elements.importText.value);
        if(form.isConnected) {for(const [key,value] of Object.entries(draft)) {if(form.elements[key])form.elements[key].value=Array.isArray(value)?value.join('\n'):value;} feedback.textContent='Imported. Review, then save.';}
      } catch(error) {if(form.isConnected) feedback.textContent=error.message;}
      finally {if(form.isConnected)button.disabled=false;}
      return true;
    }
    if(kind==="cancel"){prefill=null;editorOpen=false;editing=null;visitBar=null;editingVisit=null;render();return true;}
    if(kind==="new" || kind==="edit" || kind==="visit" || kind==="edit-visit") {
      prefill=null;editing=kind==="edit"?id:null;visitBar=kind.includes("visit")?id:null;editingVisit=kind==="edit-visit"?button.dataset.visitId:null;editorOpen=true;render();root.querySelector('#cocktail-editor')?.scrollIntoView({block:"start",behavior:"smooth"});return true;
    }
    if(kind==="delete" || kind==="delete-visit") {
      const data=getData();
      if(tab==="bars" && kind==="delete" && data.drinks.some(drink=>drink.barId===id)) { root.querySelector('#cocktail-editor [role="status"]').textContent="This venue has linked drink ratings. Edit those drinks to remove or change their venue before deleting it.";return true; }
      if(button.dataset.deleteConfirmed !== "true") {
        button.dataset.deleteConfirmed="true";
        button.textContent=`Confirm delete ${kind==="delete-visit"?"visit":"entry"}`;
        root.querySelector('#cocktail-editor [role="status"]').textContent='Select Confirm delete to remove this entry, or Cancel to keep it. The previous dataset is kept in a restore point.';
        return true;
      }
      button.disabled=true;
      try { const next=kind==="delete-visit" ? {...data,bars:data.bars.map(bar=>bar.id===id?{...bar,visits:bar.visits.filter(visit=>visit.id!==button.dataset.visitId)}:bar),drinks:data.drinks.map(drink=>drink.barId===id && drink.visitId===button.dataset.visitId?{...drink,visitId:""}:drink)} : {...data,[tab]:data[tab].filter(row=>row.id!==id)};await save(next);editorOpen=false;editing=null;visitBar=null;editingVisit=null;render(); }
      catch(error){root.querySelector('#cocktail-editor [role="status"]').textContent=error.message;button.disabled=false;}
    }
    return true;
  }
  return {render,handleClick,setTab};
}
