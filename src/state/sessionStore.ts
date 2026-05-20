import { create } from 'zustand';
import { insertSession, completeSession } from '../data/sessionRepository';
import { recordSessionForDay } from '../data/streakRepository';
import { todayKey } from '../lib/dates';

export type SessionStatus = 'running' | 'complete';

export type ActiveSession = {
  /** The persisted `sessions` row id. */
  sessionId: number;
  durationMinutes: number;
  presetId: number | null;
  startedAt: string;
  remainingSeconds: number;
  status: SessionStatus;
};

type StartArgs = {
  durationMinutes: number;
  presetId: number | null;
};

type SessionState = {
  activeSession: ActiveSession | null;
  startSession: (args: StartArgs) => void;
  tick: () => void;
  cancelSession: () => void;
  dismissComplete: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,

  startSession: ({ durationMinutes, presetId }: StartArgs) => {
    const startedAt = new Date().toISOString();
    const sessionId = insertSession({
      startedAt,
      durationPlanned: durationMinutes,
      presetId,
    });
    set({
      activeSession: {
        sessionId,
        durationMinutes,
        presetId,
        startedAt,
        remainingSeconds: durationMinutes * 60,
        status: 'running',
      },
    });
  },

  tick: () => {
    const active = get().activeSession;
    if (!active || active.status !== 'running') {
      return;
    }

    const remaining = active.remainingSeconds - 1;
    if (remaining > 0) {
      set({ activeSession: { ...active, remainingSeconds: remaining } });
      return;
    }

    completeSession(active.sessionId, new Date().toISOString());
    recordSessionForDay(todayKey());
    set({
      activeSession: { ...active, remainingSeconds: 0, status: 'complete' },
    });
  },

  cancelSession: () => {
    set({ activeSession: null });
  },

  dismissComplete: () => {
    set({ activeSession: null });
  },
}));
