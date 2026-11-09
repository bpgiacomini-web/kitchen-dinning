export function restaurantDirectionsUrl(place, userAgent = "") {
  const name = String(place?.name || "").trim();
  const address = String(place?.address || "").trim();
  const hasCoordinates = place?.lat != null && place?.lat !== "" && place?.lon != null && place?.lon !== ""
    && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon));
  const destination = hasCoordinates ? `${Number(place.lat)},${Number(place.lon)}` : [name, address].filter(Boolean).join(", ");
  if (!destination) return "";
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    const query = new URLSearchParams({ daddr: destination });
    if (name) query.set("q", name);
    return `https://maps.apple.com/?${query.toString()}`;
  }
  return `https://www.google.com/maps/dir/?${new URLSearchParams({ api: "1", destination }).toString()}`;
}
