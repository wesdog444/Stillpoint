# Focus UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Focus UI so Home feels alive and useful: live ticking sessions, visible today/streak stats, and an inline preset editor instead of starter presets only.

**Architecture:** Stay inside the existing Focus Engine Core. Add one session repository read helper for completed minutes, then update `HomeScreen` with UI state and store actions. No new packages, no schedules, no notifications, no sanitized browser.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript, Zustand, op-sqlite, Jest, React Native Testing Library.

---

## File Structure

```
Stillpoint/
├── docs/superpowers/plans/2026-05-20-focus-ui-polish.md
└── src/
    ├── data/
    │   ├── sessionRepository.ts                  # add completed-minutes read helper
    │   └── __tests__/sessionRepository.test.ts
    └── screens/
        ├── HomeScreen.tsx                        # stats, interval ticking, editor
        └── __tests__/HomeScreen.test.tsx
```

---

## Task 1: Completed focus minutes helper

**Files:**
- Modify: `src/data/sessionRepository.ts`
- Modify: `src/data/__tests__/sessionRepository.test.ts`

- [ ] **Step 1: Add the failing test**

Extend `sessionRepository.test.ts` with a test proving completed sessions sum by day and incomplete sessions do not count.

- [ ] **Step 2: Run the focused test**

Run: `npx jest src/data/__tests__/sessionRepository.test.ts`
Expected: FAIL because `getCompletedFocusMinutesForDay` does not exist.

- [ ] **Step 3: Implement the helper**

Add `getCompletedFocusMinutesForDay(dayKey: string): number`, summing `duration_planned` for rows where `completed = 1` and `substr(started_at, 1, 10) = ?`.

- [ ] **Step 4: Verify**

Run: `npx jest src/data/__tests__/sessionRepository.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/sessionRepository.ts src/data/__tests__/sessionRepository.test.ts
git commit -m "feat: add completed focus minutes query"
```

---

## Task 2: Home stats and live ticking

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/__tests__/HomeScreen.test.tsx`

- [ ] **Step 1: Add failing tests**

Extend `HomeScreen.test.tsx` to prove:
- a running session ticks down when timers advance;
- completing a session updates the Home stat row to show today's focused minutes and streak.

- [ ] **Step 2: Run the focused test**

Run: `npx jest src/screens/__tests__/HomeScreen.test.tsx`
Expected: FAIL because Home does not own a timer interval or stat row.

- [ ] **Step 3: Implement Home changes**

Add a `useEffect` interval while `activeSession.status === 'running'`, show a compact stat row (`Today`, `Current streak`, `Longest`), and read stats from `getCompletedFocusMinutesForDay(todayKey())`, `getCurrentStreak()`, and `getLongestStreak()`.

- [ ] **Step 4: Verify**

Run: `npx jest src/screens/__tests__/HomeScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx src/screens/__tests__/HomeScreen.test.tsx
git commit -m "feat: add live home stats and ticking"
```

---

## Task 3: Inline preset editor

**Files:**
- Modify: `src/screens/HomeScreen.tsx`
- Modify: `src/screens/__tests__/HomeScreen.test.tsx`

- [ ] **Step 1: Add failing tests**

Extend `HomeScreen.test.tsx` to prove:
- tapping `New preset` opens editable fields and saving creates a preset;
- tapping `Edit` for an existing preset updates it;
- deleting from the editor removes the preset.

- [ ] **Step 2: Run the focused test**

Run: `npx jest src/screens/__tests__/HomeScreen.test.tsx`
Expected: FAIL because Home has no inline editor.

- [ ] **Step 3: Implement editor**

Add local draft state, `TextInput` fields for name and duration, mode selector buttons for friction mode, `Save preset`, `Cancel edit`, and `Delete preset` for existing presets.

- [ ] **Step 4: Verify**

Run: `npx jest src/screens/__tests__/HomeScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/HomeScreen.tsx src/screens/__tests__/HomeScreen.test.tsx
git commit -m "feat: add inline preset editor"
```

---

## Task 4: Final verification and handoff

**Files:**
- Modify: `CODEX_TO_CLAUDE_HANDOFF.txt`

- [ ] **Step 1: Run all tests**

Run: `npx jest`
Expected: PASS.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run Expo export**

Run: `npx expo export --platform ios --output-dir ./.tmp-export`, then delete `./.tmp-export`.
Expected: PASS.

- [ ] **Step 4: Run dependency hygiene**

Run: `npx expo-doctor`
Expected: 17/17.

- [ ] **Step 5: Update handoff**

Update `CODEX_TO_CLAUDE_HANDOFF.txt` with the full session summary, branch/commits, verification, in-flight status, and roadmap.

- [ ] **Step 6: Commit handoff**

```bash
git add CODEX_TO_CLAUDE_HANDOFF.txt
git commit -m "docs: update focus UI polish handoff"
```

---

## Done Criteria

- Home ticks active sessions every second while mounted.
- Home shows today's completed focus minutes plus current/longest streak.
- User can create, edit, and delete presets from Home.
- `npx jest`, `npx tsc --noEmit`, `npx expo export --platform ios`, and `npx expo-doctor` pass.
