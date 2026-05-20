import { MIGRATIONS, runMigrations } from '../migrations';

type FakeDb = {
  execute: (sql: string, params?: unknown[]) => { rows: any[] };
};

function makeFakeDb(startVersion = 0): { db: FakeDb; executed: string[] } {
  let version = startVersion;
  const executed: string[] = [];
  const db: FakeDb = {
    execute: (sql: string) => {
      executed.push(sql);
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith('PRAGMA USER_VERSION =')) {
        version = Number(upper.split('=')[1].trim());
        return { rows: [] };
      }
      if (upper === 'PRAGMA USER_VERSION') {
        return { rows: [{ user_version: version }] };
      }
      return { rows: [] };
    },
  };
  return { db, executed };
}

describe('migrations', () => {
  it('migration 1 creates all seven tables', () => {
    const m1 = MIGRATIONS.find((m) => m.version === 1);
    expect(m1).toBeDefined();
    expect(m1!.statements.length).toBe(7);
  });

  it('runs every migration on a fresh database', () => {
    const { db, executed } = makeFakeDb(0);
    runMigrations(db as any);
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS sessions'))).toBe(true);
    expect(executed.some((s) => s.toUpperCase().startsWith('PRAGMA USER_VERSION ='))).toBe(true);
  });

  it('skips migrations already applied', () => {
    const latest = Math.max(...MIGRATIONS.map((m) => m.version));
    const { db, executed } = makeFakeDb(latest);
    runMigrations(db as any);
    expect(executed.some((s) => s.includes('CREATE TABLE'))).toBe(false);
  });

  it('sets user_version to the latest migration version', () => {
    const { db, executed } = makeFakeDb(0);
    runMigrations(db as any);
    const latest = Math.max(...MIGRATIONS.map((m) => m.version));
    expect(executed).toContain(`PRAGMA user_version = ${latest}`);
  });
});
