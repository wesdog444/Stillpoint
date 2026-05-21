import { getDatabase } from './database';
import { todayKey, previousDayKey } from '../lib/dates';

export type DayFocus = {
  /** 'YYYY-MM-DD' local day key. */
  dayKey: string;
  /** 3-letter weekday label, e.g. 'Mon'. */
  weekday: string;
  /** Completed focus minutes on that day. */
  minutes: number;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
}

/**
 * Completed focus minutes for each of the last 7 local days.
 * Oldest first; index 6 is today.
 */
export function getWeeklyFocusMinutes(): DayFocus[] {
  const days: string[] = [];
  let key = todayKey();
  for (let i = 0; i < 7; i += 1) {
    days.unshift(key);
    key = previousDayKey(key);
  }

  const result = getDatabase().execute(
    `SELECT substr(started_at, 1, 10) AS day, COALESCE(SUM(duration_planned), 0) AS total
     FROM sessions
     WHERE completed = 1
     GROUP BY day`,
  );
  const byDay = new Map<string, number>();
  for (const row of result.rows as { day: string; total: number }[]) {
    byDay.set(row.day, Number(row.total));
  }

  return days.map((dayKey) => ({
    dayKey,
    weekday: weekdayLabel(dayKey),
    minutes: byDay.get(dayKey) ?? 0,
  }));
}
