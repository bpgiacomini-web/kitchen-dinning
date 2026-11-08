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

/** Read-only data loader. Cloud records and legacy browser records are combined without deleting either source. */
export async function loadDataset({ storage = globalThis.localStorage, fetchImpl = globalThis.fetch, endpoint = "/api/data", getToken = () => globalThis.metroGetAccessToken?.() } = {}) {
  const local = readLegacyDataset(storage);
  if (typeof fetchImpl !== "function") return { source: local?.source || "empty", data: local?.data || normalizeDataset({}), staleFallback: false };
  try {
    // Wait for the auth UI to finish restoring the session before asking for a JWT.
    if (globalThis.metroAuthReady) await globalThis.metroAuthReady;
    const token = await getToken?.();
    if (!token) {
      if (local) return { ...local, staleFallback: false, cloudUnavailable: true };
      return { source: "empty", data: normalizeDataset({}), staleFallback: false, cloudUnavailable: true };
    }
    const response = await fetchImpl(endpoint, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error(`Data request failed (${response.status})`);
    const cloudData = normalizeDataset(await response.json());
    if (!local) return { source: "cloud", data: cloudData, staleFallback: false };
    // Preserve local-only legacy records while preferring cloud records with the same identity.
    const merge = (remote = [], legacy = [], key = "id") => {
      const ids = new Set(remote.map(item => String(item?.[key] ?? item?.id ?? item?.name ?? item?.title ?? "")));
      return [...remote, ...legacy.filter(item => !ids.has(String(item?.[key] ?? item?.id ?? item?.name ?? item?.title ?? "")))];
    };
    return {
      source: "cloud+local",
      data: {
        recipes: merge(cloudData.recipes, local.data.recipes),
        restaurants: merge(cloudData.restaurants, local.data.restaurants, "id"),
        cats: cloudData.cats?.length ? cloudData.cats : local.data.cats
      },
      staleFallback: false
    };
  } catch (error) {
    if (local) return { ...local, staleFallback: true, error: error instanceof Error ? error.message : "Data unavailable" };
    return { source: "empty", data: normalizeDataset({}), staleFallback: true, error: error instanceof Error ? error.message : "Data unavailable" };
  }
}
