/**
 * ============================================================================
 *  COST CONFIG — SAMPLE ESTIMATES FOR DEMONSTRATION ONLY
 * ============================================================================
 *  Every cost, fare, speed and budget rule used by the planner lives here.
 *  All amounts are in BDT (৳). They are rough sample estimates for testing the
 *  app — NOT live fares, prices or schedules — and must be reviewed before
 *  being presented to anyone as real prices.
 *
 *  This is business logic and data processing, not machine learning.
 *  The Python backend will replace it later.
 *
 *  Total Cost = Transportation + Accommodation + Food + Activities
 *               + Local Transport + Miscellaneous
 * ============================================================================
 */

/* ============================== Budget rules ============================== */

/** Strict: the total must be <= budget, no exceptions (0 = no tolerance). */
export const STRICT_TOLERANCE = 0;

/**
 * Flexible: the total may reach budget * (1 + FLEXIBLE_LIMIT) when the plan
 * can't fit the budget otherwise. 0.30 = 30%. Proposed value — configurable.
 */
export const FLEXIBLE_LIMIT = 0.3;

/* ======================== Intercity transportation ======================== */

/** Roads (and rail lines) are longer than a straight line between two cities. */
export const ROAD_WINDING_FACTOR = 1.35;

/**
 * Per-mode sample rates for the journey between cities.
 *  bus / train – fare PER PERSON = baseFare + farePerKm × road km
 *  car         – hired car with driver, priced PER VEHICLE; vehicles = ceil(travelers / capacity)
 *  flight      – fare PER PERSON = baseFare + farePerKm × straight-line km;
 *                duration = air time at cruiseSpeedKmh + airportMinutes (check-in, transfers)
 */
export const INTERCITY_MODES = {
  bus: { label: 'Bus', speedKmh: 40, baseFare: 100, farePerKm: 1.8 },
  train: { label: 'Train', speedKmh: 45, baseFare: 50, farePerKm: 1.4 },
  car: { label: 'Car', speedKmh: 50, baseFare: 1500, farePerKm: 15, capacity: 4 },
  flight: { label: 'Flight', cruiseSpeedKmh: 400, airportMinutes: 120, baseFare: 3000, farePerKm: 6 },
};

/**
 * Optional overrides for a few well-known routes (sample values), used instead
 * of the formula above. Key = the two destination ids sorted alphabetically and
 * joined with "|". Fares are per person; car is always calculated.
 */
export const ROUTE_OVERRIDES = {
  'coxs-bazar|dhaka': {
    bus: { durationMinutes: 600, farePerPerson: 1000 },
    train: { durationMinutes: 540, farePerPerson: 700 },
    flight: { durationMinutes: 185, farePerPerson: 5500 },
  },
  'dhaka|sylhet': {
    bus: { durationMinutes: 360, farePerPerson: 750 },
    train: { durationMinutes: 420, farePerPerson: 400 },
    flight: { durationMinutes: 165, farePerPerson: 4500 },
  },
  'chattogram|dhaka': {
    bus: { durationMinutes: 360, farePerPerson: 700 },
    train: { durationMinutes: 330, farePerPerson: 450 },
    flight: { durationMinutes: 165, farePerPerson: 4500 },
  },
  // Bus to Khagrachhari, then a shared jeep up to Sajek.
  'dhaka|sajek-valley': {
    bus: { durationMinutes: 660, farePerPerson: 1500 },
  },
  // Bus to Mongla, the usual base for Sundarbans boat trips.
  'dhaka|sundarbans': {
    bus: { durationMinutes: 330, farePerPerson: 650 },
  },
};

/** Fares are rounded to the nearest 10 taka. */
export const FARE_ROUNDING = 10;

/* ============================ Local transport ============================ */

/**
 * How each local mode behaves (sample values). The typical fare per ride for
 * each destination is in data/transport.js; longer rides cost farePerKm × km
 * instead, whichever is higher. Prices are per vehicle.
 *  speedKmh – average speed between stops
 *  capacity – travelers per vehicle
 *  maxKm    – longest ride this mode is used for
 */
export const LOCAL_MODES = {
  walk: { label: 'Walking', speedKmh: 4.5, capacity: Infinity, farePerKm: 0, maxKm: 1.5 },
  rickshaw: { label: 'Rickshaw', speedKmh: 10, capacity: 2, farePerKm: 25, maxKm: 4 },
  'battery-van': { label: 'Battery auto / easy-bike', speedKmh: 15, capacity: 6, farePerKm: 12, maxKm: 10 },
  cng: { label: 'CNG auto-rickshaw', speedKmh: 25, capacity: 3, farePerKm: 20, maxKm: 80 },
  jeep: { label: 'Jeep (chander gari)', speedKmh: 22, capacity: 10, farePerKm: 70, maxKm: 120 },
  boat: { label: 'Boat / launch', speedKmh: 15, capacity: 12, farePerKm: 60, maxKm: 150 },
};

/** Without "Local Transport" selected, legs up to this distance are walked. */
export const WALKING_MAX_KM = 1.5;

/** Stops closer than this count as the same place (no travel line is shown). */
export const SAME_PLACE_KM = 0.3;

/** Rough local-transport allowance per traveler per day, used only by the Budget-step estimate. */
export const LOCAL_ESTIMATE_PER_TRAVELER_PER_DAY = 200;

/* ============================== Accommodation ============================== */

/** Rooms needed = ceil(travelers / TRAVELERS_PER_ROOM). */
export const TRAVELERS_PER_ROOM = 2;

/**
 * Price per room per night by tier. Used when a destination has no listed
 * hotel in that tier; otherwise the hotel's own sample price in data/hotels.js is used.
 */
export const HOTEL_PRICE_PER_ROOM_PER_NIGHT = {
  budget: 2000,
  'mid-range': 5000,
  premium: 10000,
};

/* ================================== Food ================================== */

/** Food cost per person per day (breakfast + lunch + dinner) by tier. */
export const FOOD_COST_PER_PERSON_PER_DAY = {
  budget: 500,
  'mid-range': 1000,
  premium: 2000,
};

/** How a day's food cost splits across meals (for the per-meal estimates shown). */
export const MEAL_SHARE = { breakfast: 0.2, lunch: 0.35, dinner: 0.45 };

/* ================================ Activities ================================ */

/*
 * Activity costs are the per-person entry fees on each attraction in
 * data/attractions.js (also sample values).
 */

/** Activity allowance per traveler per day, used only by the Budget-step "comfortable" estimate. */
export const ACTIVITY_ESTIMATE_PER_TRAVELER_PER_DAY = 300;

/* ============================== Miscellaneous ============================== */

/** Tips, water, snacks, small tickets — a small percentage of everything else. */
export const MISC_PERCENT = 0.05;
