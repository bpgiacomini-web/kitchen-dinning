const FOOD_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "bar", "pub"]);
const PHOTON_URL = "https://photon.komoot.io/api/";
const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter"
];

function finiteCoordinate(value, min, max) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function requestLocation(req, supplied) {
  const suppliedLat = finiteCoordinate(supplied?.lat, -90, 90);
  const suppliedLon = finiteCoordinate(supplied?.lon, -180, 180);
  if (suppliedLat != null && suppliedLon != null) {
    return { lat: suppliedLat, lon: suppliedLon, source: "device" };
  }
  const lat = finiteCoordinate(req.headers["x-vercel-ip-latitude"], -90, 90);
  const lon = finiteCoordinate(req.headers["x-vercel-ip-longitude"], -180, 180);
  if (lat == null || lon == null) return null;
  let city = String(req.headers["x-vercel-ip-city"] || "");
  try { city = decodeURIComponent(city.replace(/\+/g, "%20")); } catch { city = ""; }
  const region = String(req.headers["x-vercel-ip-country-region"] || "");
  return { lat, lon, city, region, source: "network" };
}

function distanceMeters(origin, lat, lon) {
  const radians = Math.PI / 180;
  const dLat = (lat - origin.lat) * radians;
  const dLon = (lon - origin.lon) * radians;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.lat * radians) * Math.cos(lat * radians) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(a)));
}

function normalizeNearby(elements, location) {
  const seen = new Set();
  return (Array.isArray(elements) ? elements : []).map(item => {
    const tags = item?.tags || {};
    const lat = finiteCoordinate(item?.lat ?? item?.center?.lat, -90, 90);
    const lon = finiteCoordinate(item?.lon ?? item?.center?.lon, -180, 180);
    const address = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"], tags["addr:state"]].filter(Boolean).join(", ");
    const amenity = String(tags.amenity || "").toLowerCase();
    return {
      name: String(tags.name || "").trim(),
      cuisine: String(tags.cuisine || "").replaceAll("_", " "),
      address,
      website: String(tags.website || tags["contact:website"] || ""),
      lat, lon,
      distance: lat != null && lon != null ? distanceMeters(location, lat, lon) : null,
      amenity
    };
  }).filter(place => {
    if (!place.name || !FOOD_AMENITIES.has(place.amenity)) return false;
    const key = `${place.name.toLocaleLowerCase()}|${place.address.toLocaleLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, 20);
}

async function fetchJson(fetcher, url, options, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

export function createRestaurantLookupHandler({ fetcher = fetch } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const mode = body.mode;
    const location = requestLocation(req, body.location);
    if (mode === "name") {
      const query = typeof body.query === "string" ? body.query.trim() : "";
      if (query.length < 2 || query.length > 120) return res.status(400).json({ error: "Enter a restaurant name between 2 and 120 characters." });
      try {
        const url = new URL(PHOTON_URL);
        url.searchParams.set("q", query);
        url.searchParams.set("limit", "30");
        url.searchParams.set("lang", "en");
        if (location) {
          url.searchParams.set("lat", String(location.lat));
          url.searchParams.set("lon", String(location.lon));
          url.searchParams.set("location_bias_scale", "0.1");
        }
        const payload = await fetchJson(fetcher, url, { headers: { Accept: "application/json" } });
        return res.status(200).json({ features: Array.isArray(payload?.features) ? payload.features : [], location });
      } catch (error) {
        console.error("Metro Eats restaurant name lookup failed", String(error?.message || "upstream_error").slice(0, 80));
        return res.status(502).json({ error: "Online restaurant search is temporarily unavailable." });
      }
    }

    if (mode === "nearby") {
      if (!location) return res.status(422).json({ error: "Device and network location are unavailable. Allow location access or enter the restaurant details manually." });
      const query = `[out:json][timeout:15];nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub)$",i]["name"](around:8047,${location.lat},${location.lon});out center tags;`;
      let payload = null;
      for (const [index, endpoint] of OVERPASS_URLS.entries()) {
        const url = new URL(endpoint);
        url.searchParams.set("data", query);
        try {
          payload = await fetchJson(fetcher, url, { headers: { Accept: "application/json" } }, index === 0 ? 7000 : 2000);
          break;
        } catch { /* Try the public backup endpoint. */ }
      }
      if (!payload) return res.status(502).json({ error: "Nearby restaurant data is temporarily unavailable. Name search is still available." });
      return res.status(200).json({ places: normalizeNearby(payload.elements, location), location });
    }

    return res.status(400).json({ error: "Choose a restaurant name or nearby search." });
  };
}

export default createRestaurantLookupHandler();
