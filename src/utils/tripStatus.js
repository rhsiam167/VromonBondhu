/**
 * A saved trip is "completed" when the user marked it completed (trip.completed,
 * stored by the backend) or once its last day is in the past.
 * Trips without a start date stay upcoming until they are marked completed.
 */
export function getTripStatus(trip) {
  if (trip.completed) return 'completed';
  if (!trip.startDate) return 'upcoming';
  const lastDay = new Date(trip.startDate);
  lastDay.setDate(lastDay.getDate() + trip.days - 1);
  lastDay.setHours(23, 59, 59);
  return lastDay < new Date() ? 'completed' : 'upcoming';
}
