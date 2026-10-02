/**
 * PLANNING OPTIONS
 * ----------------
 * All the choices a user can pick in the 6-step planning flow.
 * Keeping them here (instead of inside the page components) means the
 * backend can later use the exact same ids.
 */

/** Step 3 – interests. `icon` is a name from components/Icons.jsx. */
export const INTERESTS = [
  { id: 'beach', label: 'Beach', icon: 'umbrella' },
  { id: 'nature', label: 'Nature', icon: 'trees' },
  { id: 'food', label: 'Food', icon: 'utensils' },
  { id: 'culture', label: 'Culture', icon: 'masks' },
  { id: 'adventure', label: 'Adventure', icon: 'compass' },
  { id: 'photography', label: 'Photography', icon: 'camera' },
  { id: 'shopping', label: 'Shopping', icon: 'bag' },
  { id: 'history', label: 'History', icon: 'landmark' },
  { id: 'relaxation', label: 'Relaxation', icon: 'lotus' },
  { id: 'nightlife', label: 'Nightlife', icon: 'moon' },
];

/** Step 2 – what the budget should cover. */
export const BUDGET_COVERS = [
  { id: 'transportation', label: 'Transportation' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'food', label: 'Food' },
  { id: 'activities', label: 'Activities' },
  { id: 'shopping', label: 'Shopping' },
];

/** Step 2 – budget mode. */
export const BUDGET_MODES = [
  { id: 'strict', label: 'Strict Budget', description: 'Stay within this amount, no exceptions.' },
  { id: 'flexible', label: 'Flexible Budget', description: "Allow going over slightly if it's worth it." },
];

/** Step 2 – slider limits (BDT). */
export const BUDGET_LIMITS = { min: 2000, max: 100000, step: 500 };

/** Step 4 – pace of the trip. `activitiesPerDay` is used by the trip generator. */
export const TRAVEL_STYLES = [
  { id: 'relaxed', label: 'Relaxed', description: 'Fewer activities, more downtime.', activitiesPerDay: 2 },
  { id: 'balanced', label: 'Balanced', description: 'A mix of activities and rest.', activitiesPerDay: 3 },
  { id: 'packed', label: 'Packed', description: 'As much as possible, every day.', activitiesPerDay: 4 },
];

export const TRANSPORT_OPTIONS = [
  { id: 'bus', label: 'Bus' },
  { id: 'train', label: 'Train' },
  { id: 'car', label: 'Car' },
  { id: 'flight', label: 'Flight' },
  { id: 'local', label: 'Local Transport' },
];

export const FOOD_OPTIONS = [
  { id: 'local-food', label: 'Local Food' },
  { id: 'street-food', label: 'Street Food' },
  { id: 'restaurant-dining', label: 'Restaurant Dining' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'halal', label: 'Halal' },
  { id: 'seafood', label: 'Seafood' },
];

export const ACCOMMODATION_TIERS = [
  { id: 'budget', label: 'Budget' },
  { id: 'mid-range', label: 'Mid-range' },
  { id: 'premium', label: 'Premium' },
];

export const CROWD_OPTIONS = [
  { id: 'avoid', label: 'Avoid Crowds' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'popular-ok', label: 'Popular Places Are Okay' },
];

/** The six steps shown in the StepIndicator, in order. */
export const PLANNING_STEPS = [
  { number: 1, label: 'Trip Details', path: '/plan/details' },
  { number: 2, label: 'Budget', path: '/plan/budget' },
  { number: 3, label: 'Interests', path: '/plan/interests' },
  { number: 4, label: 'Preferences', path: '/plan/preferences' },
  { number: 5, label: 'Review', path: '/plan/review' },
  { number: 6, label: 'Generate', path: '/plan/generating' },
];

/** Look up the label for an option id, e.g. labelFor(FOOD_OPTIONS, 'halal') → 'Halal'. */
export function labelFor(options, id) {
  return options.find((o) => o.id === id)?.label || id;
}
