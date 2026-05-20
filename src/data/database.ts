import { open } from '@op-engineering/op-sqlite';
import { runMigrations, type MigratableDb } from './migrations';

/**
 * Synchronous database facade.
 * Every consumer calls `.execute()` and gets back a plain object — no await needed.
 */
export type AppDB = {
  execute(sql: string, params?: unknown[]): { rows: any[]; insertId?: number; rowsAffected?: number };
};

let db: AppDB | null = null;

/** Opens the on-device database and applies pending migrations. Call once at startup. */
export function initDatabase(): void {
  const raw = open({ name: 'stillpoint.db' });
  const facade: AppDB = {
    execute(sql, params) {
      return raw.executeSync(sql, (params ?? []) as any);
    },
  };
  db = facade;
  runMigrations(facade as MigratableDb);
}

/** Returns the open database facade. Throws if `initDatabase` has not run. */
export function getDatabase(): AppDB {
  if (!db) {
    throw new Error('Database not initialized — call initDatabase() first.');
  }
  return db;
}
