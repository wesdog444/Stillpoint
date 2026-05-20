import { useSessionStore } from '../sessionStore';

describe('sessionStore (skeleton)', () => {
  beforeEach(() => {
    useSessionStore.setState({ activeSession: null });
  });

  it('has no active session initially', () => {
    expect(useSessionStore.getState().activeSession).toBeNull();
  });

  it('startSession sets an active session with the given duration', () => {
    useSessionStore.getState().startSession({ durationMinutes: 30, presetId: null });
    const active = useSessionStore.getState().activeSession;
    expect(active).not.toBeNull();
    expect(active!.durationMinutes).toBe(30);
    expect(active!.presetId).toBeNull();
  });

  it('endSession clears the active session', () => {
    useSessionStore.getState().startSession({ durationMinutes: 30, presetId: null });
    useSessionStore.getState().endSession();
    expect(useSessionStore.getState().activeSession).toBeNull();
  });
});
