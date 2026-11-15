const liveNews=require("./live-local-news.cjs");
const publisherNews=require('./publisher-news.cjs');
// Preview merges the fixed published feed with cached, allowlisted local RSS. Never proxy caller-supplied URLs or
// forward account credentials. This runs inside the existing lookup function.
async function readFoodNews(fetchImpl) {
  const response = await fetchImpl('https://bpgiacomini-web.github.io/kitchen-dinning/news.json', {
    headers: { Accept: 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Feed unavailable');
  const text = await response.text();
  if (text.length > 250000) throw new Error('Feed too large');
  const payload = JSON.parse(text);
  if (!Array.isArray(payload.items)) throw new Error('Invalid feed');
  const extras=await Promise.allSettled([publisherNews.readPublisherPhotos(fetchImpl),liveNews.readLiveLocalNews(fetchImpl)]);
  const pictures=extras[0].status==="fulfilled"?extras[0].value:[],live=extras[1].status==="fulfilled"?extras[1].value:null;
  return { updated:live?.items.length?live.checkedAt:payload.updated, items: mergeStories([...payload.items,...(live?.items||[])],pictures) };
}
function mergeStories(items,pictures){
 const merged=new Map();
 for(const item of [...pictures,...items]){
  const old=merged.get(item.url);
  merged.set(item.url,old?{...old,...item,image:item.image||old.image}:item);
 }
 const timestamp=item=>{const value=Date.parse(item.publishedAt||item.date||'');return Number.isFinite(value)?value:0;};
 return [...merged.values()].sort((a,b)=>timestamp(b)-timestamp(a)).slice(0,20);
}
module.exports = { readFoodNews,mergeStories };
