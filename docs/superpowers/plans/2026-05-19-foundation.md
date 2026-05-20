# Stillpoint Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a runnable Expo/React Native app skeleton for Stillpoint — theme system, navigation shell with all five tabs, on-device data layer, and Zustand store skeletons — so later phases (focus engine, sanitized browser, etc.) build on solid ground.

**Architecture:** Single iOS target, Expo managed workflow + React Native + TypeScript. Pure logic (theme tokens, SQL builders, store reducers, migration ordering) is unit-tested with Jest on Windows. Native modules (op-sqlite, MMKV) are mocked in Jest so their consumers are testable without a device. Screens and navigation are verified with React Native Testing Library render tests. No device or Mac is required to complete or verify this phase — a full device run arrives with the CI pipeline (Plan 7).

**Tech Stack:** Expo SDK 52, React Native 0.76, TypeScript, React Navigation v7 (bottom tabs + native stack), Zustand, `@op-engineering/op-sqlite`, `react-native-mmkv`, `expo-font`, `lucide-react-native`, Jest + `jest-expo` + `@testing-library/react-native`.

---

## File Structure

Files created in this phase and their single responsibility:

```
Stillpoint/
├── app.json                        # Expo config: name, bundle id, scheme, fonts plugin
├── App.tsx                         # Root: load fonts, init DB, render navigator
├── index.ts                        # Expo entry point
├── babel.config.js                 # Babel preset
├── tsconfig.json                   # TypeScript config
├── jest.config.js                  # Jest config (jest-expo preset)
├── jest.setup.ts                   # Native module mocks + RNTL setup
├── package.json
├── assets/
│   └── fonts/                       # Fraunces + Raleway .ttf files (downloaded)
└── src/
    ├── theme/
    │   ├── colors.ts                # Color token constants
    │   ├── spacing.ts               # Spacing + radius scale
    │   ├── typography.ts            # Font family + type scale tokens
    │   ├── theme.ts                 # Combined theme object + useTheme hook
    │   └── __tests__/theme.test.ts
    ├── data/
    │   ├── schema.ts                # Pure SQL string builders for all tables
    │   ├── migrations.ts            # Ordered migration list + runner logic
    │   ├── database.ts              # op-sqlite open + applyMigrations entry
    │   ├── mmkv.ts                  # Typed MMKV settings wrapper
    │   └── __tests__/
    │       ├── schema.test.ts
    │       ├── migrations.test.ts
    │       └── mmkv.test.ts
    ├── state/
    │   ├── settingsStore.ts         # Zustand: app settings
    │   ├── sessionStore.ts          # Zustand: focus session (skeleton)
    │   ├── presetStore.ts           # Zustand: presets (skeleton)
    │   └── __tests__/
    │       ├── settingsStore.test.ts
    │       ├── sessionStore.test.ts
    │       └── presetStore.test.ts
    ├── components/
    │   ├── ScreenScaffold.tsx       # Shared placeholder screen wrapper
    │   └── __tests__/ScreenScaffold.test.tsx
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── SocialScreen.tsx
    │   ├── BlocksScreen.tsx
    │   ├── StatsScreen.tsx
    │   └── ProfileScreen.tsx
    └── nav/
        ├── tabs.ts                  # Tab config (name, label, icon)
        ├── RootNavigator.tsx        # Bottom tab navigator
        └── __tests__/RootNavigator.test.tsx
```

---

## Task 1: Initialize the Expo project

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `App.tsx`, `index.ts` (all generated)

- [ ] **Step 1: Scaffold the Expo app into the existing project folder**

The repo root `Stillpoint/` already exists with a `docs/` folder and a git repo. Scaffold into it.

Run from inside `Stillpoint/`:
```bash
npx create-expo-app@latest . --template blank-typescript
```
If the CLI refuses because the directory is non-empty, scaffold into a temp dir and copy:
```bash
npx create-expo-app@latest ../stillpoint-tmp --template blank-typescript
cp -r ../stillpoint-tmp/. .
rm -rf ../stillpoint-tmp
```

- [ ] **Step 2: Verify the scaffold**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

Run: `ls App.tsx package.json tsconfig.json`
Expected: all three listed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo blank-typescript project"
```

---

## Task 2: Install dependencies

**Files:**
- Modify: `package.json` (dependency entries added by the installers)

- [ ] **Step 1: Install native runtime dependencies via expo install**

`expo install` picks versions compatible with the installed Expo SDK — always use it for native packages.

Run:
```bash
npx expo install react-native-screens react-native-safe-area-context react-native-svg expo-font @op-engineering/op-sqlite react-native-mmkv
```

- [ ] **Step 2: Install navigation, state, and icon libraries**

Run:
```bash
npm install @react-navigation/native@^7 @react-navigation/bottom-tabs@^7 @react-navigation/native-stack@^7 zustand@^5 lucide-react-native@^0.460.0
```

- [ ] **Step 3: Install test tooling as dev dependencies**

Run:
```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest react-test-renderer
```

- [ ] **Step 4: Verify install**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install navigation, state, data, and test dependencies"
```

---

## Task 3: Configure Jest with native module mocks

**Files:**
- Create: `jest.config.js`
- Create: `jest.setup.ts`
- Modify: `package.json` (add `test` script)

- [ ] **Step 1: Write the Jest config**

Create `jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg|lucide-react-native))',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/__tests__/**'],
};
```

- [ ] **Step 2: Write the Jest setup with native mocks**

Create `jest.setup.ts`:
```ts
import '@testing-library/jest-native/extend-expect';

// --- react-native-mmkv mock: in-memory key-value store ---
jest.mock('react-native-mmkv', () => {
  class MMKV {
    private store = new Map<string, string | number | boolean>();
    set(key: string, value: string | number | boolean) {
      this.store.set(key, value);
    }
    getString(key: string): string | undefined {
      const v = this.store.get(key);
      return typeof v === 'string' ? v : undefined;
    }
    getBoolean(key: string): boolean | undefined {
      const v = this.store.get(key);
      return typeof v === 'boolean' ? v : undefined;
    }
    getNumber(key: string): number | undefined {
      const v = this.store.get(key);
      return typeof v === 'number' ? v : undefined;
    }
    contains(key: string): boolean {
      return this.store.has(key);
    }
    delete(key: string) {
      this.store.delete(key);
    }
    clearAll() {
      this.store.clear();
    }
  }
  return { MMKV };
});

// --- op-sqlite mock: records executed SQL, returns empty rowsets ---
jest.mock('@op-engineering/op-sqlite', () => {
  const executed: { sql: string; params: unknown[] }[] = [];
  let userVersion = 0;
  const makeDb = () => ({
    execute: (sql: string, params: unknown[] = []) => {
      executed.push({ sql, params });
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('PRAGMA USER_VERSION =')) {
        userVersion = Number(trimmed.split('=')[1].trim());
        return { rows: [] };
      }
      if (trimmed === 'PRAGMA USER_VERSION') {
        return { rows: [{ user_version: userVersion }] };
      }
      return { rows: [] };
    },
    close: () => undefined,
  });
  return {
    open: jest.fn(() => makeDb()),
    __executed: executed,
    __resetMock: () => {
      executed.length = 0;
      userVersion = 0;
    },
  };
});
```

- [ ] **Step 3: Add the test script to package.json**

In `package.json`, add to the `"scripts"` object:
```json
"test": "jest"
```

- [ ] **Step 4: Verify Jest runs**

Run: `npx jest --passWithNoTests`
Expected: exits 0, prints "No tests found" or similar without crashing.

- [ ] **Step 5: Commit**

```bash
git add jest.config.js jest.setup.ts package.json
git commit -m "chore: configure Jest with op-sqlite and MMKV mocks"
```

---

## Task 4: Color and spacing tokens

**Files:**
- Create: `src/theme/colors.ts`
- Create: `src/theme/spacing.ts`
- Test: `src/theme/__tests__/theme.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/theme/__tests__/theme.test.ts`:
```ts
import { colors } from '../colors';
import { spacing, radius } from '../spacing';

describe('colors', () => {
  it('exposes the Calm Wellness purple system color', () => {
    expect(colors.purple500).toBe('#8b5cf6');
  });
  it('exposes the single mindful-green accent', () => {
    expect(colors.accent).toBe('#6ee7b7');
  });
  it('exposes background gradient stops', () => {
    expect(colors.bgGradient).toEqual(['#1a0f2e', '#08020f']);
  });
  it('exposes primary text color', () => {
    expect(colors.textPrimary).toBe('#e8defc');
  });
});

describe('spacing', () => {
  it('follows a 4pt scale', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
  });
  it('exposes a card radius', () => {
    expect(radius.card).toBe(14);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/theme`
Expected: FAIL — cannot find module `../colors`.

- [ ] **Step 3: Write the color tokens**

Create `src/theme/colors.ts`:
```ts
export const colors = {
  // Background
  bgGradient: ['#1a0f2e', '#08020f'] as const,
  bgDeep: '#08020f',
  bgRaised: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',

  // Purple system color
  purple300: '#d4c2ff',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  purple600: '#6d28d9',
  purple700: '#5b21b6',
  purple900: '#2e1065',

  // Mindful green accent (used sparingly)
  accent: '#6ee7b7',
  accentDeep: '#059669',

  // Text
  textPrimary: '#e8defc',
  textSecondary: 'rgba(232,222,252,0.6)',
  textMuted: 'rgba(232,222,252,0.4)',

  // Status
  danger: '#f87171',
} as const;

export type ColorToken = keyof typeof colors;
```

- [ ] **Step 4: Write the spacing tokens**

Create `src/theme/spacing.ts`:
```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  card: 14,
  lg: 20,
  pill: 999,
} as const;

export type SpacingToken = keyof typeof spacing;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/theme`
Expected: PASS — `colors` and `spacing` suites green.

- [ ] **Step 6: Commit**

```bash
git add src/theme/colors.ts src/theme/spacing.ts src/theme/__tests__/theme.test.ts
git commit -m "feat: add color and spacing theme tokens"
```

---

## Task 5: Typography tokens

**Files:**
- Create: `src/theme/typography.ts`
- Test: `src/theme/__tests__/theme.test.ts` (extend)

- [ ] **Step 1: Add the failing test**

Append to `src/theme/__tests__/theme.test.ts`:
```ts
import { typography, fontFamily } from '../typography';

describe('typography', () => {
  it('maps the display family to Fraunces', () => {
    expect(fontFamily.display).toBe('Fraunces');
    expect(fontFamily.displayLight).toBe('Fraunces-Light');
  });
  it('maps the body family to Raleway', () => {
    expect(fontFamily.body).toBe('Raleway');
    expect(fontFamily.bodyMedium).toBe('Raleway-Medium');
  });
  it('exposes a hero number text style using the display font', () => {
    expect(typography.heroNumber.fontFamily).toBe('Fraunces-Light');
    expect(typography.heroNumber.fontSize).toBe(64);
  });
  it('exposes a label style using the body font', () => {
    expect(typography.label.fontFamily).toBe('Raleway-Medium');
    expect(typography.label.letterSpacing).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/theme`
Expected: FAIL — cannot find module `../typography`.

- [ ] **Step 3: Write the typography tokens**

Create `src/theme/typography.ts`:
```ts
import type { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Fraunces',
  displayLight: 'Fraunces-Light',
  body: 'Raleway',
  bodyMedium: 'Raleway-Medium',
  bodySemibold: 'Raleway-SemiBold',
} as const;

export const typography = {
  heroNumber: {
    fontFamily: fontFamily.displayLight,
    fontSize: 64,
    letterSpacing: -2,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  cardTitle: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.body,
    fontSize: 14,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof typography;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/theme`
Expected: PASS — all suites green.

- [ ] **Step 5: Commit**

```bash
git add src/theme/typography.ts src/theme/__tests__/theme.test.ts
git commit -m "feat: add typography theme tokens"
```

---

## Task 6: Combined theme object and useTheme hook

**Files:**
- Create: `src/theme/theme.ts`
- Test: `src/theme/__tests__/theme.test.ts` (extend)

- [ ] **Step 1: Add the failing test**

Append to `src/theme/__tests__/theme.test.ts`:
```ts
import { theme, useTheme } from '../theme';

describe('theme', () => {
  it('bundles colors, spacing, radius, and typography', () => {
    expect(theme.colors.accent).toBe('#6ee7b7');
    expect(theme.spacing.md).toBe(16);
    expect(theme.radius.card).toBe(14);
    expect(theme.typography.title.fontSize).toBe(24);
  });
  it('useTheme returns the same theme object', () => {
    expect(useTheme()).toBe(theme);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/theme`
Expected: FAIL — cannot find module `../theme`.

- [ ] **Step 3: Write the combined theme**

Create `src/theme/theme.ts`:
```ts
import { colors } from './colors';
import { spacing, radius } from './spacing';
import { typography, fontFamily } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  fontFamily,
} as const;

export type Theme = typeof theme;

/**
 * The theme is static in v1 (no light mode, no runtime switching), so the hook
 * just returns the constant. It exists so screens depend on a hook, not a
 * module global — when theming becomes dynamic later, only this file changes.
 */
export function useTheme(): Theme {
  return theme;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/theme`
Expected: PASS — all suites green.

- [ ] **Step 5: Commit**

```bash
git add src/theme/theme.ts src/theme/__tests__/theme.test.ts
git commit -m "feat: assemble combined theme and useTheme hook"
```

---

## Task 7: Font packages and loading helper

**Files:**
- Modify: `package.json` (font packages installed)
- Create: `src/theme/fonts.ts`

> **Revised from the original plan:** instead of manually downloading `.ttf` files,
> use the `@expo-google-fonts/*` packages, which bundle the exact static weights
> and need no manual asset management.

- [ ] **Step 1: Install the font packages**

Run:
```bash
npx expo install @expo-google-fonts/fraunces @expo-google-fonts/raleway
```
These packages export the font files as module assets. `@expo-google-fonts/fraunces`
provides `Fraunces_300Light` and `Fraunces_400Regular`; `@expo-google-fonts/raleway`
provides `Raleway_400Regular`, `Raleway_500Medium`, and `Raleway_600SemiBold`.

- [ ] **Step 2: Write the font map helper**

Create `src/theme/fonts.ts`:
```ts
import { Fraunces_300Light, Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
} from '@expo-google-fonts/raleway';

/**
 * Maps the font-family names used in `typography.ts` to their bundled font
 * assets. Passed to `useFonts` in App.tsx. The keys MUST match `fontFamily`
 * values exactly (Fraunces, Fraunces-Light, Raleway, Raleway-Medium,
 * Raleway-SemiBold).
 */
export const fontAssets = {
  Fraunces: Fraunces_400Regular,
  'Fraunces-Light': Fraunces_300Light,
  Raleway: Raleway_400Regular,
  'Raleway-Medium': Raleway_500Medium,
  'Raleway-SemiBold': Raleway_600SemiBold,
} as const;
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/theme/fonts.ts
git commit -m "feat: add Fraunces and Raleway font packages and loader map"
```

---

## Task 8: Database schema SQL builders

**Files:**
- Create: `src/data/schema.ts`
- Test: `src/data/__tests__/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/schema.test.ts`:
```ts
import { CREATE_TABLE_SQL, TABLE_NAMES } from '../schema';

describe('schema', () => {
  it('lists all seven tables', () => {
    expect(TABLE_NAMES).toEqual([
      'sessions',
      'presets',
      'blocklists',
      'blocklist_sites',
      'intentions',
      'streak_days',
      'cheat_passes',
    ]);
  });

  it('provides a CREATE statement for every table', () => {
    for (const name of TABLE_NAMES) {
      expect(CREATE_TABLE_SQL[name]).toContain(`CREATE TABLE IF NOT EXISTS ${name}`);
    }
  });

  it('sessions table has the expected columns', () => {
    const sql = CREATE_TABLE_SQL.sessions;
    expect(sql).toContain('id INTEGER PRIMARY KEY AUTOINCREMENT');
    expect(sql).toContain('started_at');
    expect(sql).toContain('ended_at');
    expect(sql).toContain('duration_planned');
    expect(sql).toContain('preset_id');
    expect(sql).toContain('completed');
  });

  it('streak_days enforces a unique date', () => {
    expect(CREATE_TABLE_SQL.streak_days).toContain('date TEXT UNIQUE NOT NULL');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/schema.test.ts`
Expected: FAIL — cannot find module `../schema`.

- [ ] **Step 3: Write the schema module**

Create `src/data/schema.ts`:
```ts
export const TABLE_NAMES = [
  'sessions',
  'presets',
  'blocklists',
  'blocklist_sites',
  'intentions',
  'streak_days',
  'cheat_passes',
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

export const CREATE_TABLE_SQL: Record<TableName, string> = {
  sessions: `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_planned INTEGER NOT NULL,
    preset_id INTEGER,
    completed INTEGER NOT NULL DEFAULT 0
  );`,

  presets: `CREATE TABLE IF NOT EXISTS presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    blocklist_id INTEGER,
    friction_mode TEXT NOT NULL DEFAULT 'soft',
    schedule_enabled INTEGER NOT NULL DEFAULT 0,
    schedule_start TEXT,
    schedule_end TEXT,
    schedule_weekdays TEXT
  );`,

  blocklists: `CREATE TABLE IF NOT EXISTS blocklists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    always_gated INTEGER NOT NULL DEFAULT 0
  );`,

  blocklist_sites: `CREATE TABLE IF NOT EXISTS blocklist_sites (
    blocklist_id INTEGER NOT NULL,
    site_key TEXT NOT NULL,
    PRIMARY KEY (blocklist_id, site_key)
  );`,

  intentions: `CREATE TABLE IF NOT EXISTS intentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    text TEXT NOT NULL,
    site_key TEXT,
    session_id INTEGER
  );`,

  streak_days: `CREATE TABLE IF NOT EXISTS streak_days (
    date TEXT UNIQUE NOT NULL,
    session_count INTEGER NOT NULL DEFAULT 0
  );`,

  cheat_passes: `CREATE TABLE IF NOT EXISTS cheat_passes (
    date TEXT NOT NULL,
    site_key TEXT NOT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (date, site_key)
  );`,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/schema.test.ts`
Expected: PASS — all `schema` suite green.

- [ ] **Step 5: Commit**

```bash
git add src/data/schema.ts src/data/__tests__/schema.test.ts
git commit -m "feat: add SQLite schema definitions for all seven tables"
```

---

## Task 9: Migration list and runner

**Files:**
- Create: `src/data/migrations.ts`
- Test: `src/data/__tests__/migrations.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/migrations.test.ts`:
```ts
import { MIGRATIONS, runMigrations } from '../migrations';

type FakeDb = {
  execute: (sql: string, params?: unknown[]) => { rows: any[] };
};

function makeFakeDb(startVersion = 0): { db: FakeDb; executed: string[] } {
  let version = startVersion;
  const executed: string[] = [];
  const db: FakeDb = {
    execute: (sql: string) => {
      executed.push(sql);
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith('PRAGMA USER_VERSION =')) {
        version = Number(upper.split('=')[1].trim());
        return { rows: [] };
      }
      if (upper === 'PRAGMA USER_VERSION') {
        return { rows: [{ user_version: version }] };
      }
      return { rows: [] };
    },
  };
  return { db, executed };
}

describe('migrations', () => {
  it('migration 1 creates all seven tables', () => {
    const m1 = MIGRATIONS.find((m) => m.version === 1);
    expect(m1).toBeDefined();
    expect(m1!.statements.length).toBe(7);
  });

  it('runs every migration on a fresh database', () => {
    const { db, executed } = makeFakeDb(0);
    runMigrations(db as any);
    expect(executed.some((s) => s.includes('CREATE TABLE IF NOT EXISTS sessions'))).toBe(true);
    expect(executed.some((s) => s.toUpperCase().startsWith('PRAGMA USER_VERSION ='))).toBe(true);
  });

  it('skips migrations already applied', () => {
    const latest = Math.max(...MIGRATIONS.map((m) => m.version));
    const { db, executed } = makeFakeDb(latest);
    runMigrations(db as any);
    expect(executed.some((s) => s.includes('CREATE TABLE'))).toBe(false);
  });

  it('sets user_version to the latest migration version', () => {
    const { db, executed } = makeFakeDb(0);
    runMigrations(db as any);
    const latest = Math.max(...MIGRATIONS.map((m) => m.version));
    expect(executed).toContain(`PRAGMA user_version = ${latest}`);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/migrations.test.ts`
Expected: FAIL — cannot find module `../migrations`.

- [ ] **Step 3: Write the migrations module**

Create `src/data/migrations.ts`:
```ts
import { CREATE_TABLE_SQL, TABLE_NAMES } from './schema';

export type Migration = {
  version: number;
  statements: string[];
};

/** Ordered list of migrations. Append new ones with the next version number. */
export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: TABLE_NAMES.map((name) => CREATE_TABLE_SQL[name]),
  },
];

/** Minimal interface a database must satisfy for the runner. */
export type MigratableDb = {
  execute: (sql: string, params?: unknown[]) => { rows: any[] };
};

/**
 * Applies every migration whose version is greater than the database's
 * current `user_version`, in ascending order, then advances `user_version`.
 */
export function runMigrations(db: MigratableDb): void {
  const result = db.execute('PRAGMA user_version');
  const current = Number(result.rows[0]?.user_version ?? 0);

  const pending = MIGRATIONS
    .filter((m) => m.version > current)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    for (const statement of migration.statements) {
      db.execute(statement);
    }
  }

  const latest = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), current);
  if (latest > current) {
    db.execute(`PRAGMA user_version = ${latest}`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/migrations.test.ts`
Expected: PASS — all `migrations` suite green.

- [ ] **Step 5: Commit**

```bash
git add src/data/migrations.ts src/data/__tests__/migrations.test.ts
git commit -m "feat: add migration list and version-gated runner"
```

---

## Task 10: Database init module

**Files:**
- Create: `src/data/database.ts`
- Test: `src/data/__tests__/database.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/database.test.ts`:
```ts
import { initDatabase, getDatabase } from '../database';

// op-sqlite is mocked in jest.setup.ts
const opSqlite = require('@op-engineering/op-sqlite');

describe('database', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    (opSqlite.open as jest.Mock).mockClear();
  });

  it('opens a database named "stillpoint"', () => {
    initDatabase();
    expect(opSqlite.open).toHaveBeenCalledWith({ name: 'stillpoint.db' });
  });

  it('runs migrations on init (creates the sessions table)', () => {
    initDatabase();
    const ran = opSqlite.__executed.some((e: any) =>
      e.sql.includes('CREATE TABLE IF NOT EXISTS sessions'),
    );
    expect(ran).toBe(true);
  });

  it('getDatabase returns the open handle after init', () => {
    initDatabase();
    expect(getDatabase()).toBeDefined();
  });

  it('getDatabase throws if called before init', () => {
    jest.resetModules();
    const fresh = require('../database');
    expect(() => fresh.getDatabase()).toThrow(/not initialized/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/database.test.ts`
Expected: FAIL — cannot find module `../database`.

- [ ] **Step 3: Write the database module**

Create `src/data/database.ts`:
```ts
import { open } from '@op-engineering/op-sqlite';
import { runMigrations, type MigratableDb } from './migrations';

type DB = ReturnType<typeof open>;

let db: DB | null = null;

/** Opens the on-device database and applies pending migrations. Call once at startup. */
export function initDatabase(): void {
  db = open({ name: 'stillpoint.db' });
  runMigrations(db as unknown as MigratableDb);
}

/** Returns the open database handle. Throws if `initDatabase` has not run. */
export function getDatabase(): DB {
  if (!db) {
    throw new Error('Database not initialized — call initDatabase() first.');
  }
  return db;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/database.test.ts`
Expected: PASS — all `database` suite green.

- [ ] **Step 5: Commit**

```bash
git add src/data/database.ts src/data/__tests__/database.test.ts
git commit -m "feat: add database init and migration bootstrap"
```

---

## Task 11: MMKV settings wrapper

**Files:**
- Create: `src/data/mmkv.ts`
- Test: `src/data/__tests__/mmkv.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/__tests__/mmkv.test.ts`:
```ts
import { kv, KV_KEYS } from '../mmkv';

describe('mmkv wrapper', () => {
  beforeEach(() => kv.clearAll());

  it('exposes stable key names', () => {
    expect(KV_KEYS.onboardingComplete).toBe('onboarding.complete');
    expect(KV_KEYS.reducedMotion).toBe('settings.reducedMotion');
  });

  it('stores and reads a boolean', () => {
    kv.setBool(KV_KEYS.onboardingComplete, true);
    expect(kv.getBool(KV_KEYS.onboardingComplete)).toBe(true);
  });

  it('returns a fallback when a key is absent', () => {
    expect(kv.getBool(KV_KEYS.onboardingComplete, false)).toBe(false);
  });

  it('stores and reads a string', () => {
    kv.setString(KV_KEYS.appearance, 'dark');
    expect(kv.getString(KV_KEYS.appearance, 'dark')).toBe('dark');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/data/__tests__/mmkv.test.ts`
Expected: FAIL — cannot find module `../mmkv`.

- [ ] **Step 3: Write the MMKV wrapper**

Create `src/data/mmkv.ts`:
```ts
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

/** Stable key names for everything stored in MMKV. */
export const KV_KEYS = {
  onboardingComplete: 'onboarding.complete',
  reducedMotion: 'settings.reducedMotion',
  appearance: 'settings.appearance',
} as const;

export type KvKey = (typeof KV_KEYS)[keyof typeof KV_KEYS];

/** Thin typed facade over MMKV with fallback-aware getters. */
export const kv = {
  setBool(key: KvKey, value: boolean): void {
    storage.set(key, value);
  },
  getBool(key: KvKey, fallback = false): boolean {
    return storage.contains(key) ? storage.getBoolean(key) ?? fallback : fallback;
  },
  setString(key: KvKey, value: string): void {
    storage.set(key, value);
  },
  getString(key: KvKey, fallback = ''): string {
    return storage.contains(key) ? storage.getString(key) ?? fallback : fallback;
  },
  clearAll(): void {
    storage.clearAll();
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/data/__tests__/mmkv.test.ts`
Expected: PASS — all `mmkv wrapper` suite green.

- [ ] **Step 5: Commit**

```bash
git add src/data/mmkv.ts src/data/__tests__/mmkv.test.ts
git commit -m "feat: add typed MMKV settings wrapper"
```

---

## Task 12: Settings store

**Files:**
- Create: `src/state/settingsStore.ts`
- Test: `src/state/__tests__/settingsStore.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/state/__tests__/settingsStore.test.ts`:
```ts
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.setState({ onboardingComplete: false, reducedMotion: false });
  });

  it('starts with onboarding incomplete', () => {
    expect(useSettingsStore.getState().onboardingComplete).toBe(false);
  });

  it('completeOnboarding flips the flag', () => {
    useSettingsStore.getState().completeOnboarding();
    expect(useSettingsStore.getState().onboardingComplete).toBe(true);
  });

  it('setReducedMotion updates the flag', () => {
    useSettingsStore.getState().setReducedMotion(true);
    expect(useSettingsStore.getState().reducedMotion).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/state/__tests__/settingsStore.test.ts`
Expected: FAIL — cannot find module `../settingsStore`.

- [ ] **Step 3: Write the settings store**

Create `src/state/settingsStore.ts`:
```ts
import { create } from 'zustand';
import { kv, KV_KEYS } from '../data/mmkv';

type SettingsState = {
  onboardingComplete: boolean;
  reducedMotion: boolean;
  completeOnboarding: () => void;
  setReducedMotion: (value: boolean) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  onboardingComplete: kv.getBool(KV_KEYS.onboardingComplete, false),
  reducedMotion: kv.getBool(KV_KEYS.reducedMotion, false),

  completeOnboarding: () => {
    kv.setBool(KV_KEYS.onboardingComplete, true);
    set({ onboardingComplete: true });
  },

  setReducedMotion: (value: boolean) => {
    kv.setBool(KV_KEYS.reducedMotion, value);
    set({ reducedMotion: value });
  },
}));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/state/__tests__/settingsStore.test.ts`
Expected: PASS — all `settingsStore` suite green.

- [ ] **Step 5: Commit**

```bash
git add src/state/settingsStore.ts src/state/__tests__/settingsStore.test.ts
git commit -m "feat: add settings Zustand store backed by MMKV"
```

---

## Task 13: Session and preset store skeletons

**Files:**
- Create: `src/state/sessionStore.ts`
- Create: `src/state/presetStore.ts`
- Test: `src/state/__tests__/sessionStore.test.ts`
- Test: `src/state/__tests__/presetStore.test.ts`

These are skeletons — only the shape and the simplest transitions. The focus engine (Plan 2) fills in timer logic, persistence, and scheduling.

- [ ] **Step 1: Write the failing session-store test**

Create `src/state/__tests__/sessionStore.test.ts`:
```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/state/__tests__/sessionStore.test.ts`
Expected: FAIL — cannot find module `../sessionStore`.

- [ ] **Step 3: Write the session store skeleton**

Create `src/state/sessionStore.ts`:
```ts
import { create } from 'zustand';

export type ActiveSession = {
  durationMinutes: number;
  presetId: number | null;
  startedAt: string;
};

type StartArgs = {
  durationMinutes: number;
  presetId: number | null;
};

type SessionState = {
  activeSession: ActiveSession | null;
  startSession: (args: StartArgs) => void;
  endSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,

  startSession: ({ durationMinutes, presetId }: StartArgs) => {
    set({
      activeSession: {
        durationMinutes,
        presetId,
        startedAt: new Date().toISOString(),
      },
    });
  },

  endSession: () => {
    set({ activeSession: null });
  },
}));
```

- [ ] **Step 4: Run the session-store test to verify it passes**

Run: `npx jest src/state/__tests__/sessionStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing preset-store test**

Create `src/state/__tests__/presetStore.test.ts`:
```ts
import { usePresetStore } from '../presetStore';

describe('presetStore (skeleton)', () => {
  beforeEach(() => {
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
    expect(usePresetStore.getState().presets[0].name).toBe('Deep Work');
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `npx jest src/state/__tests__/presetStore.test.ts`
Expected: FAIL — cannot find module `../presetStore`.

- [ ] **Step 7: Write the preset store skeleton**

Create `src/state/presetStore.ts`:
```ts
import { create } from 'zustand';

export type FrictionMode = 'hard' | 'soft' | 'intention' | 'cheat';

export type Preset = {
  id: number;
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
};

type PresetState = {
  presets: Preset[];
  setPresets: (presets: Preset[]) => void;
};

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],
  setPresets: (presets: Preset[]) => set({ presets }),
}));
```

- [ ] **Step 8: Run the preset-store test to verify it passes**

Run: `npx jest src/state/__tests__/presetStore.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/state/sessionStore.ts src/state/presetStore.ts src/state/__tests__/sessionStore.test.ts src/state/__tests__/presetStore.test.ts
git commit -m "feat: add session and preset Zustand store skeletons"
```

---

## Task 14: ScreenScaffold placeholder component

**Files:**
- Create: `src/components/ScreenScaffold.tsx`
- Test: `src/components/__tests__/ScreenScaffold.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/ScreenScaffold.test.tsx`:
```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { ScreenScaffold } from '../ScreenScaffold';

describe('ScreenScaffold', () => {
  it('renders the title', () => {
    const { getByText } = render(<ScreenScaffold title="Home" />);
    expect(getByText('Home')).toBeTruthy();
  });

  it('exposes a testID derived from the title', () => {
    const { getByTestId } = render(<ScreenScaffold title="Stats" />);
    expect(getByTestId('screen-stats')).toBeTruthy();
  });

  it('renders an optional subtitle when provided', () => {
    const { getByText } = render(
      <ScreenScaffold title="Blocks" subtitle="What gets gated" />,
    );
    expect(getByText('What gets gated')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/components/__tests__/ScreenScaffold.test.tsx`
Expected: FAIL — cannot find module `../ScreenScaffold`.

- [ ] **Step 3: Write the ScreenScaffold component**

Create `src/components/ScreenScaffold.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

/**
 * Placeholder screen wrapper used for every tab in the Foundation phase.
 * Real screen content replaces `children` usage in later plans.
 */
export function ScreenScaffold({ title, subtitle, children }: Props) {
  const theme = useTheme();
  const testID = `screen-${title.toLowerCase()}`;

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <View style={[styles.body, { padding: theme.spacing.lg }]}>
        {subtitle ? (
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.textMuted, textTransform: 'uppercase' },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, gap: 6 },
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/components/__tests__/ScreenScaffold.test.tsx`
Expected: PASS — all `ScreenScaffold` suite green.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScreenScaffold.tsx src/components/__tests__/ScreenScaffold.test.tsx
git commit -m "feat: add ScreenScaffold placeholder screen wrapper"
```

---

## Task 15: Five placeholder screens

**Files:**
- Create: `src/screens/HomeScreen.tsx`
- Create: `src/screens/SocialScreen.tsx`
- Create: `src/screens/BlocksScreen.tsx`
- Create: `src/screens/StatsScreen.tsx`
- Create: `src/screens/ProfileScreen.tsx`

No new test file — these are thin wrappers verified through the navigator test in Task 16.

- [ ] **Step 1: Write HomeScreen**

Create `src/screens/HomeScreen.tsx`:
```tsx
import React from 'react';
import { ScreenScaffold } from '../components/ScreenScaffold';

export function HomeScreen() {
  return <ScreenScaffold title="Home" subtitle="Find your stillpoint" />;
}
```

- [ ] **Step 2: Write SocialScreen**

Create `src/screens/SocialScreen.tsx`:
```tsx
import React from 'react';
import { ScreenScaffold } from '../components/ScreenScaffold';

export function SocialScreen() {
  return <ScreenScaffold title="Social" subtitle="Sanitized browsing" />;
}
```

- [ ] **Step 3: Write BlocksScreen**

Create `src/screens/BlocksScreen.tsx`:
```tsx
import React from 'react';
import { ScreenScaffold } from '../components/ScreenScaffold';

export function BlocksScreen() {
  return <ScreenScaffold title="Blocks" subtitle="What gets gated" />;
}
```

- [ ] **Step 4: Write StatsScreen**

Create `src/screens/StatsScreen.tsx`:
```tsx
import React from 'react';
import { ScreenScaffold } from '../components/ScreenScaffold';

export function StatsScreen() {
  return <ScreenScaffold title="Stats" subtitle="This week" />;
}
```

- [ ] **Step 5: Write ProfileScreen**

Create `src/screens/ProfileScreen.tsx`:
```tsx
import React from 'react';
import { ScreenScaffold } from '../components/ScreenScaffold';

export function ProfileScreen() {
  return <ScreenScaffold title="Profile" subtitle="You" />;
}
```

- [ ] **Step 6: Verify TypeScript accepts all five**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/screens
git commit -m "feat: add five placeholder tab screens"
```

---

## Task 16: Bottom tab navigator

**Files:**
- Create: `src/nav/tabs.ts`
- Create: `src/nav/RootNavigator.tsx`
- Test: `src/nav/__tests__/RootNavigator.test.tsx`

- [ ] **Step 1: Write the tab config**

Create `src/nav/tabs.ts`:
```ts
import { Home, Globe, ShieldCheck, BarChart3, User } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { BlocksScreen } from '../screens/BlocksScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type TabDef = {
  name: 'Home' | 'Social' | 'Blocks' | 'Stats' | 'Profile';
  label: string;
  component: ComponentType;
  icon: ComponentType<{ size: number; color: string }>;
};

export const TABS: TabDef[] = [
  { name: 'Home', label: 'Home', component: HomeScreen, icon: Home },
  { name: 'Social', label: 'Social', component: SocialScreen, icon: Globe },
  { name: 'Blocks', label: 'Blocks', component: BlocksScreen, icon: ShieldCheck },
  { name: 'Stats', label: 'Stats', component: StatsScreen, icon: BarChart3 },
  { name: 'Profile', label: 'Profile', component: ProfileScreen, icon: User },
];
```

- [ ] **Step 2: Write the failing navigator test**

Create `src/nav/__tests__/RootNavigator.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { RootNavigator } from '../RootNavigator';

describe('RootNavigator', () => {
  it('renders the Home screen by default', () => {
    render(<RootNavigator />);
    expect(screen.getByTestId('screen-home')).toBeTruthy();
  });

  it('shows all five tab labels', () => {
    render(<RootNavigator />);
    for (const label of ['Home', 'Social', 'Blocks', 'Stats', 'Profile']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('navigates to the Stats screen when its tab is pressed', () => {
    render(<RootNavigator />);
    fireEvent.press(screen.getByText('Stats'));
    expect(screen.getByTestId('screen-stats')).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx jest src/nav/__tests__/RootNavigator.test.tsx`
Expected: FAIL — cannot find module `../RootNavigator`.

- [ ] **Step 4: Write the RootNavigator**

Create `src/nav/RootNavigator.tsx`:
```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/theme';
import { TABS } from './tabs';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.purple400,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.bgDeep,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: theme.fontFamily.bodyMedium,
            fontSize: 10,
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: ({ size, color }) => <tab.icon size={size} color={color} />,
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx jest src/nav/__tests__/RootNavigator.test.tsx`
Expected: PASS — all `RootNavigator` suite green.

- [ ] **Step 6: Commit**

```bash
git add src/nav
git commit -m "feat: add bottom tab navigator with five tabs"
```

---

## Task 17: Wire App.tsx and final verification

**Files:**
- Modify: `App.tsx` (replace scaffold content)
- Modify: `app.json` (set name, slug, scheme, bundle identifier)

- [ ] **Step 1: Configure app.json**

Replace the `"expo"` object's relevant fields in `app.json` so it contains:
```json
{
  "expo": {
    "name": "Stillpoint",
    "slug": "stillpoint",
    "scheme": "stillpoint",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "dark",
    "ios": {
      "bundleIdentifier": "com.wesle.stillpoint",
      "supportsTablet": false
    },
    "plugins": ["expo-font"]
  }
}
```
Keep any `icon`, `splash`, `assetBundlePatterns`, and `android` fields the scaffold generated.

- [ ] **Step 2: Write the new App.tsx**

Replace the entire contents of `App.tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { fontAssets } from './src/theme/fonts';
import { theme } from './src/theme/theme';
import { initDatabase } from './src/data/database';
import { RootNavigator } from './src/nav/RootNavigator';

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase();
    setDbReady(true);
  }, []);

  if (!fontsLoaded || !dbReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bgDeep,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.purple400} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

Run: `npx tsc --noEmit`
Expected: exits 0, no errors.

- [ ] **Step 4: Run the full test suite**

Run: `npx jest`
Expected: PASS — every suite green (theme, schema, migrations, database, mmkv, settingsStore, sessionStore, presetStore, ScreenScaffold, RootNavigator). No failures.

- [ ] **Step 5: Verify the bundler builds the app graph**

Run: `npx expo export --platform ios --output-dir /tmp/stillpoint-export`
Expected: completes without error and writes a bundle. This confirms `App.tsx`, navigation, fonts, and all imports resolve. (It does not require a Mac — `expo export` only bundles JS/assets.)

Clean up: `rm -rf /tmp/stillpoint-export`

- [ ] **Step 6: Commit**

```bash
git add App.tsx app.json
git commit -m "feat: wire App root with font loading, DB init, and navigation"
```

---

## Done criteria

When every task above is complete:
- `npx jest` — all suites pass.
- `npx tsc --noEmit` — no type errors.
- `npx expo export --platform ios` — bundles without error.
- The app graph is a runnable Expo project: five-tab navigation shell, Calm Wellness theme applied, fonts wired, on-device SQLite schema created on launch, MMKV and Zustand stores in place.

The next plan (Focus Engine) builds the orb, focus sessions, the timer, presets CRUD, and schedules on top of this foundation.
