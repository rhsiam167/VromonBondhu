import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../services/apiClient';
import { useAuth } from './AuthContext';

/**
 * MY TRIPS CONTEXT
 * ----------------
 * The logged-in user's trips, stored by the backend:
 *   plannedTrips – every trip they generated while logged in (not saved yet)
 *   savedTrips   – the trips they pressed "Save Trip" on
 *   trips        – both together, newest first
 *
 * Backend calls:
 *   list   → GET    /api/trips
 *   plan   → POST   /api/trips  { trip, saved: false }
 *   save   → POST   /api/trips  { trip, saved: true }   or  PATCH /api/trips/{id} { saved: true }
 *   done   → PATCH  /api/trips/{id} { completed: true | false }
 *   open   → GET    /api/trips/{id}
 *   delete → DELETE /api/trips/{id}
 *
 * Each trip is the trip snapshot plus `savedId` (its id in the database),
 * `saved` (true/false) and `completed` (true once the user marked it completed).
 * Logged out → no trips.
 */
const SavedTripsContext = createContext(null);

/** Backend record → the trip object pages use. */
function toTrip(record) {
  return {
    ...record.trip,
    savedId: record.id,
    saved: record.saved,
    savedAt: record.createdAt,
    completed: record.completed,
    completedAt: record.completedAt,
  };
}

/** Insert or replace a trip in the list (matched by database id), newest first. */
function upsert(trips, trip) {
  return [trip, ...trips.filter((t) => t.savedId !== trip.savedId)];
}

/** The snapshot to send: the trip without our own bookkeeping fields. */
function snapshotOf(trip) {
  const { savedId, saved, savedAt, completed, completedAt, ...snapshot } = trip;
  return snapshot;
}

export function SavedTripsProvider({ children }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const records = await apiRequest('/api/trips');
      setTrips(records.map(toTrip));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load the list whenever someone logs in; clear it when they log out.
  useEffect(() => {
    if (user) refresh().catch(() => setTrips([]));
    else setTrips([]);
  }, [user, refresh]);

  const findByPlannerId = (tripId) => trips.find((t) => t.id === tripId);

  /** Record a freshly generated trip under "Recently Planned". Throws ApiError on failure. */
  async function recordPlannedTrip(trip) {
    const existing = findByPlannerId(trip.id);
    if (existing) return existing;
    const planned = toTrip(await apiRequest('/api/trips', { method: 'POST', body: { trip: snapshotOf(trip), saved: false } }));
    setTrips((list) => upsert(list, planned));
    return planned;
  }

  /** Save a trip (moves it to "Saved Trips"). Returns the saved trip. Throws ApiError on failure. */
  async function saveTrip(trip) {
    const existing = findByPlannerId(trip.id) || (trip.savedId ? trip : null);
    let record;
    if (existing?.saved) return existing;
    if (existing?.savedId) {
      record = await apiRequest(`/api/trips/${existing.savedId}`, { method: 'PATCH', body: { saved: true } });
    } else {
      // Also covers a "planned" record still being created: the backend matches it by trip id.
      record = await apiRequest('/api/trips', { method: 'POST', body: { trip: snapshotOf(trip), saved: true } });
    }
    const saved = toTrip(record);
    setTrips((list) => upsert(list, saved));
    return saved;
  }

  /** Mark a saved trip as completed (or back to upcoming). Throws ApiError on failure. */
  async function setTripCompleted(trip, completed) {
    const updated = toTrip(await apiRequest(`/api/trips/${trip.savedId}`, { method: 'PATCH', body: { completed } }));
    setTrips((list) => list.map((t) => (t.savedId === updated.savedId ? updated : t)));
    return updated;
  }

  /** Fetch one trip from the backend by its database id. */
  async function fetchSavedTrip(savedId) {
    const trip = toTrip(await apiRequest(`/api/trips/${savedId}`));
    setTrips((list) => (list.some((t) => t.savedId === savedId) ? list : [trip, ...list]));
    return trip;
  }

  async function deleteTrip(savedId) {
    await apiRequest(`/api/trips/${savedId}`, { method: 'DELETE' });
    setTrips((list) => list.filter((t) => t.savedId !== savedId));
  }

  /** Has this trip been saved (not just planned)? */
  function isSaved(tripId) {
    return trips.some((t) => (t.id === tripId || t.savedId === tripId) && t.saved);
  }

  function clearTrips() {
    setTrips([]);
  }

  const savedTrips = trips.filter((t) => t.saved);
  const plannedTrips = trips.filter((t) => !t.saved);

  return (
    <SavedTripsContext.Provider
      value={{ trips, savedTrips, plannedTrips, loading, recordPlannedTrip, saveTrip, setTripCompleted, fetchSavedTrip, deleteTrip, isSaved, clearTrips, refresh }}
    >
      {children}
    </SavedTripsContext.Provider>
  );
}

export function useSavedTrips() {
  return useContext(SavedTripsContext);
}
