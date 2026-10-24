// Metro Eats live local food and dining news feed.
// Uses publisher RSS feeds server-side so browsers do not need cross-origin RSS access.
const FEEDS = [
  { url: 'https://www.saucemagazine.com/feed/', source: 'Sauce Magazine' },
  { url: 'https://www.stlmag.com/rss/', source: 'St. Louis Magazine' },
  { url: 'https://www.thetelegraph.com/news/feed/', source: 'The Telegraph' },
  { url: 'https://www.bnd.com/news/local/rss/', source: 'Belleville News-Democrat' }
];
const esc = (s='') => String(s).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function tag(block, name) {
  const m = block.match(new RegExp('<(?:\\w+:)?'+name+'\\b[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?'+name+'\\s*>','i'));
  return m ? esc(m[1]) : '';
}
function parse(xml, source) {
  const blocks = xml.match(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)\s*>/gi) || [];
  return blocks.map(b => {
    const title = tag(b,'title');
    let url = tag(b,'link');
    if (!url) { const m=b.match(/<link\b[^>]*href=["']([^"']+)/i); if(m) url=m[1]; }
    const date = tag(b,'pubDate') || tag(b,'published') || tag(b,'updated') || tag(b,'dc:date');
    const description = tag(b,'description') || tag(b,'summary') || tag(b,'content');
    const time = Date.parse(date);
    if (!title || !/^https?:\/\//i.test(url) || !Number.isFinite(time)) return null;
    return { title, url, source, publishedAt: new Date(time).toISOString(), description };
  }).filter(Boolean);
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
  res.setHeader('Access-Control-Allow-Origin','*');
  if (req.method !== 'GET') { res.status(405).json({ error:'Method not allowed' }); return; }
  const results = await Promise.all(FEEDS.map(async f => {
    try {
      const response = await fetch(f.url, { headers:{'user-agent':'MetroEatsNews/1.0 (+local food news reader)','accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'}, signal:AbortSignal.timeout(6500) });
      if (!response.ok) return [];
      return parse(await response.text(), f.source);
    } catch (_) { return []; }
  }));
  const cutoff = Date.now() - 45*24*60*60*1000;
  // Be strict: locality alone must not let general news into a food-focused feed.
  const foodHeadline = /restaurant|dining|food|chef|menu|coffee|cafe|café|bakery|barbecue|bbq|burger|pizza|taco|sushi|brewery|brewpub|bar and grill|eatery|deli|steakhouse|brunch|breakfast|lunch|dinner|cocktail|wine|beer|opening|opens|opened|closes|closing|new location|food truck|caterer|catering|pastry|dessert|ice cream|sandwich|noodle|ramen|sauce|culinary|recipe|kitchen|bistro|taqueria|pizzeria/i;
  const foodContext = /restaurant|dining|food|chef|menu|coffee|cafe|café|bakery|barbecue|bbq|burger|pizza|taco|sushi|brewery|brewpub|eatery|deli|steakhouse|brunch|breakfast|lunch|dinner|cocktail|wine|beer|food truck|catering|pastry|dessert|ice cream|sandwich|noodle|ramen|bistro|taqueria|pizzeria/i;
  const localContext = /st\\.? louis|metro east|alton|godfrey|wood river|edwardsville|collinsville|belleville|o'fallon|ofallon|fairview heights|illinois|missouri/i;
  const items = results.flat().filter(x => Date.parse(x.publishedAt) >= cutoff)
    .filter(x => foodHeadline.test(x.title) || (foodContext.test(x.description) && localContext.test(x.title+' '+x.description)))
    .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
    .filter((x,i,arr)=>arr.findIndex(y=>y.url===x.url)===i).slice(0,18)
    .map(({title,url,source,publishedAt,description})=>({title,url,source,publishedAt,description:description.slice(0,220)}));
  res.status(200).json({ items, updatedAt:new Date().toISOString(), sources:FEEDS.length });
};
