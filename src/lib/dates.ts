/** Formats a Date as a 'YYYY-MM-DD' key in local time. */
export function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's 'YYYY-MM-DD' key in local time. */
export function todayKey(): string {
  return dateKey(new Date());
}

/**
 * Formats a Date as a local 'YYYY-MM-DDTHH:MM:SS' timestamp.
 * Unlike `Date.toISOString()` (which is UTC), the date portion of this string
 * is the LOCAL calendar day, so `substr(ts, 1, 10)` matches `todayKey()`.
 * Session rows store this so day-bucketed queries stay timezone-consistent.
 */
export function localTimestamp(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${dateKey(d)}T${hours}:${minutes}:${seconds}`;
}

/** The 'YYYY-MM-DD' key for the day before the given key. */
export function previousDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}
