/**
 * ONE-TIME EXPORT: frontend data → backend seed JSON
 * --------------------------------------------------
 * Reads the reference data from the frontend (src/data/*.js) and writes it
 * as JSON files into backend/app/seed/, where `python -m app.seed` loads it
 * into PostgreSQL.
 *
 * Run from the project root (the folder that contains src/ and backend/):
 *     node backend/scripts/export_frontend_data.mjs
 *
 * Re-run it only if you change the frontend data files.
 * All prices are sample estimates and are marked source = "sample-estimate".
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..', '..');
const seedDir = join(projectRoot, 'backend', 'app', 'seed');
const load = (file) => import(pathToFileURL(join(projectRoot, 'src', 'data', file)).href);

const SOURCE = 'sample-estimate';

const { default: destinations } = await load('destinations.js');
const { default: attractions } = await load('attractions.js');
const { default: hotels } = await load('hotels.js');
const { default: restaurants } = await load('restaurants.js');
const { default: transport } = await load('transport.js');
const planningOptions = await load('planningOptions.js');

const files = {
  'destinations.json': destinations,
  'attractions.json': attractions.map((a) => ({ ...a, source: SOURCE })),
  'hotels.json': hotels.map((h) => ({ ...h, source: SOURCE })),
  'restaurants.json': restaurants.map((r) => ({ ...r, source: SOURCE })),
  // transport.js is an object keyed by destination id → turn it into rows
  'transport_hubs.json': Object.entries(transport).map(([destinationId, info]) => ({
    destinationId,
    ...info,
    source: SOURCE,
  })),
  // The choices offered in the planning flow (used to validate requests)
  'planning_options.json': {
    interests: planningOptions.INTERESTS,
    budgetCovers: planningOptions.BUDGET_COVERS,
    budgetModes: planningOptions.BUDGET_MODES,
    budgetLimits: planningOptions.BUDGET_LIMITS,
    travelStyles: planningOptions.TRAVEL_STYLES,
    transportOptions: planningOptions.TRANSPORT_OPTIONS,
    foodOptions: planningOptions.FOOD_OPTIONS,
    accommodationTiers: planningOptions.ACCOMMODATION_TIERS,
    crowdOptions: planningOptions.CROWD_OPTIONS,
  },
};

mkdirSync(seedDir, { recursive: true });
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(seedDir, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`wrote backend/app/seed/${name} (${Array.isArray(data) ? data.length + ' rows' : 'object'})`);
}
