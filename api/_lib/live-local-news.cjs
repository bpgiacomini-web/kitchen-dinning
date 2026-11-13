const SOURCES=new Set(['Sauce Magazine','St. Louis Magazine','The Telegraph','Belleville News-Democrat','EdGlenToday','RiverBender','St. Louis Business Journal']);
const QUERIES=['St. Louis restaurant dining food when:7d','Alton Illinois restaurant dining food when:7d','Metro East Illinois restaurant food dining when:7d'];
const FOOD=/\b(restaurant|restaurants|dining|dinner|lunch|supper|food|drink|bar|bars|brewery|breweries|cafe|coffee|chef|menu|pizza|burger|breakfast|brunch|chicken|bbq|barbecue|dessert|ice cream|taco|steak|seafood|bakery|culinary|eatery|opens|opening|closes|closing|reopens|food truck|hospitality|wine|cocktail|tasting)\b/i;
const LOCAL=/\b(st\.? louis|saint louis|metro east|alton|godfrey|edwardsville|belleville|wood river|bethalto|collinsville|glen carbon|fairview heights|o'fallon)\b/i;
const OTHER=/\b(chicago|springfield|peoria|rockford|champaign|urbana|naperville|joliet|carbondale|indianapolis|kansas city|nashville|new york|los angeles|miami|denver|seattle|portland|national|nationwide|travel|vacation|cruise|disney)\b/i;
const decode=value=>String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function parseLocalNews(xml){
 if(!/<rss\b/i.test(xml))throw Error('Invalid news RSS');
 const items=[];
 for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const tag=name=>decode(match[1].match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]).trim();
  const title=tag('title'),source=tag('source'),url=tag('link'),date=Date.parse(tag('pubDate'));
  if(!SOURCES.has(source)||!FOOD.test(title)||OTHER.test(title)&&!LOCAL.test(title)||!Number.isFinite(date))continue;
  try{const link=new URL(url);if(link.protocol!=='https:'||link.username||link.password||link.hostname!=='news.google.com')continue;}catch{continue;}
  items.push({title,source,url,publishedAt:new Date(date).toISOString(),date:new Date(date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})});
 }
 return items;
}
const caches=new WeakMap();
async function readLiveLocalNews(fetcher){
 const cached=caches.get(fetcher);if(cached&&Date.now()<cached.expires)return cached.result;
 const responses=await Promise.allSettled(QUERIES.map(async query=>{
  const url='https://news.google.com/rss/search?'+new URLSearchParams({q:query,hl:'en-US',gl:'US',ceid:'US:en'});
  const response=await fetcher(url,{headers:{Accept:'application/rss+xml'},signal:AbortSignal.timeout(6000)});
  if(!response.ok)throw Error('News source unavailable');const text=await response.text();if(text.length>1000000)throw Error('News source too large');return parseLocalNews(text);
 }));
 const valid=responses.filter(result=>result.status==='fulfilled');if(!valid.length)throw Error('Live news unavailable');
 const seen=new Set(),items=valid.flatMap(result=>result.value).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;}).slice(0,20);
 const result={items,checkedAt:new Date().toISOString()};caches.set(fetcher,{result,expires:Date.now()+15*60*1000});return result;
}
module.exports={parseLocalNews,readLiveLocalNews};
