import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripPlan } from '../context/TripPlanContext';
import { useSavedTrips } from '../context/SavedTripsContext';
import { useAuth } from '../context/AuthContext';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Finds a trip by id — the one just generated, or a saved one (by its planner
 * id or its database id) — and gives the Overview/Itinerary pages the shared
 * actions. A saved trip that isn't loaded yet (e.g. after a refresh) is
 * fetched from the backend (GET /api/trips/{id}).
 */
export default function useTrip(tripId) {
  const navigate = useNavigate();
  const { generatedTrip, setGeneratedTrip, resetPlan } = useTripPlan();
  const { trips: myTrips, loading: listLoading, saveTrip, isSaved, fetchSavedTrip } = useSavedTrips();
  const { isLoggedIn, checkingSession } = useAuth();
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const trip =
    (generatedTrip && generatedTrip.id === tripId ? generatedTrip : null) ||
    myTrips.find((t) => t.id === tripId || t.savedId === tripId) ||
    null;

  // A saved-trip link opened directly: load it from the backend.
  useEffect(() => {
    if (trip || !isLoggedIn || !UUID.test(tripId)) return;
    setFetching(true);
    fetchSavedTrip(tripId)
      .catch(() => {}) // not found / not yours → the page shows "Trip not found"
      .finally(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, isLoggedIn, Boolean(trip)]);

  /** Save the trip to the backend, or ask the user to log in first. */
  async function handleSave() {
    if (!trip) return;
    if (!isLoggedIn) {
      setGeneratedTrip(trip);
      navigate('/login', { state: { saveTrip: true } });
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await saveTrip(trip);
      navigate('/my-trips');
    } catch (error) {
      setSaveError(error.message || 'Could not save this trip. Please try again.');
      setSaving(false);
    }
  }

  /** Load this trip's answers back into the planner and open the Review step. */
  function adjustPlan() {
    if (!trip) return;
    resetPlan(trip.inputs);
    navigate('/plan/review');
  }

  return {
    trip,
    loading: !trip && (fetching || checkingSession || listLoading),
    saved: trip ? isSaved(trip.id) : false,
    saving,
    saveError,
    handleSave,
    adjustPlan,
  };
}
