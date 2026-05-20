import { initDatabase } from '../../data/database';
import { useSessionStore } from '../sessionStore';
import { getRecentSessions } from '../../data/sessionRepository';
import { getCurrentStreak } from '../../data/streakRepository';

const opSqlite = require('@op-engineering/op-sqlite');

describe('sessionStore', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
    useSessionStore.setState({ activeSession: null });
  });

  it('has no active session initially', () => {
    expect(useSessionStore.getState().activeSession).toBeNull();
  });

  it('startSession creates a running session with full remaining time', () => {
    useSessionStore.getState().startSession({ durationMinutes: 30, presetId: null });
    const active = useSessionStore.getState().activeSession;
    expect(active).not.toBeNull();
    expect(active!.durationMinutes).toBe(30);
    expect(active!.remainingSeconds).toBe(30 * 60);
    expect(active!.status).toBe('running');
    expect(active!.sessionId).toBeGreaterThan(0);
  });

  it('startSession persists an incomplete session row', () => {
    useSessionStore.getState().startSession({ durationMinutes: 10, presetId: null });
    const rows = getRecentSessions(5);
    expect(rows).toHaveLength(1);
    expect(rows[0].completed).toBe(0);
    expect(rows[0].duration_planned).toBe(10);
  });

  it('tick decrements the remaining seconds', () => {
    useSessionStore.getState().startSession({ durationMinutes: 1, presetId: null });
    useSessionStore.getState().tick();
    expect(useSessionStore.getState().activeSession!.remainingSeconds).toBe(59);
  });

  it('tick to zero marks the session complete', () => {
    useSessionStore.getState().startSession({ durationMinutes: 1, presetId: null });
    for (let i = 0; i < 60; i += 1) {
      useSessionStore.getState().tick();
    }
    expect(useSessionStore.getState().activeSession!.status).toBe('complete');
    expect(useSessionStore.getState().activeSession!.remainingSeconds).toBe(0);
  });

  it('completing a session persists completion and records a streak day', () => {
    useSessionStore.getState().startSession({ durationMinutes: 1, presetId: null });
    for (let i = 0; i < 60; i += 1) {
      useSessionStore.getState().tick();
    }
    const rows = getRecentSessions(5);
    expect(rows[0].completed).toBe(1);
    expect(rows[0].ended_at).not.toBeNull();
    expect(getCurrentStreak()).toBe(1);
  });

  it('dismissComplete clears a completed session', () => {
    useSessionStore.getState().startSession({ durationMinutes: 1, presetId: null });
    for (let i = 0; i < 60; i += 1) {
      useSessionStore.getState().tick();
    }
    useSessionStore.getState().dismissComplete();
    expect(useSessionStore.getState().activeSession).toBeNull();
  });

  it('cancelSession ends the runtime session without marking the row complete', () => {
    useSessionStore.getState().startSession({ durationMinutes: 30, presetId: null });
    useSessionStore.getState().cancelSession();
    expect(useSessionStore.getState().activeSession).toBeNull();
    const rows = getRecentSessions(5);
    expect(rows[0].completed).toBe(0);
    expect(getCurrentStreak()).toBe(0);
  });

  it('tick does nothing when there is no active session', () => {
    expect(() => useSessionStore.getState().tick()).not.toThrow();
    expect(useSessionStore.getState().activeSession).toBeNull();
  });
});
