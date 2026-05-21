import { dateKey, todayKey, previousDayKey, localTimestamp } from '../dates';

describe('dates', () => {
  it('dateKey formats a Date as YYYY-MM-DD in local time', () => {
    expect(dateKey(new Date(2026, 4, 9))).toBe('2026-05-09');
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('todayKey returns a YYYY-MM-DD string', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('previousDayKey returns the day before', () => {
    expect(previousDayKey('2026-05-20')).toBe('2026-05-19');
  });

  it('previousDayKey crosses month boundaries', () => {
    expect(previousDayKey('2026-05-01')).toBe('2026-04-30');
  });

  it('previousDayKey crosses year boundaries', () => {
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });

  it('localTimestamp produces a YYYY-MM-DDTHH:MM:SS string', () => {
    expect(localTimestamp(new Date(2026, 4, 9, 8, 5, 3))).toBe('2026-05-09T08:05:03');
  });

  it('localTimestamp date portion equals the local dateKey', () => {
    // This is the timezone guarantee: substr(ts,0,10) must be the LOCAL day,
    // so day-bucketed session queries agree with todayKey().
    const d = new Date();
    expect(localTimestamp(d).slice(0, 10)).toBe(dateKey(d));
  });
});
