import type { ActiveSession } from '../state/sessionStore';
import type { FrictionMode, Preset } from '../state/presetStore';

export type FrictionDecision =
  | { kind: 'allow' }
  | { kind: 'gate'; mode: FrictionMode; sessionId: number };

/**
 * Stillpoint gates only during running focus sessions. Missing preset data
 * falls back to soft mode so the browser remains intentionally slowed down.
 */
export function decideFrictionGate(
  activeSession: ActiveSession | null,
  preset: Preset | undefined,
): FrictionDecision {
  if (!activeSession || activeSession.status !== 'running') {
    return { kind: 'allow' };
  }

  return {
    kind: 'gate',
    mode: preset?.frictionMode ?? 'soft',
    sessionId: activeSession.sessionId,
  };
}
