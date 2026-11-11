// The Preview branch's bundled news file does not receive main's scheduled updates.
// Read the public, published feed at one fixed URL; never proxy caller-supplied URLs.
const FEED_URL = 'https://bpgiacomini-web.github.io/kitchen-dinning/news.json';
export function createFoodNewsHandler({ fetchImpl = globalThis.fetch } = {}) {
  return async function handler(req,res) {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(req.method !== 'GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed.'});}
    try {
      const response=await fetchImpl(FEED_URL,{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error('Feed unavailable');
      const text=await response.text();if(text.length>250000)throw new Error('Feed too large');
      const payload=JSON.parse(text);if(!Array.isArray(payload.items))throw new Error('Invalid feed');
      return res.status(200).json({updated:payload.updated,items:payload.items.slice(0,20)});
    }catch{return res.status(503).json({error:'The published food news feed could not be refreshed.'});}
  };
}
export default createFoodNewsHandler();
