import { useState } from 'react';
import { useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Button from '../components/Button';
import TripNotFound from '../components/TripNotFound';
import TripImage from '../components/TripImage';
import useTrip from '../hooks/useTrip';
import { formatDuration, formatMinutes, formatTaka, formatTime, plural } from '../utils/format';
import { tripPath } from '../utils/tripLinks';

/**
 * DAY-BY-DAY ITINERARY
 * Day tabs switch between the days of the trip made by services/tripGenerator.js.
 */
export default function ItineraryPage() {
  const { tripId } = useParams();
  const { trip, loading, saved, saving, saveError, handleSave, adjustPlan } = useTrip(tripId);
  const [activeDay, setActiveDay] = useState(1);
  if (loading) return <PageLayout />;
  if (!trip) return <TripNotFound />;

  const day = trip.itinerary.find((d) => d.day === activeDay) || trip.itinerary[0];

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold sm:text-4xl">{trip.title}</h1>
            <p className="mt-1 text-sm text-body">
              {formatDuration(trip.days, trip.nights)} · {plural(trip.travelers, 'Traveler')}
            </p>
          </div>
          <Button variant="outline" to={tripPath(trip)}>Back to Overview</Button>
        </div>

        {/* Day tabs */}
        <div className="mt-6 flex flex-wrap gap-3" role="tablist" aria-label="Trip days">
          {trip.itinerary.map((d) => (
            <Button
              key={d.day}
              role="tab"
              aria-selected={d.day === day.day}
              variant={d.day === day.day ? 'primary' : 'outline'}
              onClick={() => setActiveDay(d.day)}
              className="min-w-[88px]"
            >
              Day {d.day}
            </Button>
          ))}
        </div>

        {/* Day header */}
        <div role="tabpanel" className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-lime/40 bg-lime-soft px-6 py-4">
            <h2 className="text-xl font-medium">
              Day {day.day}: {day.title}
            </h2>
            <p className="text-ink/80">Estimated Cost: {formatTaka(day.estimatedCost)}</p>
          </div>

          {/* Timeline */}
          <ol className="relative ml-4 mt-6 border-l-2 border-gray-200 sm:ml-4">
            {day.items.map((item, i) => (
              <li key={`${item.time}-${i}`} className="relative pb-6 pl-8 last:pb-0">
                <span className="absolute -left-[8px] top-10 h-3.5 w-3.5 rounded-full bg-lime" aria-hidden="true" />
                <p className="mb-2 text-sm font-semibold text-ink/70">{formatTime(item.time)}</p>
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-5">
                  <div className="flex-1">
                    <h3 className="text-xl font-medium">{item.title}</h3>
                    <p className="mt-1 text-body">
                      {item.detail}
                      {item.why && ` · Why: ${item.why}`}
                    </p>
                    {item.leg && (
                      <p className="mt-1 text-sm text-body">
                        Getting there: {item.leg.label} · about {formatMinutes(item.leg.durationMinutes)} · ≈{' '}
                        {formatTaka(item.leg.fare)} for {plural(trip.travelers, 'traveler')}
                      </p>
                    )}
                  </div>
                  {item.imageKey && (
                    <TripImage group={item.imageGroup} imageKey={item.imageKey} alt={item.title} className="hidden h-16 w-24 shrink-0 rounded-xl text-[0px] sm:flex" />
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-4">
          <Button variant="outline" onClick={adjustPlan}>Adjust Plan</Button>
          {saveError && <p className="w-full text-right text-sm font-medium text-red-600" role="alert">{saveError}</p>}
          <Button onClick={handleSave} disabled={saved || saving}>{saved ? 'Saved' : saving ? 'Saving…' : 'Save Trip'}</Button>
        </div>
      </div>
    </PageLayout>
  );
}
