/**
 * ============================================================================
 *  TRANSPORT PLANNER — SAMPLE ESTIMATES FOR DEMONSTRATION ONLY
 * ============================================================================
 *  Estimates distance, travel time and fares between cities and between stops.
 *  All rates come from ./costConfig.js and ../data/transport.js and are sample
 *  values — not live fares or schedules. Review them before presenting them as
 *  real prices.
 *
 *  This is business logic and data processing, not machine learning.
 *  The Python backend will replace it later; keep these return shapes stable:
 *
 *  getRouteOptions(fromId, toId, travelers) → [{
 *    mode, label, distanceKm, durationMinutes, farePerPerson, groupFare, vehicles
 *  }]   (only modes that exist on that route, cheapest first)
 *
 *  planLocalLeg(from, to, destinationId, travelers, useLocalTransport) → null (no travel) | {
 *    mode, label, distanceKm, durationMinutes, fare   // fare = whole group
 *  }
 * ============================================================================
 */
import { getTransportInfo } from '../data/transport';
import {
  FARE_ROUNDING,
  INTERCITY_MODES,
  LOCAL_MODES,
  ROAD_WINDING_FACTOR,
  ROUTE_OVERRIDES,
  SAME_PLACE_KM,
  WALKING_MAX_KM,
} from './costConfig';

/* ------------------------------- Distances ------------------------------- */

/** Straight-line (Haversine) distance in km between two { lat, lng } points. */
export function straightKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Estimated road distance: straight line × winding factor. */
export function roadKm(a, b) {
  return straightKm(a, b) * ROAD_WINDING_FACTOR;
}

const roundFare = (n) => Math.round(n / FARE_ROUNDING) * FARE_ROUNDING;
const roundMinutes = (n) => Math.max(5, Math.round(n / 5) * 5);

/* ------------------------------- Intercity ------------------------------- */

/**
 * Every intercity mode that exists between two destinations, with duration and
 * fares for the group. Flight needs airports at both ends; train needs railway
 * stations at both ends; bus and hired car always exist.
 */
export function getRouteOptions(fromId, toId, travelers) {
  const from = getTransportInfo(fromId);
  const to = getTransportInfo(toId);
  if (!from || !to) return [];

  const road = roadKm(from.coordinates, to.coordinates);
  const air = straightKm(from.coordinates, to.coordinates);
  const overrides = ROUTE_OVERRIDES[[fromId, toId].sort().join('|')] || {};
  const options = [];

  // Bus — fare per person
  const bus = INTERCITY_MODES.bus;
  options.push(
    perPersonOption('bus', road, travelers, overrides.bus, {
      durationMinutes: (road / bus.speedKmh) * 60,
      farePerPerson: bus.baseFare + bus.farePerKm * road,
    })
  );

  // Train — only if both ends have a railway station
  if (from.hasRailway && to.hasRailway) {
    const train = INTERCITY_MODES.train;
    options.push(
      perPersonOption('train', road, travelers, overrides.train, {
        durationMinutes: (road / train.speedKmh) * 60,
        farePerPerson: train.baseFare + train.farePerKm * road,
      })
    );
  }

  // Flight — only if both ends have an airport
  if (from.hasAirport && to.hasAirport) {
    const flight = INTERCITY_MODES.flight;
    options.push(
      perPersonOption('flight', air, travelers, overrides.flight, {
        durationMinutes: flight.airportMinutes + (air / flight.cruiseSpeedKmh) * 60,
        farePerPerson: flight.baseFare + flight.farePerKm * air,
      })
    );
  }

  // Hired car with driver — priced per vehicle
  const car = INTERCITY_MODES.car;
  const vehicles = Math.ceil(travelers / car.capacity);
  const groupFare = roundFare(vehicles * (car.baseFare + car.farePerKm * road));
  options.push({
    mode: 'car',
    label: car.label,
    distanceKm: Math.round(road),
    durationMinutes: roundMinutes((road / car.speedKmh) * 60),
    farePerPerson: Math.round(groupFare / travelers),
    groupFare,
    vehicles,
  });

  return options.sort((a, b) => a.groupFare - b.groupFare);
}

function perPersonOption(mode, distanceKm, travelers, override, formula) {
  const values = override || formula;
  const farePerPerson = roundFare(values.farePerPerson);
  return {
    mode,
    label: INTERCITY_MODES[mode].label,
    distanceKm: Math.round(distanceKm),
    durationMinutes: roundMinutes(values.durationMinutes),
    farePerPerson,
    groupFare: farePerPerson * travelers,
    vehicles: null,
  };
}

/* --------------------------------- Local --------------------------------- */

/**
 * How to get from one stop to the next at the destination.
 *  - Legs shorter than SAME_PLACE_KM count as "no travel" (returns null).
 *  - With Local Transport selected: the cheapest local mode that suits the distance.
 *  - Without it: walk legs up to WALKING_MAX_KM, otherwise the cheapest local mode.
 */
export function planLocalLeg(from, to, destinationId, travelers, useLocalTransport) {
  const km = roadKm(from, to);
  if (km < SAME_PLACE_KM) return null;

  if (!useLocalTransport && km <= WALKING_MAX_KM) return makeLeg('walk', km, 0, travelers);

  const info = getTransportInfo(destinationId);
  const modes = info?.localModes || [];
  const suitable = modes.filter((m) => LOCAL_MODES[m.mode].maxKm >= km);
  // If nothing is meant for a ride this long, use the longest-range mode available.
  const pool = suitable.length
    ? suitable
    : [...modes].sort((a, b) => LOCAL_MODES[b.mode].maxKm - LOCAL_MODES[a.mode].maxKm).slice(0, 1);
  if (!pool.length) return makeLeg('walk', km, 0, travelers);

  const legs = pool.map((m) => makeLeg(m.mode, km, m.farePerRide, travelers));
  return legs.sort((a, b) => a.fare - b.fare)[0];
}

function makeLeg(mode, km, farePerRide, travelers) {
  const rates = LOCAL_MODES[mode];
  const vehicles = mode === 'walk' ? 0 : Math.ceil(travelers / rates.capacity);
  const perVehicle = Math.max(farePerRide, rates.farePerKm * km);
  return {
    mode,
    label: rates.label,
    distanceKm: Math.round(km * 10) / 10,
    durationMinutes: roundMinutes((km / rates.speedKmh) * 60),
    fare: roundFare(vehicles * perVehicle),
  };
}

/** The local modes a destination offers, for display: [{ mode, label, farePerRide }]. */
export function describeLocalModes(destinationId) {
  return (getTransportInfo(destinationId)?.localModes || []).map((m) => ({
    mode: m.mode,
    label: LOCAL_MODES[m.mode].label,
    farePerRide: m.farePerRide,
  }));
}
