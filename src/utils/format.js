/**
 * Small formatting helpers used across the app.
 */

/** 14200 → "৳14,200" */
export function formatTaka(amount) {
  return `৳${Math.round(amount || 0).toLocaleString('en-US')}`;
}

/** Turns a user's ranked interests into "Beach & Nature" style text. */
export function joinWithAnd(words) {
  if (words.length <= 1) return words.join('');
  return `${words.slice(0, -1).join(', ')} & ${words[words.length - 1]}`;
}

/** 4 → "4 Days", 1 → "1 Day" */
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/** "4 Days, 3 Nights" */
export function formatDuration(days, nights) {
  return `${plural(days, 'Day')}, ${plural(nights, 'Night')}`;
}

/** 545 → "9 h 5 min", 45 → "45 min", 120 → "2 h" */
export function formatMinutes(minutes) {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Minutes since midnight → "1:30 PM" */
export function formatTime(minutes) {
  const total = Math.round(minutes) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}
