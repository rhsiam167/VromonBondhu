/**
 * The page address for a trip. Saved trips use their database id (savedId),
 * so the link still works after a page refresh; a freshly generated trip
 * that isn't saved yet uses its planner id.
 */
export function tripPath(trip, page = '') {
  return `/trip/${trip.savedId || trip.id}${page ? `/${page}` : ''}`;
}
