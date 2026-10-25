import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";

export const MAX_RESPONSE_BYTES = 1_500_000;
export const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const ALLOWED_TYPES = /^(text\/html|application\/xhtml\+xml|text\/plain|text\/markdown|application\/json|application\/ld\+json)(?:\s*;|$)/i;

function isPublicIPv4(address) {
  if (net.isIP(address) !== 4) return false;
  const octets = address.split(".").map(Number);
  const [a, b, c] = octets;
  if (octets.length !== 4 || octets.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99) || (b === 52 && c === 193) || (b === 175 && c === 48))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

export async function resolvePublicIPv4(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  const ipCandidate = host.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || net.isIP(ipCandidate)) {
    throw new Error("blocked_host");
  }
  const records = await lookup(host, { all: true, family: 4, verbatim: true });
  if (!records.length || records.some(record => !isPublicIPv4(record.address))) throw new Error("blocked_address");
  return records[0].address;
}

export function validateRecipeUrl(input) {
  let url;
  try { url = new URL(String(input || "")); } catch { throw new Error("invalid_url"); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || !url.hostname) throw new Error("invalid_url");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const ipCandidate = host.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || net.isIP(ipCandidate)) throw new Error("blocked_host");
  if (url.port && !((url.protocol === "http:" && url.port === "80") || (url.protocol === "https:" && url.port === "443"))) {
    throw new Error("blocked_port");
  }
  if (url.hostname.endsWith(".")) url.hostname = url.hostname.slice(0, -1);
  return url;
}

function requestOnce(url, pinnedAddress) {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === "https:" ? https : http;
    const request = transport.request(url, {
      method: "GET",
      family: 4,
      timeout: TIMEOUT_MS,
      headers: {
        "User-Agent": "MetroEatsRecipeImporter/2.0",
        "Accept": "text/html,application/xhtml+xml,application/ld+json,text/plain,text/markdown",
        "Accept-Encoding": "identity",
        "Connection": "close"
      },
      servername: url.protocol === "https:" ? url.hostname : undefined,
      lookup: (_hostname, options, callback) => options?.all
        ? callback(null, [{ address: pinnedAddress, family: 4 }])
        : callback(null, pinnedAddress, 4)
    }, response => {
      const status = response.statusCode || 0;
      const location = response.headers.location || "";
      const contentType = String(response.headers["content-type"] || "");
      if ([301, 302, 303, 307, 308].includes(status)) {
        response.resume();
        resolve({ status, location, contentType, body: "" });
        return;
      }
      if (status < 200 || status >= 300) {
        response.resume();
        resolve({ status, contentType, body: "" });
        return;
      }
      if (!ALLOWED_TYPES.test(contentType)) {
        response.destroy();
        resolve({ status, contentType, body: "", tooLarge: false, unsupportedType: true });
        return;
      }
      const chunks = [];
      let bytes = 0;
      response.on("data", chunk => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) {
          response.destroy(new Error("response_too_large"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve({ status, contentType, body: Buffer.concat(chunks).toString("utf8") }));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new Error("request_timeout")));
    request.on("error", reject);
    request.end();
  });
}

/** Fetch with pinned, checked IPv4 DNS results, manual redirects, timeout, and a streamed byte cap. */
export async function fetchPublicRecipePage(input, { resolveAddress = resolvePublicIPv4, request = requestOnce } = {}) {
  let url = validateRecipeUrl(input);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const pinnedAddress = await resolveAddress(url.hostname);
    const result = await request(url, pinnedAddress);
    if (result.tooLarge) throw new Error("response_too_large");
    if ([301, 302, 303, 307, 308].includes(result.status)) {
      if (redirects === MAX_REDIRECTS || !result.location) throw new Error("too_many_redirects");
      url = validateRecipeUrl(new URL(result.location, url).href);
      continue;
    }
    return { ...result, finalUrl: url.href };
  }
  throw new Error("too_many_redirects");
}
