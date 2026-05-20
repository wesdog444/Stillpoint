# Sanitized Social Browser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stillpoint's sanitized in-app browser — a Social tab listing supported sites, and an in-app WebView that loads each site's web version with its addictive surfaces (Reels, Explore, For You, Shorts, autoplay) stripped out via injected CSS/JS.

**Architecture:** A pure-logic sanitizer layer (`src/sanitizer/`) defines per-site rules (URL, CSS selectors to hide, optional JS) and a builder that compiles a rule into one WebView injection string — both fully unit-tested. The UI layer adds a `SocialScreen` cards grid and a `BrowserScreen` WebView shell, navigated via a per-tab native stack. The WebView is the only non-unit-testable piece; the screens are tested with React Native Testing Library against a mocked `react-native-webview`.

**Tech Stack:** TypeScript, `react-native-webview` (new dependency), React Navigation v7 native stack, Zustand-free (no new state), Jest + React Native Testing Library. Builds on the merged Foundation + Focus Engine + Focus UI phases.

**Scope guard (Personal Edition):** This sanitizes only Stillpoint's *own* in-app WebView. It does NOT touch the native Instagram/X/YouTube/TikTok apps and must never claim to "block" them. UI copy uses "sanitize" / "calm" / "without the feed", never "block".

**Prerequisite reading:**
- `docs/superpowers/specs/2026-05-19-stillpoint-design.md` section 6.3 (sanitized browser).
- `src/screens/SocialScreen.tsx` — currently a `ScreenScaffold` placeholder; this plan replaces it.
- `src/nav/tabs.ts` — `TabDef` has `name`, `label`, `component`, `icon`; `TABS` array. `src/nav/RootNavigator.tsx` renders `tab.component` per tab.
- `src/theme/theme.ts` — `useTheme()` returns `{ colors, spacing, radius, typography, fontFamily }`.
- `jest.setup.ts` — already mocks `react-native-mmkv` and `@op-engineering/op-sqlite`. This plan adds a `react-native-webview` mock.
- `@react-navigation/native-stack` is already installed.

---

## File Structure

```
Stillpoint/
├── jest.setup.ts                          # MODIFIED: add react-native-webview mock
├── src/
│   ├── sanitizer/
│   │   ├── types.ts                        # NEW: SiteKey, SanitizerRule types
│   │   ├── rules.ts                        # NEW: per-site rule registry + lookup
│   │   ├── injection.ts                    # NEW: buildInjection(rule) -> string
│   │   └── __tests__/
│   │       ├── rules.test.ts
│   │       └── injection.test.ts
│   ├── screens/
│   │   ├── SocialScreen.tsx                # REWRITTEN: site cards grid
│   │   ├── BrowserScreen.tsx               # NEW: sanitized WebView shell
│   │   └── __tests__/
│   │       ├── SocialScreen.test.tsx
│   │       └── BrowserScreen.test.tsx
│   └── nav/
│       ├── SocialStack.tsx                 # NEW: native stack (Social list -> Browser)
│       ├── tabs.ts                         # MODIFIED: Social tab uses SocialStack
│       └── __tests__/SocialStack.test.tsx
```

The sanitizer layer is pure data + pure functions (no React, no native) so it is fully testable. Screens depend on the sanitizer, never the reverse.

---

## Task 1: Add react-native-webview and its test mock

**Files:**
- Modify: `package.json` (add `react-native-webview`)
- Modify: `jest.setup.ts`

- [ ] **Step 1: Install react-native-webview**

Run:
```bash
npx expo install react-native-webview
```
`expo install` resolves the Expo SDK 54-compatible version. This is a network operation — use a long timeout (300000ms).

- [ ] **Step 2: Add a WebView mock to jest.setup.ts**

`react-native-webview` is a native module that cannot render in Jest. Append this block to the END of `jest.setup.ts` (after the existing mocks; do not modify the existing `react-native-mmkv` or `@op-engineering/op-sqlite` mocks):
```ts
// --- react-native-webview mock: a plain View carrying the props as testIDs ---
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  const WebView = (props: Record<string, unknown>) =>
    React.createElement(View, { testID: 'mock-webview', ...props });
  return { WebView, default: WebView };
});
```

- [ ] **Step 3: Verify the existing suite still passes**

Run: `npx jest`
Expected: PASS — all 18 existing suites / 88 tests still green (the new mock is unused so far, so nothing changes).

- [ ] **Step 4: Verify the type check**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json jest.setup.ts
git commit -m "chore: add react-native-webview and its Jest mock"
```

---

## Task 2: Sanitizer types and per-site rule registry

**Files:**
- Create: `src/sanitizer/types.ts`
- Create: `src/sanitizer/rules.ts`
- Test: `src/sanitizer/__tests__/rules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/sanitizer/__tests__/rules.test.ts`:
```ts
import { SITE_KEYS, getRule, ALL_RULES } from '../rules';

describe('sanitizer rules', () => {
  it('lists the four supported sites', () => {
    expect(SITE_KEYS).toEqual(['instagram', 'x', 'youtube', 'tiktok']);
  });

  it('provides a rule for every site key', () => {
    for (const key of SITE_KEYS) {
      const rule = getRule(key);
      expect(rule.key).toBe(key);
      expect(rule.url).toMatch(/^https:\/\//);
      expect(rule.displayName.length).toBeGreaterThan(0);
      expect(rule.removed.length).toBeGreaterThan(0);
      expect(rule.hideSelectors.length).toBeGreaterThan(0);
    }
  });

  it('ALL_RULES has one entry per site key', () => {
    expect(ALL_RULES.map((r) => r.key)).toEqual(SITE_KEYS);
  });

  it('the instagram rule targets Reels and Explore', () => {
    const rule = getRule('instagram');
    expect(rule.removed.join(' ').toLowerCase()).toContain('reels');
    expect(rule.removed.join(' ').toLowerCase()).toContain('explore');
  });

  it('getRule throws for an unknown key', () => {
    // @ts-expect-error testing the runtime guard with an invalid key
    expect(() => getRule('facebook')).toThrow(/unknown site/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/sanitizer/__tests__/rules.test.ts`
Expected: FAIL — cannot find module `../rules`.

- [ ] **Step 3: Write the types**

Create `src/sanitizer/types.ts`:
```ts
/** The social sites Stillpoint can sanitize. */
export type SiteKey = 'instagram' | 'x' | 'youtube' | 'tiktok';

/** A sanitization rule for one site. */
export type SanitizerRule = {
  key: SiteKey;
  /** Human-readable site name, shown on the Social card. */
  displayName: string;
  /** The web URL the in-app browser loads. */
  url: string;
  /** Short human-readable list of what is stripped (shown on the card). */
  removed: string[];
  /** CSS selectors hidden via an injected stylesheet. */
  hideSelectors: string[];
  /** Optional extra JavaScript run after the stylesheet is injected. */
  script?: string;
};
```

- [ ] **Step 4: Write the rule registry**

Create `src/sanitizer/rules.ts`:
```ts
import type { SiteKey, SanitizerRule } from './types';

export const SITE_KEYS: SiteKey[] = ['instagram', 'x', 'youtube', 'tiktok'];

/**
 * First-pass sanitizer rules. Site markup changes often; these selectors are a
 * starting point and are expected to need maintenance. They are intentionally
 * conservative — hide addictive surfaces, preserve messaging/search/profiles.
 */
const RULES: Record<SiteKey, SanitizerRule> = {
  instagram: {
    key: 'instagram',
    displayName: 'Instagram',
    url: 'https://www.instagram.com/',
    removed: ['Reels tab', 'Explore page', 'Suggested posts'],
    hideSelectors: [
      'a[href="/reels/"]',
      'a[href="/explore/"]',
      'div[aria-label="Explore"]',
    ],
  },
  x: {
    key: 'x',
    displayName: 'X',
    url: 'https://x.com/home',
    removed: ['"For you" feed', 'Trending sidebar', 'Explore tab'],
    hideSelectors: [
      'a[href="/explore"]',
      'div[aria-label="Timeline: Trending now"]',
      'aside[aria-label="Trending"]',
    ],
  },
  youtube: {
    key: 'youtube',
    displayName: 'YouTube',
    url: 'https://www.youtube.com/feed/subscriptions',
    removed: ['Shorts shelf', 'Recommended grid', 'Autoplay'],
    hideSelectors: [
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-reel-shelf-renderer',
      'a[title="Shorts"]',
    ],
    script:
      "document.querySelectorAll('video').forEach(function(v){v.autoplay=false;});",
  },
  tiktok: {
    key: 'tiktok',
    displayName: 'TikTok',
    url: 'https://www.tiktok.com/messages',
    removed: ['For You feed', 'Explore page'],
    hideSelectors: [
      'a[href="/foryou"]',
      'a[href="/explore"]',
      'div[data-e2e="recommend-list-item-container"]',
    ],
  },
};

/** Every rule, in `SITE_KEYS` order. */
export const ALL_RULES: SanitizerRule[] = SITE_KEYS.map((key) => RULES[key]);

/** Returns the rule for a site key. Throws if the key is not supported. */
export function getRule(key: SiteKey): SanitizerRule {
  const rule = RULES[key];
  if (!rule) {
    throw new Error(`Unknown site: ${key}`);
  }
  return rule;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/sanitizer/__tests__/rules.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/sanitizer/types.ts src/sanitizer/rules.ts src/sanitizer/__tests__/rules.test.ts
git commit -m "feat: add sanitizer types and per-site rule registry"
```

---

## Task 3: Injection builder

Compiles a `SanitizerRule` into a single JavaScript string suitable for the WebView's `injectedJavaScript` prop.

**Files:**
- Create: `src/sanitizer/injection.ts`
- Test: `src/sanitizer/__tests__/injection.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/sanitizer/__tests__/injection.test.ts`:
```ts
import { buildInjection } from '../injection';
import { getRule } from '../rules';

describe('buildInjection', () => {
  it('returns a non-empty script ending with `true;`', () => {
    const js = buildInjection(getRule('instagram'));
    expect(js.length).toBeGreaterThan(0);
    expect(js.trim().endsWith('true;')).toBe(true);
  });

  it('includes every hide selector with a display:none rule', () => {
    const rule = getRule('instagram');
    const js = buildInjection(rule);
    for (const selector of rule.hideSelectors) {
      expect(js).toContain(selector);
    }
    expect(js).toContain('display: none !important');
  });

  it('embeds the rule script when present', () => {
    const youtube = getRule('youtube');
    const js = buildInjection(youtube);
    expect(youtube.script).toBeDefined();
    expect(js).toContain('autoplay');
  });

  it('omits the script section when the rule has no script', () => {
    const instagram = getRule('instagram');
    expect(instagram.script).toBeUndefined();
    // Should still be valid and selector-bearing.
    const js = buildInjection(instagram);
    expect(js).toContain('display: none !important');
  });

  it('wraps everything in an IIFE so it does not leak globals', () => {
    const js = buildInjection(getRule('x'));
    expect(js).toContain('(function()');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/sanitizer/__tests__/injection.test.ts`
Expected: FAIL — cannot find module `../injection`.

- [ ] **Step 3: Write the implementation**

Create `src/sanitizer/injection.ts`:
```ts
import type { SanitizerRule } from './types';

/**
 * Compiles a sanitizer rule into a single JavaScript string for the WebView's
 * `injectedJavaScript` prop. The script injects a stylesheet hiding the rule's
 * selectors, then runs the rule's optional script. It is wrapped in an IIFE and
 * ends with `true;` (required by react-native-webview to avoid warnings).
 */
export function buildInjection(rule: SanitizerRule): string {
  const css = `${rule.hideSelectors.join(',\n')} { display: none !important; }`;
  // JSON.stringify safely escapes the CSS into a JS string literal.
  const cssLiteral = JSON.stringify(css);
  const ruleScript = rule.script ?? '';

  return `(function() {
  try {
    var style = document.createElement('style');
    style.setAttribute('data-stillpoint', 'sanitizer');
    style.appendChild(document.createTextNode(${cssLiteral}));
    (document.head || document.documentElement).appendChild(style);
    ${ruleScript}
  } catch (e) {}
})();
true;`;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/sanitizer/__tests__/injection.test.ts`
Expected: PASS — 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/sanitizer/injection.ts src/sanitizer/__tests__/injection.test.ts
git commit -m "feat: add sanitizer injection builder"
```

---

## Task 4: Social screen — site cards grid

Replaces the `SocialScreen` placeholder with a grid of cards, one per supported site. Each card shows the site name and what is stripped; tapping it navigates to the browser. Navigation is passed in as a prop so the screen is testable in isolation.

**Files:**
- Modify (rewrite): `src/screens/SocialScreen.tsx`
- Create: `src/screens/__tests__/SocialScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/SocialScreen.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SocialScreen } from '../SocialScreen';

describe('SocialScreen', () => {
  it('renders a card for every supported site', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(screen.getByText('Instagram')).toBeTruthy();
    expect(screen.getByText('X')).toBeTruthy();
    expect(screen.getByText('YouTube')).toBeTruthy();
    expect(screen.getByText('TikTok')).toBeTruthy();
  });

  it('shows what each site strips', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(screen.getByText(/Reels tab/)).toBeTruthy();
  });

  it('calls onOpenSite with the site key when a card is tapped', () => {
    const onOpenSite = jest.fn();
    render(<SocialScreen onOpenSite={onOpenSite} />);
    fireEvent.press(screen.getByTestId('site-card-youtube'));
    expect(onOpenSite).toHaveBeenCalledWith('youtube');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/SocialScreen.test.tsx`
Expected: FAIL — `SocialScreen` does not accept `onOpenSite` / renders only the placeholder.

- [ ] **Step 3: Rewrite the Social screen**

Replace the entire contents of `src/screens/SocialScreen.tsx`:
```tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { ALL_RULES } from '../sanitizer/rules';
import type { SiteKey } from '../sanitizer/types';

type Props = {
  /** Called with the chosen site key when a card is tapped. */
  onOpenSite: (key: SiteKey) => void;
};

export function SocialScreen({ onOpenSite }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView
      testID="screen-social"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textMuted, textTransform: 'uppercase' },
          ]}
        >
          Sanitized browsing
        </Text>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          Social
        </Text>

        {ALL_RULES.map((rule) => (
          <Pressable
            key={rule.key}
            testID={`site-card-${rule.key}`}
            onPress={() => onOpenSite(rule.key)}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.bgRaised,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.card,
                padding: theme.spacing.md,
              },
            ]}
          >
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {rule.displayName}
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              {rule.removed.join(' · ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderWidth: 1, gap: 4 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/SocialScreen.test.tsx`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0. (Note: `tabs.ts` currently references `SocialScreen` as a zero-prop component. Task 6 fixes that. If `tsc` reports an error in `tabs.ts` about missing `onOpenSite`, that is expected at this step — proceed; Task 6 resolves it. If you prefer a clean `tsc` here, you may do Task 6 immediately after. Record the error as expected, not a failure.)

- [ ] **Step 6: Commit**

```bash
git add src/screens/SocialScreen.tsx src/screens/__tests__/SocialScreen.test.tsx
git commit -m "feat: add Social screen site cards grid"
```

---

## Task 5: Browser screen — sanitized WebView shell

A screen that renders a `WebView` loading a site's URL with its sanitizer injection applied. Takes a `siteKey` prop.

**Files:**
- Create: `src/screens/BrowserScreen.tsx`
- Test: `src/screens/__tests__/BrowserScreen.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/screens/__tests__/BrowserScreen.test.tsx`:
```tsx
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BrowserScreen } from '../BrowserScreen';
import { getRule } from '../../sanitizer/rules';
import { buildInjection } from '../../sanitizer/injection';

describe('BrowserScreen', () => {
  it('renders the mocked WebView', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });

  it('loads the site URL from the rule', () => {
    render(<BrowserScreen siteKey="youtube" />);
    const webview = screen.getByTestId('mock-webview');
    expect(webview.props.source).toEqual({ uri: getRule('youtube').url });
  });

  it('passes the compiled sanitizer injection to the WebView', () => {
    render(<BrowserScreen siteKey="x" />);
    const webview = screen.getByTestId('mock-webview');
    expect(webview.props.injectedJavaScript).toBe(buildInjection(getRule('x')));
  });

  it('shows the site name in a header', () => {
    render(<BrowserScreen siteKey="tiktok" />);
    expect(screen.getByText('TikTok')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/screens/__tests__/BrowserScreen.test.tsx`
Expected: FAIL — cannot find module `../BrowserScreen`.

- [ ] **Step 3: Write the Browser screen**

Create `src/screens/BrowserScreen.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/theme';
import { getRule } from '../sanitizer/rules';
import { buildInjection } from '../sanitizer/injection';
import type { SiteKey } from '../sanitizer/types';

type Props = {
  siteKey: SiteKey;
};

export function BrowserScreen({ siteKey }: Props) {
  const theme = useTheme();
  const rule = getRule(siteKey);
  const injection = buildInjection(rule);

  return (
    <SafeAreaView
      testID="screen-browser"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <View style={[styles.header, { padding: theme.spacing.md }]}>
        <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
          {rule.displayName}
        </Text>
        <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
          Sanitized
        </Text>
      </View>
      <WebView
        source={{ uri: rule.url }}
        injectedJavaScript={injection}
        sharedCookiesEnabled
        domStorageEnabled
        style={styles.webview}
      />
      {/* sharedCookiesEnabled + domStorageEnabled keep the site's login
          session persisted between visits (spec section 6.3). */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webview: { flex: 1 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/screens/__tests__/BrowserScreen.test.tsx`
Expected: PASS — 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/screens/BrowserScreen.tsx src/screens/__tests__/BrowserScreen.test.tsx
git commit -m "feat: add sanitized WebView browser screen"
```

---

## Task 6: Social stack navigation

Wires `SocialScreen` and `BrowserScreen` into a native stack so tapping a card navigates to the browser. The Social tab's component becomes this stack.

**Files:**
- Create: `src/nav/SocialStack.tsx`
- Modify: `src/nav/tabs.ts`
- Test: `src/nav/__tests__/SocialStack.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/nav/__tests__/SocialStack.test.tsx`:
```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SocialStack } from '../SocialStack';

function renderStack() {
  return render(
    <NavigationContainer>
      <SocialStack />
    </NavigationContainer>,
  );
}

describe('SocialStack', () => {
  it('shows the Social cards screen first', () => {
    renderStack();
    expect(screen.getByTestId('screen-social')).toBeTruthy();
  });

  it('navigates to the browser when a site card is tapped', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));
    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/nav/__tests__/SocialStack.test.tsx`
Expected: FAIL — cannot find module `../SocialStack`.

- [ ] **Step 3: Write the Social stack**

Create `src/nav/SocialStack.tsx`:
```tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialScreen } from '../screens/SocialScreen';
import { BrowserScreen } from '../screens/BrowserScreen';
import type { SiteKey } from '../sanitizer/types';

export type SocialStackParamList = {
  SocialHome: undefined;
  Browser: { siteKey: SiteKey };
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialHome">
        {({ navigation }) => (
          <SocialScreen
            onOpenSite={(siteKey) => navigation.navigate('Browser', { siteKey })}
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

- [ ] **Step 4: Point the Social tab at the stack**

In `src/nav/tabs.ts`, replace the import of `SocialScreen` and its use in the `TABS` array. Change the import line:
```ts
import { SocialScreen } from '../screens/SocialScreen';
```
to:
```ts
import { SocialStack } from './SocialStack';
```
and in the `TABS` array change the Social entry's `component` from `SocialScreen` to `SocialStack`:
```ts
  { name: 'Social', label: 'Social', component: SocialStack, icon: Globe },
```
Leave the other four tab entries unchanged.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/nav/__tests__/SocialStack.test.tsx`
Expected: PASS — 2 tests green.

- [ ] **Step 6: Run the type check and the navigator suite**

Run: `npx tsc --noEmit`
Expected: exit 0 (the `tabs.ts` error noted in Task 4 Step 5 is now resolved — the Social tab uses a zero-prop `SocialStack`).

Run: `npx jest src/nav`
Expected: PASS — `SocialStack` and `RootNavigator` suites both green.

- [ ] **Step 7: Commit**

```bash
git add src/nav/SocialStack.tsx src/nav/tabs.ts src/nav/__tests__/SocialStack.test.tsx
git commit -m "feat: wire Social tab to a stack with the sanitized browser"
```

---

## Task 7: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the entire test suite**

Run: `npx jest`
Expected: PASS — every suite green, including the new `rules`, `injection`, `SocialScreen`, `BrowserScreen`, `SocialStack` suites and all prior suites.

- [ ] **Step 2: Run the type check**

Run: `npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 3: Verify the bundle builds**

Run: `npx expo export --platform ios --output-dir ./.tmp-export`
Expected: completes without error. Then clean up: `rm -rf ./.tmp-export`.

- [ ] **Step 4: Run dependency hygiene check**

Run: `npx expo-doctor`
Expected: 17/17 checks pass.

- [ ] **Step 5: Commit (only if Step 4 required a fix)**

If `expo-doctor` flagged anything and you corrected it, commit the fix. Otherwise no commit is needed.

---

## Done criteria

- `npx jest` — all suites pass, including the five new suites.
- `npx tsc --noEmit` — no type errors.
- `npx expo export --platform ios` — bundles without error.
- `npx expo-doctor` — passes.
- The Social tab shows four site cards; tapping one opens an in-app `WebView` loading that site's web URL with the sanitizer injection applied. The sanitizer rule registry and injection builder are fully unit-tested.

**Known limitation (by design):** the sanitizer only affects Stillpoint's own WebView. The bundled CSS selectors are a first pass and will need maintenance as sites change their markup; a future plan may add remote-updatable rules. This plan does not gate the browser behind focus-session friction — that is Plan 5 (Friction Layer).

The next plan (Friction Layer) gates opening a sanitized site behind the active focus session's friction mode (hard / soft / intention / cheat).
