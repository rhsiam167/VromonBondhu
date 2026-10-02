import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import TripImage from './TripImage';
import { formatDuration, formatTaka, plural } from '../utils/format';
import { tripPath } from '../utils/tripLinks';
import { getTripStatus } from '../utils/tripStatus';

/** Status pill: lime for Upcoming, gray for Completed. */
export function StatusBadge({ status }) {
  return status === 'upcoming' ? (
    <span className="rounded-full bg-lime px-3 py-1 text-xs font-semibold">Upcoming</span>
  ) : (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs text-body">Completed</span>
  );
}

/** "4 Days, 3 Nights · 2 Travelers · ৳14,200 estimated" */
export function tripSummary(trip) {
  return `${formatDuration(trip.days, trip.nights)} · ${plural(trip.travelers, 'Traveler')} · ${formatTaka(trip.budget.estimatedCost)} estimated`;
}

/**
 * One trip as a wide row card (My Trips list).
 * onSave – when given (planned trips), shows a "Save Trip" button
 * onComplete – when given (saved trips), shows "Mark as Completed" on an upcoming trip,
 *              or "Mark as Upcoming" on a trip the user marked completed; called as onComplete(trip, completed)
 * onDelete – when given, shows a "Delete" button
 */
export default function TripListItem({ trip, onDelete, onSave, onComplete }) {
  const [busy, setBusy] = useState(false);
  const status = getTripStatus(trip);

  async function run(action) {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card padding="p-5 sm:p-10" className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <TripImage group="destinations" imageKey={trip.destinationImageKey} alt={trip.destinationName} className="h-40 w-full shrink-0 rounded-xl sm:h-36 sm:w-48" />
      <div className="flex-1">
        {trip.saved === false ? (
          <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs text-body">Planned · not saved</span>
        ) : (
          <StatusBadge status={status} />
        )}
        <h3 className="mt-2 text-2xl font-medium">{trip.title}</h3>
        <p className="mt-2 text-body">{tripSummary(trip)}</p>
      </div>
      <div className="flex items-center gap-5 self-start sm:flex-col sm:items-end sm:self-center">
        {onSave && (
          <Button size="sm" onClick={() => run(() => onSave(trip))} disabled={busy}>
            {busy ? 'Saving…' : 'Save Trip'}
          </Button>
        )}
        {onComplete && status === 'upcoming' && (
          <Button size="sm" onClick={() => run(() => onComplete(trip, true))} disabled={busy}>
            {busy ? 'Updating…' : 'Mark as Completed'}
          </Button>
        )}
        {onComplete && trip.completed && (
          <Button variant="text" size="sm" onClick={() => run(() => onComplete(trip, false))} disabled={busy} className="!text-body">
            {busy ? 'Updating…' : 'Mark as Upcoming'}
          </Button>
        )}
        <Button variant="text" to={tripPath(trip, 'itinerary')} className="!text-ink">
          View Itinerary
        </Button>
        {onDelete && (
          <Button variant="text" size="sm" onClick={() => onDelete(trip)} className="!text-body hover:!text-red-600">
            Delete
          </Button>
        )}
      </div>
    </Card>
  );
}
