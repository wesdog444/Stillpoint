import { getDatabase } from './database';
import { todayKey, previousDayKey } from '../lib/dates';

/**
 * Records that a completed session happened on the given 'YYYY-MM-DD' day,
 * incrementing that day's session count (creating the row if absent).
 */
export function recordSessionForDay(dayKey: string): void {
  getDatabase().execute(
    `INSERT INTO streak_days (date, session_count) VALUES (?, 1)
     ON CONFLICT(date) DO UPDATE SET session_count = session_count + 1`,
    [dayKey],
  );
}

/** True if the given day has at least one recorded session. */
function dayHasSession(dayKey: string): boolean {
  const result = getDatabase().execute(
    'SELECT session_count FROM streak_days WHERE date = ?',
    [dayKey],
  );
  const row = result.rows[0] as { session_count: number } | undefined;
  return (row?.session_count ?? 0) > 0;
}

/** Consecutive-day streak ending today. 0 if today has no session. */
export function getCurrentStreak(): number {
  let streak = 0;
  let key = todayKey();
  while (dayHasSession(key)) {
    streak += 1;
    key = previousDayKey(key);
  }
  return streak;
}

/** Longest consecutive-day run anywhere in the streak history. */
export function getLongestStreak(): number {
  const result = getDatabase().execute(
    'SELECT date FROM streak_days WHERE session_count > 0 ORDER BY date',
  );
  const dates = (result.rows as { date: string }[]).map((r) => r.date);

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    if (previous !== null && previousDayKey(date) === previous) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }
  return longest;
}
