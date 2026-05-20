import { CREATE_TABLE_SQL, TABLE_NAMES } from '../schema';

describe('schema', () => {
  it('lists all seven tables', () => {
    expect(TABLE_NAMES).toEqual([
      'sessions',
      'presets',
      'blocklists',
      'blocklist_sites',
      'intentions',
      'streak_days',
      'cheat_passes',
    ]);
  });

  it('provides a CREATE statement for every table', () => {
    for (const name of TABLE_NAMES) {
      expect(CREATE_TABLE_SQL[name]).toContain(`CREATE TABLE IF NOT EXISTS ${name}`);
    }
  });

  it('sessions table has the expected columns', () => {
    const sql = CREATE_TABLE_SQL.sessions;
    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
    expect(sql).toContain('started_at');
    expect(sql).toContain('ended_at');
    expect(sql).toContain('duration_planned');
    expect(sql).toContain('preset_id');
    expect(sql).toContain('completed');
  });

  it('streak_days enforces a unique date', () => {
    expect(CREATE_TABLE_SQL.streak_days).toContain('date TEXT UNIQUE NOT NULL');
  });
});
