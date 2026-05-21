# Stats & Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per AGENTS.md, UI UX Pro Max guidance was consulted while writing this plan (value-labeled bars, accessible per-bar labels, a summary fallback).

**Goal:** Build Stillpoint's Stats tab — a weekly focus overview (7-day bar chart + week total), streak stat cards, and an intentions journal (preview on Stats, full list on its own screen).

**Architecture:** A stats query layer (`getWeeklyFocusMinutes`) and an intentions-journal query extend the existing repositories — pure logic, fully unit-tested via the better-sqlite3-backed mock. The weekly chart is built from plain React Native `View`s (no charting library — no new native dependency, fully testable, accessible). The Stats tab becomes a native stack: an overview screen plus an intentions journal screen.

**Tech Stack:** TypeScript, React Native (plain-View bar chart), React Navigation v7 native stack, Jest + React Native Testing Library. Builds on merged Foundation → Friction Layer phases.

**Prerequisite reading:**
- `docs/superpowers/specs/2026-05-19-stillpoint-design.md` section 5.4 (Stats).
- `src/data/sessionRepository.ts` — has `getCompletedFocusMinutesForDay`, `getSessionsForDay`. Session `started_at` is a LOCAL timestamp (`localTimestamp()` from `src/lib/dates.ts`), so `substr(started_at,1,10)` is the local day.
- `src/data/streakRepository.ts` — `getCurrentStreak()`, `getLongestStreak()`.
- `src/data/intentionRepository.ts` — created in Plan 5 over the `intentions` table (columns: `id, created_at, text, site_key, session_id`). Task 2 extends it.
- `src/lib/dates.ts` — `todayKey()`, `previousDayKey(key)`, `dateKey(d)`.
- `src/screens/StatsScreen.tsx` — currently a `ScreenScaffold` placeholder; this plan replaces it.
- `src/nav/tabs.ts` / `src/nav/SocialStack.tsx` — the established tab + per-tab native stack pattern (mirror `SocialStack` for `StatsStack`).
- `src/theme/theme.ts` — `useTheme()`.

---

## File Structure

```
Stillpoint/
├── src/
│   ├── data/
│   │   ├── statsRepository.ts              # NEW: getWeeklyFocusMinutes()
│   │   ├── intentionRepository.ts          # MODIFIED: add getAllIntentions()
│   │   └── __tests__/
│   │       ├── statsRepository.test.ts
│   │       └── intentionRepository.test.ts # MODIFIED: add getAllIntentions tests
│   ├── components/
│   │   ├── WeeklyChart.tsx                  # NEW: plain-View 7-day bar chart
│   │   └── __tests__/WeeklyChart.test.tsx
│   ├── screens/
│   │   ├── StatsScreen.tsx                  # REWRITTEN: weekly overview
│   │   ├── IntentionsJournalScreen.tsx      # NEW: full intentions list
│   │   └── __tests__/
│   │       ├── StatsScreen.test.tsx
│   │       └── IntentionsJournalScreen.test.tsx
│   └── nav/
│       ├── StatsStack.tsx                   # NEW: Stats overview -> journal
│       ├── tabs.ts                          # MODIFIED: Stats tab uses StatsStack
│       └── __tests__/StatsStack.test.tsx
```

---

## Task 1: Stats repository — weekly focus minutes

**Files:**
- Create: `src/data/statsRepository.ts`
- Test: `src/data/__tests__/statsRepository.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/statsRepository.test.ts`:
```ts
import { initDatabase } from '../database';
import { insertSession, completeSession } from '../sessionRepository';
import { getWeeklyFocusMinutes } from '../statsRepository';
import { todayKey, previousDayKey } from '../../lib/dates';

const opSqlite = require('@op-engineering/op-sqlite');

/** Inserts an already-completed session on the given day. */
function seedCompletedSession(dayKey: string, minutes: number): void {
  const id = insertSession({
    startedAt: `${dayKey}T09:00:00`,
    durationPlanned: minutes,
    presetId: null,
  });
  completeSession(id, `${dayKey}T10:00:00`);
}

describe('statsRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('returns exactly 7 days, oldest first, today last', () => {
    const week = getWeeklyFocusMinutes();
    expect(week).toHaveLength(7);
    expect(week[6].dayKey).toBe(todayKey());
    expect(week[5].dayKey).toBe(previousDayKey(todayKey()));
  });

  it('every day is zero on a fresh database', () => {
    expect(getWeeklyFocusMinutes().every((d) => d.minutes === 0)).toBe(true);
  });

  it('sums completed-session minutes into the right day', () => {
    seedCompletedSession(todayKey(), 25);
    seedCompletedSession(todayKey(), 15);
    seedCompletedSession(previousDayKey(todayKey()), 30);
    const week = getWeeklyFocusMinutes();
    expect(week[6].minutes).toBe(40);
    expect(week[5].minutes).toBe(30);
  });

  it('ignores incomplete sessions', () => {
    insertSession({ startedAt: `${todayKey()}T09:00:00`, durationPlanned: 50, presetId: null });
    expect(getWeeklyFocusMinutes()[6].minutes).toBe(0);
  });

  it('each day carries a 3-letter weekday label', () => {
    for (const day of getWeeklyFocusMinutes()) {
      expect(day.weekday).toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/statsRepository.test.ts`
Expected: FAIL — cannot find module `../statsRepository`.

- [ ] **Step 3: Write the implementation**

Create `src/data/statsRepository.ts`:
```ts
import { getDatabase } from './database';
import { todayKey, previousDayKey } from '../lib/dates';

export type DayFocus = {
  /** 'YYYY-MM-DD' local day key. */
  dayKey: string;
  /** 3-letter weekday label, e.g. 'Mon'. */
  weekday: string;
  /** Completed focus minutes on that day. */
  minutes: number;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function weekdayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  return WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
}

/**
 * Completed focus minutes for each of the last 7 local days.
 * Oldest first; index 6 is today.
 */
export function getWeeklyFocusMinutes(): DayFocus[] {
  const days: string[] = [];
  let key = todayKey();
  for (let i = 0; i < 7; i += 1) {
    days.unshift(key);
    key = previousDayKey(key);
  }

  const result = getDatabase().execute(
    `SELECT substr(started_at, 1, 10) AS day, COALESCE(SUM(duration_planned), 0) AS total
     FROM sessions
     WHERE completed = 1
     GROUP BY day`,
  );
  const byDay = new Map<string, number>();
  for (const row of result.rows as { day: string; total: number }[]) {
    byDay.set(row.day, Number(row.total));
  }

  return days.map((dayKey) => ({
    dayKey,
    weekday: weekdayLabel(dayKey),
    minutes: byDay.get(dayKey) ?? 0,
  }));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/statsRepository.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/data/statsRepository.ts src/data/__tests__/statsRepository.test.ts
git commit -m "feat: add stats repository weekly focus query"
```

---

## Task 2: Intentions journal query

Extends the existing `intentionRepository.ts` (from Plan 5) with a query that returns all saved intention-check reasons, newest first.

**Files:**
- Modify: `src/data/intentionRepository.ts`
- Modify: `src/data/__tests__/intentionRepository.test.ts`

- [ ] **Step 1: Read the existing repository**

Open `src/data/intentionRepository.ts` and its test. It was created in Plan 5 over the `intentions` table (schema columns: `id INTEGER`, `created_at TEXT`, `text TEXT`, `site_key TEXT`, `session_id INTEGER`). Note the existing save-function name and whether an `IntentionRow` type is already exported — you will reuse the existing style and types.

- [ ] **Step 2: Write the failing test**

Append to `src/data/__tests__/intentionRepository.test.ts` a new test block. Use the existing save function (from Step 1) to seed rows; the example below assumes it is `saveIntention({ text, siteKey, sessionId })` — if Plan 5 named it differently, use that name and argument shape:
```ts
import { getAllIntentions } from '../intentionRepository';

describe('intentionRepository — journal query', () => {
  beforeEach(() => {
    const opSqlite = require('@op-engineering/op-sqlite');
    opSqlite.__resetMock();
    require('../database').initDatabase();
  });

  it('getAllIntentions is empty on a fresh database', () => {
    expect(getAllIntentions()).toEqual([]);
  });

  it('getAllIntentions returns saved reasons newest-first', () => {
    // Use the Plan 5 save function. Adjust the call to its real signature.
    const repo = require('../intentionRepository');
    const save = repo.saveIntention ?? repo.recordIntention ?? repo.insertIntention;
    save({ text: 'reply to Sam', siteKey: 'instagram', sessionId: null });
    save({ text: 'check DMs', siteKey: 'x', sessionId: null });
    const all = getAllIntentions();
    expect(all).toHaveLength(2);
    expect(all[0].text).toBe('check DMs');
    expect(all[1].text).toBe('reply to Sam');
  });
});
```
If the Plan 5 save function is not one of those three names, replace the `save` lookup with the actual exported name.

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/intentionRepository.test.ts`
Expected: FAIL — `getAllIntentions` is not exported.

- [ ] **Step 4: Add the query to the repository**

Add to `src/data/intentionRepository.ts` (reuse the existing `IntentionRow` type if one is exported; otherwise add this one):
```ts
export type IntentionRow = {
  id: number;
  created_at: string;
  text: string;
  site_key: string | null;
  session_id: number | null;
};

/** All saved intention-check reasons, newest first. */
export function getAllIntentions(): IntentionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM intentions ORDER BY created_at DESC, id DESC',
  );
  return result.rows as IntentionRow[];
}
```
Ensure `getDatabase` is imported (it already is if the repo has other queries). If an `IntentionRow` type already exists, do NOT duplicate it — reuse it as the return type.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/intentionRepository.test.ts`
Expected: PASS — all prior intention tests plus the 2 new ones green.

- [ ] **Step 6: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/data/intentionRepository.ts src/data/__tests__/intentionRepository.test.ts
git commit -m "feat: add intentions journal query"
```

---

## Task 3: Weekly chart component

A 7-bar chart built from plain `View`s. Each bar's height is proportional to the week's maximum; each bar shows its minute value and carries an accessibility label.

**Files:**
- Create: `src/components/WeeklyChart.tsx`
- Test: `src/components/__tests__/WeeklyChart.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/WeeklyChart.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WeeklyChart } from '../WeeklyChart';
import type { DayFocus } from '../../data/statsRepository';

const WEEK: DayFocus[] = [
  { dayKey: '2026-05-14', weekday: 'Thu', minutes: 0 },
  { dayKey: '2026-05-15', weekday: 'Fri', minutes: 30 },
  { dayKey: '2026-05-16', weekday: 'Sat', minutes: 60 },
  { dayKey: '2026-05-17', weekday: 'Sun', minutes: 45 },
  { dayKey: '2026-05-18', weekday: 'Mon', minutes: 90 },
  { dayKey: '2026-05-19', weekday: 'Tue', minutes: 20 },
  { dayKey: '2026-05-20', weekday: 'Wed', minutes: 50 },
];

describe('WeeklyChart', () => {
  it('renders a bar for each day with its weekday label', () => {
    render(<WeeklyChart data={WEEK} />);
    for (const day of WEEK) {
      expect(screen.getByTestId(`chart-bar-${day.dayKey}`)).toBeTruthy();
    }
    expect(screen.getAllByText('Mon').length).toBeGreaterThan(0);
  });

  it('gives each bar an accessibility label with its minutes', () => {
    render(<WeeklyChart data={WEEK} />);
    const bar = screen.getByTestId('chart-bar-2026-05-18');
    expect(bar.props.accessibilityLabel).toBe('Mon: 90 minutes focused');
  });

  it('renders without crashing when every day is zero', () => {
    const zero = WEEK.map((d) => ({ ...d, minutes: 0 }));
    render(<WeeklyChart data={zero} />);
    expect(screen.getByTestId('chart-bar-2026-05-20')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/components/__tests__/WeeklyChart.test.tsx`
Expected: FAIL — cannot find module `../WeeklyChart`.

- [ ] **Step 3: Write the implementation**

Create `src/components/WeeklyChart.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';
import type { DayFocus } from '../data/statsRepository';

type Props = {
  data: DayFocus[];
};

const CHART_HEIGHT = 120;

export function WeeklyChart({ data }: Props) {
  const theme = useTheme();
  const maxMinutes = Math.max(1, ...data.map((d) => d.minutes));

  return (
    <View style={styles.row}>
      {data.map((day) => {
        const fillHeight = Math.round((day.minutes / maxMinutes) * CHART_HEIGHT);
        return (
          <View key={day.dayKey} style={styles.column}>
            <Text style={[styles.value, { color: theme.colors.textMuted }]}>
              {day.minutes}
            </Text>
            <View style={[styles.track, { height: CHART_HEIGHT }]}>
              <View
                testID={`chart-bar-${day.dayKey}`}
                accessibilityLabel={`${day.weekday}: ${day.minutes} minutes focused`}
                style={[
                  styles.fill,
                  {
                    height: fillHeight,
                    backgroundColor: theme.colors.purple500,
                    borderRadius: theme.radius.sm,
                  },
                ]}
              />
            </View>
            <Text style={[styles.weekday, { color: theme.colors.textMuted }]}>
              {day.weekday}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  column: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 9 },
  track: { width: '100%', justifyContent: 'flex-end' },
  fill: { width: '100%', minHeight: 2 },
  weekday: { fontSize: 9 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/components/__tests__/WeeklyChart.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/components/WeeklyChart.tsx src/components/__tests__/WeeklyChart.test.tsx
git commit -m "feat: add weekly focus bar chart component"
```

---

## Task 4: Stats overview screen

Replaces the `StatsScreen` placeholder with the weekly overview: a week-total hero number, the `WeeklyChart`, streak stat cards, and an intentions journal preview. Navigation to the full journal is passed as a prop so the screen is testable in isolation.

**Files:**
- Modify (rewrite): `src/screens/StatsScreen.tsx`
- Create: `src/screens/__tests__/StatsScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/StatsScreen.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StatsScreen } from '../StatsScreen';
import { initDatabase } from '../../data/database';
import { insertSession, completeSession } from '../../data/sessionRepository';
import { todayKey } from '../../lib/dates';

const opSqlite = require('@op-engineering/op-sqlite');

describe('StatsScreen', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('shows a zero week total on a fresh database', () => {
    render(<StatsScreen onOpenJournal={() => {}} />);
    expect(screen.getByText(/0 min this week/i)).toBeTruthy();
  });

  it('sums completed sessions into the week total', () => {
    const id = insertSession({
      startedAt: `${todayKey()}T09:00:00`,
      durationPlanned: 40,
      presetId: null,
    });
    completeSession(id, `${todayKey()}T09:40:00`);
    render(<StatsScreen onOpenJournal={() => {}} />);
    expect(screen.getByText(/40 min this week/i)).toBeTruthy();
  });

  it('renders the weekly chart (7 bars)', () => {
    render(<StatsScreen onOpenJournal={() => {}} />);
    expect(screen.getByTestId(`chart-bar-${todayKey()}`)).toBeTruthy();
  });

  it('calls onOpenJournal when the journal preview is tapped', () => {
    const onOpenJournal = jest.fn();
    render(<StatsScreen onOpenJournal={onOpenJournal} />);
    fireEvent.press(screen.getByTestId('journal-preview'));
    expect(onOpenJournal).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/StatsScreen.test.tsx`
Expected: FAIL — `StatsScreen` does not accept `onOpenJournal` / renders only the placeholder.

- [ ] **Step 3: Rewrite the Stats screen**

Replace the entire contents of `src/screens/StatsScreen.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { WeeklyChart } from '../components/WeeklyChart';
import { getWeeklyFocusMinutes } from '../data/statsRepository';
import { getCurrentStreak, getLongestStreak } from '../data/streakRepository';
import { getAllIntentions } from '../data/intentionRepository';

type Props = {
  /** Opens the full intentions journal. */
  onOpenJournal: () => void;
};

export function StatsScreen({ onOpenJournal }: Props) {
  const theme = useTheme();
  const week = getWeeklyFocusMinutes();
  const weekTotal = week.reduce((sum, day) => sum + day.minutes, 0);
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();
  const intentions = getAllIntentions();
  const latestIntention = intentions[0];

  return (
    <SafeAreaView
      testID="screen-stats"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textMuted, textTransform: 'uppercase' },
          ]}
        >
          This week
        </Text>
        <Text style={[theme.typography.heroNumber, { color: theme.colors.textPrimary }]}>
          {weekTotal} min this week
        </Text>

        <WeeklyChart data={week} />

        <View style={styles.statRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
              Current streak
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {currentStreak} days
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
              Longest streak
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {longestStreak} days
            </Text>
          </View>
        </View>

        <Pressable
          testID="journal-preview"
          onPress={onOpenJournal}
          accessibilityRole="button"
          style={[
            styles.journal,
            { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
            Intentions journal · {intentions.length}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            {latestIntention ? `"${latestIntention.text}"` : 'No intentions logged yet'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, padding: 14, gap: 4 },
  journal: { borderWidth: 1, padding: 14, gap: 4 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/StatsScreen.test.tsx`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0. (Note: `tabs.ts` still references `StatsScreen` as a zero-prop component; a `tsc` error there is expected until Task 6 — record it as expected, not a failure, or do Task 6 next.)

- [ ] **Step 6: Commit**

```bash
git add src/screens/StatsScreen.tsx src/screens/__tests__/StatsScreen.test.tsx
git commit -m "feat: add Stats overview screen"
```

---

## Task 5: Intentions journal screen

A full-list screen of every saved intention reason.

**Files:**
- Create: `src/screens/IntentionsJournalScreen.tsx`
- Test: `src/screens/__tests__/IntentionsJournalScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/IntentionsJournalScreen.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { IntentionsJournalScreen } from '../IntentionsJournalScreen';
import { initDatabase } from '../../data/database';

const opSqlite = require('@op-engineering/op-sqlite');

describe('IntentionsJournalScreen', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('shows an empty state when there are no intentions', () => {
    render(<IntentionsJournalScreen />);
    expect(screen.getByText(/no intentions logged yet/i)).toBeTruthy();
  });

  it('lists every saved intention', () => {
    const repo = require('../../data/intentionRepository');
    const save = repo.saveIntention ?? repo.recordIntention ?? repo.insertIntention;
    save({ text: 'reply to Sam', siteKey: 'instagram', sessionId: null });
    save({ text: 'post an update', siteKey: 'x', sessionId: null });
    render(<IntentionsJournalScreen />);
    expect(screen.getByText('"reply to Sam"')).toBeTruthy();
    expect(screen.getByText('"post an update"')).toBeTruthy();
  });
});
```
(If the Plan 5 save function has a different name, use the real one — see Task 2 Step 1.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/IntentionsJournalScreen.test.tsx`
Expected: FAIL — cannot find module `../IntentionsJournalScreen`.

- [ ] **Step 3: Write the implementation**

Create `src/screens/IntentionsJournalScreen.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { getAllIntentions } from '../data/intentionRepository';

export function IntentionsJournalScreen() {
  const theme = useTheme();
  const intentions = getAllIntentions();

  return (
    <SafeAreaView
      testID="screen-intentions-journal"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          Intentions journal
        </Text>

        {intentions.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            No intentions logged yet
          </Text>
        ) : (
          intentions.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entry,
                { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                {`"${entry.text}"`}
              </Text>
              <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
                {entry.created_at}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  entry: { borderWidth: 1, padding: 14, gap: 4 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/IntentionsJournalScreen.test.tsx`
Expected: PASS — 2 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/screens/IntentionsJournalScreen.tsx src/screens/__tests__/IntentionsJournalScreen.test.tsx
git commit -m "feat: add intentions journal screen"
```

---

## Task 6: Stats stack navigation

Wires `StatsScreen` and `IntentionsJournalScreen` into a native stack, mirroring the `SocialStack` pattern. The Stats tab's component becomes this stack.

**Files:**
- Create: `src/nav/StatsStack.tsx`
- Modify: `src/nav/tabs.ts`
- Test: `src/nav/__tests__/StatsStack.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/nav/__tests__/StatsStack.test.tsx`:
```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StatsStack } from '../StatsStack';
import { initDatabase } from '../../data/database';

const opSqlite = require('@op-engineering/op-sqlite');

function renderStack() {
  return render(
    <NavigationContainer>
      <StatsStack />
    </NavigationContainer>,
  );
}

describe('StatsStack', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('shows the Stats overview first', () => {
    renderStack();
    expect(screen.getByTestId('screen-stats')).toBeTruthy();
  });

  it('navigates to the intentions journal when the preview is tapped', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('journal-preview'));
    expect(screen.getByTestId('screen-intentions-journal')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/nav/__tests__/StatsStack.test.tsx`
Expected: FAIL — cannot find module `../StatsStack`.

- [ ] **Step 3: Write the Stats stack**

Create `src/nav/StatsStack.tsx`:
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatsScreen } from '../screens/StatsScreen';
import { IntentionsJournalScreen } from '../screens/IntentionsJournalScreen';

export type StatsStackParamList = {
  StatsHome: undefined;
  IntentionsJournal: undefined;
};

const Stack = createNativeStackNavigator<StatsStackParamList>();

export function StatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatsHome">
        {({ navigation }) => (
          <StatsScreen onOpenJournal={() => navigation.navigate('IntentionsJournal')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="IntentionsJournal" component={IntentionsJournalScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Point the Stats tab at the stack**

In `src/nav/tabs.ts`, replace the `StatsScreen` import:
```ts
import { StatsScreen } from '../screens/StatsScreen';
```
with:
```ts
import { StatsStack } from './StatsStack';
```
and in the `TABS` array change the Stats entry's `component` from `StatsScreen` to `StatsStack`:
```ts
  { name: 'Stats', label: 'Stats', component: StatsStack, icon: BarChart3 },
```
Leave the other four tab entries unchanged.

- [ ] **Step 5: Run the test and the type check**

Run: `npx jest src/nav/__tests__/StatsStack.test.tsx`
Expected: PASS — 2 tests green.

Run: `npx tsc --noEmit`
Expected: exit 0 (the `tabs.ts` error noted in Task 4 Step 5 is now resolved).

Run: `npx jest src/nav`
Expected: PASS — `StatsStack`, `SocialStack`, `RootNavigator` suites all green.

- [ ] **Step 6: Commit**

```bash
git add src/nav/StatsStack.tsx src/nav/tabs.ts src/nav/__tests__/StatsStack.test.tsx
git commit -m "feat: wire Stats tab to a stack with the intentions journal"
```

---

## Task 7: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `npx jest`
Expected: PASS — every suite green, including the new `statsRepository`, `WeeklyChart`, `StatsScreen`, `IntentionsJournalScreen`, `StatsStack` suites and the extended `intentionRepository` suite.

- [ ] **Step 2: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 3: Verify the bundle builds**

Run: `npx expo export --platform ios --output-dir ./.tmp-export`
Expected: completes without error. Then: `rm -rf ./.tmp-export`.

- [ ] **Step 4: Run dependency hygiene check**

Run: `npx expo-doctor`
Expected: 17/17 checks pass.

- [ ] **Step 5: Commit (only if Step 4 required a fix)**

If `expo-doctor` flagged something and you corrected it, commit the fix. Otherwise no commit is needed.

---

## Done criteria

- `npx jest` — all suites pass, including the five new suites and the extended intentions suite.
- `npx tsc --noEmit` — no type errors.
- `npx expo export --platform ios` — bundles without error.
- `npx expo-doctor` — passes.
- The Stats tab shows the week total, a 7-day bar chart, current/longest streak cards, and an intentions journal preview; tapping the preview opens the full journal screen.

**Deliberately deferred:** a full session-history list screen (the roadmap mentioned it
under Stats). It is omitted here to keep this plan focused and cohesive — `getRecentSessions`
already exists in `sessionRepository`, so a history screen is a small follow-up. Add it as a
short "Stats — session history" slice before, or alongside, the next plan if desired.

The next plan (Onboarding & Shortcuts) covers the Personal Edition onboarding flow, the Shortcuts automation walkthrough, and `stillpoint://` deep links.
