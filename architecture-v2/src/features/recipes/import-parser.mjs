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

export function cleanSourceUrl(value) {
  const raw = plainText(value);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.+|gclid|dclid|gbraid|wbraid|gad_source|gad_campaignid|fbclid|msclkid|mc_cid|mc_eid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = "";
    return url.toString();
  } catch {
    return raw.split(/[?#]/, 1)[0];
  }
}

function inferCookTime(directions) {
  const text = directions.join(" ");
  const match = text.match(/\b(?:bake|baking|cook|cooking|roast|roasting|grill|grilling|broil|broiling|fry|frying|simmer|simmering)\b[^.!?]{0,320}?\b(?:for|about|approximately)\s+(\d+)\s*(?:minutes?|mins?)\b/i);
  return match ? `${match[1]} minutes` : "";
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
    cookTime: plainText(node.cookTime) || inferCookTime(directions),
    totalTime: plainText(node.totalTime),
    source: cleanSourceUrl(node.url ?? node.mainEntityOfPage)
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

/** Parse common recipe text, including custom section headings and mixed ingredient/instruction bullets. */
export function parsePastedRecipeText(input) {
  const lines = String(input ?? "").replace(/\r/g, "").split("\n")
    .map(line => line.replace(/^\s{0,3}#{1,6}\s*/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
  if (!lines.length) return null;

  const sectionAliases = {
    meat: "ingredients", protein: "ingredients", proteins: "ingredients",
    vegetables: "ingredients", vegetable: "ingredients", "dry dump": "ingredients",
    mirepiox: "ingredients", mirepoix: "ingredients", finishes: "ingredients",
    finish: "ingredients", sauce: "ingredients", seasoning: "ingredients",
    seasonings: "ingredients", "for the meat": "ingredients", "for the vegetables": "ingredients",
    ingredients: "ingredients", ingredient: "ingredients",
    directions: "directions", direction: "directions", instructions: "directions",
    instruction: "directions", method: "directions", preparation: "directions", steps: "directions"
  };
  const isSectionHeading = line => {
    const normalized = line.toLowerCase().replace(/[:：]\s*$/, "").trim();
    return Object.prototype.hasOwnProperty.call(sectionAliases, normalized);
  };
  const titleLine = lines.find(line => /^title\s*:/i.test(line));
  const firstSectionIndex = lines.findIndex(isSectionHeading);
  const titleCandidates = lines.slice(0, firstSectionIndex < 0 ? lines.length : firstSectionIndex)
    .filter(line => !/^https?:\\/\\//i.test(line) && !/^(recipe|print|jump to recipe)\\s*:?$/i.test(line));
  const title = titleLine
    ? titleLine.replace(/^title\\s*:\\s*/i, "").trim()
    : (titleCandidates[0] || "Imported Recipe");

  const ingredients = [];
  const directions = [];
  let section = "";
  const actionPattern = /^(?:deglaze|once\b|then\b|saute(?:e|é)?\b|sauté\b|add\b|combine\b|cover\b|bring\b|simmer\b|stir\b|mix\b|cook\b|heat\b|bake\b|roast\b|grill\b|fry\b|boil\b|serve\b|season\b|fold\b|whisk\b|pour\b|reduce\b|remove\b|transfer\b|set\b|let\b|place\b|preheat\b|chop\b|mince\b|drain\b|toss\b|thicken\b)/i;
  const cleanBullet = raw => raw.replace(/^\s*(?:[-*•·]\s*|\d+[.)]\s*)/, "").trim();
  const addDirection = value => {
    const text = value.replace(/[–—-]\s*$/, "").trim();
    if (text && !directions.includes(text)) directions.push(text);
  };
  const addIngredient = value => {
    const text = value.replace(/[–—-]\s*$/, "").trim();
    if (text && !ingredients.includes(text)) ingredients.push(text);
  };

  for (const raw of lines) {
    const line = cleanBullet(raw);
    const heading = line.toLowerCase().replace(/[:：]\s*$/, "").trim();
    if (isSectionHeading(line)) {
      section = sectionAliases[heading];
      continue;
    }
    if (/^(nutrition|notes?|tips|equipment|reviews|comments|related recipes|more recipes|about the author)\b/i.test(line)) {
      section = "";
      continue;
    }
    if (/^title\s*:/i.test(line) || /^https?:\/\//i.test(line) || line.length < 2) continue;

    // A bullet may contain an ingredient followed by an instruction after a dash.
    const split = line.match(/^(.+?)\s+[–—]\s+(.+)$/);
    if (section === "ingredients" && split) {
      addIngredient(split[1]);
      addDirection(split[2]);
      continue;
    }
    if (section === "ingredients" && actionPattern.test(line)) {
      addDirection(line);
      continue;
    }
    if (section === "directions") {
      addDirection(line);
      continue;
    }
    if (section === "ingredients" && line.length <= 400) {
      addIngredient(line);
      continue;
    }

    // Standard headings are optional for recipes arranged into custom sections.
    if (!section && actionPattern.test(line)) addDirection(line);
  }

  if (!ingredients.length || !directions.length) return null;
  return {
    title,
    ingredients,
    directions,
    description: "",
    servings: "",
    prepTime: "",
    cookTime: inferCookTime(directions),
    totalTime: "",
    source: ""
  };
}
