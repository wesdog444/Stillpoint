# Social Mini-App Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Social tab into a Stillpoint-owned mini-app shell with a stable timer, correct toolbar actions, stronger sanitizer behavior, and real Blocks/Profile surfaces.

**Architecture:** Keep the existing React Native + WebView stack. Add small pure helpers for timer formatting and social destinations, keep BrowserScreen responsible for WebView chrome, and keep Blocks/Profile as screen-level dashboards.

**Tech Stack:** Expo SDK 54, React Native, React Navigation, react-native-webview 13.15.0, lucide-react-native, Jest + React Native Testing Library.

---

## Files

- Modify `src/screens/BrowserScreen.tsx`: timer-only chrome, toolbar callbacks, destination rail, account manager overlay, WebView persistence props.
- Modify `src/nav/SocialStack.tsx`: pass a return-to-social callback into BrowserScreen.
- Modify `src/sanitizer/injection.ts`: dynamic sanitizer loop.
- Modify `src/sanitizer/rules.ts`: stronger Instagram selectors and destination metadata if needed.
- Create `src/social/destinations.ts`: platform destination labels and URLs.
- Create `src/ui/sessionTimer.ts`: elapsed timer formatting.
- Modify `src/screens/BlocksScreen.tsx`: scheduler/control center.
- Modify `src/screens/ProfileScreen.tsx`: summary/settings surface.
- Update tests under `src/screens/__tests__`, `src/sanitizer/__tests__`, and `src/ui/__tests__`.

## Tasks

### Task 1: Stable Timer Helper

- [ ] Add tests in `src/ui/__tests__/sessionTimer.test.ts` for `formatElapsedSeconds(0) -> "0:00"`, `formatElapsedSeconds(65) -> "1:05"`, and `formatElapsedSeconds(3600) -> "60:00"`.
- [ ] Create `src/ui/sessionTimer.ts` with `formatElapsedSeconds`.
- [ ] Run `npx jest src/ui/__tests__/sessionTimer.test.ts --runInBand`.

### Task 2: Browser Chrome Behavior

- [ ] Update `src/screens/__tests__/BrowserScreen.test.tsx` so it expects only the timer, no "0 ads", no "0 suggested", and no "Block these".
- [ ] Add tests that Back calls `goBack`, Refresh calls `reload`, Forward calls `goForward`, Home calls an `onReturnHome` prop, and Account opens an account manager.
- [ ] Update BrowserScreen implementation.
- [ ] Run `npx jest src/screens/__tests__/BrowserScreen.test.tsx --runInBand`.

### Task 3: Social Destinations

- [ ] Add `src/social/destinations.ts` with per-site destinations: Messages, Search, Profile, Account, Breathe.
- [ ] Add tests ensuring Instagram destinations avoid Reels.
- [ ] Render the destination rail in BrowserScreen.
- [ ] Run the BrowserScreen and social destination tests.

### Task 4: Stronger Sanitizer

- [ ] Add injection tests that the generated script includes a repeated cleanup loop and the new Instagram Reels/feed selectors.
- [ ] Update `src/sanitizer/injection.ts` and `src/sanitizer/rules.ts`.
- [ ] Run sanitizer tests.

### Task 5: Blocks Scheduler Surface

- [ ] Replace placeholder Blocks tests with checks for scheduler copy, active hours, Shortcut instructions, and `stillpoint://breathe`.
- [ ] Implement the Blocks scheduler/control center UI.
- [ ] Run Blocks tests.

### Task 6: Profile Surface

- [ ] Add/replace Profile tests for focus stats, social status, Shortcuts status, and Personal Edition copy.
- [ ] Implement Profile screen.
- [ ] Run Profile tests.

### Task 7: Full Verification and Publish

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npx jest --runInBand`.
- [ ] Run `npx expo-doctor`.
- [ ] Run `npx expo export --platform ios`.
- [ ] Update `CLAUDE_TO_CODEX_HANDOFF.txt`.
- [ ] Commit, merge to master, push, and watch the GitHub IPA workflow.

