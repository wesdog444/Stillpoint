import { open } from '@op-engineering/op-sqlite';
import { runMigrations, type MigratableDb } from './migrations';

type DB = ReturnType<typeof open>;

let db: DB | null = null;

/** Opens the on-device database and applies pending migrations. Call once at startup. */
export function initDatabase(): void {
  db = open({ name: 'stillpoint.db' });
  runMigrations(db as unknown as MigratableDb);
}

/** Returns the open database handle. Throws if `initDatabase` has not run. */
export function getDatabase(): DB {
  if (!db) {
    throw new Error('Database not initialized — call initDatabase() first.');
  }
  return db;
}
