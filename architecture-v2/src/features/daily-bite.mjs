import { currentBite, publishedBites, millisecondsToNextDate, regionalDate } from '../domain/daily-bite.mjs';

const regionId = 'greater-st-louis';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalogPromise;
function loadCatalog() {
  if (!catalogPromise) catalogPromise = fetch(new URL('../../content/daily-bites.json', import.meta.url), {cache:'no-cache'})
    .then(response => { if (!response.ok) throw new Error('Content unavailable'); return response.json(); })
    .catch(error => { catalogPromise=null; throw error; });
  return catalogPromise;
}
const displayDate = date => new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
function biteMarkup(entry) {
  return `<article class="dailyBiteArticle"><p class="dailyBiteMeta"><time datetime="${esc(entry.publicationDate)}">${displayDate(entry.publicationDate)}</time> · ${esc(entry.category)}</p><h3>${esc(entry.title)}</h3><p class="dailyBiteIntro">${esc(entry.summary)}</p><details class="dailyBiteRead"><summary>Read the bite</summary><div class="dailyBiteBody"><p>${esc(entry.body)}</p><p class="dailyBiteSources">Sources: ${entry.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.name)}</a>`).join(' · ')}</p></div></details></article>`;
}

// Content is shared and read-only. No account or journal writes occur here.
export function mountDailyBite(container, {archive=false} = {}) {
  let disposed=false, timer, renderedDate;
  let search='', category='';
  const refresh = async () => {
    clearTimeout(timer);
    try {
      const catalog=await loadCatalog();
      if (disposed || !container.isConnected) return;
      const region=catalog.regions.find(region=>region.id===regionId);
      if (!region) throw new Error('Region unavailable');
      const today=regionalDate(new Date(),region.timeZone);
      if (renderedDate===today) { timer=setTimeout(refresh,millisecondsToNextDate(new Date(),region.timeZone)+100); return; }
      if (archive) {
        const entries=publishedBites(catalog,regionId);
        container.innerHTML=`<section class="content-panel dailyBite"><button type="button" class="btn" data-view="home">← Home</button><p class="eyebrow">${esc(region.name)}</p><h2>The Daily Bite Archive</h2><p>Food stories worth another look.</p><div class="dailyBiteFilters"><label>Search bites<input type="search" data-bite-search placeholder="Dish, place, or story" value="${esc(search)}"></label><label>Category<select data-bite-category><option value="">All categories</option>${[...new Set(entries.map(entry=>entry.category))].sort().map(value=>`<option${category===value?' selected':''}>${esc(value)}</option>`).join('')}</select></label></div><div data-bite-results></div></section>`;
        const renderResults=()=>{
          const filtered=entries.filter(entry=>(!category||entry.category===category)&&`${entry.title} ${entry.summary} ${entry.body} ${entry.subjectTags.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
          container.querySelector('[data-bite-results]').innerHTML=filtered.map(entry=>biteMarkup(entry)).join('')||'<p class="hint">No published bites match yet.</p>';
        };
        container.querySelector('[data-bite-search]').addEventListener('input',event=>{search=event.target.value;renderResults();});
        container.querySelector('[data-bite-category]').addEventListener('change',event=>{category=event.target.value;renderResults();});
        renderResults();
      } else {
        const selected=currentBite(catalog,regionId);
        container.innerHTML=`<section class="content-panel dailyBite" aria-labelledby="daily-bite-title"><div class="dailyBiteHeading"><div><p class="eyebrow">${esc(region.name)}</p><h2 id="daily-bite-title">The Daily Bite</h2></div><span class="dailyBiteTag">${selected?.isToday?'A fresh taste daily':'Latest bite'}</span></div>${selected?biteMarkup(selected.entry):'<p class="hint">Our first food story is coming soon.</p>'}<button type="button" class="btn dailyBiteArchiveLink" data-view="daily-bite-archive">Browse past bites →</button></section>`;
      }
      renderedDate=today;
      timer=setTimeout(refresh,millisecondsToNextDate(new Date(),region.timeZone)+100);
    } catch {
      if (!disposed && container.isConnected) container.innerHTML=`<section class="content-panel dailyBite"><h2>The Daily Bite</h2><p class="hint">The kitchen is taking a moment. Try again soon.</p><button type="button" class="btn" data-bite-retry>Try again</button>${archive?'<button type="button" class="btn" data-view="home">Home</button>':''}</section>`;
      container.querySelector('[data-bite-retry]')?.addEventListener('click',refresh);
    }
  };
  const resume=()=>{if(!document.hidden) void refresh();};
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('focus',resume);
  void refresh();
  return ()=>{disposed=true;clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);};
}
