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

/** The 'YYYY-MM-DD' key for the day before the given key. */
export function previousDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}
