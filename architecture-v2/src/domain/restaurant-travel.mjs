export const isTravelRestaurant = restaurant => restaurant?.travel === true;
export function matchesRestaurantScope(restaurant, scope = 'home') {
  return scope === 'all' || (scope === 'travel' ? isTravelRestaurant(restaurant) : !isTravelRestaurant(restaurant));
}
export function homeJournalData(data) {
  return {...data, restaurants:(data.restaurants||[]).filter(row=>!isTravelRestaurant(row))};
}
