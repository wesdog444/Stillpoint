import { dateKey, todayKey, previousDayKey } from '../dates';

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
});
