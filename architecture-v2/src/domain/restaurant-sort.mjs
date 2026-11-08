export function sortRestaurantItems(items, mode, { lastVisit, averageRating }) {
  return [...items].sort((a, b) => {
    if (mode === "highest") return (averageRating(b) ?? -1) - (averageRating(a) ?? -1) || a.name.localeCompare(b.name);
    if (mode === "lowest") return (averageRating(a) ?? Infinity) - (averageRating(b) ?? Infinity) || a.name.localeCompare(b.name);
    if (mode === "name") return a.name.localeCompare(b.name);
    return lastVisit(b) - lastVisit(a) || a.name.localeCompare(b.name);
  });
}
