// Temporary, fixed-target diagnostic endpoint for Metro Eats recipe import.
// This endpoint does not accept user-supplied URLs and should be removed after verification.
const TARGET = 'https://www.simplyrecipes.com/recipes/osso_buco/';
function parseRecipe(html) {
  const blocks = html.match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const found = [];
  function walk(v) {
    if (!v) return;
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v !== 'object') return;
    const types = Array.isArray(v['@type']) ? v['@type'] : [v['@type']];
    if (types.some(t => String(t).toLowerCase().split(/[\/#]/).pop() === 'recipe')) found.push(v);
    if (v['@graph']) walk(v['@graph']);
  }
  for (const b of blocks) {
    const raw = b.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>\s*$/i, '');
    try { walk(JSON.parse(raw)); } catch {}
  }
  const r = found.find(x => Array.isArray(x.recipeIngredient) && x.recipeInstructions);
  if (!r) return null;
  function steps(v, out=[]) {
    if (typeof v === 'string') out.push(v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
    else if (Array.isArray(v)) v.forEach(x=>steps(x,out));
    else if (v && typeof v==='object') steps(v.text || v.itemListElement || v.name || '',out);
    return out.filter(Boolean);
  }
  return {title:r.name, ingredients:r.recipeIngredient, steps:steps(r.recipeInstructions), method:'schema.org Recipe JSON-LD'};
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  const outcomes=[];
  try {
    const r=await fetch(TARGET,{headers:{'User-Agent':'Mozilla/5.0 (compatible; MetroEatsRecipeImporter/1.0)','Accept':'text/html,*/*'},signal:AbortSignal.timeout(10000)});
    const html=await r.text();
    const recipe=parseRecipe(html);
    outcomes.push({source:'publisher',status:r.status,contentType:r.headers.get('content-type'),bytes:html.length,foundRecipe:!!recipe});
    if(recipe) return res.status(200).json({ok:true,...recipe,steps:recipe.steps.length,ingredients:recipe.ingredients.length,outcomes});
  } catch(e) { outcomes.push({source:'publisher',error:String(e.message||e)}); }
  try {
    const r=await fetch('https://r.jina.ai/'+TARGET,{headers:{'Accept':'text/plain','User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(10000)});
    const txt=await r.text();
    outcomes.push({source:'reader',status:r.status,contentType:r.headers.get('content-type'),bytes:txt.length,preview:txt.slice(0,240)});
    const lines=txt.replace(/\r/g,'').split('\n').map(x=>x.replace(/^\s{0,3}#{1,6}\s*/,'').replace(/\*\*/g,'').trim()).filter(Boolean);
    const ingredients=[],directions=[]; let section='';
    for(const raw of lines) {
      const line=raw.replace(/^[-*•]\s*/,'').replace(/^\d+[.)]\s*/,'').trim();
      if (/^ingredients?(\s*\([^)]*\))?\s*:?$/i.test(line)){section='i';continue}
      if (/^(directions?|instructions?|method|preparation|steps?)\s*:?$/i.test(line)){section='d';continue}
      if (/^(nutrition|notes?|tips|equipment|reviews|comments|related recipes|more recipes)\b/i.test(line)){section='';continue}
      if(section==='i' && line.length>1 && line.length<=260) ingredients.push(line);
      if(section==='d' && line.length>1 && line.length<=1200) directions.push(line);
    }
    if(ingredients.length>=2 && directions.length>=2) return res.status(200).json({ok:true,title:lines.find(x=>/osso buco/i.test(x))||'Osso Buco',ingredients,directions,outcomes});
    return res.status(422).json({ok:false,message:'Reader did not yield parseable recipe sections',ingredientCount:ingredients.length,directionCount:directions.length,outcomes});
  } catch(e) { outcomes.push({source:'reader',error:String(e.message||e)}); }
  return res.status(502).json({ok:false,outcomes});
}
