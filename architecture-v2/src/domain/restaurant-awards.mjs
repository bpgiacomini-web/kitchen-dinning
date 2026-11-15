import { safeWebUrl } from "./cocktails.mjs";
export const AWARD_LEVELS = ["Local", "Regional", "National", "International"];
// Discovery links do not claim a restaurant has won an award. Every recognition
// must be checked against its source and explicitly approved by the account owner.
export function awardSearchLinks(restaurant) {
  const identity = [restaurant.name, restaurant.address].filter(Boolean).join(" ");
  return [
    ["Local", `${identity} restaurant award best of readers choice`],
    ["Regional", `${identity} restaurant award regional dining`],
    ["National", `${identity} James Beard restaurant award`],
    ["International", `${identity} Michelin World's 50 Best restaurant recognition`]
  ].map(([level, query]) => ({ level, url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }));
}
export function validAward(award) {
  return award && typeof award === "object" && !Array.isArray(award)
    && typeof award.id === "string" && award.id.trim().length > 0 && award.id.length <= 200
    && typeof award.name === "string" && award.name.trim().length > 0 && award.name.length <= 180
    && AWARD_LEVELS.includes(award.level) && Number.isInteger(award.year) && award.year >= 1900 && award.year <= new Date().getUTCFullYear() + 1
    && typeof award.source === "string" && award.source.trim().length > 0 && award.source.length <= 180
    && typeof award.sourceUrl === "string" && award.sourceUrl.length <= 2000 && Boolean(safeWebUrl(award.sourceUrl))
    && typeof award.location === "string" && award.location.trim().length > 0 && award.location.length <= 300
    && typeof award.approvedAt === "string" && Number.isFinite(Date.parse(award.approvedAt));
}
