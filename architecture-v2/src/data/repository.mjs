import { normalizeDataset } from "../domain/normalize.mjs";

export const LEGACY_STORAGE_KEYS = ["metro_eats_v2", "metro_eats_v1"];

/** Read legacy browser data without modifying or deleting any key. */
export function readLegacyDataset(storage = globalThis.localStorage) {
  if (!storage) return null;
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && (Array.isArray(parsed.recipes) || Array.isArray(parsed.restaurants))) {
        return { source: `local:${key}`, data: normalizeDataset(parsed) };
      }
    } catch { /* Ignore malformed keys; never overwrite them from this read path. */ }
  }
  return null;
}

/** Read-only remote fallback. This module intentionally has no write method. */
export async function loadDataset({ storage = globalThis.localStorage, fetchImpl = globalThis.fetch, endpoint = "/api/data" } = {}) {
  const local = readLegacyDataset(storage);
  if (local) return { ...local, staleFallback: false };
  if (typeof fetchImpl !== "function") return { source: "empty", data: normalizeDataset({}), staleFallback: false };
  try {
    const response = await fetchImpl(endpoint, { method: "GET", cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);
    return { source: "cloud", data: normalizeDataset(await response.json()), staleFallback: false };
  } catch (error) {
    return { source: "empty", data: normalizeDataset({}), staleFallback: true, error: error instanceof Error ? error.message : "Data unavailable" };
  }
}
