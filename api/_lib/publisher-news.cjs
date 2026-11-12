const FEED='https://www.riverbender.com/syndication/newsRSS.cfm';
const decode=value=>String(value||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
function publisherStories(xml){
 const items=[];
 for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const block=match[1],tag=name=>decode(block.match(new RegExp('<'+name+'[^>]*>([\\s\\S]*?)</'+name+'>','i'))?.[1]).trim();
  const title=tag('title'),url=tag('link'),description=tag('description');
  if(!/\b(restaurant|dining|food|cocktail|brewery|pizza|cafe|chef|recipe|brunch|barbecue|bakery)\b/i.test(title+' '+description.slice(0,250)))continue;
  if(!/^https?:\/\/(?:www\.)?riverbender\.com\//i.test(url))continue;
  const image=decode(block.match(/<(?:media:content|media:thumbnail|enclosure)\b[^>]*url=["']([^"']+)["']/i)?.[1] || description.match(/<img\b[^>]*src=["']([^"']+)["']/i)?.[1]);
  let safe='';try{const parsed=new URL(image,url);if(parsed.protocol==='https:' && /(^|\.)riverbender\.com$/.test(parsed.hostname) && !/logo|banner|avatar|pixel/i.test(parsed.pathname))safe=parsed.href;}catch{}
  if(!safe)continue;
  const date=tag('pubDate');items.push({title,source:'RiverBender',url,image:safe,publishedAt:Number.isNaN(Date.parse(date))?'':new Date(date).toISOString(),date:Number.isNaN(Date.parse(date))?'':new Date(date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})});
 }
 return items.slice(0,4);
}
let cached=null,expires=0;
async function readPublisherPhotos(fetcher){
 if(cached && Date.now()<expires)return cached;
 const response=await fetcher(FEED,{headers:{Accept:'application/rss+xml'},signal:AbortSignal.timeout(7000)});if(!response.ok)return [];
 const xml=await response.text();if(xml.length>1500000)return [];const items=publisherStories(xml);cached=items;expires=Date.now()+15*60*1000;return items;
}
module.exports={readPublisherPhotos,publisherStories};
