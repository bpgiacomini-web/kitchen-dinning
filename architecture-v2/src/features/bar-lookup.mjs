import { normalizeRestaurantLookup } from '../domain/restaurant-lookup.mjs';
export async function lookupBars({query='',location=null,signal,fetcher=fetch}={}) {
  const response=await fetcher('/api/restaurant-lookup',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({mode:query?'bar-name':'bar-nearby',query,location}),signal});
  const payload=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(payload.error || 'Bar lookup unavailable. Enter details manually.');
  return {places:query?normalizeRestaurantLookup(payload.features,payload.location):payload.places || [],location:payload.location || location};
}
