import { useState } from 'react';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import TripImage from '../components/TripImage';
import { StatusBadge, tripSummary } from '../components/TripListItem';
import { useAuth } from '../context/AuthContext';
import { useSavedTrips } from '../context/SavedTripsContext';
import { useTripPlan } from '../context/TripPlanContext';
import { getTripStatus } from '../utils/tripStatus';
import { formatTaka, plural } from '../utils/format';
import { tripPath } from '../utils/tripLinks';
import { useNavigate } from 'react-router-dom';

/**
 * HOME (logged in) — dashboard built only from the user's saved trips.
 * With no saved trips, it shows zeros and invites the user to plan one.
 */
export default function HomePage() {
  const { user } = useAuth();
  // "Trips Planned" counts everything you generated; upcoming trips and spend count saved trips only.
  const { trips, savedTrips, setTripCompleted } = useSavedTrips();
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');
  const { resetPlan } = useTripPlan();
  const navigate = useNavigate();

  const upcoming = savedTrips.filter((t) => getTripStatus(t) === 'upcoming');
  const totalSpend = savedTrips.reduce((sum, t) => sum + t.budget.estimatedCost, 0);
  const nextTrip = upcoming[0];

  /** "Mark as Completed" on the next trip: it moves to Completed Trips and the next upcoming one shows here. */
  async function markCompleted() {
    setCompleting(true);
    setCompleteError('');
    try {
      await setTripCompleted(nextTrip, true);
    } catch (error) {
      setCompleteError(error.message);
    } finally {
      setCompleting(false);
    }
  }

  function planTrip() {
    resetPlan();
    navigate('/plan/details');
  }

  return (
    <PageLayout background="bg-page">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-8">
        <h1 className="text-4xl font-bold">Welcome back, {user.name}</h1>
        <p className="mt-3 text-lg text-body">Here&apos;s what&apos;s happening with your trips.</p>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <StatCard size="lg" value={trips.length} label="Trips Planned" />
          <StatCard size="lg" value={upcoming.length} label={upcoming.length === 1 ? 'Upcoming Trip' : 'Upcoming Trips'} highlight />
          <StatCard size="lg" value={formatTaka(totalSpend)} label="Total Estimated Spend" />
        </section>

        {/* Next upcoming trip */}
        <Card padding="p-0" className="mt-12 overflow-hidden">
          {nextTrip ? (
            <div className="flex flex-col sm:flex-row">
              <TripImage group="destinations" imageKey={nextTrip.destinationImageKey} alt={nextTrip.destinationName} className="h-48 w-full sm:h-auto sm:w-2/5" />
              <div className="px-8 py-10">
                <StatusBadge status="upcoming" />
                <h2 className="mt-3 text-2xl font-medium">{nextTrip.title}</h2>
                <p className="mt-3 text-body">{tripSummary(nextTrip)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <Button size="sm" onClick={markCompleted} disabled={completing}>
                    {completing ? 'Updating…' : 'Mark as Completed'}
                  </Button>
                  <Button variant="text" to={tripPath(nextTrip, 'itinerary')}>View Itinerary</Button>
                </div>
                {completeError && <p className="mt-3 text-sm font-medium text-red-600" role="alert">{completeError}</p>}
              </div>
            </div>
          ) : (
            <div className="px-8 py-12 text-center">
              <h2 className="text-2xl font-medium">No upcoming trips yet</h2>
              <p className="mt-2 text-body">Plan a trip and save it — it will show up here.</p>
              <Button onClick={planTrip} className="mt-5">Plan a New Trip</Button>
            </div>
          )}
        </Card>

        {/* Recent trips */}
        {trips.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Recent Trips</h2>
              <Button variant="text" to="/my-trips">View All</Button>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.slice(0, 3).map((trip) => (
                <Card key={trip.id} padding="p-0" className="overflow-hidden">
                  <TripImage group="destinations" imageKey={trip.destinationImageKey} alt={trip.destinationName} className="h-56 w-full" />
                  <div className="px-8 py-7">
                    <h3 className="text-xl font-medium">{trip.title}</h3>
                    <p className="mt-2 text-sm text-body">
                      {plural(trip.days, 'Day')} · <span className="capitalize">{trip.saved ? getTripStatus(trip) : 'planned · not saved'}</span>
                    </p>
                    <Button variant="text" size="sm" to={tripPath(trip, 'itinerary')} className="mt-3">View Itinerary</Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
