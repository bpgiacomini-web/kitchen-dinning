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

export function restaurantNavigationOptions(place) {
  const name = String(place?.name || "").trim();
  const address = String(place?.address || "").trim();
  const hasCoordinates = place?.lat != null && place?.lat !== "" && place?.lon != null && place?.lon !== ""
    && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon));
  const destination = hasCoordinates ? `${Number(place.lat)},${Number(place.lon)}` : [name, address].filter(Boolean).join(", ");
  if (!destination) return [];

  const appleParams = new URLSearchParams({ daddr: destination });
  if (name) appleParams.set("q", name);
  const googleParams = new URLSearchParams({ api: "1", destination });
  const wazeParams = hasCoordinates
    ? new URLSearchParams({ ll: destination, navigate: "yes" })
    : new URLSearchParams({ q: destination });

  return [
    { id: "apple-maps", label: "Apple Maps", url: `https://maps.apple.com/?${appleParams}` },
    { id: "google-maps", label: "Google Maps", url: `https://www.google.com/maps/dir/?${googleParams}` },
    { id: "waze", label: "Waze", url: `https://waze.com/ul?${wazeParams}` },
  ];
}
