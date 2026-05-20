import { initDatabase, getDatabase } from '../database';

// op-sqlite is mocked in jest.setup.ts
const opSqlite = require('@op-engineering/op-sqlite');

describe('database', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    (opSqlite.open as jest.Mock).mockClear();
  });

  it('opens a database named "stillpoint"', () => {
    initDatabase();
    expect(opSqlite.open).toHaveBeenCalledWith({ name: 'stillpoint.db' });
  });

  it('runs migrations on init (creates the sessions table)', () => {
    initDatabase();
    const ran = opSqlite.__executed.some((e: any) =>
      e.sql.includes('CREATE TABLE IF NOT EXISTS sessions'),
    );
    expect(ran).toBe(true);
  });

  it('getDatabase returns the open handle after init', () => {
    initDatabase();
    expect(getDatabase()).toBeDefined();
  });

  it('getDatabase throws if called before init', () => {
    jest.resetModules();
    const fresh = require('../database');
    expect(() => fresh.getDatabase()).toThrow(/not initialized/i);
  });
});
