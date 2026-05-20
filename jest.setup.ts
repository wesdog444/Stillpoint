import '@testing-library/jest-native/extend-expect';

// --- react-native-mmkv mock: in-memory key-value store ---
jest.mock('react-native-mmkv', () => {
  class MMKVInstance {
    private store = new Map<string, string | number | boolean>();
    set(key: string, value: string | number | boolean) {
      this.store.set(key, value);
    }
    getString(key: string): string | undefined {
      const v = this.store.get(key);
      return typeof v === 'string' ? v : undefined;
    }
    getBoolean(key: string): boolean | undefined {
      const v = this.store.get(key);
      return typeof v === 'boolean' ? v : undefined;
    }
    getNumber(key: string): number | undefined {
      const v = this.store.get(key);
      return typeof v === 'number' ? v : undefined;
    }
    contains(key: string): boolean {
      return this.store.has(key);
    }
    delete(key: string) {
      this.store.delete(key);
    }
    clearAll() {
      this.store.clear();
    }
  }
  return { createMMKV: () => new MMKVInstance() };
});

// --- op-sqlite mock: delegates to an in-memory better-sqlite3 database ---
jest.mock('@op-engineering/op-sqlite', () => {
  const Database = require('better-sqlite3');
  // `realDb` is loosely typed: this is test glue and better-sqlite3's
  // class/namespace merge makes a precise type import fragile.
  let realDb: any = null;
  const executed: { sql: string; params: unknown[] }[] = [];

  const ensureDb = () => {
    if (!realDb) realDb = new Database(':memory:');
    return realDb;
  };

  const execute = (sql: string, params: unknown[] = []) => {
    executed.push({ sql, params });
    const db = ensureDb();
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('PRAGMA')) {
      const setMatch = trimmed.match(/PRAGMA\s+(\w+)\s*=\s*(.+?);?$/i);
      if (setMatch) {
        db.pragma(`${setMatch[1]} = ${setMatch[2]}`);
        return { rows: [], rowsAffected: 0 };
      }
      const name = trimmed.replace(/^PRAGMA\s+/i, '').replace(/;$/, '').trim();
      return { rows: db.pragma(name, { simple: false }) as any[], rowsAffected: 0 };
    }

    const stmt = db.prepare(trimmed);
    if (stmt.reader) {
      return { rows: stmt.all(...params) as any[], rowsAffected: 0 };
    }
    const info = stmt.run(...params);
    return {
      rows: [] as any[],
      rowsAffected: info.changes,
      insertId: Number(info.lastInsertRowid),
    };
  };

  return {
    open: jest.fn(() => ({ execute, close: () => undefined })),
    __executed: executed,
    __resetMock: () => {
      executed.length = 0;
      if (realDb) {
        realDb.close();
        realDb = null;
      }
    },
  };
});
