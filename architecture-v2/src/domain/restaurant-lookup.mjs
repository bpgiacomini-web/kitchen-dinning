const FOOD_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "bar", "pub"]);
const KNOWN_LOCAL_WEBSITES = [
  { name: "fast eddies bon air", aliases: ["fast eddies", "fast eddies bon air"], website: "https://fasteddiesbonair.com/", address: "1530 E 4th Street, Alton, IL 62002" },
  { name: "ropers regal beagle", aliases: ["regal beagle", "ropers regal beagle"], website: "https://www.ropersregalbeagle.com/", address: "3043 Godfrey Road, Godfrey, IL 62035" },
  { name: "macs downtown", aliases: ["macs downtown"], website: "https://macsdowntown.com/", address: "315 Belle Street, Alton, IL 62002" }
];

function normalizedName(value) {
  return String(value || "").toLocaleLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function distanceMeters(origin, point) {
  if (!origin || !point || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)) return null;
  const radians = Math.PI / 180;
  const dLat = (point.lat - origin.lat) * radians;
  const dLon = (point.lon - origin.lon) * radians;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.lat * radians) * Math.cos(point.lat * radians) * Math.sin(dLon / 2) ** 2;
  return Math.round(6371000 * 2 * Math.asin(Math.sqrt(a)));
}

function foodFeature(feature) {
  const props = feature?.properties || {};
  const amenity = String(props.osm_value || "").toLowerCase();
  return (String(props.osm_key || "").toLowerCase() === "amenity" && FOOD_AMENITIES.has(amenity)) || FOOD_AMENITIES.has(String(props.type || "").toLowerCase());
}

export function normalizeRestaurantLookup(features, origin = null) {
  const seen = new Set();
  return (Array.isArray(features) ? features : []).filter(foodFeature).map(feature => {
    const props = feature.properties || {};
    const [lonRaw, latRaw] = feature.geometry?.coordinates || [];
    const point = { lat: Number(latRaw), lon: Number(lonRaw) };
    const address = [props.housenumber, props.street, props.city || props.locality || props.county, props.state].filter(Boolean).join(", ");
    const name = String(props.name || "").trim();
    const normalizedPlaceName = normalizedName(name);
    const knownLocal = KNOWN_LOCAL_WEBSITES.find(item => item.aliases.some(alias => normalizedPlaceName === alias || normalizedPlaceName.startsWith(`${alias} `)));
    return {
      name,
      cuisine: String(props.extra?.cuisine || props.cuisine || "").replaceAll("_", " "),
      address: address || knownLocal?.address || "",
      website: String(props.extra?.website || props.website || knownLocal?.website || ""),
      lat: Number.isFinite(point.lat) ? point.lat : null,
      lon: Number.isFinite(point.lon) ? point.lon : null,
      distance: distanceMeters(origin, point),
      source: "OpenStreetMap"
    };
  }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)).filter(place => {
    const key = `${place.name.toLocaleLowerCase()}|${place.address.toLocaleLowerCase()}`;
    if (!place.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeName(value) {
  return String(value || "").toLocaleLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function nameMatchStrength(candidate, query) {
  const name = normalizeName(candidate);
  const search = normalizeName(query);
  if (!name || !search) return 0;
  if (name === search) return 3;
  if (name.startsWith(search)) return 2;
  const tokens = search.split(/\s+/).filter(token => token.length > 1);
  if (tokens.length && tokens.every(token => name.split(/\s+/).includes(token))) return 1;
  return 0;
}

export async function searchRestaurantNames(query, { location = null, fetcher = fetch, signal } = {}) {
  const name = String(query || "").trim();
  if (name.length < 2) return { places: [], location };
  const response = await fetcher("/api/restaurant-lookup", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "name", query: name, location }),
    signal
  });
  if (!response.ok) throw new Error(`Restaurant lookup returned HTTP ${response.status}.`);
  const payload = await response.json();
  const lookupLocation = payload?.location || location;
  const results = normalizeRestaurantLookup(payload?.features, lookupLocation);
  const matchingNames = results.filter(place => nameMatchStrength(place.name, name) >= 1);
  const nearby = lookupLocation ? matchingNames.filter(place => place.distance == null || place.distance <= 200_000) : matchingNames;
  // Keep nearby matches first. If there are none, retain only strong name matches
  // from the global geocoder so a correct result is not hidden by a bad IP location.
  const candidates = nearby.length ? nearby : matchingNames;
  const rank = restaurant => nameMatchStrength(restaurant.name, name);
  const places = candidates.sort((a, b) => {
    if (lookupLocation) return (a.distance ?? Infinity) - (b.distance ?? Infinity) || rank(b) - rank(a);
    return rank(b) - rank(a);
  }).slice(0, 8);
  return { places, location: lookupLocation };
}

export async function searchNearbyRestaurants({ location = null, fetcher = fetch, signal } = {}) {
  const response = await fetcher("/api/restaurant-lookup", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "nearby", location }),
    signal
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error || `Nearby restaurant lookup returned HTTP ${response.status}.`);
  return { places: Array.isArray(payload?.places) ? payload.places : [], location: payload?.location || location };
}
