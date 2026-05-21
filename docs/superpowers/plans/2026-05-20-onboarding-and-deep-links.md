# Onboarding & Deep Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per AGENTS.md, invoke UI UX Pro Max before building the onboarding UI.

**Goal:** Build Stillpoint's first-run onboarding flow (welcome, Personal Edition philosophy, notification permission, Shortcuts-automation walkthrough) and `stillpoint://` deep-link routing so iOS Shortcuts redirect automations can land on the sanitized browser.

**Architecture:** Onboarding is a self-contained multi-step flow component gated on the existing `settingsStore.onboardingComplete` flag — `App.tsx` shows it on first run, then the tab navigator. Step content is plain data so steps are easy to test. A notification-permission helper wraps `expo-notifications`. Deep linking is a React Navigation `linking` config object (pure data, unit-testable) wired into the navigation container.

**Tech Stack:** TypeScript, React Native, `expo-notifications` (new dependency), React Navigation v7 linking, Zustand, Jest + React Native Testing Library. Builds on merged Foundation → Stats & Insights phases.

**Scope guard:** This plan covers the *testable React Native* half of "Onboarding & Shortcuts". The Swift **App Intents** (exposing Stillpoint actions to the iOS Shortcuts app) require native code + an Expo config plugin and are intentionally deferred to a later plan. The Shortcuts *walkthrough* here is instructional UI — it teaches the user to build redirect automations by hand; it does not create them.

**Prerequisite reading:**
- `docs/superpowers/specs/2026-05-19-stillpoint-design.md` sections 2 (Personal Edition constraints), 5.7 (onboarding), 6.6 (Shortcuts).
- `src/state/settingsStore.ts` — exports `useSettingsStore` with `onboardingComplete: boolean` and `completeOnboarding(): void`.
- `App.tsx` — currently: loads fonts, `initDatabase()`, renders `SafeAreaProvider` + `StatusBar` + `RootNavigator`.
- `src/nav/RootNavigator.tsx` — `NavigationContainer` wrapping a bottom-tab navigator built from `TABS`.
- `src/nav/SocialStack.tsx` — `SocialStackParamList` has `Browser: { siteKey: SiteKey }`; route name `SocialHome`.
- `app.json` — already declares `"scheme": "stillpoint"`.
- `src/theme/theme.ts` — `useTheme()`.

---

## File Structure

```
Stillpoint/
├── App.tsx                                  # MODIFIED: gate onboarding on settingsStore
├── jest.setup.ts                            # MODIFIED: add expo-notifications mock
├── src/
│   ├── lib/
│   │   ├── notifications.ts                  # NEW: requestNotificationPermission()
│   │   └── __tests__/notifications.test.ts
│   ├── onboarding/
│   │   ├── steps.ts                          # NEW: onboarding step content (data)
│   │   ├── OnboardingFlow.tsx                # NEW: multi-step flow component
│   │   └── __tests__/OnboardingFlow.test.tsx
│   └── nav/
│       ├── linking.ts                        # NEW: stillpoint:// linking config
│       ├── RootNavigator.tsx                 # MODIFIED: pass linking to NavigationContainer
│       └── __tests__/linking.test.ts
```

---

## Task 1: Add expo-notifications and its test mock

**Files:**
- Modify: `package.json`
- Modify: `jest.setup.ts`

- [ ] **Step 1: Install expo-notifications**

Run:
```bash
npx expo install expo-notifications
```
Network operation — use a long timeout (300000ms).

- [ ] **Step 2: Add an expo-notifications mock to jest.setup.ts**

Append this block to the END of `jest.setup.ts` (after the existing mocks; do not modify the existing ones):
```ts
// --- expo-notifications mock: permission request resolves to "granted" ---
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
}));
```

- [ ] **Step 3: Verify the existing suite still passes**

Run: `npx jest`
Expected: PASS — all 32 existing suites / 144 tests still green.

- [ ] **Step 4: Verify the type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json jest.setup.ts
git commit -m "chore: add expo-notifications and its Jest mock"
```

---

## Task 2: Notification permission helper

**Files:**
- Create: `src/lib/notifications.ts`
- Test: `src/lib/__tests__/notifications.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/notifications.test.ts`:
```ts
import { requestNotificationPermission } from '../notifications';

const expoNotifications = require('expo-notifications');

describe('requestNotificationPermission', () => {
  beforeEach(() => {
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockClear();
  });

  it('returns true when permission is granted', async () => {
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    await expect(requestNotificationPermission()).resolves.toBe(true);
  });

  it('returns false when permission is denied', async () => {
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });

  it('calls expo-notifications requestPermissionsAsync', async () => {
    await requestNotificationPermission();
    expect(expoNotifications.requestPermissionsAsync).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib/__tests__/notifications.test.ts`
Expected: FAIL — cannot find module `../notifications`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/notifications.ts`:
```ts
import * as Notifications from 'expo-notifications';

/**
 * Requests the OS notification permission.
 * Returns true if the user granted it, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const result = await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/lib/__tests__/notifications.test.ts`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/notifications.ts src/lib/__tests__/notifications.test.ts
git commit -m "feat: add notification permission helper"
```

---

## Task 3: Onboarding step content

The onboarding steps are plain data so the flow component stays simple and the content is easy to test and edit.

**Files:**
- Create: `src/onboarding/steps.ts`
- Test: `src/onboarding/__tests__/steps.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/onboarding/__tests__/steps.test.ts`:
```ts
import { ONBOARDING_STEPS } from '../steps';

describe('ONBOARDING_STEPS', () => {
  it('has four steps in order: welcome, philosophy, notifications, shortcuts', () => {
    expect(ONBOARDING_STEPS.map((s) => s.key)).toEqual([
      'welcome',
      'philosophy',
      'notifications',
      'shortcuts',
    ]);
  });

  it('every step has a title and at least one body paragraph', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.body.length).toBeGreaterThan(0);
    }
  });

  it('the notifications step is flagged as the permission step', () => {
    const notif = ONBOARDING_STEPS.find((s) => s.key === 'notifications');
    expect(notif?.requestsNotificationPermission).toBe(true);
  });

  it('the shortcuts step lists numbered automation instructions', () => {
    const shortcuts = ONBOARDING_STEPS.find((s) => s.key === 'shortcuts');
    expect(shortcuts?.steps?.length).toBeGreaterThan(0);
  });

  it('never uses the word "block" in onboarding copy (Personal Edition: "sanitize")', () => {
    const allCopy = ONBOARDING_STEPS.flatMap((s) => [s.title, ...s.body, ...(s.steps ?? [])])
      .join(' ')
      .toLowerCase();
    expect(allCopy).not.toContain('block');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/onboarding/__tests__/steps.test.ts`
Expected: FAIL — cannot find module `../steps`.

- [ ] **Step 3: Write the step content**

Create `src/onboarding/steps.ts`:
```ts
export type OnboardingStep = {
  key: 'welcome' | 'philosophy' | 'notifications' | 'shortcuts';
  title: string;
  /** Body paragraphs. */
  body: string[];
  /** Present on the notifications step — its primary button requests permission. */
  requestsNotificationPermission?: boolean;
  /** Numbered instruction lines, used by the shortcuts walkthrough step. */
  steps?: string[];
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: 'welcome',
    title: 'Welcome to Stillpoint',
    body: [
      'Stillpoint helps you use your phone on purpose.',
      'Start focus sessions, and reach social media through a calm, sanitized browser instead of the endless feed.',
    ],
  },
  {
    key: 'philosophy',
    title: 'How Stillpoint works',
    body: [
      'Stillpoint is a personal companion, not an enforcer.',
      'It gives you a sanitized way into social sites and gentle friction during focus sessions — the calm path is the easy one.',
      'It cannot police the native apps; the rest is up to you.',
    ],
  },
  {
    key: 'notifications',
    title: 'Gentle reminders',
    body: [
      'Stillpoint can remind you when a scheduled focus session is about to start.',
      'Reminders are quiet and optional — you can change this any time in Settings.',
    ],
    requestsNotificationPermission: true,
  },
  {
    key: 'shortcuts',
    title: 'Set up redirect Shortcuts',
    body: [
      'For each social app you want to redirect, create one iOS Shortcuts automation.',
      'Every reflexive tap on that app will bounce you into Stillpoint instead.',
    ],
    steps: [
      'Open the Shortcuts app and go to the Automation tab.',
      'Tap +, choose "App", and pick the social app (e.g. Instagram).',
      'Set it to run when the app "Is Opened", and turn on "Run Immediately".',
      'Add the action "Open App" and choose Stillpoint.',
      'Save. Repeat for each app you want to redirect.',
    ],
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/onboarding/__tests__/steps.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/onboarding/steps.ts src/onboarding/__tests__/steps.test.ts
git commit -m "feat: add onboarding step content"
```

---

## Task 4: Onboarding flow component

A multi-step flow: shows one step at a time, Next/Back, the notifications step's primary button requests permission, the final step finishes onboarding via `settingsStore`.

**Files:**
- Create: `src/onboarding/OnboardingFlow.tsx`
- Test: `src/onboarding/__tests__/OnboardingFlow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/onboarding/__tests__/OnboardingFlow.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingFlow } from '../OnboardingFlow';
import { useSettingsStore } from '../../state/settingsStore';

describe('OnboardingFlow', () => {
  beforeEach(() => {
    useSettingsStore.setState({ onboardingComplete: false });
  });

  it('starts on the welcome step', () => {
    render(<OnboardingFlow />);
    expect(screen.getByText('Welcome to Stillpoint')).toBeTruthy();
  });

  it('advances through the steps with the Next button', () => {
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('How Stillpoint works')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('Gentle reminders')).toBeTruthy();
  });

  it('goes back with the Back button', () => {
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-back'));
    expect(screen.getByText('Welcome to Stillpoint')).toBeTruthy();
  });

  it('finishing the last step completes onboarding', async () => {
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next')); // -> philosophy
    fireEvent.press(screen.getByTestId('onboarding-next')); // -> notifications
    fireEvent.press(screen.getByTestId('onboarding-next')); // -> shortcuts
    fireEvent.press(screen.getByTestId('onboarding-next')); // finish
    await waitFor(() => {
      expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    });
  });

  it('the notifications step requests permission when its button is pressed', async () => {
    const expoNotifications = require('expo-notifications');
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockClear();
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next')); // -> philosophy
    fireEvent.press(screen.getByTestId('onboarding-next')); // -> notifications
    fireEvent.press(screen.getByTestId('onboarding-enable-notifications'));
    await waitFor(() => {
      expect(expoNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/onboarding/__tests__/OnboardingFlow.test.tsx`
Expected: FAIL — cannot find module `../OnboardingFlow`.

- [ ] **Step 3: Write the component**

Create `src/onboarding/OnboardingFlow.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { useSettingsStore } from '../state/settingsStore';
import { requestNotificationPermission } from '../lib/notifications';
import { ONBOARDING_STEPS } from './steps';

export function OnboardingFlow() {
  const theme = useTheme();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);

  const step = ONBOARDING_STEPS[index];
  const isLast = index === ONBOARDING_STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => setIndex((i) => Math.max(0, i - 1));

  return (
    <SafeAreaView
      testID="onboarding-flow"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textMuted, textTransform: 'uppercase' },
          ]}
        >
          {`Step ${index + 1} of ${ONBOARDING_STEPS.length}`}
        </Text>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {step.title}
        </Text>

        {step.body.map((paragraph, i) => (
          <Text
            key={`body-${i}`}
            style={[theme.typography.body, { color: theme.colors.textSecondary }]}
          >
            {paragraph}
          </Text>
        ))}

        {step.steps?.map((line, i) => (
          <Text
            key={`line-${i}`}
            style={[theme.typography.body, { color: theme.colors.textPrimary }]}
          >
            {`${i + 1}. ${line}`}
          </Text>
        ))}

        {step.requestsNotificationPermission ? (
          <Pressable
            testID="onboarding-enable-notifications"
            accessibilityRole="button"
            onPress={() => {
              void requestNotificationPermission();
            }}
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.accent, borderRadius: theme.radius.card },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.accent }]}>
              Enable reminders
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={[styles.nav, { padding: theme.spacing.lg }]}>
        {index > 0 ? (
          <Pressable
            testID="onboarding-back"
            accessibilityRole="button"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
              Back
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <Pressable
          testID="onboarding-next"
          accessibilityRole="button"
          onPress={goNext}
          style={[
            styles.nextButton,
            { backgroundColor: theme.colors.purple500, borderRadius: theme.radius.card },
          ]}
        >
          <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
            {isLast ? 'Finish' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  secondaryButton: { borderWidth: 1, padding: 14, alignItems: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { padding: 12, minWidth: 64 },
  nextButton: { paddingVertical: 12, paddingHorizontal: 28 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/onboarding/__tests__/OnboardingFlow.test.tsx`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/onboarding/OnboardingFlow.tsx src/onboarding/__tests__/OnboardingFlow.test.tsx
git commit -m "feat: add onboarding flow component"
```

---

## Task 5: Deep-link configuration

A React Navigation `linking` config so `stillpoint://` URLs route into the app — in particular `stillpoint://sanitized/<site>` opens the sanitized browser.

**Files:**
- Create: `src/nav/linking.ts`
- Test: `src/nav/__tests__/linking.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/nav/__tests__/linking.test.ts`:
```ts
import { linking } from '../linking';

describe('deep-link config', () => {
  it('registers the stillpoint:// scheme', () => {
    expect(linking.prefixes).toContain('stillpoint://');
  });

  it('maps the Social tab and a sanitized-browser route with a siteKey param', () => {
    const social = linking.config?.screens?.Social as
      | { screens?: Record<string, unknown> }
      | undefined;
    expect(social?.screens?.Browser).toBe('sanitized/:siteKey');
    expect(social?.screens?.SocialHome).toBe('social');
  });

  it('maps the Home tab', () => {
    expect(linking.config?.screens?.Home).toBe('home');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/nav/__tests__/linking.test.ts`
Expected: FAIL — cannot find module `../linking`.

- [ ] **Step 3: Write the linking config**

Create `src/nav/linking.ts`:
```ts
import type { LinkingOptions } from '@react-navigation/native';

/**
 * Deep-link config for the `stillpoint://` scheme. Shortcuts redirect
 * automations open URLs like `stillpoint://sanitized/instagram`, which routes
 * to the Social tab's Browser screen with `siteKey` = 'instagram'.
 */
// `LinkingOptions<any>`: the tab and per-tab stack param lists are not unified
// into one root ParamList, so a precise generic adds friction without value.
export const linking: LinkingOptions<any> = {
  prefixes: ['stillpoint://'],
  config: {
    screens: {
      Home: 'home',
      Social: {
        screens: {
          SocialHome: 'social',
          Browser: 'sanitized/:siteKey',
        },
      },
      Blocks: 'blocks',
      Stats: 'stats',
      Profile: 'profile',
    },
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/nav/__tests__/linking.test.ts`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/nav/linking.ts src/nav/__tests__/linking.test.ts
git commit -m "feat: add stillpoint:// deep-link configuration"
```

---

## Task 6: Wire onboarding gating and deep linking into the app

**Files:**
- Modify: `src/nav/RootNavigator.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Pass the linking config to the navigation container**

In `src/nav/RootNavigator.tsx`, add the import:
```ts
import { linking } from './linking';
```
and change the `<NavigationContainer>` opening tag to pass the config:
```tsx
    <NavigationContainer linking={linking}>
```
Leave everything else in the file unchanged.

- [ ] **Step 2: Gate onboarding in App.tsx**

In `App.tsx`, add these imports alongside the existing ones:
```ts
import { useSettingsStore } from './src/state/settingsStore';
import { OnboardingFlow } from './src/onboarding/OnboardingFlow';
```
Then, inside the `App` component, after the existing `fontsLoaded` / `dbReady` logic and the loading-guard `return`, read the onboarding flag and branch. Replace the final `return (...)` block so it reads:
```tsx
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {onboardingComplete ? <RootNavigator /> : <OnboardingFlow />}
    </SafeAreaProvider>
  );
```
Keep the font/DB loading guard above it exactly as it is. The `useSettingsStore` hook call must be at the top level of the component (with the other hooks), not inside a conditional — place the `const onboardingComplete = ...` line with the other hook calls near the top of `App`, and only use it in the final `return`.

- [ ] **Step 3: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Run the navigation and onboarding suites**

Run: `npx jest src/nav src/onboarding`
Expected: PASS — `linking`, `RootNavigator`, `SocialStack`, `StatsStack`, `steps`, `OnboardingFlow` suites all green.

- [ ] **Step 5: Commit**

```bash
git add src/nav/RootNavigator.tsx App.tsx
git commit -m "feat: gate onboarding on first run and enable deep linking"
```

---

## Task 7: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `npx jest`
Expected: PASS — every suite green, including the new `notifications`, `steps`, `OnboardingFlow`, `linking` suites.

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

- `npx jest` — all suites pass, including the four new suites.
- `npx tsc --noEmit` — no type errors.
- `npx expo export --platform ios` — bundles without error.
- `npx expo-doctor` — passes.
- On first run the app shows the 4-step onboarding flow; finishing it sets `onboardingComplete` and the app shows the tab navigator from then on. `stillpoint://sanitized/<site>` deep links are configured to route to the sanitized browser.

**Deferred (next plan):** the Swift **App Intents** that expose Stillpoint actions ("Start Focus Session", "Open Sanitized <site>", "Log a Distraction") to the iOS Shortcuts app. That requires native Swift in the main target plus an Expo config plugin, and cannot be unit-tested on Windows — it belongs with the CI / dev-build work.

The next plan (CI & Dev Build) sets up a GitHub Actions macOS runner to produce an unsigned `.ipa` for Sideloadly, adds the Swift App Intents, and covers a real-device smoke test of the native modules.
