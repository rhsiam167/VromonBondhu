/**
 * TRANSPORT DATA — SAMPLE ESTIMATES FOR DEMONSTRATION ONLY
 * --------------------------------------------------------
 * Per-destination transport facts used by services/transportPlanner.js.
 * Fares are sample values, not live fares or schedules, and must be
 * reviewed before being presented as real prices. Shaped like database rows
 * so it can become backend seed data.
 *
 * Fields (keyed by destination id from destinations.js):
 *  coordinates – latitude/longitude of the usual base (city centre, or the
 *                gateway town such as Mongla for the Sundarbans)
 *  hasAirport  – a domestic airport in or next to the place
 *  hasRailway  – a railway station with intercity trains
 *  localModes  – how people usually get around there, with a typical fare
 *                per ride (per vehicle, in BDT). Mode details such as speed
 *                and capacity are in services/costConfig.js → LOCAL_MODES.
 */
const transport = {
  dhaka: {
    coordinates: { lat: 23.751, lng: 90.3935 },
    hasAirport: true,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 80 },
      { mode: 'cng', farePerRide: 250 },
    ],
  },
  chattogram: {
    coordinates: { lat: 22.3569, lng: 91.7832 },
    hasAirport: true,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 70 },
      { mode: 'cng', farePerRide: 200 },
    ],
  },
  sylhet: {
    coordinates: { lat: 24.8949, lng: 91.8687 },
    hasAirport: true,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 60 },
      { mode: 'cng', farePerRide: 200 },
    ],
  },
  khulna: {
    coordinates: { lat: 22.8456, lng: 89.5403 },
    hasAirport: false,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 50 },
      { mode: 'battery-van', farePerRide: 60 },
      { mode: 'cng', farePerRide: 180 },
    ],
  },
  rajshahi: {
    coordinates: { lat: 24.3745, lng: 88.6042 },
    hasAirport: true,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 50 },
      { mode: 'battery-van', farePerRide: 50 },
      { mode: 'cng', farePerRide: 150 },
    ],
  },
  rangpur: {
    coordinates: { lat: 25.7439, lng: 89.2752 },
    hasAirport: false,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 50 },
      { mode: 'battery-van', farePerRide: 50 },
      { mode: 'cng', farePerRide: 150 },
    ],
  },
  barishal: {
    coordinates: { lat: 22.701, lng: 90.3535 },
    hasAirport: true,
    hasRailway: false,
    localModes: [
      { mode: 'rickshaw', farePerRide: 50 },
      { mode: 'cng', farePerRide: 150 },
      { mode: 'boat', farePerRide: 800 },
    ],
  },
  cumilla: {
    coordinates: { lat: 23.4607, lng: 91.1809 },
    hasAirport: false,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 50 },
      { mode: 'cng', farePerRide: 150 },
    ],
  },
  mymensingh: {
    coordinates: { lat: 24.7471, lng: 90.4203 },
    hasAirport: false,
    hasRailway: true,
    localModes: [
      { mode: 'rickshaw', farePerRide: 50 },
      { mode: 'battery-van', farePerRide: 50 },
      { mode: 'cng', farePerRide: 150 },
    ],
  },
  'coxs-bazar': {
    coordinates: { lat: 21.43, lng: 91.98 },
    hasAirport: true,
    hasRailway: true,
    localModes: [
      { mode: 'battery-van', farePerRide: 60 },
      { mode: 'cng', farePerRide: 250 },
      { mode: 'jeep', farePerRide: 1500 },
    ],
  },
  'sajek-valley': {
    coordinates: { lat: 23.382, lng: 92.2938 },
    hasAirport: false,
    hasRailway: false,
    localModes: [{ mode: 'jeep', farePerRide: 1200 }],
  },
  sundarbans: {
    // Mongla — the usual starting point for Sundarbans boat trips.
    coordinates: { lat: 22.4833, lng: 89.6 },
    hasAirport: false,
    hasRailway: false,
    localModes: [{ mode: 'boat', farePerRide: 800 }],
  },
};

export default transport;

/** Transport facts for one destination id. */
export function getTransportInfo(destinationId) {
  return transport[destinationId] || null;
}
