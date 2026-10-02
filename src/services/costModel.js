/**
 * COST MODEL — small helpers that turn the sample numbers in costConfig.js
 * into costs. Shared by the trip generator and the Budget-step estimate.
 * Sample estimates only; business logic, not machine learning.
 */
import { getHotelsByDestination } from '../data/hotels';
import { HOTEL_PRICE_PER_ROOM_PER_NIGHT, MISC_PERCENT, TRAVELERS_PER_ROOM } from './costConfig';

export const TIER_ORDER = ['budget', 'mid-range', 'premium'];

export function roomsFor(travelers) {
  return Math.ceil(travelers / TRAVELERS_PER_ROOM);
}

/**
 * The cheapest listed hotel in a tier, or a generic sample stay priced from
 * costConfig if the destination has none in that tier.
 */
export function cheapestHotelInTier(destinationId, tier) {
  const inTier = getHotelsByDestination(destinationId)
    .filter((h) => h.priceTier === tier)
    .sort((a, b) => a.pricePerNight - b.pricePerNight);
  if (inTier.length) return inTier[0];
  return {
    id: `${destinationId}-${tier}-stay`,
    destinationId,
    name: `${tier[0].toUpperCase()}${tier.slice(1)} stay`,
    priceTier: tier,
    pricePerNight: HOTEL_PRICE_PER_ROOM_PER_NIGHT[tier],
    highlight: 'Sample price',
    imageKey: tier === 'budget' ? 'guesthouse' : tier === 'premium' ? 'premium-hotel' : 'city-hotel',
  };
}

/** Miscellaneous is a small percentage of everything else. */
export function miscFor(subtotal) {
  return subtotal * MISC_PERCENT;
}
