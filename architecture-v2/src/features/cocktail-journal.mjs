import { COCKTAIL_ICON, COCKTAIL_TYPES, optionalRating, safeWebUrl, summarizeCocktailCollection } from "../domain/cocktails.mjs";
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const score = value => value == null ? "Unrated" : `${Number(value).toFixed(1)}/10`;
const tabs = { bars: "Bars & Venues", drinks: "Drink Ratings", cocktailRecipes: "Home Cocktails" };
export function createCocktailJournal({ root, getData, save }) {
  let tab = "bars", editing = null, visitBar = null, editingVisit = null, editorOpen = false;
  const field = (name, label, value = "", attributes = "") => `<label>${label}<input name="${name}" value="${esc(value)}" ${attributes}></label>`;
  const area = (name, label, value = "", required = false) => `<label>${label}<textarea name="${name}" rows="3" maxlength="10000"${required ? " required" : ""}>${esc(value)}</textarea></label>`;
  const ratingField = (name, label, value) => field(name, `${label} <small>Optional · 1–10</small>`, value ?? "", 'type="number" min="1" max="10" step="0.5" inputmode="decimal"');
  const types = (value = "") => `<label>Base / style<select name="base"><option value="">Choose a style</option>${COCKTAIL_TYPES.map(type => `<option${type === value ? " selected" : ""}>${esc(type)}</option>`).join("")}</select></label>`;
  const action = (label, kind, id = "", extra = "") => `<button class="btn" type="button" data-cocktail-action="${kind}" data-id="${esc(id)}" ${extra}>${label}</button>`;
  function setTab(next) { if (tabs[next]) tab = next; editing = null; visitBar = null; editorOpen = false; }
  function render() {
    const data = getData();
    const rows = data[tab] || [];
    const stats = summarizeCocktailCollection(rows, { visits: tab === "bars" });
    root.innerHTML = `<section class="hero cocktailHero"><div class="heroIn"><div class="eyebrow">Your drinks journal</div><h2><span class="cocktailMark">${COCKTAIL_ICON}</span> Cocktails &amp; Bars</h2><p>Great places, memorable drinks, and cocktails worth making at home.</p></div></section><section class="content-panel cocktailJournal"><nav class="cocktailTabs" aria-label="Cocktails and bars categories">${Object.entries(tabs).map(([key,label]) => `<button type="button" data-cocktail-tab="${key}" aria-pressed="${tab === key}">${label}</button>`).join("")}</nav><div class="sectionTitle"><div><div class="sectionKicker">${rows.length} saved · ${stats.favoriteCount} favorites</div><h3>${tabs[tab]}</h3></div>${action(tab === "bars" ? "＋ Add a Bar" : tab === "drinks" ? "＋ Rate a Drink" : "＋ Add a Home Cocktail", "new")}</div><p class="hint">${tab === "bars" ? "Rate each visit separately. Venue averages use venue ratings only; drink scores stay in Drink Ratings." : tab === "drinks" ? "Rate a drink on its own merits and link it to a venue if you like. Each tasting keeps its own entry." : "Your home cocktail recipes have their own ratings, separate from drinks tried at bars."}</p><p class="cocktailAverage">${score(stats.averageRating)} <small>${stats.ratedCount ? `average across ${stats.ratedCount} ${tab === "bars" ? "rated visits" : "rated entries"}` : "Add a rating when you’re ready"}</small></p><label class="cocktailSearch">Search ${tabs[tab].toLowerCase()}<input id="cocktail-search" type="search" placeholder="Search name, style, venue, or notes"></label><p id="cocktail-search-count" class="hint" aria-live="polite">${rows.length} entries</p>${editorOpen ? renderEditor(data) : ""}<div class="cocktailCards">${rows.slice().sort((a,b) => Number(Boolean(b.favorite))-Number(Boolean(a.favorite)) || a.name.localeCompare(b.name)).map(item => renderCard(item,data)).join("") || `<p class="empty">Your ${tabs[tab].toLowerCase()} journal starts here. Add your first entry above.</p>`}</div><p class="hint">Private to your account. Ratings in this section never change your restaurant, recipe, or frozen-pizza scores.</p></section>`;
    root.querySelector("#cocktail-search").addEventListener("input", event => {
      const query = event.target.value.trim().toLocaleLowerCase(); let count = 0;
      root.querySelectorAll("[data-cocktail-search]").forEach(card => { card.hidden = !card.dataset.cocktailSearch.includes(query); if (!card.hidden) count++; });
      root.querySelector("#cocktail-search-count").textContent = `${count} matching ${count === 1 ? "entry" : "entries"}`;
    });
    root.querySelector("#cocktail-editor")?.addEventListener("submit", submit);
    root.querySelector("#cocktail-editor input")?.focus({preventScroll:true});
  }
  function renderCard(item,data) {
    const bar = data.bars?.find(bar => bar.id === item.barId);
    const stats = tab === "bars" ? summarizeCocktailCollection([item],{visits:true}) : null;
    const details = tab === "bars" ? `<p>${esc(item.address)}</p>${safeWebUrl(item.website) ? `<a href="${esc(safeWebUrl(item.website))}" target="_blank" rel="noopener noreferrer">Venue website ↗</a>` : ""}<h4>Visit history · ${item.visits?.length || 0}</h4>${(item.visits || []).slice().reverse().map(visit => `<article class="cocktailVisit"><strong>${esc(visit.visitedAt)} · ${score(visit.overallRating)}</strong><p class="hint">${[["Service",visit.service],["Atmosphere",visit.atmosphere],["Value",visit.value]].filter(([,value])=>value!=null).map(([label,value])=>`${label} ${score(value)}`).join(" · ")}</p><p>${esc(visit.notes)}</p>${action("Edit visit", "edit-visit", item.id, `data-visit-id="${esc(visit.id)}"`)}</article>`).join("") || '<p class="hint">No visits recorded yet.</p>'}` : tab === "cocktailRecipes" ? `<p>${esc([item.base,item.glassware,item.garnish && `Garnish: ${item.garnish}`].filter(Boolean).join(" · "))}</p><h4>Ingredients</h4><ul>${item.ingredients.map(line=>`<li>${esc(line)}</li>`).join("")}</ul><h4>Preparation</h4><ol>${item.directions.map(line=>`<li>${esc(line)}</li>`).join("")}</ol>${safeWebUrl(item.source) ? `<a href="${esc(safeWebUrl(item.source))}" target="_blank" rel="noopener noreferrer">Recipe source ↗</a>` : ""}` : `<p>${esc([bar?.name,item.base,item.triedAt,item.price != null ? `$${Number(item.price).toFixed(2)}` : ""].filter(Boolean).join(" · "))}</p>`;
    return `<article class="readOnlyItem cocktailCard" id="cocktail-${esc(item.id)}" data-cocktail-search="${esc(JSON.stringify([item,bar?.name]).toLocaleLowerCase())}"><div class="recipeCardHeader"><div><h3>${item.favorite ? '<span aria-label="Favorite">★</span> ' : ""}${esc(item.name)}</h3><span class="cocktailRating">${score(stats ? stats.averageRating : item.overallRating)}</span>${stats ? `<small>${stats.visitCount} visits · ${stats.ratedCount} rated</small>` : ""}</div><div class="recipeCardActions">${action("Edit","edit",item.id)}${tab === "bars" ? action("＋ Rate a visit","visit",item.id) : ""}</div></div><details><summary>${tab === "bars" ? "Venue details & visit history" : tab === "cocktailRecipes" ? "View cocktail recipe" : "Drink details"}</summary>${details}${item.notes ? `<p class="cocktailNotes">${esc(item.notes)}</p>` : ""}</details></article>`;
  }
  function renderEditor(data) {
    const item = editing ? data[tab].find(row=>row.id===editing) : null;
    const bar = visitBar ? data.bars.find(row=>row.id===visitBar) : null;
    const visit = bar?.visits?.find(row=>row.id===editingVisit);
    let content;
    if (bar) content = `${field("visitedAt","Visit date",visit?.visitedAt || today(),'type="date" required')}${ratingField("overallRating","Overall venue rating",visit?.overallRating)}<div class="cocktailFormGrid">${ratingField("service","Service",visit?.service)}${ratingField("atmosphere","Atmosphere",visit?.atmosphere)}${ratingField("value","Value",visit?.value)}</div>${area("notes","Visit notes",visit?.notes)}`;
    else {
      content = field("name",tab === "bars" ? "Venue name" : "Cocktail name",item?.name,'required maxlength="180"');
      if(tab === "bars") content += field("address","Address",item?.address,'maxlength="300"') + field("website","Website",item?.website,'type="url" maxlength="2000" placeholder="https://"');
      else {
        content += types(item?.base) + ratingField("overallRating","Overall rating",item?.overallRating);
        if(tab === "drinks") content += `<label>Venue <small>Optional</small><select name="barId"><option value="">No venue / other</option>${data.bars.map(bar=>`<option value="${esc(bar.id)}"${item?.barId===bar.id?' selected':''}>${esc(bar.name)}</option>`).join("")}</select></label><div class="cocktailFormGrid">${field("triedAt","Date tried",item?.triedAt || today(),'type="date"')}${field("price","Price ($)",item?.price,'type="number" min="0" step="0.01" inputmode="decimal"')}</div>`;
        else content += `${area("ingredients","Ingredients & quantities (one per line)",item?.ingredients?.join("\n"),true)}${area("directions","Preparation (one step per line)",item?.directions?.join("\n"),true)}<div class="cocktailFormGrid">${field("glassware","Glassware",item?.glassware,'maxlength="300"')}${field("garnish","Garnish",item?.garnish,'maxlength="300"')}</div>${field("source","Recipe source URL",item?.source,'type="url" maxlength="2000" placeholder="https://"')}`;
      }
      content += area("notes","Notes",item?.notes) + `<label class="inlineCheck"><input name="favorite" type="checkbox"${item?.favorite?' checked':''}> Favorite</label>`;
    }
    return `<form id="cocktail-editor" class="cocktailEditor"><h3>${bar ? `${visit ? "Edit visit to" : "Rate a visit to"} ${esc(bar.name)}` : `${item ? "Edit" : "Add"} ${tab === "bars" ? "a venue" : tab === "drinks" ? "a drink rating" : "a home cocktail"}`}</h3>${content}<div class="actions">${action("Cancel","cancel")}<button class="btn primary" type="submit">Save ${bar ? "visit" : "entry"}</button>${(item || visit) ? action("Delete",visit ? "delete-visit" : "delete",item?.id || bar.id,visit ? `data-visit-id="${esc(visit.id)}"` : "") : ""}</div><p class="edit-status" role="status" aria-live="polite"></p></form>`;
  }
  async function submit(event) {
    event.preventDefault(); const form=event.currentTarget, button=form.querySelector('[type="submit"]'), feedback=form.querySelector('[role="status"]');
    const values=new FormData(form), value=key=>String(values.get(key)||"").trim(), now=new Date().toISOString();
    button.disabled=true;
    try {
      const data=getData(); let next;
      if(visitBar) {
        const bar=data.bars.find(row=>row.id===visitBar); if(!bar) throw new Error("This venue is no longer available. Reload before saving.");
        const existing=bar.visits.find(row=>row.id===editingVisit);
        if(editingVisit && !existing) throw new Error("This visit is no longer available. Reload before saving.");
        const visit={...existing,id:existing?.id || crypto.randomUUID(),visitedAt:value("visitedAt"),overallRating:optionalRating(value("overallRating")),service:optionalRating(value("service")),atmosphere:optionalRating(value("atmosphere")),value:optionalRating(value("value")),notes:value("notes"),createdAt:existing?.createdAt || now,updatedAt:now};
        next={...data,bars:data.bars.map(row=>row.id===bar.id ? {...bar,updatedAt:now,visits:existing ? bar.visits.map(row=>row.id===existing.id?visit:row) : [...bar.visits,visit]} : row)};
      } else {
        const existing=editing ? data[tab].find(row=>row.id===editing) : null;
        if(editing && !existing) throw new Error("This entry is no longer available. Reload before saving.");
        const item={...existing,id:existing?.id || crypto.randomUUID(),name:value("name"),notes:value("notes"),favorite:values.has("favorite"),createdAt:existing?.createdAt || now,updatedAt:now};
        if(tab === "bars") Object.assign(item,{address:value("address"),website:value("website"),visits:existing?.visits || []});
        else Object.assign(item,{base:value("base"),overallRating:optionalRating(value("overallRating"))});
        if(tab === "drinks") Object.assign(item,{barId:value("barId"),triedAt:value("triedAt"),price:value("price")===""?null:Number(value("price"))});
        if(tab === "cocktailRecipes") Object.assign(item,{ingredients:value("ingredients").split(/\r?\n/).map(line=>line.trim()).filter(Boolean),directions:value("directions").split(/\r?\n/).map(line=>line.trim()).filter(Boolean),glassware:value("glassware"),garnish:value("garnish"),source:value("source")});
        for(const key of ["website","source"]) if(item[key] && !safeWebUrl(item[key])) throw new Error("Use a complete http:// or https:// address.");
        next={...data,[tab]:existing ? data[tab].map(row=>row.id===existing.id?item:row) : [...data[tab],item]};
      }
      await save(next); editorOpen=false;editing=null;visitBar=null;editingVisit=null;render();
    } catch(error) { feedback.textContent=error.message || "Save failed. Your entry was not reported as saved.";button.disabled=false; }
  }
  async function handleClick(event) {
    const tabButton=event.target.closest('[data-cocktail-tab]');
    if(tabButton){setTab(tabButton.dataset.cocktailTab);render();return true;}
    const button=event.target.closest('[data-cocktail-action]');if(!button)return false;
    const kind=button.dataset.cocktailAction,id=button.dataset.id;
    if(kind==="cancel"){editorOpen=false;editing=null;visitBar=null;editingVisit=null;render();return true;}
    if(kind==="new" || kind==="edit" || kind==="visit" || kind==="edit-visit") {
      editing=kind==="edit"?id:null;visitBar=kind.includes("visit")?id:null;editingVisit=kind==="edit-visit"?button.dataset.visitId:null;editorOpen=true;render();root.querySelector('#cocktail-editor')?.scrollIntoView({block:"start",behavior:"smooth"});return true;
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
      try { const next=kind==="delete-visit" ? {...data,bars:data.bars.map(bar=>bar.id===id?{...bar,visits:bar.visits.filter(visit=>visit.id!==button.dataset.visitId)}:bar)} : {...data,[tab]:data[tab].filter(row=>row.id!==id)};await save(next);editorOpen=false;editing=null;visitBar=null;editingVisit=null;render(); }
      catch(error){root.querySelector('#cocktail-editor [role="status"]').textContent=error.message;button.disabled=false;}
    }
    return true;
  }
  return {render,handleClick,setTab};
}
