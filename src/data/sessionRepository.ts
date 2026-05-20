import { getDatabase } from './database';

export type SessionRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_planned: number;
  preset_id: number | null;
  completed: number;
};

/** Inserts a new, incomplete session. Returns the new row id. */
export function insertSession(args: {
  startedAt: string;
  durationPlanned: number;
  presetId: number | null;
}): number {
  const result = getDatabase().execute(
    'INSERT INTO sessions (started_at, duration_planned, preset_id, completed) VALUES (?, ?, ?, 0)',
    [args.startedAt, args.durationPlanned, args.presetId],
  );
  return Number((result as { insertId?: number }).insertId);
}

/** Marks a session complete and records its end time. */
export function completeSession(id: number, endedAt: string): void {
  getDatabase().execute(
    'UPDATE sessions SET ended_at = ?, completed = 1 WHERE id = ?',
    [endedAt, id],
  );
}

/** All sessions whose `started_at` falls on the given 'YYYY-MM-DD' day, oldest first. */
export function getSessionsForDay(dayKey: string): SessionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM sessions WHERE substr(started_at, 1, 10) = ? ORDER BY started_at',
    [dayKey],
  );
  return result.rows as SessionRow[];
}

/** The most recent sessions, newest first, capped at `limit`. */
export function getRecentSessions(limit: number): SessionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?',
    [limit],
  );
  return result.rows as SessionRow[];
}

/** Total planned minutes from completed sessions that started on the given day. */
export function getCompletedFocusMinutesForDay(dayKey: string): number {
  const result = getDatabase().execute(
    `SELECT COALESCE(SUM(duration_planned), 0) AS total
     FROM sessions
     WHERE completed = 1 AND substr(started_at, 1, 10) = ?`,
    [dayKey],
  );
  const row = result.rows[0] as { total: number | null } | undefined;
  return Number(row?.total ?? 0);
}
