/**
 * BUDGET ESTIMATE — the "Estimated Range for Your Trip" on the Budget step.
 * Uses the same sample rates as the trip generator. Sample estimates only.
 */
import { findDestinationByName, findStartingCityByName } from '../data/destinations';
import { cheapestHotelInTier, miscFor, roomsFor } from './costModel';
import { getRouteOptions } from './transportPlanner';
import {
  ACTIVITY_ESTIMATE_PER_TRAVELER_PER_DAY,
  FOOD_COST_PER_PERSON_PER_DAY,
  LOCAL_ESTIMATE_PER_TRAVELER_PER_DAY,
} from './costConfig';

/**
 * Returns { low, high } for the whole group, or null if the trip details are incomplete.
 *  low  – cheapest transport, budget stay and food, free activities
 *  high – bus, mid-range stay and food, some paid activities
 */
export function estimateBudgetRange({ from, destination, days, nights, travelers }) {
  const origin = findStartingCityByName(from);
  const dest = findDestinationByName(destination);
  if (!origin || !dest || origin.id === dest.id) return null;

  const options = getRouteOptions(origin.id, dest.id, travelers);
  const cheapest = options[0];
  const bus = options.find((o) => o.mode === 'bus') || cheapest;
  const local = LOCAL_ESTIMATE_PER_TRAVELER_PER_DAY * travelers * days;
  const rooms = roomsFor(travelers);

  const lowSubtotal =
    cheapest.groupFare * 2 +
    cheapestHotelInTier(dest.id, 'budget').pricePerNight * rooms * nights +
    FOOD_COST_PER_PERSON_PER_DAY.budget * travelers * days +
    local;
  const highSubtotal =
    bus.groupFare * 2 +
    cheapestHotelInTier(dest.id, 'mid-range').pricePerNight * rooms * nights +
    FOOD_COST_PER_PERSON_PER_DAY['mid-range'] * travelers * days +
    ACTIVITY_ESTIMATE_PER_TRAVELER_PER_DAY * travelers * days +
    local * 1.5;

  const roundTo500 = (n) => Math.ceil(n / 500) * 500;
  const low = roundTo500(lowSubtotal + miscFor(lowSubtotal));
  const high = roundTo500(highSubtotal + miscFor(highSubtotal));
  return { low, high: Math.max(high, low) };
}

/**
 * Starting price for ONE traveler at a destination, excluding the journey there
 * (landing-page cards, where no starting city is known yet).
 */
export function estimateStayAndFood(dest) {
  const days = dest.typicalDays;
  const nights = Math.max(0, days - 1);
  const subtotal =
    cheapestHotelInTier(dest.id, 'budget').pricePerNight * nights +
    FOOD_COST_PER_PERSON_PER_DAY.budget * days +
    LOCAL_ESTIMATE_PER_TRAVELER_PER_DAY * days;
  return Math.ceil(subtotal / 500) * 500;
}
