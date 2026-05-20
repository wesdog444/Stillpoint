import { initDatabase } from '../database';
import { getCheatPassStatus, useCheatPass } from '../cheatPassRepository';

jest.mock('@op-engineering/op-sqlite');

describe('cheatPassRepository', () => {
  beforeEach(() => {
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
  });

  it('starts a site with all passes remaining', () => {
    expect(getCheatPassStatus('2026-05-20', 'youtube')).toEqual({
      date: '2026-05-20',
      siteKey: 'youtube',
      usedCount: 0,
      remainingCount: 3,
      limit: 3,
    });
  });

  it('records pass usage per site and day', () => {
    expect(useCheatPass('2026-05-20', 'youtube')).toBe(true);
    expect(useCheatPass('2026-05-20', 'youtube')).toBe(true);

    expect(getCheatPassStatus('2026-05-20', 'youtube')).toMatchObject({
      usedCount: 2,
      remainingCount: 1,
    });
    expect(getCheatPassStatus('2026-05-20', 'instagram')).toMatchObject({
      usedCount: 0,
      remainingCount: 3,
    });
  });

  it('refuses usage when the daily site limit is exhausted', () => {
    expect(useCheatPass('2026-05-20', 'tiktok', 2)).toBe(true);
    expect(useCheatPass('2026-05-20', 'tiktok', 2)).toBe(true);
    expect(useCheatPass('2026-05-20', 'tiktok', 2)).toBe(false);

    expect(getCheatPassStatus('2026-05-20', 'tiktok', 2)).toEqual({
      date: '2026-05-20',
      siteKey: 'tiktok',
      usedCount: 2,
      remainingCount: 0,
      limit: 2,
    });
  });
});
