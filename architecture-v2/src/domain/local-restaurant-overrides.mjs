// Small, free local corrections for well-known Metro East map-data gaps.
// Coordinates are public Census geocodes for the listed street addresses.
export const LOCAL_RESTAURANT_OVERRIDES = [
  {
    name: "Delmar Public House",
    aliases: ["delmar public house"],
    cuisine: "American",
    address: "2926 West Delmar Avenue, Godfrey, IL 62035",
    website: "https://delmarpublichouse.com/",
    lat: 38.93839,
    lon: -90.24966,
  },
  {
    name: "Arandas MX Cocina",
    aliases: ["arandas mx cocina", "arandas"],
    cuisine: "Mexican",
    address: "3200 Godfrey Road, Godfrey, IL 62035",
    website: "https://arandasmxcocina.com/",
    lat: 38.93495,
    lon: -90.19231,
  },
];

export function isExcludedRestaurantName(value) {
  const name = String(value || "").toLocaleLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  return name.includes("concession stand") || name === "chic n pig" || name.startsWith("chic n pig ");
}
