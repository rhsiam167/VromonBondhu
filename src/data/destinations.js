/**
 * DESTINATIONS
 * ------------
 * Reference data for every place the planner supports.
 * Each object is shaped like a database row so it can later be used as
 * seed data for the backend without changes.
 *
 * Fields:
 *  id           – unique slug, used to link attractions/hotels/restaurants
 *  name         – display name
 *  nameBn       – Bangla name
 *  division     – administrative division
 *  categories   – any of: 'beach' | 'nature' | 'adventure' | 'heritage' | 'urban'
 *  description  – short summary
 *  imageKey     – key in imageMap.js → destinations
 *  startingCity – true for the cities a trip can start from
 *  (coordinates, airports, railways and local transport are in transport.js)
 *  typicalDays  – suggested trip length
 *  featured     – shown in "Popular Destinations" and quick-pick chips
 */
const destinations = [
  {
    id: 'dhaka',
    startingCity: true,
    imageKey: 'dhaka',
    name: 'Dhaka',
    nameBn: 'ঢাকা',
    division: 'Dhaka',
    categories: ['urban', 'heritage'],
    description:
      'The capital — Mughal forts, Old Dhaka lanes, river ports and the busiest food scene in the country.',
    typicalDays: 2,
    featured: false,
  },
  {
    id: 'chattogram',
    startingCity: true,
    imageKey: 'chattogram',
    name: 'Chattogram',
    nameBn: 'চট্টগ্রাম',
    division: 'Chattogram',
    categories: ['urban', 'beach', 'nature'],
    description:
      'Port city between hills and sea — Patenga beach, Foy’s Lake and the coastal hills of Sitakunda.',
    typicalDays: 3,
    featured: false,
  },
  {
    id: 'sylhet',
    startingCity: true,
    imageKey: 'sylhet',
    name: 'Sylhet',
    nameBn: 'সিলেট',
    division: 'Sylhet',
    categories: ['nature', 'adventure', 'heritage'],
    description:
      'Rolling tea gardens, the Ratargul swamp forest and the clear stone-bed rivers of Jaflong and Bisnakandi.',
    typicalDays: 3,
    featured: true,
  },
  {
    id: 'khulna',
    startingCity: true,
    imageKey: 'khulna',
    name: 'Khulna',
    nameBn: 'খুলনা',
    division: 'Khulna',
    categories: ['heritage', 'urban'],
    description:
      'Gateway to the Sundarbans and home of the UNESCO-listed mosque city of Bagerhat.',
    typicalDays: 2,
    featured: false,
  },
  {
    id: 'rajshahi',
    startingCity: true,
    imageKey: 'rajshahi',
    name: 'Rajshahi',
    nameBn: 'রাজশাহী',
    division: 'Rajshahi',
    categories: ['heritage', 'urban'],
    description:
      'Clean, green “Silk City” on the Padma — terracotta temples of Puthia, mango orchards and Rajshahi silk.',
    typicalDays: 2,
    featured: false,
  },
  {
    id: 'rangpur',
    startingCity: true,
    imageKey: 'rangpur',
    name: 'Rangpur',
    nameBn: 'রংপুর',
    division: 'Rangpur',
    categories: ['heritage'],
    description:
      'Northern city known for the Tajhat Palace and the legacy of Begum Rokeya.',
    typicalDays: 2,
    featured: false,
  },
  {
    id: 'barishal',
    startingCity: true,
    imageKey: 'barishal',
    name: 'Barishal',
    nameBn: 'বরিশাল',
    division: 'Barishal',
    categories: ['nature', 'heritage'],
    description:
      'The “Venice of Bengal” — river life, floating guava markets and the Guthia Mosque.',
    typicalDays: 2,
    featured: false,
  },
  {
    id: 'cumilla',
    startingCity: true,
    imageKey: 'cumilla',
    name: 'Cumilla',
    nameBn: 'কুমিল্লা',
    division: 'Chattogram',
    categories: ['heritage'],
    description:
      'Ancient Buddhist ruins of Mainamati, a WWII war cemetery and the famous Cumillar Rosh Malai.',
    typicalDays: 1,
    featured: false,
  },
  {
    id: 'mymensingh',
    startingCity: true,
    imageKey: 'mymensingh',
    name: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    division: 'Mymensingh',
    categories: ['heritage', 'nature'],
    description:
      'Quiet river town on the old Brahmaputra with zamindar palaces and the Zainul Abedin art museum.',
    typicalDays: 2,
    featured: false,
  },
  {
    id: 'coxs-bazar',
    startingCity: false,
    imageKey: 'coxs-bazar',
    name: "Cox's Bazar",
    nameBn: 'কক্সবাজার',
    division: 'Chattogram',
    categories: ['beach', 'nature', 'adventure'],
    description:
      'The world’s longest natural sea beach, with the Marine Drive, Himchari hills and Inani’s coral stones.',
    typicalDays: 4,
    featured: true,
  },
  {
    id: 'sajek-valley',
    startingCity: false,
    imageKey: 'sajek-valley',
    name: 'Sajek Valley',
    nameBn: 'সাজেক ভ্যালি',
    division: 'Chattogram',
    categories: ['nature', 'adventure'],
    description:
      'Hilltop village in Rangamati above a sea of clouds — reached by jeep from Khagrachhari.',
    typicalDays: 3,
    featured: true,
  },
  {
    id: 'sundarbans',
    startingCity: false,
    imageKey: 'sundarbans',
    name: 'Sundarbans',
    nameBn: 'সুন্দরবন',
    division: 'Khulna',
    categories: ['nature', 'adventure'],
    description:
      'The largest mangrove forest on Earth and home of the Royal Bengal Tiger, explored by boat from Khulna or Mongla.',
    typicalDays: 4,
    featured: true,
  },
];

export default destinations;

/* ---------- Small helper functions for working with this data ---------- */

/** Find a destination by its id, e.g. getDestinationById('sylhet'). */
export function getDestinationById(id) {
  return destinations.find((d) => d.id === id) || null;
}

/** Find a destination by its name, ignoring upper/lower case. */
export function findDestinationByName(name) {
  const clean = (name || '').trim().toLowerCase();
  return destinations.find((d) => d.name.toLowerCase() === clean) || null;
}

/** The cities a trip can start from. */
export function getStartingCities() {
  return destinations.filter((d) => d.startingCity);
}

/** A starting city by name (ignoring case), or null if it isn't one. */
export function findStartingCityByName(name) {
  const found = findDestinationByName(name);
  return found && found.startingCity ? found : null;
}

/** Destinations shown on the landing page and as quick-pick chips. */
export function getFeaturedDestinations() {
  return destinations.filter((d) => d.featured);
}
