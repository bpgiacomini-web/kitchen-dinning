// Temporary, non-credentialed Neon Auth POST route check for the Preview.
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const base = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL;
  if (!base) return res.status(503).json({ error: "Preview authentication URL is not configured." });
  try {
    const target = new URL(base.replace(/\\/+$/, "") + "/sign-in/email");
    const upstream = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({})
    });
    const body = await upstream.text();
    let safeBody = null;
    try {
      const parsed = JSON.parse(body);
      safeBody = {
        code: typeof parsed.code === "string" ? parsed.code : undefined,
        message: typeof parsed.message === "string" ? parsed.message.slice(0, 240) : undefined,
        error: typeof parsed.error === "string" ? parsed.error.slice(0, 240) : undefined
      };
    } catch {}
    return res.status(200).json({
      routeStatus: upstream.status,
      routeRecognized: upstream.status !== 404,
      neonRequestId: upstream.headers.get("x-neon-ret-request-id") || null,
      response: safeBody
    });
  } catch (error) {
    return res.status(502).json({ error: "Could not reach Neon Auth.", type: error?.name || "UnknownError" });
  }
}