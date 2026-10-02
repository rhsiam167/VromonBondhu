/**
 * HOTELS
 * ------
 * Sample places to stay at each destination.
 *
 * Fields:
 *  id            – unique slug
 *  destinationId – links to destinations.js
 *  name          – display name
 *  priceTier     – 'budget' | 'mid-range' | 'premium'
 *  pricePerNight – approximate price for one standard double room, in BDT
 *  highlight     – short selling point shown on the card
 *  imageKey      – key in imageMap.js → stays (by price tier + kind of place)
 *
 * Prices are approximate planning estimates and should be verified before launch.
 */

const hotels = [
  // Dhaka
  { id: 'pan-pacific-sonargaon', destinationId: 'dhaka', name: 'Pan Pacific Sonargaon', priceTier: 'premium', pricePerNight: 16000, highlight: 'Karwan Bazar', imageKey: 'premium-hotel' },
  { id: 'hotel-71-dhaka', destinationId: 'dhaka', name: 'Hotel 71', priceTier: 'mid-range', pricePerNight: 6000, highlight: 'Bangla Motor', imageKey: 'city-hotel' },
  { id: 'hotel-grand-prince-dhaka', destinationId: 'dhaka', name: 'Hotel Grand Prince', priceTier: 'budget', pricePerNight: 2500, highlight: 'Mirpur', imageKey: 'budget-hotel' },

  // Chattogram
  { id: 'radisson-blu-ctg', destinationId: 'chattogram', name: 'Radisson Blu Chattogram Bay View', priceTier: 'premium', pricePerNight: 14000, highlight: 'City View', imageKey: 'premium-hotel' },
  { id: 'hotel-agrabad', destinationId: 'chattogram', name: 'Hotel Agrabad', priceTier: 'mid-range', pricePerNight: 7000, highlight: 'Agrabad', imageKey: 'city-hotel' },
  { id: 'hotel-golden-inn-ctg', destinationId: 'chattogram', name: 'Hotel Golden Inn', priceTier: 'budget', pricePerNight: 2200, highlight: 'Station Road', imageKey: 'budget-hotel' },

  // Sylhet
  { id: 'rose-view-sylhet', destinationId: 'sylhet', name: 'Rose View Hotel', priceTier: 'premium', pricePerNight: 11000, highlight: 'Pool & Spa', imageKey: 'premium-hotel' },
  { id: 'noorjahan-grand', destinationId: 'sylhet', name: 'Hotel Noorjahan Grand', priceTier: 'mid-range', pricePerNight: 5500, highlight: 'Dargah Gate', imageKey: 'city-hotel' },
  { id: 'hotel-holy-gate', destinationId: 'sylhet', name: 'Hotel Holy Gate', priceTier: 'budget', pricePerNight: 2000, highlight: 'City Center', imageKey: 'budget-hotel' },

  // Khulna
  { id: 'hotel-royal-khulna', destinationId: 'khulna', name: 'Hotel Royal International', priceTier: 'premium', pricePerNight: 7500, highlight: 'KDA Avenue', imageKey: 'premium-hotel' },
  { id: 'hotel-castle-salam', destinationId: 'khulna', name: 'Hotel Castle Salam', priceTier: 'mid-range', pricePerNight: 4500, highlight: 'City Center', imageKey: 'city-hotel' },
  { id: 'hotel-park-khulna', destinationId: 'khulna', name: 'Hotel Park', priceTier: 'budget', pricePerNight: 1800, highlight: 'Near Station', imageKey: 'budget-hotel' },

  // Rajshahi
  { id: 'hotel-x-rajshahi', destinationId: 'rajshahi', name: 'Hotel X Rajshahi', priceTier: 'premium', pricePerNight: 9000, highlight: 'River View', imageKey: 'premium-hotel' },
  { id: 'parjatan-rajshahi', destinationId: 'rajshahi', name: 'Parjatan Motel Rajshahi', priceTier: 'mid-range', pricePerNight: 3500, highlight: 'Near Padma', imageKey: 'resort' },
  { id: 'hotel-nice-rajshahi', destinationId: 'rajshahi', name: 'Hotel Nice International', priceTier: 'budget', pricePerNight: 1500, highlight: 'Shaheb Bazar', imageKey: 'budget-hotel' },

  // Rangpur
  { id: 'grand-palace-rangpur', destinationId: 'rangpur', name: 'Hotel Grand Palace', priceTier: 'premium', pricePerNight: 6500, highlight: 'Pool', imageKey: 'premium-hotel' },
  { id: 'hotel-north-view', destinationId: 'rangpur', name: 'Hotel North View', priceTier: 'mid-range', pricePerNight: 3500, highlight: 'City Center', imageKey: 'city-hotel' },
  { id: 'parjatan-rangpur', destinationId: 'rangpur', name: 'Parjatan Motel Rangpur', priceTier: 'budget', pricePerNight: 1800, highlight: 'Quiet Area', imageKey: 'guesthouse' },

  // Barishal
  { id: 'hotel-grand-park-barishal', destinationId: 'barishal', name: 'Hotel Grand Park', priceTier: 'premium', pricePerNight: 7000, highlight: 'Pool', imageKey: 'premium-hotel' },
  { id: 'hotel-athena-barishal', destinationId: 'barishal', name: 'Hotel Athena International', priceTier: 'mid-range', pricePerNight: 3500, highlight: 'Near Launch Ghat', imageKey: 'city-hotel' },
  { id: 'hotel-ali-barishal', destinationId: 'barishal', name: 'Hotel Ali International', priceTier: 'budget', pricePerNight: 1500, highlight: 'Sadar Road', imageKey: 'budget-hotel' },

  // Cumilla
  { id: 'hotel-elite-cumilla', destinationId: 'cumilla', name: 'Hotel Elite', priceTier: 'mid-range', pricePerNight: 3500, highlight: 'Kandirpar', imageKey: 'city-hotel' },
  { id: 'kotbari-resort', destinationId: 'cumilla', name: 'Kotbari Hill Resort', priceTier: 'premium', pricePerNight: 6000, highlight: 'Near Mainamati', imageKey: 'resort' },
  { id: 'hotel-abedin-cumilla', destinationId: 'cumilla', name: 'Hotel Abedin', priceTier: 'budget', pricePerNight: 1400, highlight: 'City Center', imageKey: 'budget-hotel' },

  // Mymensingh
  { id: 'hotel-amir-mymensingh', destinationId: 'mymensingh', name: 'Hotel Amir International', priceTier: 'mid-range', pricePerNight: 3000, highlight: 'City Center', imageKey: 'city-hotel' },
  { id: 'brahmaputra-river-resort', destinationId: 'mymensingh', name: 'Brahmaputra River Resort', priceTier: 'premium', pricePerNight: 5500, highlight: 'River View', imageKey: 'resort' },
  { id: 'hotel-mustafiz', destinationId: 'mymensingh', name: 'Hotel Mustafiz International', priceTier: 'budget', pricePerNight: 1300, highlight: 'Near Station', imageKey: 'budget-hotel' },

  // Cox's Bazar
  { id: 'sayeman-beach-resort', destinationId: 'coxs-bazar', name: 'Sayeman Beach Resort', priceTier: 'premium', pricePerNight: 14000, highlight: 'Rooftop Pool', imageKey: 'premium-resort' },
  { id: 'sea-pearl-beach-resort', destinationId: 'coxs-bazar', name: 'Sea Pearl Beach Resort', priceTier: 'premium', pricePerNight: 12000, highlight: 'Inani', imageKey: 'premium-resort' },
  { id: 'long-beach-hotel', destinationId: 'coxs-bazar', name: 'Long Beach Hotel', priceTier: 'mid-range', pricePerNight: 7500, highlight: 'Kolatoli', imageKey: 'beach-hotel' },
  { id: 'ocean-paradise-hotel', destinationId: 'coxs-bazar', name: 'Ocean Paradise Hotel', priceTier: 'mid-range', pricePerNight: 6500, highlight: 'Near Beach', imageKey: 'resort' },
  { id: 'hotel-sea-crown', destinationId: 'coxs-bazar', name: 'Hotel Sea Crown', priceTier: 'budget', pricePerNight: 2500, highlight: 'Sea View', imageKey: 'beach-hotel' },
  { id: 'coral-reef-guest-house', destinationId: 'coxs-bazar', name: 'Coral Reef Guest House', priceTier: 'budget', pricePerNight: 1800, highlight: 'City Center', imageKey: 'guesthouse' },
  { id: 'hotel-sea-view-coxs', destinationId: 'coxs-bazar', name: 'Hotel Sea View', priceTier: 'budget', pricePerNight: 2200, highlight: 'Near Beach', imageKey: 'beach-hotel' },

  // Sajek Valley
  { id: 'sajek-resort', destinationId: 'sajek-valley', name: 'Sajek Resort', priceTier: 'premium', pricePerNight: 12000, highlight: 'Valley View', imageKey: 'hill-cottage' },
  { id: 'megh-machang', destinationId: 'sajek-valley', name: 'Megh Machang Resort', priceTier: 'mid-range', pricePerNight: 4500, highlight: 'Cloud View', imageKey: 'hill-cottage' },
  { id: 'ruilui-cottage', destinationId: 'sajek-valley', name: 'Ruilui Para Cottage', priceTier: 'budget', pricePerNight: 2000, highlight: 'Village Stay', imageKey: 'hill-cottage' },

  // Sundarbans (stays near Mongla / on tour boats)
  { id: 'sundarbans-cruise-cabin', destinationId: 'sundarbans', name: 'Liveaboard Cruise Cabin', priceTier: 'premium', pricePerNight: 9000, highlight: 'On the River', imageKey: 'resort' },
  { id: 'mongla-eco-resort', destinationId: 'sundarbans', name: 'Mongla Eco Resort', priceTier: 'mid-range', pricePerNight: 4000, highlight: 'Forest Edge', imageKey: 'resort' },
  { id: 'parjatan-pashur', destinationId: 'sundarbans', name: 'Parjatan Motel Pashur, Mongla', priceTier: 'budget', pricePerNight: 1800, highlight: 'Riverside', imageKey: 'guesthouse' },
];

export default hotels;

/** All hotels for one destination. */
export function getHotelsByDestination(destinationId) {
  return hotels.filter((h) => h.destinationId === destinationId);
}
