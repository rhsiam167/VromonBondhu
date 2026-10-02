/**
 * PLAN VALIDATION — the checks for each planning step. Used by the step pages
 * AND the Edit pop-up, so both show exactly the same errors.
 * Each function returns { errors, changes }: `errors` is empty when valid,
 * `changes` holds cleaned-up values to save (e.g. the exact city spelling).
 */
import { findDestinationByName, findStartingCityByName } from '../data/destinations';
import { BUDGET_LIMITS } from '../data/planningOptions';
import { formatTaka } from '../utils/format';

export function validateTripDetails(values) {
  const errors = {};
  const from = findStartingCityByName(values.from);
  const to = findDestinationByName(values.destination);
  if (!from) errors.from = 'Please choose one of the supported starting cities.';
  if (!to) errors.destination = 'Please choose a destination from the list.';
  if (from && to && from.id === to.id) errors.destination = 'Destination must be different from your starting location.';
  if (values.nights > values.days) errors.duration = 'Nights can’t be more than days.';
  const changes = from && to ? { from: from.name, destination: to.name } : {};
  return { errors, changes };
}

export function validateBudget(values) {
  const errors = {};
  if (values.budget < BUDGET_LIMITS.min) errors.budget = `Budget must be at least ${formatTaka(BUDGET_LIMITS.min)}.`;
  if (values.budgetCovers.length === 0) errors.covers = 'Select at least one thing your budget covers.';
  return { errors, changes: {} };
}

export function validateInterests(values) {
  const errors = {};
  if (values.interests.length === 0) errors.interests = 'Select at least one interest.';
  return { errors, changes: {} };
}

/** Step 4 has no required fields. */
export function validatePreferences() {
  return { errors: {}, changes: {} };
}
