/** Pure recipe extraction helpers. Network fetching and URL safety belong in a server adapter. */
export function plainText(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    if (value.text != null) return plainText(value.text);
    if (value.value != null && value.name) return plainText(`${value.value} ${value.name}`);
    if (value.name != null) return plainText(value.name);
    if (value.value != null) return plainText(value.value);
    return "";
  }
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function flattenInstructions(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenInstructions);
  if (typeof value === "object") {
    if (value.text != null) return flattenInstructions(value.text);
    if (value.itemListElement != null) return flattenInstructions(value.itemListElement);
    if (value.name != null) return flattenInstructions(value.name);
    return [];
  }
  const text = plainText(value);
  return text ? [text] : [];
}

function recipeType(node) {
  const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
  return types.some(type => String(type || "").toLowerCase().split(/[\/#]/).pop() === "recipe");
}

function walkJsonLd(value, recipes) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(item => walkJsonLd(item, recipes));
    return;
  }
  if (recipeType(value)) recipes.push(value);
  for (const [key, child] of Object.entries(value)) {
    if (key !== "@context" && key !== "@type" && key !== "@id" && child && typeof child === "object") {
      walkJsonLd(child, recipes);
    }
  }
}

export function normalizeImportedRecipe(node) {
  if (!node || typeof node !== "object") return null;
  const ingredients = (Array.isArray(node.recipeIngredient) ? node.recipeIngredient : [node.recipeIngredient])
    .map(plainText).filter(Boolean);
  const directions = flattenInstructions(node.recipeInstructions);
  const title = plainText(node.name ?? node.headline);
  if (!title || !ingredients.length || !directions.length) return null;
  return {
    title,
    ingredients,
    directions,
    description: plainText(node.description),
    servings: plainText(node.recipeYield),
    prepTime: plainText(node.prepTime),
    cookTime: plainText(node.cookTime),
    totalTime: plainText(node.totalTime),
    source: plainText(node.url ?? node.mainEntityOfPage)
  };
}

/** Extract the first complete Recipe node from raw JSON-LD text or HTML. */
export function parseRecipeJsonLd(input) {
  const source = String(input ?? "");
  const blocks = [...source.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  const candidates = [];
  if (!blocks.length) {
    try { walkJsonLd(JSON.parse(source), candidates); } catch { return null; }
  } else {
    for (const block of blocks) {
      try { walkJsonLd(JSON.parse(block.replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim()), candidates); } catch { /* Skip malformed blocks, continue looking. */ }
    }
  }
  for (const candidate of candidates) {
    const normalized = normalizeImportedRecipe(candidate);
    if (normalized) return normalized;
  }
  return null;
}

/** Parse pasted plain text only when recognizable ingredient and direction sections exist. */
export function parsePastedRecipeText(input) {
  const lines = String(input ?? "").replace(/\r/g, "").split("\n")
    .map(line => line.replace(/^\s{0,3}#{1,6}\s*/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const titleLine = lines.find(line => /^title\s*:/i.test(line));
  const title = titleLine
    ? titleLine.replace(/^title\s*:\s*/i, "").trim()
    : lines.find(line => line.length > 3 && !/^https?:\/\//i.test(line) && !/^(ingredients|directions|instructions|method|steps)\s*:?$/i.test(line)) || "";
  const ingredients = [];
  const directions = [];
  let section = "";
  for (const raw of lines) {
    const line = raw.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
    if (/^ingredients?(\s*\([^)]*\))?\s*:?$/i.test(line)) { section = "ingredients"; continue; }
    if (/^(directions?|instructions?|method|preparation|steps?)\s*:?$/i.test(line)) { section = "directions"; continue; }
    if (/^(nutrition|notes?|tips|equipment|reviews|comments|related recipes|more recipes|about the author)\b/i.test(line)) { section = ""; continue; }
    if (!section || line.length < 2 || /^https?:\/\//i.test(line)) continue;
    if (section === "ingredients" && line.length <= 260) ingredients.push(line);
    if (section === "directions" && line.length <= 1200) directions.push(line);
  }
  if (!title || !ingredients.length || !directions.length) return null;
  return { title, ingredients, directions, description: "", servings: "", prepTime: "", cookTime: "", totalTime: "", source: "" };
}
