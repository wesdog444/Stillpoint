import { CREATE_TABLE_SQL, TABLE_NAMES } from './schema';

export type Migration = {
  version: number;
  statements: string[];
};

/** Ordered list of migrations. Append new ones with the next version number. */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: TABLE_NAMES.map((name) => CREATE_TABLE_SQL[name]),
  },
];

/** Minimal interface a database must satisfy for the runner. */
export type MigratableDb = {
  execute: (sql: string, params?: unknown[]) => { rows: any[] };
};

/**
 * Applies every migration whose version is greater than the database's
 * current `user_version`, in ascending order, then advances `user_version`.
 */
export function runMigrations(db: MigratableDb): void {
  const result = db.execute('PRAGMA user_version');
  const current = Number(result.rows[0]?.user_version ?? 0);

  const pending = MIGRATIONS
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    for (const statement of migration.statements) {
      db.execute(statement);
    }
  }

  const latest = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), current);
  if (latest > current) {
    db.execute(`PRAGMA user_version = ${latest}`);
  }
}
