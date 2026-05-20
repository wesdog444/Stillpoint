# Focus Engine Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stillpoint's focus engine data and runtime layer — DB-backed session/preset/streak repositories, the preset and session stores wired to them, a real countdown timer, and session-completion → persistence → streak tracking — all pure logic, fully unit-tested.

**Architecture:** Repositories wrap the on-device SQLite database (`getDatabase()` from the Foundation) with typed CRUD functions. Zustand stores call repositories. To test SQL against real semantics on Windows without a device, the Jest mock for `@op-engineering/op-sqlite` is upgraded to delegate to an in-memory `better-sqlite3` database — every repository test exercises real SQL.

**Tech Stack:** TypeScript, `@op-engineering/op-sqlite` (mocked by `better-sqlite3` in tests), Zustand v5, Jest. Builds on the merged Foundation phase.

**Prerequisite reading:** This plan modifies Foundation files. Relevant existing code:
- `src/data/database.ts` — exports `initDatabase()` and `getDatabase()`. `getDatabase().execute(sql, params)` returns an op-sqlite `QueryResult`.
- `src/data/schema.ts` — `CREATE_TABLE_SQL`, `TABLE_NAMES` (tables: `sessions`, `presets`, `blocklists`, `blocklist_sites`, `intentions`, `streak_days`, `cheat_passes`).
- `src/state/presetStore.ts` — exports `usePresetStore`, the `Preset` type (`{ id, name, durationMinutes, frictionMode }`), and `FrictionMode` (`'hard' | 'soft' | 'intention' | 'cheat'`). Currently a skeleton with `presets` + `setPresets`.
- `src/state/sessionStore.ts` — exports `useSessionStore`, the `ActiveSession` type (`{ durationMinutes, presetId, startedAt }`). Currently a skeleton with `startSession` + `endSession`.
- `jest.setup.ts` — currently mocks `@op-engineering/op-sqlite` with a "record SQL, return empty rows" mock exposing `open`, `__executed`, `__resetMock`.

---

## File Structure

```
Stillpoint/
├── jest.setup.ts                     # MODIFIED: op-sqlite mock now backed by better-sqlite3
├── src/
│   ├── lib/
│   │   ├── dates.ts                  # NEW: 'YYYY-MM-DD' date-key helpers
│   │   └── __tests__/dates.test.ts
│   ├── data/
│   │   ├── sessionRepository.ts      # NEW: CRUD over the sessions table
│   │   ├── presetRepository.ts       # NEW: CRUD over the presets table
│   │   ├── streakRepository.ts       # NEW: streak_days reads/writes + streak math
│   │   └── __tests__/
│   │       ├── sessionRepository.test.ts
│   │       ├── presetRepository.test.ts
│   │       └── streakRepository.test.ts
│   └── state/
│       ├── presetStore.ts            # MODIFIED: repository-backed CRUD actions
│       ├── sessionStore.ts           # MODIFIED: timer + persistence + streak on completion
│       └── __tests__/
│           ├── presetStore.test.ts   # MODIFIED: rewritten for repo-backed behavior
│           └── sessionStore.test.ts  # MODIFIED: rewritten for timer/persistence behavior
```

Each repository owns one table and exposes typed functions. Stores own runtime state and call repositories — no SQL in stores.

---

## Task 1: Upgrade the op-sqlite Jest mock to real in-memory SQLite

The current mock returns empty rowsets, so repository tests (insert-then-read) cannot be verified. This task replaces it with a `better-sqlite3`-backed mock that runs real SQL in memory, while preserving the `open` / `__executed` / `__resetMock` surface the existing `database.test.ts` depends on.

**Files:**
- Modify: `package.json` (add `better-sqlite3` dev dependency)
- Modify: `jest.setup.ts`

- [ ] **Step 1: Install better-sqlite3 as a dev dependency**

Run:
```bash
npm install --save-dev better-sqlite3 @types/better-sqlite3
```
`better-sqlite3` ships prebuilt binaries for Node 22 on Windows. If the install fails to build the native binary, STOP and report BLOCKED with the error — do not work around it.

- [ ] **Step 2: Replace the op-sqlite mock in jest.setup.ts**

In `jest.setup.ts`, replace the entire existing `jest.mock('@op-engineering/op-sqlite', ...)` block (keep the `react-native-mmkv` mock and the `@testing-library/jest-native` import untouched) with:
```ts
// --- op-sqlite mock: delegates to an in-memory better-sqlite3 database ---
jest.mock('@op-engineering/op-sqlite', () => {
  const Database = require('better-sqlite3');
  // `realDb` is loosely typed: this is test glue and better-sqlite3's
  // class/namespace merge makes a precise type import fragile.
  let realDb: any = null;
  const executed: { sql: string; params: unknown[] }[] = [];

  const ensureDb = () => {
    if (!realDb) realDb = new Database(':memory:');
    return realDb;
  };

  const execute = (sql: string, params: unknown[] = []) => {
    executed.push({ sql, params });
    const db = ensureDb();
    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('PRAGMA')) {
      const setMatch = trimmed.match(/PRAGMA\s+(\w+)\s*=\s*(.+?);?$/i);
      if (setMatch) {
        db.pragma(`${setMatch[1]} = ${setMatch[2]}`);
        return { rows: [], rowsAffected: 0 };
      }
      const name = trimmed.replace(/^PRAGMA\s+/i, '').replace(/;$/, '').trim();
      return { rows: db.pragma(name, { simple: false }) as any[], rowsAffected: 0 };
    }

    const stmt = db.prepare(trimmed);
    if (stmt.reader) {
      return { rows: stmt.all(...params) as any[], rowsAffected: 0 };
    }
    const info = stmt.run(...params);
    return {
      rows: [] as any[],
      rowsAffected: info.changes,
      insertId: Number(info.lastInsertRowid),
    };
  };

  return {
    open: jest.fn(() => ({ execute, close: () => undefined })),
    __executed: executed,
    __resetMock: () => {
      executed.length = 0;
      if (realDb) {
        realDb.close();
        realDb = null;
      }
    },
  };
});
```

- [ ] **Step 3: Run the full existing suite to confirm nothing broke**

Run: `npx jest`
Expected: PASS — all 10 existing suites, 42 tests, still green. The `database.test.ts` suite still finds `CREATE TABLE` strings in `__executed` and `open` is still a `jest.fn`; `migrations.test.ts` uses its own fake db and is unaffected.

- [ ] **Step 4: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0. (`@types/better-sqlite3` provides the `import('better-sqlite3').Database` type used in the mock.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json jest.setup.ts
git commit -m "test: back op-sqlite mock with in-memory better-sqlite3"
```

---

## Task 2: Date-key helpers

**Files:**
- Create: `src/lib/dates.ts`
- Test: `src/lib/__tests__/dates.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/dates.test.ts`:
```ts
import { dateKey, todayKey, previousDayKey } from '../dates';

describe('dates', () => {
  it('dateKey formats a Date as YYYY-MM-DD in local time', () => {
    expect(dateKey(new Date(2026, 4, 9))).toBe('2026-05-09');
    expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('todayKey returns a YYYY-MM-DD string', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('previousDayKey returns the day before', () => {
    expect(previousDayKey('2026-05-20')).toBe('2026-05-19');
  });

  it('previousDayKey crosses month boundaries', () => {
    expect(previousDayKey('2026-05-01')).toBe('2026-04-30');
  });

  it('previousDayKey crosses year boundaries', () => {
    expect(previousDayKey('2026-01-01')).toBe('2025-12-31');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib`
Expected: FAIL — cannot find module `../dates`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/dates.ts`:
```ts
/** Formats a Date as a 'YYYY-MM-DD' key in local time. */
export function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Today's 'YYYY-MM-DD' key in local time. */
export function todayKey(): string {
  return dateKey(new Date());
}

/** The 'YYYY-MM-DD' key for the day before the given key. */
export function previousDayKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return dateKey(date);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/lib`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dates.ts src/lib/__tests__/dates.test.ts
git commit -m "feat: add date-key helpers"
```

---

## Task 3: Session repository

CRUD over the `sessions` table. The `sessions` schema columns are `id, started_at, ended_at, duration_planned, preset_id, completed`.

**Files:**
- Create: `src/data/sessionRepository.ts`
- Test: `src/data/__tests__/sessionRepository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/sessionRepository.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/sessionRepository.test.ts`
Expected: FAIL — cannot find module `../sessionRepository`.

- [ ] **Step 3: Write the implementation**

Create `src/data/sessionRepository.ts`:
```ts
import { getDatabase } from './database';

export type SessionRow = {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_planned: number;
  preset_id: number | null;
  completed: number;
};

/** Inserts a new, incomplete session. Returns the new row id. */
export function insertSession(args: {
  startedAt: string;
  durationPlanned: number;
  presetId: number | null;
}): number {
  const result = getDatabase().execute(
    'INSERT INTO sessions (started_at, duration_planned, preset_id, completed) VALUES (?, ?, ?, 0)',
    [args.startedAt, args.durationPlanned, args.presetId],
  );
  return Number((result as { insertId?: number }).insertId);
}

/** Marks a session complete and records its end time. */
export function completeSession(id: number, endedAt: string): void {
  getDatabase().execute(
    'UPDATE sessions SET ended_at = ?, completed = 1 WHERE id = ?',
    [endedAt, id],
  );
}

/** All sessions whose `started_at` falls on the given 'YYYY-MM-DD' day, oldest first. */
export function getSessionsForDay(dayKey: string): SessionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM sessions WHERE substr(started_at, 1, 10) = ? ORDER BY started_at',
    [dayKey],
  );
  return result.rows as SessionRow[];
}

/** The most recent sessions, newest first, capped at `limit`. */
export function getRecentSessions(limit: number): SessionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?',
    [limit],
  );
  return result.rows as SessionRow[];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/sessionRepository.test.ts`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/data/sessionRepository.ts src/data/__tests__/sessionRepository.test.ts
git commit -m "feat: add session repository"
```

---

## Task 4: Preset repository

CRUD over the `presets` table. Schema columns: `id, name, duration, blocklist_id, friction_mode, schedule_enabled, schedule_start, schedule_end, schedule_weekdays`. This task covers `name`, `duration`, and `friction_mode`; schedule columns are handled in Plan 3.

**Files:**
- Create: `src/data/presetRepository.ts`
- Test: `src/data/__tests__/presetRepository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/presetRepository.test.ts`:
```ts
import { initDatabase } from '../database';
import {
  getAllPresets,
  insertPreset,
  updatePreset,
  deletePreset,
} from '../presetRepository';

const opSqlite = require('@op-engineering/op-sqlite');

describe('presetRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('getAllPresets is empty on a fresh database', () => {
    expect(getAllPresets()).toEqual([]);
  });

  it('insertPreset stores a preset and returns its id', () => {
    const id = insertPreset({ name: 'Deep Work', duration: 90, frictionMode: 'hard' });
    expect(id).toBeGreaterThan(0);
    const all = getAllPresets();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(id);
    expect(all[0].name).toBe('Deep Work');
    expect(all[0].duration).toBe(90);
    expect(all[0].friction_mode).toBe('hard');
  });

  it('getAllPresets returns presets ordered by id', () => {
    insertPreset({ name: 'A', duration: 10, frictionMode: 'soft' });
    insertPreset({ name: 'B', duration: 20, frictionMode: 'soft' });
    const all = getAllPresets();
    expect(all.map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('updatePreset changes name, duration, and friction mode', () => {
    const id = insertPreset({ name: 'Reading', duration: 30, frictionMode: 'soft' });
    updatePreset(id, { name: 'Reading (long)', duration: 45, frictionMode: 'intention' });
    const all = getAllPresets();
    expect(all[0].name).toBe('Reading (long)');
    expect(all[0].duration).toBe(45);
    expect(all[0].friction_mode).toBe('intention');
  });

  it('deletePreset removes the preset', () => {
    const id = insertPreset({ name: 'Temp', duration: 5, frictionMode: 'cheat' });
    deletePreset(id);
    expect(getAllPresets()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/presetRepository.test.ts`
Expected: FAIL — cannot find module `../presetRepository`.

- [ ] **Step 3: Write the implementation**

Create `src/data/presetRepository.ts`:
```ts
import { getDatabase } from './database';
import type { FrictionMode } from '../state/presetStore';

export type PresetRow = {
  id: number;
  name: string;
  duration: number;
  blocklist_id: number | null;
  friction_mode: FrictionMode;
  schedule_enabled: number;
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_weekdays: string | null;
};

type PresetInput = {
  name: string;
  duration: number;
  frictionMode: FrictionMode;
};

/** All presets, ordered by id (creation order). */
export function getAllPresets(): PresetRow[] {
  const result = getDatabase().execute('SELECT * FROM presets ORDER BY id');
  return result.rows as PresetRow[];
}

/** Inserts a preset. Returns the new row id. */
export function insertPreset(input: PresetInput): number {
  const result = getDatabase().execute(
    'INSERT INTO presets (name, duration, friction_mode) VALUES (?, ?, ?)',
    [input.name, input.duration, input.frictionMode],
  );
  return Number((result as { insertId?: number }).insertId);
}

/** Updates a preset's name, duration, and friction mode. */
export function updatePreset(id: number, input: PresetInput): void {
  getDatabase().execute(
    'UPDATE presets SET name = ?, duration = ?, friction_mode = ? WHERE id = ?',
    [input.name, input.duration, input.frictionMode, id],
  );
}

/** Deletes a preset by id. */
export function deletePreset(id: number): void {
  getDatabase().execute('DELETE FROM presets WHERE id = ?', [id]);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/presetRepository.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/data/presetRepository.ts src/data/__tests__/presetRepository.test.ts
git commit -m "feat: add preset repository"
```

---

## Task 5: Streak repository

Reads/writes the `streak_days` table (`date TEXT UNIQUE NOT NULL, session_count INTEGER`) and computes streak lengths.

**Files:**
- Create: `src/data/streakRepository.ts`
- Test: `src/data/__tests__/streakRepository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/streakRepository.test.ts`:
```ts
import { initDatabase } from '../database';
import {
  recordSessionForDay,
  getCurrentStreak,
  getLongestStreak,
} from '../streakRepository';
import { todayKey, previousDayKey } from '../../lib/dates';

const opSqlite = require('@op-engineering/op-sqlite');

describe('streakRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('current streak is 0 on a fresh database', () => {
    expect(getCurrentStreak()).toBe(0);
  });

  it('recording a session today makes the current streak 1', () => {
    recordSessionForDay(todayKey());
    expect(getCurrentStreak()).toBe(1);
  });

  it('recording the same day twice keeps the streak at 1 day', () => {
    recordSessionForDay(todayKey());
    recordSessionForDay(todayKey());
    expect(getCurrentStreak()).toBe(1);
  });

  it('consecutive days build the current streak', () => {
    const today = todayKey();
    const yesterday = previousDayKey(today);
    const dayBefore = previousDayKey(yesterday);
    recordSessionForDay(dayBefore);
    recordSessionForDay(yesterday);
    recordSessionForDay(today);
    expect(getCurrentStreak()).toBe(3);
  });

  it('current streak is 0 when today has no session even if past days do', () => {
    recordSessionForDay(previousDayKey(todayKey()));
    expect(getCurrentStreak()).toBe(0);
  });

  it('getLongestStreak finds the longest consecutive run', () => {
    // A 2-day run, a gap, then a 3-day run ending today.
    const today = todayKey();
    const d1 = previousDayKey(today);
    const d2 = previousDayKey(d1);
    const d3 = previousDayKey(d2); // gap day - not recorded
    const d4 = previousDayKey(d3);
    const d5 = previousDayKey(d4);
    recordSessionForDay(today);
    recordSessionForDay(d1);
    recordSessionForDay(d2);
    recordSessionForDay(d4);
    recordSessionForDay(d5);
    expect(getLongestStreak()).toBe(3);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/streakRepository.test.ts`
Expected: FAIL — cannot find module `../streakRepository`.

- [ ] **Step 3: Write the implementation**

Create `src/data/streakRepository.ts`:
```ts
import { getDatabase } from './database';
import { todayKey, previousDayKey } from '../lib/dates';

/**
 * Records that a completed session happened on the given 'YYYY-MM-DD' day,
 * incrementing that day's session count (creating the row if absent).
 */
export function recordSessionForDay(dayKey: string): void {
  getDatabase().execute(
    `INSERT INTO streak_days (date, session_count) VALUES (?, 1)
     ON CONFLICT(date) DO UPDATE SET session_count = session_count + 1`,
    [dayKey],
  );
}

/** True if the given day has at least one recorded session. */
function dayHasSession(dayKey: string): boolean {
  const result = getDatabase().execute(
    'SELECT session_count FROM streak_days WHERE date = ?',
    [dayKey],
  );
  const row = result.rows[0] as { session_count: number } | undefined;
  return (row?.session_count ?? 0) > 0;
}

/** Consecutive-day streak ending today. 0 if today has no session. */
export function getCurrentStreak(): number {
  let streak = 0;
  let key = todayKey();
  while (dayHasSession(key)) {
    streak += 1;
    key = previousDayKey(key);
  }
  return streak;
}

/** Longest consecutive-day run anywhere in the streak history. */
export function getLongestStreak(): number {
  const result = getDatabase().execute(
    'SELECT date FROM streak_days WHERE session_count > 0 ORDER BY date',
  );
  const dates = (result.rows as { date: string }[]).map((r) => r.date);

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of dates) {
    if (previous !== null && previousDayKey(date) === previous) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }
  return longest;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/streakRepository.test.ts`
Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/data/streakRepository.ts src/data/__tests__/streakRepository.test.ts
git commit -m "feat: add streak repository"
```

---

## Task 6: Wire the preset store to the preset repository

The Foundation `presetStore.ts` is a skeleton (`presets` + `setPresets`). This task adds repository-backed actions and a row→`Preset` mapper, keeping `setPresets` so existing consumers/tests stay valid.

**Files:**
- Modify: `src/state/presetStore.ts`
- Modify (rewrite): `src/state/__tests__/presetStore.test.ts`

- [ ] **Step 1: Rewrite the test**

Replace the entire contents of `src/state/__tests__/presetStore.test.ts`:
```ts
import { initDatabase } from '../../data/database';
import { usePresetStore } from '../presetStore';

const opSqlite = require('@op-engineering/op-sqlite');

describe('presetStore', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
    usePresetStore.setState({ presets: [] });
  });

  it('starts with no presets', () => {
    expect(usePresetStore.getState().presets).toEqual([]);
  });

  it('setPresets replaces the list', () => {
    usePresetStore.getState().setPresets([
      { id: 1, name: 'Deep Work', durationMinutes: 90, frictionMode: 'hard' },
    ]);
    expect(usePresetStore.getState().presets).toHaveLength(1);
  });

  it('createPreset persists a preset and refreshes the list', () => {
    usePresetStore.getState().createPreset({
      name: 'Reading',
      durationMinutes: 30,
      frictionMode: 'soft',
    });
    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('Reading');
    expect(presets[0].durationMinutes).toBe(30);
    expect(presets[0].frictionMode).toBe('soft');
    expect(presets[0].id).toBeGreaterThan(0);
  });

  it('loadPresets reads persisted presets from the database', () => {
    usePresetStore.getState().createPreset({
      name: 'Sleep',
      durationMinutes: 480,
      frictionMode: 'hard',
    });
    usePresetStore.setState({ presets: [] });
    usePresetStore.getState().loadPresets();
    expect(usePresetStore.getState().presets).toHaveLength(1);
    expect(usePresetStore.getState().presets[0].name).toBe('Sleep');
  });

  it('editPreset updates a persisted preset', () => {
    usePresetStore.getState().createPreset({
      name: 'Focus',
      durationMinutes: 25,
      frictionMode: 'soft',
    });
    const id = usePresetStore.getState().presets[0].id;
    usePresetStore.getState().editPreset(id, {
      name: 'Focus (deep)',
      durationMinutes: 50,
      frictionMode: 'intention',
    });
    const updated = usePresetStore.getState().presets[0];
    expect(updated.name).toBe('Focus (deep)');
    expect(updated.durationMinutes).toBe(50);
    expect(updated.frictionMode).toBe('intention');
  });

  it('removePreset deletes a persisted preset', () => {
    usePresetStore.getState().createPreset({
      name: 'Temp',
      durationMinutes: 5,
      frictionMode: 'cheat',
    });
    const id = usePresetStore.getState().presets[0].id;
    usePresetStore.getState().removePreset(id);
    expect(usePresetStore.getState().presets).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/state/__tests__/presetStore.test.ts`
Expected: FAIL — `createPreset` / `loadPresets` / `editPreset` / `removePreset` are not functions.

- [ ] **Step 3: Rewrite the preset store**

Replace the entire contents of `src/state/presetStore.ts`:
```ts
import { create } from 'zustand';
import {
  getAllPresets,
  insertPreset,
  updatePreset,
  deletePreset,
  type PresetRow,
} from '../data/presetRepository';

export type FrictionMode = 'hard' | 'soft' | 'intention' | 'cheat';

export type Preset = {
  id: number;
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
};

/** Input shape for creating/editing a preset (no id). */
export type PresetDraft = {
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
};

/** Maps a database row to the UI-facing Preset shape. */
function rowToPreset(row: PresetRow): Preset {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration,
    frictionMode: row.friction_mode,
  };
}

type PresetState = {
  presets: Preset[];
  setPresets: (presets: Preset[]) => void;
  loadPresets: () => void;
  createPreset: (draft: PresetDraft) => void;
  editPreset: (id: number, draft: PresetDraft) => void;
  removePreset: (id: number) => void;
};

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],

  setPresets: (presets: Preset[]) => set({ presets }),

  loadPresets: () => {
    set({ presets: getAllPresets().map(rowToPreset) });
  },

  createPreset: (draft: PresetDraft) => {
    insertPreset({
      name: draft.name,
      duration: draft.durationMinutes,
      frictionMode: draft.frictionMode,
    });
    set({ presets: getAllPresets().map(rowToPreset) });
  },

  editPreset: (id: number, draft: PresetDraft) => {
    updatePreset(id, {
      name: draft.name,
      duration: draft.durationMinutes,
      frictionMode: draft.frictionMode,
    });
    set({ presets: getAllPresets().map(rowToPreset) });
  },

  removePreset: (id: number) => {
    deletePreset(id);
    set({ presets: getAllPresets().map(rowToPreset) });
  },
}));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/state/__tests__/presetStore.test.ts`
Expected: PASS — 6 tests green.

- [ ] **Step 5: Verify the type check (presetRepository imports `FrictionMode` from this file)**

Run: `npx tsc --noEmit`
Expected: exit 0. `FrictionMode` is still exported from `presetStore.ts`, so `presetRepository.ts`'s type-only import still resolves.

- [ ] **Step 6: Commit**

```bash
git add src/state/presetStore.ts src/state/__tests__/presetStore.test.ts
git commit -m "feat: wire preset store to preset repository"
```

---

## Task 7: Upgrade the session store with timer, persistence, and streak tracking

The Foundation `sessionStore.ts` is a skeleton. This task makes it a real focus engine: starting a session persists a `sessions` row and begins a countdown; `tick()` advances it; completing it marks the row complete and records a streak day; cancelling it ends the runtime session without marking the row complete.

**Files:**
- Modify: `src/state/sessionStore.ts`
- Modify (rewrite): `src/state/__tests__/sessionStore.test.ts`

- [ ] **Step 1: Rewrite the test**

Replace the entire contents of `src/state/__tests__/sessionStore.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/state/__tests__/sessionStore.test.ts`
Expected: FAIL — `remainingSeconds` / `status` / `tick` / `cancelSession` not present.

- [ ] **Step 3: Rewrite the session store**

Replace the entire contents of `src/state/sessionStore.ts`:
```ts
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
    // Reached zero: persist completion and record the streak day.
    completeSession(active.sessionId, new Date().toISOString());
    recordSessionForDay(todayKey());
    set({
      activeSession: { ...active, remainingSeconds: 0, status: 'complete' },
    });
  },

  cancelSession: () => {
    // The persisted row stays incomplete (completed = 0); only runtime state clears.
    set({ activeSession: null });
  },

  dismissComplete: () => {
    set({ activeSession: null });
  },
}));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/state/__tests__/sessionStore.test.ts`
Expected: PASS — 9 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/state/sessionStore.ts src/state/__tests__/sessionStore.test.ts
git commit -m "feat: add timer, persistence, and streak tracking to session store"
```

---

## Task 8: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `npx jest`
Expected: PASS — every suite green. New suites: `dates`, `sessionRepository`, `presetRepository`, `streakRepository`; rewritten: `presetStore`, `sessionStore`; all Foundation suites still pass (`theme`, `schema`, `migrations`, `database`, `mmkv`, `settingsStore`, `ScreenScaffold`, `RootNavigator`).

- [ ] **Step 2: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 3: Verify the bundle still builds**

Run: `npx expo export --platform ios --output-dir ./.tmp-export`
Expected: completes without error. Then clean up: `rm -rf ./.tmp-export`.

- [ ] **Step 4: Run dependency hygiene check**

Run: `npx expo-doctor`
Expected: 17/17 checks pass. (`better-sqlite3` and `@types/better-sqlite3` are dev-only and should not trigger an SDK mismatch; if expo-doctor flags them, add them to `expo.install.exclude` in `package.json` and note it.)

- [ ] **Step 5: Commit any cleanup**

If Step 4 required an `expo.install.exclude` edit:
```bash
git add package.json
git commit -m "chore: exclude dev-only better-sqlite3 from expo dependency validation"
```
Otherwise no commit is needed.

---

## Done criteria

- `npx jest` — all suites pass, including the four new repository/helper suites and the two rewritten store suites.
- `npx tsc --noEmit` — no type errors.
- `npx expo export --platform ios` — bundles without error.
- `npx expo-doctor` — passes.
- The focus engine works end to end in logic: presets persist and round-trip through the database; a session can be started (persisting a row), ticked down, and completed (marking the row complete and recording a streak day); streaks compute correctly across consecutive days.

The next plan (Focus UI) builds the Skia orb, the real Home screen, the session-in-progress screen, and the preset detail/edit sheet on top of this engine, plus schedules and `expo-notifications`.
