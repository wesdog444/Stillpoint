# Friction Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate Stillpoint's sanitized browser during active focus sessions using the active preset's friction mode: hard, soft delay, intention check, or cheat pass.

**Architecture:** Keep persistence and decision logic pure/testable, then layer a React Native friction screen into the existing `SocialStack`. `SocialStack` decides whether a site tap opens the browser directly or navigates to `FrictionGate`; `FrictionGateScreen` handles the mode-specific bypass flow and returns to `Browser` only when the gate permits it.

**Tech Stack:** TypeScript, React Native, React Navigation native stack, Zustand stores already in the app, op-sqlite repositories, Jest + React Native Testing Library. UI work must invoke UI UX Pro Max first and follow its React Native guidance: typed navigation, `Pressable`, 44px+ touch targets, explicit accessibility labels, visible errors/recovery.

---

## Scope

This plan implements friction for Stillpoint's own in-app sanitized browser only. It does not attempt OS-level blocking and does not change native social apps.

In scope:
- Persist intention-check entries to the existing `intentions` table.
- Persist cheat-pass usage to the existing `cheat_passes` table.
- Decide whether a site open should be allowed or gated from the active focus session and active preset.
- Add the full-screen `FrictionGateScreen`.
- Wire Social card taps through the gate before opening `BrowserScreen`.

Out of scope:
- Blocks-tab management of which sites are gated.
- Always-gated site settings.
- Schedules, notifications, deep links, App Intents.
- Stats UI for intentions/cheat passes. The repositories added here make Plan 6 possible.

Default behavior for this plan:
- No running focus session: open the sanitized browser directly.
- Running focus session with a matching preset: use that preset's `frictionMode`.
- Running focus session with no preset or missing preset: use `soft` as the conservative fallback.
- Soft mode delay: 30 seconds in production, overrideable in tests.
- Cheat mode default: 3 passes per site per local day.

---

## Prerequisite Reading

- `AGENTS.md` for Expo SDK 54 and UI UX Pro Max workflow.
- `docs/superpowers/specs/2026-05-19-stillpoint-design.md` sections 5.6 and 6.1.
- `src/state/sessionStore.ts` for `ActiveSession`.
- `src/state/presetStore.ts` for `Preset` and `FrictionMode`.
- `src/nav/SocialStack.tsx` for the current Social -> Browser navigation.
- `src/screens/BrowserScreen.tsx` for the existing sanitized browser entry point.
- `src/data/schema.ts` for `intentions` and `cheat_passes`.

---

## File Structure

```
Stillpoint/
├── AGENTS.md                                      # MODIFIED: UI UX Pro Max workflow preference
├── docs/superpowers/plans/
│   └── 2026-05-20-friction-layer.md              # NEW: this plan
└── src/
    ├── data/
    │   ├── intentionRepository.ts                 # NEW: insert/read intention entries
    │   ├── cheatPassRepository.ts                 # NEW: daily cheat-pass usage
    │   └── __tests__/
    │       ├── intentionRepository.test.ts
    │       └── cheatPassRepository.test.ts
    ├── friction/
    │   ├── gate.ts                                # NEW: pure gate decision logic
    │   └── __tests__/gate.test.ts
    ├── screens/
    │   ├── FrictionGateScreen.tsx                 # NEW: hard/soft/intention/cheat UI
    │   └── __tests__/FrictionGateScreen.test.tsx
    └── nav/
        ├── SocialStack.tsx                        # MODIFIED: route through FrictionGate
        └── __tests__/SocialStack.test.tsx         # MODIFIED: gated navigation coverage
```

---

## Task 1: Intention Repository

**Files:**
- Create: `src/data/intentionRepository.ts`
- Test: `src/data/__tests__/intentionRepository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/intentionRepository.test.ts`:

```ts
import { initDatabase } from '../database';
import {
  insertIntention,
  getRecentIntentions,
  type IntentionRow,
} from '../intentionRepository';

jest.mock('@op-engineering/op-sqlite');

describe('intentionRepository', () => {
  beforeEach(() => {
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
  });

  it('inserts an intention row and returns its id', () => {
    const id = insertIntention({
      createdAt: '2026-05-20T12:00:00.000Z',
      text: 'I need to reply to one message',
      siteKey: 'instagram',
      sessionId: 42,
    });

    expect(id).toBeGreaterThan(0);
    const rows = getRecentIntentions();
    expect(rows[0]).toMatchObject<IntentionRow>({
      id,
      created_at: '2026-05-20T12:00:00.000Z',
      text: 'I need to reply to one message',
      site_key: 'instagram',
      session_id: 42,
    });
  });

  it('returns recent intentions newest first and honors the limit', () => {
    insertIntention({
      createdAt: '2026-05-20T10:00:00.000Z',
      text: 'First reason',
      siteKey: 'x',
      sessionId: 1,
    });
    insertIntention({
      createdAt: '2026-05-20T11:00:00.000Z',
      text: 'Second reason',
      siteKey: 'youtube',
      sessionId: 2,
    });

    const rows = getRecentIntentions(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe('Second reason');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/intentionRepository.test.ts`

Expected: FAIL because `../intentionRepository` does not exist.

- [ ] **Step 3: Add the repository**

Create `src/data/intentionRepository.ts`:

```ts
import { getDatabase } from './database';
import type { SiteKey } from '../sanitizer/types';

export type IntentionRow = {
  id: number;
  created_at: string;
  text: string;
  site_key: SiteKey | null;
  session_id: number | null;
};

type InsertIntentionInput = {
  createdAt: string;
  text: string;
  siteKey: SiteKey;
  sessionId: number;
};

/** Inserts an intention-check reason and returns the new row id. */
export function insertIntention(input: InsertIntentionInput): number {
  const result = getDatabase().execute(
    'INSERT INTO intentions (created_at, text, site_key, session_id) VALUES (?, ?, ?, ?)',
    [input.createdAt, input.text, input.siteKey, input.sessionId],
  );
  return Number((result as { insertId?: number }).insertId);
}

/** Most recent intention entries, newest first. */
export function getRecentIntentions(limit = 20): IntentionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM intentions ORDER BY created_at DESC, id DESC LIMIT ?',
    [limit],
  );
  return result.rows as IntentionRow[];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/intentionRepository.test.ts`

Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/intentionRepository.ts src/data/__tests__/intentionRepository.test.ts
git -c user.name="Wesle" -c user.email="wesleycarr7@gmail.com" commit -m "feat: add intention repository"
```

---

## Task 2: Cheat Pass Repository

**Files:**
- Create: `src/data/cheatPassRepository.ts`
- Test: `src/data/__tests__/cheatPassRepository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/cheatPassRepository.test.ts`:

```ts
import { initDatabase } from '../database';
import {
  getCheatPassStatus,
  useCheatPass,
} from '../cheatPassRepository';

jest.mock('@op-engineering/op-sqlite');

describe('cheatPassRepository', () => {
  beforeEach(() => {
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
  });

  it('starts a site with all passes remaining', () => {
    expect(getCheatPassStatus('2026-05-20', 'youtube')).toEqual({
      date: '2026-05-20',
      siteKey: 'youtube',
      usedCount: 0,
      remainingCount: 3,
      limit: 3,
    });
  });

  it('records pass usage per site and day', () => {
    expect(useCheatPass('2026-05-20', 'youtube')).toBe(true);
    expect(useCheatPass('2026-05-20', 'youtube')).toBe(true);

    expect(getCheatPassStatus('2026-05-20', 'youtube')).toMatchObject({
      usedCount: 2,
      remainingCount: 1,
    });
    expect(getCheatPassStatus('2026-05-20', 'instagram')).toMatchObject({
      usedCount: 0,
      remainingCount: 3,
    });
  });

  it('refuses usage when the daily site limit is exhausted', () => {
    expect(useCheatPass('2026-05-20', 'tiktok', 2)).toBe(true);
    expect(useCheatPass('2026-05-20', 'tiktok', 2)).toBe(true);
    expect(useCheatPass('2026-05-20', 'tiktok', 2)).toBe(false);

    expect(getCheatPassStatus('2026-05-20', 'tiktok', 2)).toEqual({
      date: '2026-05-20',
      siteKey: 'tiktok',
      usedCount: 2,
      remainingCount: 0,
      limit: 2,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/cheatPassRepository.test.ts`

Expected: FAIL because `../cheatPassRepository` does not exist.

- [ ] **Step 3: Add the repository**

Create `src/data/cheatPassRepository.ts`:

```ts
import { getDatabase } from './database';
import type { SiteKey } from '../sanitizer/types';

export const DEFAULT_CHEAT_PASS_LIMIT = 3;

export type CheatPassStatus = {
  date: string;
  siteKey: SiteKey;
  usedCount: number;
  remainingCount: number;
  limit: number;
};

function getUsedCount(date: string, siteKey: SiteKey): number {
  const result = getDatabase().execute(
    'SELECT used_count FROM cheat_passes WHERE date = ? AND site_key = ?',
    [date, siteKey],
  );
  const row = result.rows[0] as { used_count: number } | undefined;
  return row?.used_count ?? 0;
}

/** Returns today's cheat-pass status for one site. */
export function getCheatPassStatus(
  date: string,
  siteKey: SiteKey,
  limit = DEFAULT_CHEAT_PASS_LIMIT,
): CheatPassStatus {
  const usedCount = getUsedCount(date, siteKey);
  return {
    date,
    siteKey,
    usedCount,
    remainingCount: Math.max(limit - usedCount, 0),
    limit,
  };
}

/** Consumes one pass if any remain. Returns true when a pass was consumed. */
export function useCheatPass(
  date: string,
  siteKey: SiteKey,
  limit = DEFAULT_CHEAT_PASS_LIMIT,
): boolean {
  const status = getCheatPassStatus(date, siteKey, limit);
  if (status.remainingCount <= 0) {
    return false;
  }

  getDatabase().execute(
    `INSERT INTO cheat_passes (date, site_key, used_count) VALUES (?, ?, 1)
     ON CONFLICT(date, site_key) DO UPDATE SET used_count = used_count + 1`,
    [date, siteKey],
  );
  return true;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/cheatPassRepository.test.ts`

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/cheatPassRepository.ts src/data/__tests__/cheatPassRepository.test.ts
git -c user.name="Wesle" -c user.email="wesleycarr7@gmail.com" commit -m "feat: add cheat pass repository"
```

---

## Task 3: Pure Friction Gate Decision

**Files:**
- Create: `src/friction/gate.ts`
- Test: `src/friction/__tests__/gate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/friction/__tests__/gate.test.ts`:

```ts
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
    expect(
      decideFrictionGate(active(), preset({ frictionMode: 'intention' })),
    ).toEqual({
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/friction/__tests__/gate.test.ts`

Expected: FAIL because `../gate` does not exist.

- [ ] **Step 3: Add the pure decision function**

Create `src/friction/gate.ts`:

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/friction/__tests__/gate.test.ts`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/friction/gate.ts src/friction/__tests__/gate.test.ts
git -c user.name="Wesle" -c user.email="wesleycarr7@gmail.com" commit -m "feat: add friction gate decision logic"
```

---

## Task 4: Friction Gate Screen

**Files:**
- Create: `src/screens/FrictionGateScreen.tsx`
- Test: `src/screens/__tests__/FrictionGateScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/FrictionGateScreen.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { getRecentIntentions } from '../../data/intentionRepository';
import { getCheatPassStatus, useCheatPass } from '../../data/cheatPassRepository';
import { FrictionGateScreen } from '../FrictionGateScreen';

jest.mock('@op-engineering/op-sqlite');

describe('FrictionGateScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-20T12:00:00.000Z'));
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hard mode does not render a continue action', () => {
    render(
      <FrictionGateScreen
        mode="hard"
        siteKey="instagram"
        sessionId={1}
        onContinue={jest.fn()}
        onEndSession={jest.fn()}
      />,
    );

    expect(screen.getByText('Stay with this session')).toBeTruthy();
    expect(screen.queryByText(/Continue to Instagram/)).toBeNull();
    expect(screen.getByRole('button', { name: /end focus session/i })).toBeTruthy();
  });

  it('soft mode enables continue after the delay', () => {
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="soft"
        siteKey="youtube"
        sessionId={1}
        onContinue={onContinue}
        onEndSession={jest.fn()}
        softDelaySeconds={2}
      />,
    );

    fireEvent.press(screen.getByText('Continue in 2s'));
    expect(onContinue).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.press(screen.getByText('Continue to YouTube'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('intention mode requires at least 8 characters and saves the reason', () => {
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="intention"
        siteKey="x"
        sessionId={9}
        onContinue={onContinue}
        onEndSession={jest.fn()}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Why are you opening this?'), 'reply');
    fireEvent.press(screen.getByText('Continue to X'));
    expect(screen.getByText('Write at least 8 characters.')).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByPlaceholderText('Why are you opening this?'),
      'Reply to one client DM',
    );
    fireEvent.press(screen.getByText('Continue to X'));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(getRecentIntentions()[0]).toMatchObject({
      text: 'Reply to one client DM',
      site_key: 'x',
      session_id: 9,
    });
  });

  it('cheat mode consumes one pass before continuing', () => {
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="cheat"
        siteKey="tiktok"
        sessionId={3}
        onContinue={onContinue}
        onEndSession={jest.fn()}
      />,
    );

    expect(screen.getByText('3 passes left today')).toBeTruthy();
    fireEvent.press(screen.getByText('Use pass'));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(getCheatPassStatus('2026-05-20', 'tiktok')).toMatchObject({
      usedCount: 1,
      remainingCount: 2,
    });
  });

  it('cheat mode blocks continue when passes are exhausted', () => {
    useCheatPass('2026-05-20', 'instagram', 1);
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="cheat"
        siteKey="instagram"
        sessionId={3}
        onContinue={onContinue}
        onEndSession={jest.fn()}
        cheatPassLimit={1}
      />,
    );

    expect(screen.getByText('No passes left today')).toBeTruthy();
    expect(screen.queryByText('Use pass')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/FrictionGateScreen.test.tsx`

Expected: FAIL because `../FrictionGateScreen` does not exist.

- [ ] **Step 3: Add the screen**

Create `src/screens/FrictionGateScreen.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { getRule } from '../sanitizer/rules';
import type { SiteKey } from '../sanitizer/types';
import type { FrictionMode } from '../state/presetStore';
import { insertIntention } from '../data/intentionRepository';
import {
  DEFAULT_CHEAT_PASS_LIMIT,
  getCheatPassStatus,
  useCheatPass,
} from '../data/cheatPassRepository';
import { todayKey } from '../lib/dates';

type Props = {
  mode: FrictionMode;
  siteKey: SiteKey;
  sessionId: number;
  onContinue: () => void;
  onEndSession: () => void;
  softDelaySeconds?: number;
  cheatPassLimit?: number;
};

const MODE_TITLE: Record<FrictionMode, string> = {
  hard: 'Stay with this session',
  soft: 'Pause before opening',
  intention: 'Set an intention',
  cheat: 'Use a cheat pass',
};

export function FrictionGateScreen({
  mode,
  siteKey,
  sessionId,
  onContinue,
  onEndSession,
  softDelaySeconds = 30,
  cheatPassLimit = DEFAULT_CHEAT_PASS_LIMIT,
}: Props) {
  const theme = useTheme();
  const rule = getRule(siteKey);
  const [remainingDelay, setRemainingDelay] = useState(softDelaySeconds);
  const [intention, setIntention] = useState('');
  const [error, setError] = useState<string | null>(null);
  const today = todayKey();
  const cheatStatus = getCheatPassStatus(today, siteKey, cheatPassLimit);

  useEffect(() => {
    if (mode !== 'soft' || remainingDelay <= 0) return undefined;
    const timer = setInterval(() => {
      setRemainingDelay((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, remainingDelay]);

  const saveIntention = () => {
    const trimmed = intention.trim();
    if (trimmed.length < 8) {
      setError('Write at least 8 characters.');
      return;
    }
    insertIntention({
      createdAt: new Date().toISOString(),
      text: trimmed,
      siteKey,
      sessionId,
    });
    onContinue();
  };

  const consumePass = () => {
    if (useCheatPass(today, siteKey, cheatPassLimit)) {
      onContinue();
    }
  };

  return (
    <SafeAreaView
      testID="screen-friction-gate"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <View style={[styles.panel, { padding: theme.spacing.lg, gap: theme.spacing.md }]}>
        <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
          {rule.displayName}
        </Text>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {MODE_TITLE[mode]}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Stillpoint can open the calm web version, but this focus session asks for one
          deliberate pause first.
        </Text>

        {mode === 'hard' && (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            This preset does not allow browsing until the session ends.
          </Text>
        )}

        {mode === 'intention' && (
          <View style={{ gap: theme.spacing.sm }}>
            <TextInput
              accessibilityLabel="Intention reason"
              placeholder="Why are you opening this?"
              placeholderTextColor={theme.colors.textMuted}
              value={intention}
              onChangeText={(value) => {
                setIntention(value);
                if (error) setError(null);
              }}
              multiline
              style={[
                styles.input,
                {
                  borderColor: error ? theme.colors.danger : theme.colors.border,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.bgRaised,
                  borderRadius: theme.radius.card,
                  padding: theme.spacing.md,
                },
              ]}
            />
            {error ? (
              <Text accessibilityLiveRegion="polite" style={[theme.typography.body, { color: theme.colors.danger }]}>
                {error}
              </Text>
            ) : null}
          </View>
        )}

        {mode === 'cheat' && (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            {cheatStatus.remainingCount > 0
              ? `${cheatStatus.remainingCount} passes left today`
              : 'No passes left today'}
          </Text>
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {mode === 'soft' && (
            <GateButton
              label={
                remainingDelay > 0
                  ? `Continue in ${remainingDelay}s`
                  : `Continue to ${rule.displayName}`
              }
              disabled={remainingDelay > 0}
              onPress={onContinue}
            />
          )}
          {mode === 'intention' && (
            <GateButton label={`Continue to ${rule.displayName}`} onPress={saveIntention} />
          )}
          {mode === 'cheat' && cheatStatus.remainingCount > 0 && (
            <GateButton label="Use pass" onPress={consumePass} />
          )}
          <GateButton label="End focus session" variant="secondary" onPress={onEndSession} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function GateButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            variant === 'primary' ? theme.colors.purple500 : theme.colors.bgRaised,
          borderColor: variant === 'primary' ? theme.colors.purple400 : theme.colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  panel: { flex: 1, justifyContent: 'center' },
  input: { minHeight: 104, borderWidth: 1, textAlignVertical: 'top' },
  button: {
    minHeight: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/FrictionGateScreen.test.tsx`

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/screens/FrictionGateScreen.tsx src/screens/__tests__/FrictionGateScreen.test.tsx
git -c user.name="Wesle" -c user.email="wesleycarr7@gmail.com" commit -m "feat: add friction gate screen"
```

---

## Task 5: Wire Social Navigation Through the Gate

**Files:**
- Modify: `src/nav/SocialStack.tsx`
- Modify: `src/nav/__tests__/SocialStack.test.tsx`

- [ ] **Step 1: Extend the failing SocialStack test**

Replace `src/nav/__tests__/SocialStack.test.tsx` with:

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SocialStack } from '../SocialStack';
import { useSessionStore } from '../../state/sessionStore';
import { usePresetStore } from '../../state/presetStore';

function renderStack() {
  return render(
    <NavigationContainer>
      <SocialStack />
    </NavigationContainer>,
  );
}

describe('SocialStack', () => {
  beforeEach(() => {
    useSessionStore.setState({ activeSession: null });
    usePresetStore.setState({ presets: [] });
  });

  it('shows the Social cards screen first', () => {
    renderStack();
    expect(screen.getByTestId('screen-social')).toBeTruthy();
  });

  it('navigates directly to the browser when no focus session is active', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));
    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });

  it('routes through the friction gate when a focus session is active', () => {
    useSessionStore.setState({
      activeSession: {
        sessionId: 11,
        durationMinutes: 25,
        presetId: 5,
        startedAt: '2026-05-20T12:00:00.000Z',
        remainingSeconds: 1000,
        status: 'running',
      },
    });
    usePresetStore.setState({
      presets: [{ id: 5, name: 'Strict', durationMinutes: 25, frictionMode: 'hard' }],
    });

    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));

    expect(screen.getByTestId('screen-friction-gate')).toBeTruthy();
    expect(screen.queryByTestId('mock-webview')).toBeNull();
    expect(screen.getByText('Stay with this session')).toBeTruthy();
  });

  it('continues from an intention gate to the browser', () => {
    useSessionStore.setState({
      activeSession: {
        sessionId: 12,
        durationMinutes: 25,
        presetId: 6,
        startedAt: '2026-05-20T12:00:00.000Z',
        remainingSeconds: 1000,
        status: 'running',
      },
    });
    usePresetStore.setState({
      presets: [{ id: 6, name: 'Intentional', durationMinutes: 25, frictionMode: 'intention' }],
    });

    renderStack();
    fireEvent.press(screen.getByTestId('site-card-x'));
    fireEvent.changeText(
      screen.getByPlaceholderText('Why are you opening this?'),
      'Reply to one message',
    );
    fireEvent.press(screen.getByText('Continue to X'));

    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.getByTestId('mock-webview').props.source).toEqual({ uri: 'https://x.com/home' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/nav/__tests__/SocialStack.test.tsx`

Expected: FAIL because `SocialStack` does not yet route through `FrictionGateScreen`.

- [ ] **Step 3: Update the stack**

Replace `src/nav/SocialStack.tsx` with:

```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialScreen } from '../screens/SocialScreen';
import { BrowserScreen } from '../screens/BrowserScreen';
import { FrictionGateScreen } from '../screens/FrictionGateScreen';
import type { SiteKey } from '../sanitizer/types';
import type { FrictionMode } from '../state/presetStore';
import { usePresetStore } from '../state/presetStore';
import { useSessionStore } from '../state/sessionStore';
import { decideFrictionGate } from '../friction/gate';

export type SocialStackParamList = {
  SocialHome: undefined;
  FrictionGate: { siteKey: SiteKey; mode: FrictionMode; sessionId: number };
  Browser: { siteKey: SiteKey };
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialStack() {
  const activeSession = useSessionStore((state) => state.activeSession);
  const cancelSession = useSessionStore((state) => state.cancelSession);
  const presets = usePresetStore((state) => state.presets);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialHome">
        {({ navigation }) => (
          <SocialScreen
            onOpenSite={(siteKey) => {
              const activePreset = presets.find((preset) => preset.id === activeSession?.presetId);
              const decision = decideFrictionGate(activeSession, activePreset);
              if (decision.kind === 'allow') {
                navigation.navigate('Browser', { siteKey });
                return;
              }
              navigation.navigate('FrictionGate', {
                siteKey,
                mode: decision.mode,
                sessionId: decision.sessionId,
              });
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="FrictionGate">
        {({ navigation, route }) => (
          <FrictionGateScreen
            mode={route.params.mode}
            siteKey={route.params.siteKey}
            sessionId={route.params.sessionId}
            onContinue={() => navigation.replace('Browser', { siteKey: route.params.siteKey })}
            onEndSession={() => {
              cancelSession();
              navigation.popToTop();
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Browser">
        {({ route }) => <BrowserScreen siteKey={route.params.siteKey} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Run navigation tests**

Run: `npx jest src/nav/__tests__/SocialStack.test.tsx`

Expected: PASS, 4 tests.

Run: `npx jest src/nav`

Expected: PASS, both nav suites.

- [ ] **Step 5: Run the type check**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/nav/SocialStack.tsx src/nav/__tests__/SocialStack.test.tsx
git -c user.name="Wesle" -c user.email="wesleycarr7@gmail.com" commit -m "feat: gate Social browser during focus sessions"
```

---

## Task 6: Update Handoff and Run Full Verification

**Files:**
- Modify: `CODEX_PLAN5_HANDOFF.txt` or create it if it does not exist.

- [ ] **Step 1: Create/update the handoff**

After implementation verification, create `CODEX_PLAN5_HANDOFF.txt`. Do not commit it until the commit list and verification results below contain concrete command output from this branch.

Use this structure:

```text
Stillpoint Plan 5 handoff from Codex to Claude/fresh Codex
Date: 2026-05-20
Current branch: friction-layer

SESSION SUMMARY
- Plan 5 Friction Layer was implemented.
- Added intention persistence, cheat-pass persistence, pure friction decision logic, FrictionGateScreen, and SocialStack gating.
- UI UX Pro Max was invoked before UI work per AGENTS.md. Applied React Native guidance: typed navigation, Pressable controls, 44px+ touch targets, visible error recovery, accessible labels.

COMMITS
- Run `git log --oneline master..HEAD` and paste every Plan 5 commit SHA + subject here.

VERIFICATION
- Record the exact passing results after running:
  - `npx jest`
  - `npx tsc --noEmit`
  - `npx expo export --platform ios --output-dir ./.tmp-export`
  - `npx expo-doctor`

ROADMAP
- Plan 6: Stats & Insights.
- Plan 7: Onboarding & Shortcuts.
- Plan 8: CI/dev-build pipeline.

NOTES
- Friction only gates Stillpoint's own sanitized WebView.
- Blocks-tab always-gated settings are still future work.
```

Before committing, confirm the commit list and verification section contain concrete values copied from the commands above.

- [ ] **Step 2: Run all tests**

Run: `npx jest`

Expected: all suites pass, including new repository, friction, screen, and navigation tests.

- [ ] **Step 3: Run TypeScript**

Run: `npx tsc --noEmit`

Expected: exit 0.

- [ ] **Step 4: Verify the iOS export**

Run:

```powershell
if (Test-Path -LiteralPath '.tmp-export') { Remove-Item -LiteralPath '.tmp-export' -Recurse -Force }
npx expo export --platform ios --output-dir ./.tmp-export
$exportExit=$LASTEXITCODE
if (Test-Path -LiteralPath '.tmp-export') { Remove-Item -LiteralPath '.tmp-export' -Recurse -Force }
exit $exportExit
```

Expected: export exits 0 and `.tmp-export` is removed.

- [ ] **Step 5: Run dependency hygiene**

Run: `npx expo-doctor`

Expected: 17/17 checks pass.

- [ ] **Step 6: Commit the handoff**

```bash
git add CODEX_PLAN5_HANDOFF.txt
git -c user.name="Wesle" -c user.email="wesleycarr7@gmail.com" commit -m "docs: add Plan 5 handoff after verification"
```

---

## Done Criteria

- Opening a sanitized site outside a focus session still opens `BrowserScreen` directly.
- Opening a sanitized site during a running focus session routes through the active preset's friction mode.
- Hard mode does not offer a bypass, only ending the focus session.
- Soft mode allows continuing only after its delay.
- Intention mode requires at least 8 characters, saves the reason, then opens the browser.
- Cheat mode consumes one daily site pass before opening; exhausted passes prevent continuing.
- `npx jest` passes.
- `npx tsc --noEmit` passes.
- `npx expo export --platform ios` passes.
- `npx expo-doctor` passes.

## Self-Review

- Spec coverage: implements spec sections 5.6 and the browser-gating part of 6.1. It intentionally leaves Blocks settings, Stats display, schedules, and deep links to later plans.
- UI/UX: Plan uses UI UX Pro Max guidance for React Native screens: `Pressable`, typed navigation, accessible buttons, 44px+ touch targets, visible errors, and calm wellness copy.
- Type consistency: `FrictionMode` is reused from `presetStore`; `SiteKey` is reused from `sanitizer/types`; `ActiveSession` is reused from `sessionStore`.
- Task 6 requires concrete commit and verification evidence before committing the handoff.
