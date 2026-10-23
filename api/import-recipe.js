const MAX_HTML = 2_000_000;
const TIMEOUT_MS = 12_000;

function safePublicUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') ||
      host === '::1' || host.startsWith('127.') || host.startsWith('10.') ||
      host.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === '0.0.0.0' || host === '169.254.169.254') return null;
  return url;
}

function parseJsonLd(html) {
  const found = [];
  const blocks = html.match(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  function walk(value) {
    if (!value) return;
    if (Array.isArray(value)) { value.forEach(walk); return; }
    if (typeof value !== 'object') return;
    const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (types.some(t => String(t).toLowerCase().split(/[\\/#]/).pop() === 'recipe')) found.push(value);
    // Recipe nodes may be nested under @graph, mainEntity, or publisher-specific wrappers.
    for (const [key, child] of Object.entries(value)) {
      if (key !== '@context' && key !== '@type' && key !== '@id' && child && typeof child === 'object') walk(child);
    }
  }
  for (const block of blocks) {
    const raw = block.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>\s*$/i, '')
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
    try { walk(JSON.parse(raw)); } catch {}
  }
  const recipe = found.find(r => {
    const ingredients = Array.isArray(r.recipeIngredient) ? r.recipeIngredient : (typeof r.recipeIngredient === 'string' ? [r.recipeIngredient] : []);
    const steps = r.recipeInstructions;
    return ingredients.some(item => String(item || '').trim()) &&
      (Array.isArray(steps) ? steps.length > 0 : typeof steps === 'string' && steps.trim().length > 0);
  }) || null;
  if (!recipe) return null;
  // Schema.org allows a single string as well as an array for these fields.
  recipe.recipeIngredient = Array.isArray(recipe.recipeIngredient) ? recipe.recipeIngredient : [recipe.recipeIngredient];
  return recipe;
}

function plainText(value) {
  if (value && typeof value === 'object') {
    // Some publishers encode ingredients as Schema.org PropertyValue objects.
    if (value.text) return plainText(value.text);
    if (value.value != null && value.name) return plainText(String(value.value) + ' ' + value.name);
    if (value.name) return plainText(value.name);
    if (value.value != null) return plainText(value.value);
    return '';
  }
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
function instructions(value, out = []) {
  if (typeof value === 'string') { const t = plainText(value); if (t) out.push(t); }
  else if (Array.isArray(value)) value.forEach(v => instructions(v, out));
  else if (value && typeof value === 'object') {
    if (value.text) instructions(value.text, out);
    else if (value.itemListElement) instructions(value.itemListElement, out);
    else if (value.name) instructions(value.name, out);
  }
  return out;
}
function isoDuration(value) {
  if (!value) return '';
  const m = String(value).match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?/i);
  if (!m) return plainText(value);
  const parts = [];
  if (m[1]) parts.push(Number(m[1]) * 24 * 60 + Number(m[2] || 0) * 60 + Number(m[3] || 0) + ' minutes');
  else {
    if (m[2]) parts.push(m[2] + ' hours');
    if (m[3]) parts.push(m[3] + ' minutes');
  }
  return parts.join(' ') || plainText(value);
}
function parseReaderText(text) {
  const originalLines = String(text || '').replace(/\r/g, '').split('\n').map(line => line.trim()).filter(Boolean);
  const lines = originalLines.map(line =>
    line.replace(/^\s{0,3}#{1,6}\s*/, '').replace(/\*\*/g, '').trim()
  ).filter(Boolean);
  const ignoredTitle = /^(jump to recipe|print recipe|save recipe|pin recipe|ingredients?|directions?|instructions?|method|preparation|steps?|nutrition|notes?|tips|equipment|reviews|comments|related recipes|more recipes|about the author|advertisement)$/i;
  let title = '';
  const titleLine = lines.find(line => /^title\s*:/i.test(line));
  if (titleLine) title = titleLine.replace(/^title\s*:\s*/i, '').trim();
  if (!title) {
    const heading = originalLines.find(line => /^\s{0,3}#{1,3}\s+/.test(line))
      ?.replace(/^\s{0,3}#{1,3}\s+/, '').replace(/\*\*/g, '').trim();
    if (heading && heading.length <= 120 && !ignoredTitle.test(heading)) title = heading;
  }
  if (!title) title = lines.find(line => line.length > 3 && line.length <= 120 &&
    !/^https?:\/\//i.test(line) && !ignoredTitle.test(line) &&
    !/^(serves?|yield|prep(?:aration)?\s*time|cook(?:ing)?\s*time|total\s*time|calories?|nutrition|by)\s*:/i.test(line)) || '';
  const ingredients = [];
  const steps = [];
  let section = '';
  for (const raw of lines) {
    const line = raw.replace(/^[-*•]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
    if (/^ingredients?(?:\s*\([^)]*\))?(?:\s*[-–—|:].*)?\s*:??$/i.test(line)) { section = 'ingredients'; continue; }
    if (/^(?:directions?|instructions?|method|preparation|steps?)(?:\s*[-–—|:].*)?\s*:??$/i.test(line)) { section = 'steps'; continue; }
    if (/^(nutrition|notes?|tips|equipment|reviews|comments|related recipes|more recipes|about the author|variations|storage|serving suggestions)\b/i.test(line)) { section = ''; continue; }
    if (!section || line.length < 2 || /^https?:\/\//i.test(line)) continue;
    if (section === 'ingredients' && line.length <= 260) ingredients.push(line);
    if (section === 'steps' && line.length <= 1200) steps.push(line);
  }
  if (ingredients.length < 2 || steps.length < 2) return null;
  return { name: title.replace(/\s*[|–—-]\s*(Simply Recipes).*$/i, '').trim() || 'Imported Recipe',
    recipeIngredient: ingredients, recipeInstructions: steps };
}

async function readText(url, outcomes = []) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MetroEatsRecipeImporter/1.0)', 'Accept': 'text/html,text/plain;q=0.9,*/*;q=0.8' }
    });
    const type = response.headers.get('content-type') || '';
    if (!response.ok) {
      outcomes.push({ url, status: response.status, contentType: type });
      return '';
    }
    outcomes.push({ url, status: response.status, contentType: type });
    const text = await response.text();
    // Reader proxies may label readable recipe text as text/markdown or an unfamiliar type.
    if (!/text\/html|text\/plain|text\/markdown|application\/json|application\/xhtml\+xml/i.test(type) && !/^\s*(?:#|Title:|Ingredients\b)/i.test(text)) return '';
    return text.length <= MAX_HTML ? text : text.slice(0, MAX_HTML);
  } catch { return ''; } finally { clearTimeout(timer); }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  const url = safePublicUrl(req.body && req.body.url);
  if (!url) return res.status(400).json({ error: 'Enter a valid public http or https recipe URL.' });
  try {
    const outcomes = [];
    let html = await readText(url.href, outcomes);
    let recipe = html ? parseJsonLd(html) : null;
    // If the publisher blocks server fetches, try a text-reader proxy server-side.
    if (!recipe) {
      const reader = 'https://r.jina.ai/' + url.href;
      const text = await readText(reader, outcomes);
      if (text) {
        html = text;
        recipe = parseJsonLd(text) || parseReaderText(text);
      }
    }
    if (!recipe) {
      const blocked = outcomes.some(item => [401, 402, 403, 406, 409, 429, 451].includes(item.status));
      const error = blocked
        ? 'This website blocks automated recipe importing, so Metro Eats cannot safely extract its recipe. Nothing was saved. Open the recipe, copy the ingredients and directions, and paste the recipe text into Metro Eats instead.'
        : 'Metro Eats could not find clear recipe ingredients and directions on that page. Nothing was saved. Try another recipe page or paste the recipe text directly.';
      return res.status(422).json({ error, reason: blocked ? 'source_blocked' : 'recipe_not_found' });
    }
    const ingredients = recipe.recipeIngredient.map(plainText).filter(Boolean).slice(0, 100);
    const steps = instructions(recipe.recipeInstructions).slice(0, 100);
    if (!ingredients.length || !steps.length) return res.status(422).json({ error: 'The page did not contain clear ingredients and directions.' });
    const time = [];
    if (recipe.prepTime) time.push('Prep ' + isoDuration(recipe.prepTime));
    if (recipe.cookTime) time.push('Cook ' + isoDuration(recipe.cookTime));
    if (!time.length && recipe.totalTime) time.push('Total ' + isoDuration(recipe.totalTime));
    const yieldValue = Array.isArray(recipe.recipeYield) ? recipe.recipeYield.join(', ') : recipe.recipeYield || '';
    return res.status(200).json({ recipe: {
      title: plainText(recipe.name) || 'Imported Recipe',
      ingredients,
      steps,
      servings: plainText(yieldValue),
      time: time.join(' • '),
      extractionMethod: 'Server-side Recipe structured data'
    }});
  } catch (error) {
    console.error('Metro Eats recipe URL import error', error);
    return res.status(500).json({ error: 'Recipe import service is temporarily unavailable.' });
  }
}
