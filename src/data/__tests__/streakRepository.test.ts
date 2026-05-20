import { initDatabase } from '../database';
import {
  recordSessionForDay,
  getCurrentStreak,
  getLongestStreak,
} from '../streakRepository';
import { todayKey, previousDayKey } from '../../lib/dates';

const opSqlite = require('@op-engineering/op-sqlite');

describe('streakRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('current streak is 0 on a fresh database', () => {
    expect(getCurrentStreak()).toBe(0);
  });

  it('recording a session today makes the current streak 1', () => {
    recordSessionForDay(todayKey());
    expect(getCurrentStreak()).toBe(1);
  });

  it('recording the same day twice keeps the streak at 1 day', () => {
    recordSessionForDay(todayKey());
    recordSessionForDay(todayKey());
    expect(getCurrentStreak()).toBe(1);
  });

  it('consecutive days build the current streak', () => {
    const today = todayKey();
    const yesterday = previousDayKey(today);
    const dayBefore = previousDayKey(yesterday);
    recordSessionForDay(dayBefore);
    recordSessionForDay(yesterday);
    recordSessionForDay(today);
    expect(getCurrentStreak()).toBe(3);
  });

  it('current streak is 0 when today has no session even if past days do', () => {
    recordSessionForDay(previousDayKey(todayKey()));
    expect(getCurrentStreak()).toBe(0);
  });

  it('getLongestStreak finds the longest consecutive run', () => {
    // A 2-day run, a gap, then a 3-day run ending today.
    const today = todayKey();
    const d1 = previousDayKey(today);
    const d2 = previousDayKey(d1);
    const d3 = previousDayKey(d2); // gap day - not recorded
    const d4 = previousDayKey(d3);
    const d5 = previousDayKey(d4);
    recordSessionForDay(today);
    recordSessionForDay(d1);
    recordSessionForDay(d2);
    recordSessionForDay(d4);
    recordSessionForDay(d5);
    expect(getLongestStreak()).toBe(3);
  });
});
