import { authenticatedUser } from './user-data.js';
import { consumeAccountRateLimit, sendRateLimitResponse } from './_lib/rate-limit.js';

const FOOD_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "bar", "pub"]);
const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";
const OPEN_FOOD_FACTS_URL = "https://world.openfoodfacts.org/api/v2/product/";
const OVERPASS_URLS = [
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter"
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

function normalizeNearby(elements, location, { filter = () => true, limit = 20 } = {}) {
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
    if (!place.name || !FOOD_AMENITIES.has(place.amenity) || !filter(place)) return false;
    const key = `${place.name.toLocaleLowerCase()}|${place.address.toLocaleLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, limit);
}

function normalizePhotonNearby(features, location) {
  const elements = (Array.isArray(features) ? features : []).map(feature => {
    const props = feature?.properties || {};
    const [lon, lat] = feature?.geometry?.coordinates || [];
    return {
      lat, lon,
      tags: {
        name: props.name,
        amenity: props.osm_key === "amenity" ? props.osm_value : "",
        cuisine: props.cuisine || props.extra?.cuisine || "",
        website: props.website || props.extra?.website || "",
        "addr:housenumber": props.housenumber,
        "addr:street": props.street,
        "addr:city": props.city,
        "addr:state": props.state
      }
    };
  });
  return normalizeNearby(elements, location);
}

function hasFoodFeature(feature) {
  const props = feature?.properties || {};
  return String(props.osm_key || "").toLowerCase() === "amenity" && FOOD_AMENITIES.has(String(props.osm_value || "").toLowerCase());
}

function hasNearbyNameMatch(features, query, location) {
  return features.some(feature => {
    if (!hasFoodFeature(feature) || !nameMatches(feature?.properties?.name, query)) return false;
    if (!location) return true;
    const [lon, lat] = feature.geometry?.coordinates || [];
    const point = { lat: Number(lat), lon: Number(lon) };
    const distance = distanceMeters(location, point.lat, point.lon);
    return distance == null || distance <= 30000;
  });
}

function nameMatches(candidate, query) {
  const normalize = value => String(value || "").toLocaleLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const name = normalize(candidate);
  const search = normalize(query);
  if (!name || !search) return false;
  if (name.includes(search) || search.includes(name)) return true;
  const words = search.split(/\s+/).filter(word => word.length > 1 && word !== "the");
  return words.length > 0 && words.filter(word => name.includes(word)).length / words.length >= 0.7;
}

async function nearbyNameFeatures(query, location, fetcher) {
  if (!location) return [];
  const overpassQuery = `[out:json][timeout:15];nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub)$",i]["name"](around:30000,${location.lat},${location.lon});out center tags;`;
  for (const [index, endpoint] of OVERPASS_URLS.entries()) {
    const url = new URL(endpoint);
    url.searchParams.set("data", overpassQuery);
    try {
      const payload = await fetchJson(fetcher, url, { headers: { Accept: "application/json" } }, index === 0 ? 7000 : 3000);
      return normalizeNearby(payload.elements, location, { filter: place => nameMatches(place.name, query) }).map(place => ({
        type: "Feature",
        properties: {
          name: place.name,
          city: place.address.split(", ").slice(-2, -1)[0] || "",
          street: place.address.split(", ").slice(0, 2).join(" "),
          osm_key: "amenity",
          osm_value: place.amenity,
          extra: { cuisine: place.cuisine, website: place.website }
        },
        geometry: { type: "Point", coordinates: [place.lon, place.lat] }
      }));
    } catch { /* Try the public backup endpoint. */ }
  }
  return [];
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

export function createRestaurantLookupHandler({ fetcher = fetch, authenticate = authenticatedUser, limitRequests = consumeAccountRateLimit } = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const mode = body.mode;
    if (mode === "pizza-upc") {
      const identity = await authenticate(req);
      if (identity.error) return res.status(identity.status || 503).json({ error: identity.error });
      const upc = String(body.upc || "").trim();
      if (!/^\d{8,14}$/.test(upc)) return res.status(400).json({ error: "Enter an 8 to 14 digit UPC barcode." });
      try {
        const allowance = await limitRequests({ scope: "pizza-upc-lookup", accountId: identity.userId, limit: 30, windowSeconds: 60 });
        if (!allowance.allowed) return sendRateLimitResponse(res, allowance.retryAfterSeconds);
      } catch (error) {
        console.error("Metro Eats UPC lookup rate limit unavailable", String(error?.message || "rate_limit_error").slice(0, 80));
        return res.status(503).json({ error: "UPC lookup is temporarily unavailable. Please try again later." });
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);
      try {
        const url = new URL(`${OPEN_FOOD_FACTS_URL}${encodeURIComponent(upc)}.json`);
        url.searchParams.set("fields", "code,product_name,product_name_en,brands");
        const response = await fetcher(url, { headers: { Accept: "application/json", "User-Agent": "MetroEats/1.0 (frozen-pizza UPC lookup)" }, signal: controller.signal });
        if (!response.ok) throw new Error(`upstream_${response.status}`);
        const payload = await response.json();
        const product = payload?.product;
        const brand = String(product?.brands || "").split(",")[0].trim();
        const name = String(product?.product_name_en || product?.product_name || "").trim();
        if (payload?.status !== 1 || !product || (!brand && !name)) return res.status(404).json({ error: "No product details were found for that UPC. You can enter the brand and pizza name yourself." });
        const productCode = String(product.code || "");
        return res.status(200).json({ product: { upc: /^\d{8,14}$/.test(productCode) ? productCode : upc, brand, name, source: "Open Food Facts" } });
      } catch (error) {
        console.error("Metro Eats UPC lookup failed", String(error?.message || "upstream_error").slice(0, 80));
        return res.status(502).json({ error: "Product lookup is temporarily unavailable. You can enter the brand and pizza name yourself." });
      } finally { clearTimeout(timeout); }
    }
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
        let features = [];
        let photonError = null;
        try {
          const payload = await fetchJson(fetcher, url, { headers: { Accept: "application/json" } });
          features = Array.isArray(payload?.features) ? payload.features : [];
        } catch (error) { photonError = error; }
        if (!hasNearbyNameMatch(features, query, location)) {
          const fallback = await nearbyNameFeatures(query, location, fetcher);
          if (fallback.length) features = [...features, ...fallback];
        }
        if (photonError && !features.length) throw photonError;
        return res.status(200).json({ features, location });
      } catch (error) {
        console.error("Metro Eats restaurant name lookup failed", String(error?.message || "upstream_error").slice(0, 80));
        return res.status(502).json({ error: "Online restaurant search is temporarily unavailable." });
      }
    }

    if (mode === "nearby") {
      if (!location) return res.status(422).json({ error: "Device and network location are unavailable. Allow location access or enter the restaurant details manually." });
      const query = `[out:json][timeout:15];nwr["amenity"~"^(restaurant|fast_food|cafe|bar|pub)$",i]["name"](around:8047,${location.lat},${location.lon});out center tags;`;
      const photonUrl = new URL(PHOTON_REVERSE_URL);
      photonUrl.searchParams.set("lat", String(location.lat));
      photonUrl.searchParams.set("lon", String(location.lon));
      photonUrl.searchParams.set("radius", "8.05");
      photonUrl.searchParams.set("limit", "50");
      photonUrl.searchParams.set("lang", "en");
      for (const amenity of FOOD_AMENITIES) photonUrl.searchParams.append("osm_tag", `amenity:${amenity}`);
      try {
        const nearby = await fetchJson(fetcher, photonUrl, {
          headers: { Accept: "application/json", "User-Agent": "MetroEats/1.0 (nearby restaurant lookup)" }
        }, 4000);
        if (!Array.isArray(nearby?.features)) throw new Error("invalid_photon_response");
        return res.status(200).json({ places: normalizePhotonNearby(nearby.features, location), location });
      } catch (error) {
        console.error("Metro Eats Photon nearby lookup failed", String(error?.message || "upstream_error").slice(0, 80));
      }
      let payload = null;
      for (const [index, endpoint] of OVERPASS_URLS.entries()) {
        const url = new URL(endpoint);
        url.searchParams.set("data", query);
        try {
          payload = await fetchJson(fetcher, url, {
            headers: { Accept: "application/json", "User-Agent": "MetroEats/1.0 (nearby restaurant lookup)" }
          }, 1600);
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
