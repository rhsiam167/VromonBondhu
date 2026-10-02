import { useParams } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import StatCard from '../components/StatCard';
import TripImage from '../components/TripImage';
import TripNotFound from '../components/TripNotFound';
import { ACCOMMODATION_TIERS, labelFor } from '../data/planningOptions';
import useTrip from '../hooks/useTrip';
import { formatDuration, formatMinutes, formatTaka, plural } from '../utils/format';
import { tripPath } from '../utils/tripLinks';
import { FLEXIBLE_LIMIT } from '../services/costConfig';

/**
 * GENERATED TRIP OVERVIEW
 * All trip content comes from the trip object made by services/tripGenerator.js.
 */
export default function TripOverviewPage() {
  const { tripId } = useParams();
  const { trip, loading, saved, saving, saveError, handleSave } = useTrip(tripId);
  if (loading) return <PageLayout />;
  if (!trip) return <TripNotFound />;

  const { budget } = trip;
  // Strict plans are always within budget. Only a flexible plan can go over (within its limit).
  const overBudget = budget.mode === 'flexible' && budget.difference < 0;
  const reasons = [...trip.reasons, ...(trip.adjustmentsMade || [])];

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-8 sm:pt-16">
        {/* ---------- Hero ---------- */}
        <section className="relative h-64 overflow-hidden rounded-3xl sm:h-72">
          <TripImage group="destinations" imageKey={trip.destinationImageKey} alt={trip.destinationName} className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
          <div className="absolute bottom-0 left-0 p-6 sm:p-8">
            <span className="rounded-full bg-lime px-3 py-1 text-xs font-semibold">Trip Ready</span>
            <h1 className="mt-3 text-4xl font-bold text-white sm:text-6xl">{trip.title}</h1>
            <p className="mt-2 text-white/90">
              {formatDuration(trip.days, trip.nights)} · {plural(trip.travelers, 'Traveler')} · {trip.focusLabel}
            </p>
          </div>
        </section>

        {/* ---------- Stats ---------- */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard value={formatTaka(budget.estimatedCost)} label="Estimated Total Cost" />
          <StatCard
            value={formatTaka(overBudget ? -budget.difference : Math.max(0, budget.difference))}
            label={overBudget ? 'Over Budget' : 'Under Budget'}
            highlight={!overBudget}
          />
          <StatCard value={trip.activityCount} label="Planned Activities" />
          <StatCard value={trip.stays.length} label="Recommended Stays" />
        </section>
        <div className="mt-3 space-y-1 text-sm text-body">
          {overBudget && (
            <p>
              This plan is {formatTaka(budget.overage)} ({budget.overagePercent}%) over your budget, within your flexible
              limit of {Math.round(FLEXIBLE_LIMIT * 100)}%.
            </p>
          )}
          <p>Costs are estimates based on sample data, not live prices.</p>
        </div>

        {/* ---------- Why ---------- */}
        <Card className="mt-6">
          <h2 className="text-xl font-semibold">Why We Planned It This Way</h2>
          <ul className="mt-4 space-y-3">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-3 text-body">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-lime" />
                {reason}
              </li>
            ))}
          </ul>
        </Card>

        {/* ---------- Transportation ---------- */}
        <TransportationSummary transport={trip.transport} travelers={trip.travelers} />

        {/* ---------- Stays ---------- */}
        <h2 className="mb-5 mt-10 text-2xl font-semibold">Recommended Stays</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trip.stays.map((stay) => (
            <PlaceCard
              key={stay.id}
              group="stays"
              imageKey={stay.imageKey}
              name={stay.name}
              meta={`${labelFor(ACCOMMODATION_TIERS, stay.priceTier)} · ${stay.highlight} · ${formatTaka(stay.pricePerNight)}/night`}
            />
          ))}
        </div>

        {/* ---------- Food ---------- */}
        <h2 className="mb-5 mt-10 text-2xl font-semibold">Recommended Food &amp; Restaurants</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trip.restaurants.map((r) => (
            <PlaceCard key={r.id} group="food" imageKey={r.imageKey} name={r.name} meta={`${r.cuisine} · ${r.highlight}`} />
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-end gap-4">
          {saveError && <p className="w-full text-right text-sm font-medium text-red-600" role="alert">{saveError}</p>}
          <Button variant="outline" onClick={handleSave} disabled={saved || saving}>
            {saved ? 'Saved' : saving ? 'Saving…' : 'Save Trip'}
          </Button>
          <Button to={tripPath(trip, 'itinerary')}>View Day-by-Day Itinerary</Button>
        </div>
      </div>
    </PageLayout>
  );
}

/** "Transportation Summary" card — every number comes from trip.transport. */
function TransportationSummary({ transport, travelers }) {
  const journeyText = (j) =>
    `about ${formatMinutes(j.durationMinutes)} · ${formatTaka(j.farePerPerson)} per person · ${formatTaka(j.groupFare)} for ${plural(travelers, 'traveler')}`;
  const { local } = transport;
  const localText = local.modes
    .map((m) => (m.farePerRide ? `${m.label} (typically ${formatTaka(m.farePerRide)} per ride)` : m.label))
    .join(', ');

  return (
    <>
      <Card className="mt-6">
        <h2 className="text-xl font-semibold">Transportation Summary</h2>
        <dl className="mt-4 divide-y divide-gray-100">
          <TransportRow label="Getting There">
            <ModeName leg={transport.outbound} /> · {journeyText(transport.outbound)}
          </TransportRow>
          <TransportRow label="Getting Back">
            <ModeName leg={transport.return} /> · {journeyText(transport.return)}
          </TransportRow>
          <TransportRow label="Getting Around">
            {localText || 'No local travel needed'} · {formatTaka(local.totalFare)} estimated for the trip
            {local.note && <span className="mt-1 block text-sm text-body">{local.note}</span>}
          </TransportRow>
        </dl>

        {transport.alternatives.length > 0 && (
          <div className="mt-5 rounded-xl bg-field px-4 py-3">
            <h3 className="text-sm font-semibold">Other Options for This Route</h3>
            <ul className="mt-2 space-y-1 text-sm text-body">
              {transport.alternatives.map((alt) => (
                <li key={alt.mode}>
                  <span className="font-medium text-ink">{alt.label}</span> · about {formatMinutes(alt.durationMinutes)} ·{' '}
                  {formatTaka(alt.farePerPerson)} per person
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <p className="mt-3 text-sm text-body">Fares are sample estimates, not live prices.</p>
    </>
  );
}

function TransportRow({ label, children }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="font-medium">{label}</dt>
      <dd className="text-body">{children}</dd>
    </div>
  );
}

/**
 * leg.selected: true/false = the user did/didn't select this mode; null = no intercity mode was selected.
 * A mode outside the user's selection is only used as a last resort (see adjustmentsMade), so it gets a
 * gray tag instead of the lime "Recommended" one.
 */
function ModeName({ leg }) {
  return (
    <>
      <span className="font-medium text-ink">{leg.label}</span>
      {leg.selected === false ? (
        <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
          Not in your selected preferences
        </span>
      ) : (
        <span className="ml-2 rounded-full bg-lime px-2 py-0.5 text-xs font-semibold text-ink">Recommended</span>
      )}
    </>
  );
}

function PlaceCard({ group, imageKey, name, meta }) {
  return (
    <Card padding="p-0" className="overflow-hidden">
      <TripImage group={group} imageKey={imageKey} alt={name} className="h-52 w-full" />
      <div className="px-4 py-4">
        <h3 className="text-xl font-medium">{name}</h3>
        <p className="mt-1 text-sm text-body">{meta}</p>
      </div>
    </Card>
  );
}
