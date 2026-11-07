const FOOD_AMENITIES = new Set(["restaurant", "fast_food", "cafe", "bar", "pub"]);

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
    return {
      name,
      cuisine: String(props.extra?.cuisine || props.cuisine || "").replaceAll("_", " "),
      address,
      website: String(props.extra?.website || props.website || ""),
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
  const results = lookupLocation
    ? normalizeRestaurantLookup(payload?.features, lookupLocation).filter(place => place.distance == null || place.distance <= 200_000)
    : [];
  const normalizedQuery = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const rank = restaurant => {
    const normalizedName = restaurant.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return normalizedName === normalizedQuery ? 0 : normalizedName.startsWith(normalizedQuery) ? 1 : normalizedName.includes(normalizedQuery) ? 2 : 3;
  };
  const places = results.sort((a, b) => rank(a) - rank(b) || (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, 8);
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
