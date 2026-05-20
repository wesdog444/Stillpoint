import { initDatabase } from '../database';
import {
  insertSession,
  completeSession,
  getSessionsForDay,
  getRecentSessions,
} from '../sessionRepository';

const opSqlite = require('@op-engineering/op-sqlite');

describe('sessionRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('insertSession returns the new row id and stores an incomplete session', () => {
    const id = insertSession({
      startedAt: '2026-05-20T09:00:00.000Z',
      durationPlanned: 30,
      presetId: null,
    });
    expect(id).toBeGreaterThan(0);
    const rows = getSessionsForDay('2026-05-20');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(id);
    expect(rows[0].duration_planned).toBe(30);
    expect(rows[0].preset_id).toBeNull();
    expect(rows[0].completed).toBe(0);
    expect(rows[0].ended_at).toBeNull();
  });

  it('completeSession marks the session complete and sets ended_at', () => {
    const id = insertSession({
      startedAt: '2026-05-20T09:00:00.000Z',
      durationPlanned: 30,
      presetId: null,
    });
    completeSession(id, '2026-05-20T09:30:00.000Z');
    const rows = getSessionsForDay('2026-05-20');
    expect(rows[0].completed).toBe(1);
    expect(rows[0].ended_at).toBe('2026-05-20T09:30:00.000Z');
  });

  it('getSessionsForDay only returns sessions started on that day', () => {
    insertSession({ startedAt: '2026-05-20T09:00:00.000Z', durationPlanned: 30, presetId: null });
    insertSession({ startedAt: '2026-05-21T09:00:00.000Z', durationPlanned: 30, presetId: null });
    expect(getSessionsForDay('2026-05-20')).toHaveLength(1);
    expect(getSessionsForDay('2026-05-21')).toHaveLength(1);
    expect(getSessionsForDay('2026-05-22')).toHaveLength(0);
  });

  it('getRecentSessions returns sessions newest-first, limited', () => {
    insertSession({ startedAt: '2026-05-20T08:00:00.000Z', durationPlanned: 10, presetId: null });
    insertSession({ startedAt: '2026-05-20T10:00:00.000Z', durationPlanned: 20, presetId: null });
    insertSession({ startedAt: '2026-05-20T09:00:00.000Z', durationPlanned: 15, presetId: null });
    const recent = getRecentSessions(2);
    expect(recent).toHaveLength(2);
    expect(recent[0].started_at).toBe('2026-05-20T10:00:00.000Z');
    expect(recent[1].started_at).toBe('2026-05-20T09:00:00.000Z');
  });
});
