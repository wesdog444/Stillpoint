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

// --- op-sqlite mock: records executed SQL, returns empty rowsets ---
jest.mock('@op-engineering/op-sqlite', () => {
  const executed: { sql: string; params: unknown[] }[] = [];
  let userVersion = 0;
  const makeDb = () => ({
    execute: (sql: string, params: unknown[] = []) => {
      executed.push({ sql, params });
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('PRAGMA USER_VERSION =')) {
        userVersion = Number(trimmed.split('=')[1].trim());
        return { rows: [] };
      }
      if (trimmed === 'PRAGMA USER_VERSION') {
        return { rows: [{ user_version: userVersion }] };
      }
      return { rows: [] };
    },
    close: () => undefined,
  });
  return {
    open: jest.fn(() => makeDb()),
    __executed: executed,
    __resetMock: () => {
      executed.length = 0;
      userVersion = 0;
    },
  };
});
