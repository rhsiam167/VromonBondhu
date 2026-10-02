/**
 * IMAGE MAP
 * ---------
 * The ONLY place in the app that contains image file paths.
 * Data entries (destinations, attractions, hotels, restaurants) store an
 * `imageKey`, and the <TripImage /> component looks the key up here.
 *
 * All files live in /public/images/ (served from /images/...).
 * To swap a photo, change the path here — nothing else needs to change.
 * The comment next to each path says what the photo shows.
 */
export const IMAGE_MAP = {
  site: {
    logo: '/logo.png',
    landingHero: '/images/destinations/Background.jpg', // fishing boats on a beach at sunset
  },

  // One photo per destination (keys = destination ids in destinations.js)
  destinations: {
    dhaka: '/images/destinations/dhaka.jpg.jpg', // busy street with CNGs and rickshaws at dusk
    chattogram: '/images/destinations/Background-3.jpg', // port with cranes and ships below hills
    sylhet: '/images/destinations/sylhet.jpg.jpg', // tea garden hills with pickers
    khulna: '/images/destinations/Background-4.jpg', // river sunset with palms and boats
    rajshahi: '/images/destinations/rajshahi.jpg.jpg', // mango orchard
    rangpur: '/images/destinations/Background-5.jpg', // paddy fields with a village path
    barishal: '/images/destinations/barishal.jpg.jpg', // floating guava market
    cumilla: '/images/destinations/cumilla.jpg.jpg', // Buddhist vihara ruins (Mainamati)
    mymensingh: '/images/destinations/Background-6.jpg', // riverbank with a wooden boat
    'coxs-bazar': '/images/destinations/Background-1.jpg', // long sandy beach, blue sky
    'sajek-valley': '/images/destinations/sajek-valley.jpg.jpg', // hill cottages above the clouds
    sundarbans: '/images/destinations/Background-2.jpg', // boat in a mangrove creek
  },

  // Attraction categories (many attractions share one image)
  attractions: {
    beach: '/images/attractions/beach.jpg.jpg',
    sunset: '/images/attractions/sunset-viewpoint.jpg.jpg',
    hills: '/images/attractions/hills-and-clouds.jpg.jpg',
    'tea-garden': '/images/attractions/Background-2.jpg',
    mangrove: '/images/attractions/Background-1.jpg',
    'river-boat': '/images/attractions/Background.jpg',
    fort: '/images/attractions/Background-3.jpg', // Lalbagh Fort style
    mosque: '/images/attractions/Background-4.jpg', // Sixty Dome Mosque style
    museum: '/images/attractions/Background-5.jpg', // museum gallery
    market: '/images/attractions/Background-8.jpg', // busy vegetable market
    trekking: '/images/attractions/Background-7.jpg', // hiker on a green ridge
    nightlife: '/images/attractions/Background-6.jpg', // lit-up street at night
  },

  // Stay types (chosen by price tier + kind of place)
  stays: {
    guesthouse: '/images/stays/Background.jpg', // cosy rustic room — budget guesthouse
    'budget-hotel': '/images/stays/Background-5.jpg', // simple twin room — budget hotel
    'beach-hotel': '/images/stays/Background-2.jpg', // room with sea-view balcony
    'city-hotel': '/images/stays/Background-3.jpg', // mid-range hotel room
    resort: '/images/stays/Background-1.jpg', // tropical villas around a pool
    'premium-hotel': '/images/stays/Background-4.jpg', // luxury room with city skyline
    'premium-resort': '/images/stays/Background-1.jpg', // tropical villas around a pool
    'hill-cottage': '/images/stays/Background-6.jpg', // wooden cottage on a misty hill
  },

  // Food types (matched to each restaurant's cuisine)
  food: {
    'rice-curry': '/images/food/1.jpg', // rice with bhorta and curries
    'fish-curry': '/images/food/2.jpg', // fish curry with rice
    'food-court': '/images/food/3.jpg', // local eatery feast on banana leaf
    seafood: '/images/food/4.jpg', // seafood platter by the sea
    sweets: '/images/food/5.jpg', // rasgulla, sandesh, kalojam
    biryani: '/images/food/6.jpg', // kacchi biryani pot
    grill: '/images/food/7.jpg', // beach barbecue at sunset
    'restaurant-interior': '/images/food/8.jpg', // warm restaurant dining room
    cafe: '/images/food/9.jpg', // café table by a window
    'tea-stall': '/images/food/10.jpg', // roadside tea stall
    'street-food': '/images/food/11.jpg', // fuchka vendor
  },
};

/** getImage('food', 'biryani') → '/images/food/6.jpg' (or null if unknown). */
export function getImage(group, key) {
  return IMAGE_MAP[group]?.[key] || null;
}
