/**
 * RESTAURANTS
 * -----------
 * Sample food options at each destination.
 *
 * Fields:
 *  id               – unique slug
 *  destinationId    – links to destinations.js
 *  name             – display name
 *  cuisine          – main cuisine shown on the card
 *  priceTier        – 'budget' | 'mid-range' | 'premium'
 *  avgCostPerPerson – approximate cost of one meal per person, in BDT
 *  foodTags         – matches food preference ids in planningOptions.js
 *                     ('local-food','street-food','restaurant-dining',
 *                      'vegetarian','halal','seafood')
 *  highlight        – short note shown on the card
 *  imageKey         – key in imageMap.js → food (matched to the cuisine)
 *
 * Prices are approximate planning estimates and should be verified before launch.
 */

const restaurants = [
  // Dhaka
  { id: 'haji-biriyani', destinationId: 'dhaka', name: 'Haji Biriyani', cuisine: 'Old Dhaka Biryani', priceTier: 'budget', avgCostPerPerson: 300, foodTags: ['local-food', 'halal'], highlight: 'Since 1939', imageKey: 'biryani' },
  { id: 'star-kabab', destinationId: 'dhaka', name: 'Star Kabab & Restaurant', cuisine: 'Bangladeshi', priceTier: 'budget', avgCostPerPerson: 350, foodTags: ['local-food', 'halal'], highlight: 'Local Favorite', imageKey: 'grill' },
  { id: 'beauty-lassi', destinationId: 'dhaka', name: 'Beauty Lassi & Faluda', cuisine: 'Street Sweets', priceTier: 'budget', avgCostPerPerson: 150, foodTags: ['street-food', 'vegetarian'], highlight: 'Old Dhaka Classic', imageKey: 'sweets' },
  { id: 'izumi-dhaka', destinationId: 'dhaka', name: 'Izumi', cuisine: 'Japanese', priceTier: 'premium', avgCostPerPerson: 2500, foodTags: ['restaurant-dining', 'seafood'], highlight: 'Gulshan', imageKey: 'restaurant-interior' },

  // Chattogram
  { id: 'mezban-bari', destinationId: 'chattogram', name: 'Mezban Bari', cuisine: 'Chittagonian Mezbani', priceTier: 'budget', avgCostPerPerson: 400, foodTags: ['local-food', 'halal'], highlight: 'Mezbani Beef', imageKey: 'food-court' },
  { id: 'barcode-cafe-ctg', destinationId: 'chattogram', name: 'Barcode Café', cuisine: 'Continental', priceTier: 'mid-range', avgCostPerPerson: 900, foodTags: ['restaurant-dining', 'halal'], highlight: 'GEC Circle', imageKey: 'cafe' },
  { id: 'patenga-food-stalls', destinationId: 'chattogram', name: 'Patenga Beach Food Stalls', cuisine: 'Seafood Fry', priceTier: 'budget', avgCostPerPerson: 250, foodTags: ['street-food', 'seafood'], highlight: 'Sea Breeze', imageKey: 'street-food' },

  // Sylhet
  { id: 'panshi-sylhet', destinationId: 'sylhet', name: 'Panshi Restaurant', cuisine: 'Bangladeshi', priceTier: 'budget', avgCostPerPerson: 300, foodTags: ['local-food', 'halal'], highlight: '30+ Bhorta Varieties', imageKey: 'rice-curry' },
  { id: 'pach-bhai-sylhet', destinationId: 'sylhet', name: 'Pach Bhai Restaurant', cuisine: 'Sylheti', priceTier: 'budget', avgCostPerPerson: 300, foodTags: ['local-food', 'halal'], highlight: 'Local Favorite', imageKey: 'rice-curry' },
  { id: 'woondaal-sylhet', destinationId: 'sylhet', name: 'Woondaal King Kebab', cuisine: 'Kebab & Grill', priceTier: 'mid-range', avgCostPerPerson: 700, foodTags: ['restaurant-dining', 'halal'], highlight: 'Zindabazar', imageKey: 'grill' },

  // Khulna
  { id: 'chuijhal-khulna', destinationId: 'khulna', name: 'Chuijhal House', cuisine: 'Chui Jhal Mutton', priceTier: 'budget', avgCostPerPerson: 450, foodTags: ['local-food', 'halal'], highlight: 'Regional Specialty', imageKey: 'rice-curry' },
  { id: 'rupsha-fish-khulna', destinationId: 'khulna', name: 'Rupsha Galda Chingri Ghar', cuisine: 'Prawn & River Fish', priceTier: 'mid-range', avgCostPerPerson: 800, foodTags: ['seafood', 'local-food'], highlight: 'Giant Prawns', imageKey: 'fish-curry' },
  { id: 'khulna-street', destinationId: 'khulna', name: 'Shibbari Street Snacks', cuisine: 'Street Food', priceTier: 'budget', avgCostPerPerson: 150, foodTags: ['street-food', 'vegetarian'], highlight: 'Evening Snacks', imageKey: 'tea-stall' },

  // Rajshahi
  { id: 'kalai-ruti-rajshahi', destinationId: 'rajshahi', name: 'Kalai Ruti Stalls', cuisine: 'Kalai Ruti & Bhorta', priceTier: 'budget', avgCostPerPerson: 120, foodTags: ['street-food', 'local-food', 'vegetarian'], highlight: 'Rajshahi Signature', imageKey: 'street-food' },
  { id: 'rahmania-rajshahi', destinationId: 'rajshahi', name: 'Rahmania Hotel', cuisine: 'Bangladeshi', priceTier: 'budget', avgCostPerPerson: 250, foodTags: ['local-food', 'halal'], highlight: 'Shaheb Bazar', imageKey: 'rice-curry' },
  { id: 'padma-garden-rajshahi', destinationId: 'rajshahi', name: 'Padma Garden Restaurant', cuisine: 'Multi-cuisine', priceTier: 'mid-range', avgCostPerPerson: 600, foodTags: ['restaurant-dining', 'halal'], highlight: 'Riverside', imageKey: 'restaurant-interior' },

  // Rangpur
  { id: 'haribhanga-rangpur', destinationId: 'rangpur', name: 'Rangpur Local Kitchen', cuisine: 'Northern Bengali', priceTier: 'budget', avgCostPerPerson: 250, foodTags: ['local-food', 'halal'], highlight: 'Shidol Bhorta', imageKey: 'rice-curry' },
  { id: 'rangpur-grill', destinationId: 'rangpur', name: 'Jahaj Company Grill', cuisine: 'Grill & Kebab', priceTier: 'mid-range', avgCostPerPerson: 550, foodTags: ['restaurant-dining', 'halal'], highlight: 'City Center', imageKey: 'grill' },

  // Barishal
  { id: 'barishal-hilsa', destinationId: 'barishal', name: 'Kirtankhola Ilish Ghar', cuisine: 'Hilsa & River Fish', priceTier: 'mid-range', avgCostPerPerson: 600, foodTags: ['seafood', 'local-food'], highlight: 'Fresh Ilish', imageKey: 'fish-curry' },
  { id: 'barishal-local', destinationId: 'barishal', name: 'Sadar Road Bhaat Ghar', cuisine: 'Bangladeshi', priceTier: 'budget', avgCostPerPerson: 200, foodTags: ['local-food', 'halal'], highlight: 'Home-style', imageKey: 'rice-curry' },

  // Cumilla
  { id: 'matri-bhandar', destinationId: 'cumilla', name: 'Matri Bhandar', cuisine: 'Rosh Malai & Sweets', priceTier: 'budget', avgCostPerPerson: 200, foodTags: ['local-food', 'vegetarian'], highlight: 'Famous Rosh Malai', imageKey: 'sweets' },
  { id: 'cumilla-highway', destinationId: 'cumilla', name: 'Highway Food Village', cuisine: 'Bangladeshi & Fast Food', priceTier: 'mid-range', avgCostPerPerson: 500, foodTags: ['restaurant-dining', 'halal'], highlight: 'Dhaka–Ctg Highway', imageKey: 'restaurant-interior' },

  // Mymensingh
  { id: 'gopal-pal-monda', destinationId: 'mymensingh', name: 'Gopal Pal’s Monda', cuisine: 'Traditional Sweets', priceTier: 'budget', avgCostPerPerson: 150, foodTags: ['local-food', 'vegetarian'], highlight: 'Since 1824', imageKey: 'sweets' },
  { id: 'mymensingh-river-cafe', destinationId: 'mymensingh', name: 'Brahmaputra River Café', cuisine: 'Bangladeshi', priceTier: 'budget', avgCostPerPerson: 300, foodTags: ['local-food', 'halal', 'seafood'], highlight: 'Riverside', imageKey: 'fish-curry' },

  // Cox's Bazar
  { id: 'poushee-coxs', destinationId: 'coxs-bazar', name: 'Poushee Restaurant', cuisine: 'Bangladeshi', priceTier: 'mid-range', avgCostPerPerson: 500, foodTags: ['local-food', 'halal', 'seafood'], highlight: 'Local Favorite', imageKey: 'food-court' },
  { id: 'jhawban-coxs', destinationId: 'coxs-bazar', name: 'Jhawban Restaurant', cuisine: 'Local Food', priceTier: 'budget', avgCostPerPerson: 300, foodTags: ['local-food', 'halal'], highlight: 'Budget-Friendly', imageKey: 'rice-curry' },
  { id: 'sea-crown-restaurant', destinationId: 'coxs-bazar', name: 'Sea Crown Restaurant', cuisine: 'Seafood', priceTier: 'mid-range', avgCostPerPerson: 600, foodTags: ['seafood', 'restaurant-dining', 'halal'], highlight: 'Sea View', imageKey: 'seafood' },
  { id: 'beach-shack-bbq', destinationId: 'coxs-bazar', name: 'Sugandha Beach BBQ Stalls', cuisine: 'Seafood', priceTier: 'budget', avgCostPerPerson: 450, foodTags: ['seafood', 'street-food'], highlight: 'Sunset View', imageKey: 'grill' },
  { id: 'mermaid-cafe', destinationId: 'coxs-bazar', name: 'Mermaid Café', cuisine: 'Seafood & Continental', priceTier: 'premium', avgCostPerPerson: 1500, foodTags: ['seafood', 'restaurant-dining'], highlight: 'Beachfront', imageKey: 'cafe' },

  // Sajek Valley
  { id: 'bamboo-chicken-sajek', destinationId: 'sajek-valley', name: 'Ruilui Bamboo Chicken Stalls', cuisine: 'Pahari Food', priceTier: 'budget', avgCostPerPerson: 350, foodTags: ['local-food', 'street-food'], highlight: 'Cooked in Bamboo', imageKey: 'grill' },
  { id: 'chimbal-sajek', destinationId: 'sajek-valley', name: 'Valley View Restaurant', cuisine: 'Bangladeshi', priceTier: 'mid-range', avgCostPerPerson: 450, foodTags: ['local-food', 'halal'], highlight: 'Cloud View', imageKey: 'rice-curry' },

  // Sundarbans
  { id: 'boat-kitchen-sundarbans', destinationId: 'sundarbans', name: 'Tour Boat Kitchen', cuisine: 'Bangladeshi & Fish', priceTier: 'mid-range', avgCostPerPerson: 500, foodTags: ['local-food', 'seafood', 'halal'], highlight: 'Freshly Cooked Onboard', imageKey: 'fish-curry' },
  { id: 'mongla-fish-hotel', destinationId: 'sundarbans', name: 'Mongla Ghat Bhaat Hotel', cuisine: 'River Fish & Rice', priceTier: 'budget', avgCostPerPerson: 200, foodTags: ['local-food', 'seafood'], highlight: 'Budget-Friendly', imageKey: 'fish-curry' },
];

export default restaurants;

/** All restaurants for one destination. */
export function getRestaurantsByDestination(destinationId) {
  return restaurants.filter((r) => r.destinationId === destinationId);
}
