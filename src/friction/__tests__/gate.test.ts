import { decideFrictionGate } from '../gate';
import type { ActiveSession } from '../../state/sessionStore';
import type { Preset } from '../../state/presetStore';

function active(overrides: Partial<ActiveSession> = {}): ActiveSession {
  return {
    sessionId: 7,
    durationMinutes: 25,
    presetId: 3,
    startedAt: '2026-05-20T12:00:00.000Z',
    remainingSeconds: 1200,
    status: 'running',
    ...overrides,
  };
}

function preset(overrides: Partial<Preset> = {}): Preset {
  return {
    id: 3,
    name: 'Deep Work',
    durationMinutes: 25,
    frictionMode: 'hard',
    ...overrides,
  };
}

describe('decideFrictionGate', () => {
  it('allows browser access when no session is active', () => {
    expect(decideFrictionGate(null, undefined)).toEqual({ kind: 'allow' });
  });

  it('allows browser access when the active session is complete', () => {
    expect(decideFrictionGate(active({ status: 'complete' }), preset())).toEqual({
      kind: 'allow',
    });
  });

  it('gates with the active preset friction mode during a running session', () => {
    expect(decideFrictionGate(active(), preset({ frictionMode: 'intention' }))).toEqual({
      kind: 'gate',
      mode: 'intention',
      sessionId: 7,
    });
  });

  it('falls back to soft mode if the running session has no preset match', () => {
    expect(decideFrictionGate(active(), undefined)).toEqual({
      kind: 'gate',
      mode: 'soft',
      sessionId: 7,
    });
  });
});
