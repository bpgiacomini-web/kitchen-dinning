/**
 * Same-origin Neon Auth proxy for the isolated Metro Eats Preview.
 * Keeping auth requests on the app's own origin avoids Safari ITP treating
 * Neon Auth cookies as third-party cookies.
 */
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const upstreamBase = process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL;
  if (!upstreamBase) return res.status(503).json({ error: "Preview authentication URL is not configured." });

  const requestUrl = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const prefix = "/api/auth/";
  if (!requestUrl.pathname.startsWith(prefix)) return res.status(404).json({ error: "Auth route not found." });
  const authPath = requestUrl.pathname.slice(prefix.length);
  if (!authPath || authPath.split("/").some(part => part === "." || part === "..")) {
    return res.status(400).json({ error: "Invalid auth route." });
  }

  const target = new URL(upstreamBase.replace(/\/+$/, "") + "/" + authPath + requestUrl.search);
  const headers = new Headers();
  for (const [name, value] of Object.entries(req.headers)) {
    if (value == null || ["host", "connection", "content-length", "transfer-encoding"].includes(name.toLowerCase())) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : String(value));
  }

  let body;
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    if (chunks.length) body = Buffer.concat(chunks);
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual"
    });
    for (const [name, value] of upstream.headers) {
      const lower = name.toLowerCase();
      if (["connection", "content-length", "transfer-encoding", "content-encoding", "set-cookie"].includes(lower)) continue;
      res.setHeader(name, value);
    }
    const cookies = upstream.headers.getSetCookie?.();
    if (cookies?.length) res.setHeader("Set-Cookie", cookies);
    else {
      const cookie = upstream.headers.get("set-cookie");
      if (cookie) res.setHeader("Set-Cookie", cookie);
    }
    res.statusCode = upstream.status;
    const payload = Buffer.from(await upstream.arrayBuffer());
    return res.end(payload);
  } catch (error) {
    console.error("Metro Eats Preview auth proxy failed", error?.name || "UnknownError");
    return res.status(502).json({ error: "The Preview authentication service could not be reached." });
  }
}
