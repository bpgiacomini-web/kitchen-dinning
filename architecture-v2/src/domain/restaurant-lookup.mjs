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
  }).filter(place => {
    const key = `${place.name.toLocaleLowerCase()}|${place.address.toLocaleLowerCase()}`;
    if (!place.name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchRestaurantNames(query, { location = null, fetcher = fetch, signal } = {}) {
  const name = String(query || "").trim();
  if (name.length < 2) return [];
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", name);
  url.searchParams.set("limit", "20");
  url.searchParams.set("lang", "en");
  if (location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lon))) {
    url.searchParams.set("lat", String(Number(location.lat)));
    url.searchParams.set("lon", String(Number(location.lon)));
  }
  const response = await fetcher(url, { headers: { Accept: "application/json" }, signal });
  if (!response.ok) throw new Error(`Restaurant lookup returned HTTP ${response.status}.`);
  const payload = await response.json();
  const results = normalizeRestaurantLookup(payload?.features, location);
  const normalizedQuery = name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const rank = restaurant => {
    const normalizedName = restaurant.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return normalizedName === normalizedQuery ? 0 : normalizedName.startsWith(normalizedQuery) ? 1 : normalizedName.includes(normalizedQuery) ? 2 : 3;
  };
  return results.sort((a, b) => rank(a) - rank(b) || (a.distance ?? Infinity) - (b.distance ?? Infinity)).slice(0, 8);
}
