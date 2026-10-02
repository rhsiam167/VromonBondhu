/**
 * GOLDEN VALUES: run the FRONTEND's own JavaScript and save its answers, so the
 * Python tests can check the backend gives the same numbers (parity tests).
 *
 * Run from the project root (needs the frontend's `npm install` for esbuild):
 *     node backend/scripts/make_golden_values.mjs
 * Writes backend/tests/planner/golden_values.json.
 *
 * It uses esbuild (already installed with the frontend) to bundle the
 * frontend modules, because they import each other without ".js" extensions.
 */
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outFile = join(mkdtempSync(join(tmpdir(), 'vromon-golden-')), 'golden.mjs');

const entry = `
import { getRouteOptions, planLocalLeg } from './src/services/transportPlanner';
import { cheapestHotelInTier, roomsFor, miscFor } from './src/services/costModel';
import { getInterestWeights } from './src/utils/interestWeights';
import { generateTrip } from './src/services/tripGenerator';
import destinations from './src/data/destinations';
import attractions from './src/data/attractions';
import transport from './src/data/transport';

// Structure of a value: object → its keys' structures, array → union of its elements.
function shape(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const merged = {};
    for (const v of value) {
      const s = shape(v);
      if (typeof s === 'object') for (const [k, sub] of Object.entries(s)) merged[k] = merged[k] && typeof merged[k] === 'object' ? merged[k] : sub;
    }
    return value.length && typeof shape(value[0]) !== 'object' ? ['scalar'] : [merged];
  }
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  return typeof value;
}

const routePairs = [
  ['dhaka', 'coxs-bazar', 2], ['dhaka', 'sundarbans', 3], ['dhaka', 'sylhet', 1], ['chattogram', 'sajek-valley', 5],
  ['rajshahi', 'barishal', 4], ['khulna', 'rangpur', 2], ['sylhet', 'coxs-bazar', 6], ['mymensingh', 'cumilla', 3],
  ['dhaka', 'sajek-valley', 4], ['cumilla', 'khulna', 7],
];
const routes = routePairs.map(([from, to, travelers]) => ({ from, to, travelers, options: getRouteOptions(from, to, travelers) }));

const legs = [];
for (const destinationId of ['coxs-bazar', 'dhaka', 'sajek-valley', 'sundarbans', 'khulna', 'sylhet']) {
  const hub = transport[destinationId].coordinates;
  const places = attractions.filter((a) => a.destinationId === destinationId).slice(0, 4);
  for (const [i, a] of places.entries()) {
    for (const useLocal of [true, false]) {
      const travelers = 1 + ((i * 2 + (useLocal ? 1 : 0)) % 5);
      legs.push({ destinationId, from: hub, to: a.coordinates, travelers, useLocal, leg: planLocalLeg(hub, a.coordinates, destinationId, travelers, useLocal) });
      if (places[i + 1]) {
        const to = places[i + 1].coordinates;
        legs.push({ destinationId, from: a.coordinates, to, travelers, useLocal, leg: planLocalLeg(a.coordinates, to, destinationId, travelers, useLocal) });
      }
    }
  }
}

const hotels = [];
for (const d of destinations) for (const tier of ['budget', 'mid-range', 'premium']) {
  const h = cheapestHotelInTier(d.id, tier);
  hotels.push({ destinationId: d.id, tier, id: h.id, pricePerNight: h.pricePerNight });
}

const interestLists = [['beach'], ['beach', 'nature'], ['adventure', 'photography', 'food', 'beach'], ['a', 'b', 'c', 'd', 'e', 'f', 'g']];

const base = { startDate: '', budgetMode: 'strict', budgetCovers: ['transportation'], travelStyle: 'balanced', transport: ['bus', 'train'],
  food: ['local-food'], accommodation: 'budget', crowd: 'balanced', notes: '', from: 'Dhaka', destination: "Cox's Bazar",
  days: 4, nights: 3, travelers: 2, budget: 40000, interests: ['beach', 'nature'] };
const ok = await generateTrip(base);
const infeasible = await generateTrip({ ...base, budget: 3000 });

export default {
  note: 'Produced by running the frontend JavaScript. Regenerate with: node backend/scripts/make_golden_values.mjs',
  routes,
  legs,
  hotels,
  roomsFor: [1, 2, 3, 4, 5, 6, 7].map((t) => ({ travelers: t, rooms: roomsFor(t) })),
  miscFor: [0, 999, 12345, 14427.5].map((s) => ({ subtotal: s, misc: miscFor(s) })),
  interestWeights: interestLists.map((list) => ({ ranked: list, weights: getInterestWeights(list) })),
  contract: { okStatus: ok.status, ok: shape(ok), infeasibleStatus: infeasible.status, infeasible: shape(infeasible) },
};
`;

await build({
  stdin: { contents: entry, resolveDir: root, loader: 'js' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: outFile,
  logLevel: 'warning',
});
const { default: golden } = await import(pathToFileURL(outFile).href);
const target = join(root, 'backend', 'tests', 'planner', 'golden_values.json');
writeFileSync(target, JSON.stringify(golden, null, 2) + '\n', 'utf8');
console.log(`wrote ${target}`);
console.log(`  ${golden.routes.length} route pairs, ${golden.legs.length} local legs, ${golden.hotels.length} hotel lookups`);
console.log(`  contract statuses: ${golden.contract.okStatus} / ${golden.contract.infeasibleStatus}`);
