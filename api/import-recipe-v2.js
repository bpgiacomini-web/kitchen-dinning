const MAX_BODY_CHARS = 2_048;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const input = req.body && typeof req.body.url === "string" ? req.body.url.trim() : "";
  if (!input || input.length > MAX_BODY_CHARS) return res.status(400).json({ error: "Enter one valid public recipe URL." });
  try {
    const { fetchPublicRecipePage } = await import("../architecture-v2/src/features/recipes/safe-url-fetch.mjs");
    const page = await fetchPublicRecipePage(input);
    if (!page.body) return res.status(422).json({ error: "The recipe page could not be read. Nothing was saved. Paste the recipe text instead." });
    const { parseRecipeJsonLd, parsePastedRecipeText, cleanSourceUrl } = await import("../architecture-v2/src/features/recipes/import-parser.mjs");
    const recipe = parseRecipeJsonLd(page.body) || (page.contentType.startsWith("text/plain") || page.contentType.startsWith("text/markdown") ? parsePastedRecipeText(page.body) : null);
    if (!recipe) return res.status(422).json({ error: "No complete recipe ingredients and directions were found on that page. Nothing was saved; try pasting the recipe text instead." });
    return res.status(200).json({ recipe: { ...recipe, source: cleanSourceUrl(page.finalUrl), extractionMethod: "Server-side recipe structured data" } });
  } catch (error) {
    const reason = String(error && error.message || "");
    if (["invalid_url", "blocked_host", "blocked_address", "blocked_port"].includes(reason)) return res.status(400).json({ error: "That address is not allowed. Enter a public recipe webpage using HTTP or HTTPS." });
    if (reason === "response_too_large") return res.status(413).json({ error: "That webpage is too large to import safely. Paste the recipe text instead." });
    if (reason === "too_many_redirects") return res.status(422).json({ error: "That webpage redirects too many times. Paste the recipe text instead." });
    if (["request_timeout", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN", "ECONNRESET"].includes(reason)) return res.status(422).json({ error: "The recipe webpage could not be reached safely. Paste the recipe text instead." });
    console.error("Metro Eats recipe URL import failed", { reason: reason.slice(0, 80) });
    return res.status(502).json({ error: "Recipe import is temporarily unavailable. Nothing was saved." });
  }
}