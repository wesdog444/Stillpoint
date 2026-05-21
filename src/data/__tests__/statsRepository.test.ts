import { initDatabase } from '../database';
import { insertSession, completeSession } from '../sessionRepository';
import { getWeeklyFocusMinutes } from '../statsRepository';
import { todayKey, previousDayKey } from '../../lib/dates';

const opSqlite = require('@op-engineering/op-sqlite');

/** Inserts an already-completed session on the given day. */
function seedCompletedSession(dayKey: string, minutes: number): void {
  const id = insertSession({
    startedAt: `${dayKey}T09:00:00`,
    durationPlanned: minutes,
    presetId: null,
  });
  completeSession(id, `${dayKey}T10:00:00`);
}

describe('statsRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('returns exactly 7 days, oldest first, today last', () => {
    const week = getWeeklyFocusMinutes();
    expect(week).toHaveLength(7);
    expect(week[6].dayKey).toBe(todayKey());
    expect(week[5].dayKey).toBe(previousDayKey(todayKey()));
  });

  it('every day is zero on a fresh database', () => {
    expect(getWeeklyFocusMinutes().every((d) => d.minutes === 0)).toBe(true);
  });

  it('sums completed-session minutes into the right day', () => {
    seedCompletedSession(todayKey(), 25);
    seedCompletedSession(todayKey(), 15);
    seedCompletedSession(previousDayKey(todayKey()), 30);
    const week = getWeeklyFocusMinutes();
    expect(week[6].minutes).toBe(40);
    expect(week[5].minutes).toBe(30);
  });

  it('ignores incomplete sessions', () => {
    insertSession({ startedAt: `${todayKey()}T09:00:00`, durationPlanned: 50, presetId: null });
    expect(getWeeklyFocusMinutes()[6].minutes).toBe(0);
  });

  it('each day carries a 3-letter weekday label', () => {
    for (const day of getWeeklyFocusMinutes()) {
      expect(day.weekday).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
    }
  });
});
