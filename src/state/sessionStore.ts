import { create } from 'zustand';

export type ActiveSession = {
  durationMinutes: number;
  presetId: number | null;
  startedAt: string;
};

type StartArgs = {
  durationMinutes: number;
  presetId: number | null;
};

type SessionState = {
  activeSession: ActiveSession | null;
  startSession: (args: StartArgs) => void;
  endSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,

  startSession: ({ durationMinutes, presetId }: StartArgs) => {
    set({
      activeSession: {
        durationMinutes,
        presetId,
        startedAt: new Date().toISOString(),
      },
    });
  },

  endSession: () => {
    set({ activeSession: null });
  },
}));
