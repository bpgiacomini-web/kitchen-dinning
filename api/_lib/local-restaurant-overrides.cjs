// Keep the server copy CommonJS: Vercel's Node function bundler loads .js API
// routes through require(), which cannot load the browser-side .mjs module.
const LOCAL_RESTAURANT_OVERRIDES = [
  {
    name: "Fast Eddie's Bon Air",
    aliases: ["fast eddies", "fast eddies bon air"],
    cuisine: "American",
    address: "1530 East 4th Street, Alton, IL 62002",
    website: "https://fasteddiesbonair.com/",
    lat: 38.88817,
    lon: -90.163,
  },
  {
    name: "Mac's Downtown",
    aliases: ["macs downtown"],
    cuisine: "American",
    address: "315 Belle Street, Alton, IL 62002",
    website: "https://macsdowntown.com/",
    lat: 38.8917,
    lon: -90.1872,
  },
  {
    name: "Roper's Regal Beagle",
    aliases: ["regal beagle", "ropers regal beagle"],
    cuisine: "American",
    address: "3043 Godfrey Road, Godfrey, IL 62035",
    website: "https://www.ropersregalbeagle.com/",
    lat: 38.930969,
    lon: -90.190838,
  },
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

function isExcludedRestaurantName(value) {
  const name = String(value || "").toLocaleLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  return name.includes("concession stand") || name === "chic n pig" || name.startsWith("chic n pig ");
}

module.exports = { LOCAL_RESTAURANT_OVERRIDES, isExcludedRestaurantName };
