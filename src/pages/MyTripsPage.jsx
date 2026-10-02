import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';
import Icon from '../components/Icons';
import TripListItem from '../components/TripListItem';
import { useSavedTrips } from '../context/SavedTripsContext';
import { useTripPlan } from '../context/TripPlanContext';
import { getTripStatus } from '../utils/tripStatus';

/**
 * MY TRIPS — three sections:
 *   Saved Trips       – trips you pressed "Save Trip" on that are still upcoming
 *   Completed Trips   – saved trips you marked completed (or whose dates have passed)
 *   Recently Planned  – every other trip you generated while logged in
 * Plus the empty state when there are no trips at all.
 */
export default function MyTripsPage() {
  const { trips, savedTrips, plannedTrips, loading, saveTrip, setTripCompleted, deleteTrip } = useSavedTrips();
  const { resetPlan } = useTripPlan();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');

  const upcomingTrips = savedTrips.filter((t) => getTripStatus(t) === 'upcoming');
  const completedTrips = savedTrips.filter((t) => getTripStatus(t) === 'completed');

  function planTrip() {
    resetPlan();
    navigate('/plan/details');
  }

  async function handleDelete(trip) {
    if (!window.confirm(`Delete "${trip.title}"? This can't be undone.`)) return;
    setActionError('');
    try {
      await deleteTrip(trip.savedId);
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function handleComplete(trip, completed) {
    setActionError('');
    try {
      await setTripCompleted(trip, completed);
    } catch (error) {
      setActionError(error.message);
    }
  }

  async function handleSave(trip) {
    setActionError('');
    try {
      await saveTrip(trip);
    } catch (error) {
      setActionError(error.message);
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-8">
        <h1 className="text-4xl font-bold">My Trips</h1>
        <p className="mt-2 text-lg text-body">Your saved trips, and every trip you&apos;ve planned.</p>

        {loading && trips.length === 0 ? (
          <p className="py-28 text-center text-body">Loading your trips…</p>
        ) : trips.length === 0 ? (
          /* ---------- Empty state ---------- */
          <div className="flex flex-col items-center py-28 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Icon name="luggage" className="h-8 w-8" strokeWidth={2} />
            </span>
            <h2 className="mt-8 text-2xl font-bold">No Trips Yet</h2>
            <p className="mt-2 max-w-md text-body">Once you plan a trip, it will show up here so you can revisit it anytime.</p>
            <Button size="md" onClick={planTrip} className="mt-6 py-3">Plan Your First Trip</Button>
          </div>
        ) : (
          <>
            {actionError && <p className="mt-6 text-sm font-medium text-red-600" role="alert">{actionError}</p>}

            {/* ---------- Saved Trips (upcoming) ---------- */}
            <section className="mt-10" aria-labelledby="saved-heading">
              <h2 id="saved-heading" className="text-2xl font-semibold">
                Saved Trips <span className="text-body">({upcomingTrips.length})</span>
              </h2>
              <p className="mt-1 text-sm text-body">Upcoming trips you&apos;ve saved. Mark a trip as completed once you&apos;re back.</p>
              <div className="mt-6 space-y-6">
                {upcomingTrips.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-body">
                    {savedTrips.length === 0 ? (
                      <>No saved trips yet. Open a planned trip below and press <strong className="text-ink">Save Trip</strong> to keep it here.</>
                    ) : (
                      'No upcoming trips. Your finished trips are under Completed Trips.'
                    )}
                  </p>
                )}
                {upcomingTrips.map((trip) => (
                  <TripListItem key={trip.savedId} trip={trip} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </div>
            </section>

            {/* ---------- Completed Trips ---------- */}
            <section className="mt-14" aria-labelledby="completed-heading">
              <h2 id="completed-heading" className="text-2xl font-semibold">
                Completed Trips <span className="text-body">({completedTrips.length})</span>
              </h2>
              <div className="mt-6 space-y-6">
                {completedTrips.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-body">
                    No completed trips yet. Press <strong className="text-ink">Mark as Completed</strong> on a saved trip after you travel.
                  </p>
                )}
                {completedTrips.map((trip) => (
                  <TripListItem key={trip.savedId} trip={trip} onComplete={handleComplete} onDelete={handleDelete} />
                ))}
              </div>
            </section>

            {/* ---------- Recently Planned ---------- */}
            <section className="mt-14" aria-labelledby="planned-heading">
              <h2 id="planned-heading" className="text-2xl font-semibold">
                Recently Planned <span className="text-body">({plannedTrips.length})</span>
              </h2>
              <p className="mt-1 text-sm text-body">Every trip you generate while logged in appears here. Save the ones you want to keep.</p>
              <div className="mt-6 space-y-6">
                {plannedTrips.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-gray-200 px-6 py-8 text-center text-body">No other planned trips.</p>
                )}
                {plannedTrips.map((trip) => (
                  <TripListItem key={trip.savedId} trip={trip} onDelete={handleDelete} onSave={handleSave} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </PageLayout>
  );
}
