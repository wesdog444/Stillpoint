# Stillpoint — Personal Edition — Design Spec

**Date:** 2026-05-19
**Status:** Approved for implementation planning
**Author:** Wesle + Claude (brainstorming session)

---

## 1. Overview

Stillpoint is a personal iOS focus and digital-wellbeing app. It combines two ideas:

1. **A focus companion** — timed focus sessions, presets, streaks, analytics, and an intentions journal, wrapped in a calm meditative interface.
2. **A sanitized social browser** — an in-app web browser that loads Instagram, X, YouTube, and TikTok with their addictive surfaces (Reels, Explore, For You, Shorts, autoplay, infinite recommendation feeds) stripped out, while preserving messaging, search, and intentional navigation.

The product philosophy is *intentional use*, not hard prohibition: make the addictive version costly to reach and the calm version easy.

This is a **single-user personal build**. It is distributed as an unsigned `.ipa` that the user signs and installs with Sideloadly using their own Apple ID. It is not intended for the App Store.

---

## 2. Scope and the central constraint

### 2.1 Why this is "Personal Edition" and not the full blocker

The original concept included OS-enforced blocking of native apps (Opal-style): a focus session that physically prevents launching TikTok, with a Shield screen shown over the blocked app.

**This is impossible to ship via sideload.** iOS's Family Controls, DeviceActivity, and ManagedSettings frameworks require the **Family Controls Distribution entitlement**, which Apple grants only to paid Developer Program accounts after a manual review. Sideloadly signs apps with the user's Apple ID; it does not and cannot inject managed entitlements. The frameworks fail at the OS layer for any app lacking the entitlement, regardless of install method (free Apple ID, AltStore, Sideloadly, TrollStore).

The user has chosen not to pay the Apple Developer fee. Therefore OS-enforced blocking is **out of scope** and cannot be revisited without that decision changing.

### 2.2 What replaces enforcement

Two honor-system mechanisms, both free and sideload-compatible:

- **Sanitized in-app browser** — the user opens the calm version of a social site *inside* Stillpoint instead of the native app. This is fully enforceable: Stillpoint controls its own WebView.
- **Shortcuts redirect automations** — the user manually creates iOS Personal Automations ("When Instagram opens → open Stillpoint"). Every reflexive tap on a native social app bounces the user into Stillpoint after a ~0.5–1s flash. This is friction, not a wall; the user can push through or delete the automation.

### 2.3 In scope (v1)

- Onboarding, including a guided Shortcuts-automation walkthrough
- Focus sessions: ad-hoc and preset-based
- Presets with optional auto-start schedules (delivered as local notifications)
- Four friction modes gating the sanitized browser during sessions: hard block, soft block (timed delay), intention check, cheat pass
- Sanitized in-app browser for Instagram, X, YouTube, TikTok
- Streaks and basic gamification
- Analytics dashboard and intentions journal
- App Intents exposed to the Shortcuts app
- `stillpoint://` deep linking

### 2.4 Out of scope (v1)

- OS-enforced native-app blocking, Shield extensions, DeviceActivityMonitor (impossible — see 2.1)
- User accounts, cloud sync, backend (the app is fully local/offline)
- Premium tier / monetization
- Social features (leaderboards, buddy sessions)
- Android (separate effort if pursued later)
- Remote-updated sanitizer rules (rules are bundled; v1.1 candidate)

---

## 3. Target user

A single user (the project owner) on a personal iPhone running iOS 16 or later. Technically comfortable enough to run Sideloadly and follow a guided automation setup. No multi-user, no parental-control, no accessibility-of-minors considerations.

---

## 4. Visual design

**Aesthetic direction:** "Calm Wellness" — dark, meditative, soft. Cousin to Headspace and Calm.

- **Base:** dark gradient (`#1a0f2e` → `#08020f`), ambient purple radial glow
- **System color:** violet/purple family (`#8b5cf6`, `#6d28d9`, `#a78bfa`)
- **Accent:** a single "mindful green" (`#6ee7b7` / `#059669`) — used sparingly, only for streaks, schedule indicators, and positive confirmations. It is the only non-purple ink on most screens.
- **Typography:**
  - **Display:** Fraunces (variable serif) — hero numbers, ritual/preset names, section titles. Light weights, large optical size. Makes focused time feel earned.
  - **Body/UI:** Raleway (sans) — labels, body text, metadata.
  - Rationale: avoids generic system/Inter defaults; the serif warmth suits the meditative tone.
- **Signature element:** the **orb** — a soft glowing sphere, the focal point of the Home screen and the tap target to start a focus session. A faint ambient ring pulses around it on a 4s loop.
- **Motion:** calm, never aggressive. Breathing animations, soft fades, gentle scale. Reanimated 3 + Skia for GPU-cheap fluid motion. `prefers-reduced-motion` respected.
- **Icons:** vector only (Lucide). No emoji as structural icons.

---

## 5. Navigation and screens

Bottom tab bar, 5 tabs: **Home · Social · Blocks · Stats · Profile.**

### 5.1 Home (Centered Orb layout)

- Top: date/time-of-day meta line, serif hero number (today's focused time), streak thread highlighted in mindful green.
- Center: the orb. Tapping it starts a focus session. Below it, a serif CTA ("Find your stillpoint").
- Bottom: a row of three preset tiles. Tap a tile = start that preset's session immediately. Long-press (or tap the `⋯`) = open the preset detail sheet. Tiles with an active schedule show a small green clock + day code.

### 5.2 Social (sanitized browsing)

- Grid of supported sites (Instagram, X, TikTok, YouTube), each tile naming what is stripped ("No Reels · No Explore").
- Tap a tile → launches the sanitized in-app browser for that site. Login sessions persist per site.
- "+ Add a site" entry for future sites.

### 5.3 Blocks

In Personal Edition, "Blocks" manages three things:

- **Presets** — list of focus presets; tap to edit (duration, blocklist, friction mode, schedule).
- **Sanitized-site gating** — which sanitized sites require a friction screen, and whether always or only during sessions ("Always gated" pinned hero card).
- **Shortcuts automations** — a checklist of redirect automations the user has set up, each with a "re-open setup guide" action. Stillpoint cannot verify these exist; the checklist is user-maintained.

### 5.4 Stats

- Weekly hero number + 7-day bar chart of focused time (Victory Native / Skia).
- Twin stat cards: bypasses used, sanitized-scroll time.
- Intentions journal preview (tap to read all entries).
- Session history reachable via a header button (calendar/list view).

### 5.5 Profile

- Streak ribbon with day-dots (longest streak shown).
- Settings list: permissions, notifications, appearance, data export, about/version.
- No account row (no accounts in v1).

### 5.6 Friction modals

Shown when the user opens a gated sanitized site while a focus session is active. Four modes, chosen per preset/blocklist:

- **Hard block** — static dim orb, no bypass; the only out is ending the session.
- **Soft block** — 4s breathing animation; bypass button disabled for N seconds (default 30s), then enabled.
- **Intention check** — user types a reason (min 8 chars); saved to the intentions journal.
- **Cheat pass** — N passes/day (default 3); each grants a fixed window (default 5 min). Tokens shown; replenish at midnight.

Note: friction modals gate **Stillpoint's own sanitized browser**, since native apps cannot be intercepted. They are full React Native screens.

### 5.7 Onboarding

- Welcome + philosophy.
- Notification permission request.
- **Shortcuts walkthrough:** step-by-step, screenshot-guided instructions for creating redirect automations ("When Instagram opens → Open Stillpoint"). One automation per app the user wants to redirect. Stillpoint provides the App Intents the automations call; the user builds the automation triggers by hand in the Shortcuts app.

---

## 6. Features in detail

### 6.1 Focus sessions

- **Ad-hoc:** tap the orb → pick a duration → session starts.
- **Preset:** tap a preset tile → session starts immediately with that preset's config.
- A session has: duration, an associated blocklist (which sanitized sites are gated), a friction mode, and optional schedule.
- During a session: the in-app timer runs; opening a gated sanitized site triggers the friction modal; a local notification fires at session end.
- Sessions are self-tracked (honor system) — Stillpoint cannot detect native-app usage.

### 6.2 Presets and schedules

- A preset is a reusable focus profile: name, duration, blocklist, friction mode, optional schedule.
- **Schedule:** start–end time + weekday selection. When enabled, a local notification fires at the start time ("Study Hall starts now") and the session auto-arms. The session auto-ends at the end time or after its duration, whichever is shorter.
- Schedules are best-effort: they rely on local notifications, not OS-level enforcement.
- Conflict resolution: if two scheduled presets overlap, the stricter friction mode wins (hard > soft > intention > cheat pass).

### 6.3 Sanitized browser

- `react-native-webview` with persistent cookies (`sharedCookiesEnabled`) so site logins survive.
- Per-site rule files (`instagram.json`, `x.json`, `youtube.json`, `tiktok.json`), each containing:
  - CSS selectors for elements to hide (Reels tab, Explore, For You feed, Shorts shelf, suggested content, autoplay-next).
  - JavaScript injected via `injectedJavaScriptBeforeContentLoaded` to neutralize infinite-scroll observers and recommendation loaders.
- Rules are **bundled in the app** for v1. When a site changes its markup the sanitizer breaks until the next app build. Remote-updatable rules are a v1.1 candidate.
- The browser is honest about its limits: it sanitizes the *web* version. It does not and cannot modify the native apps.

### 6.4 Streaks and gamification

- A day counts toward the streak if the user completes at least one focus session.
- Streak ribbon on Home and Profile; longest-streak record kept.
- Lightweight: streaks + a few milestone acknowledgements. No elaborate achievement system in v1.

### 6.5 Analytics and intentions journal

- Tracked locally: focused time per day/week, sessions completed, friction bypasses, intention-check entries, sanitized-browser time.
- Intentions journal: every intention-check submission is stored with a timestamp and shown in Stats — a weekly review loop.

### 6.6 Shortcuts integration

- **App Intents** (iOS 16+, defined in the main app target via Swift, added through an Expo config plugin): "Start Focus Session", "Open Sanitized Instagram" (and per-site variants), "Log a Distraction".
- These appear as actions in the iOS Shortcuts app, letting the user wire automations that call into Stillpoint.
- **Redirect automations** are created by the user, guided by onboarding. Typical automation: trigger "When [app] is opened" → action "Open Stillpoint" (deep-linked to the sanitized site).
- Stillpoint registers the `stillpoint://` URL scheme; e.g. `stillpoint://sanitized/instagram` opens directly to that sanitized site; `stillpoint://breathe` opens a Stop & Breathe screen for apps with no sanitized version.

---

## 7. Architecture

**Single iOS target. Expo + React Native + TypeScript. No Swift extensions, no App Group.**

```
Stillpoint/
├── app.config.ts                    # Expo config: bundle id, URL scheme, App Intents plugin
├── src/
│   ├── screens/                     # Onboarding, Home, Social, Blocks, Stats, Profile, friction modals
│   ├── components/                  # Orb (Skia), preset tiles, charts
│   ├── nav/                         # React Navigation v7 — bottom tabs + native stack
│   ├── state/                       # Zustand stores (session, presets, blocklists, streaks)
│   ├── data/                        # op-sqlite (relational) + MMKV (settings)
│   ├── sanitizer/                   # WebView config + per-site rule JSON
│   ├── intents/                     # App Intents Swift source + config plugin
│   ├── onboarding/                  # Shortcuts automation walkthrough
│   └── theme/                       # Fraunces + Raleway, Calm Wellness tokens
├── assets/                          # fonts, sanitizer rule files
├── ios/                             # generated by `expo prebuild`
└── .github/workflows/build-ipa.yml  # macOS runner → unsigned .ipa artifact
```

### 7.1 Stack decisions (settled)

- **Framework:** Expo (managed, with config plugins) + React Native + TypeScript.
- **Navigation:** React Navigation v7 — native stack + bottom tabs.
- **State:** Zustand with persist middleware (MMKV-backed).
- **Persistence:** op-sqlite for relational data (sessions, presets, blocklists, intentions, streaks); react-native-mmkv for settings/flags. Fully on-device.
- **Animation:** Reanimated 3 + `@shopify/react-native-skia` for the orb and motion.
- **Charts:** Victory Native (Skia-based).
- **WebView:** `react-native-webview` with pre-content-load JS injection + bundled per-site rule files.
- **Forms:** react-hook-form + zod.
- **Dates:** date-fns.
- **App Intents:** thin Swift source in the main target, registered via an Expo config plugin (the only Swift in the project).
- **Error tracking:** optional; Sentry free tier if desired. Not required for a single-user build.

### 7.2 Build and distribution

- Built in CI on a **GitHub Actions `macos-latest` runner**: `expo prebuild` → `xcodebuild archive` → export an **unsigned `.ipa`** artifact.
- The user downloads the artifact and installs it with **Sideloadly**, which re-signs it with the user's free Apple ID.
- No Mac required on the user's side (the user is on Windows).
- **7-day expiry:** free-Apple-ID signing expires after 7 days. The app simply stops launching; the user re-signs via Sideloadly. Nothing to build for this, but onboarding should mention it.

---

## 8. Data model (initial)

Local SQLite tables (op-sqlite):

- `sessions` — id, started_at, ended_at, duration_planned, preset_id (nullable), completed (bool)
- `presets` — id, name, duration, blocklist_id, friction_mode, schedule_enabled, schedule_start, schedule_end, schedule_weekdays
- `blocklists` — id, name, always_gated (bool)
- `blocklist_sites` — blocklist_id, site_key (instagram/x/youtube/tiktok)
- `intentions` — id, created_at, text, site_key, session_id
- `streak_days` — date (unique), session_count
- `cheat_passes` — date, site_key, used_count

MMKV key-value: onboarding-complete flag, current-session snapshot, notification settings, appearance, friction defaults.

---

## 9. Risks and known limitations

- **Honor-system core.** Blocking is friction, not enforcement. The user can bypass everything. This is inherent to a sideloaded app and was accepted explicitly.
- **Sanitizer fragility.** When Instagram/X/TikTok/YouTube change their web markup, bundled rules break until the next app build. Mitigation: keep rule files small and selector-based; consider remote rules in v1.1.
- **App-flash on redirect.** The ~0.5–1s native-app flash before a Shortcuts redirect is unavoidable.
- **Shortcuts automation behavior** has varied across iOS versions; works well on iOS 16–18 but is not a guaranteed contract.
- **7-day re-sign chore.** Acceptable to the user but a real recurring friction.
- **Sanitized web ≠ native.** TikTok web in particular is feature-limited; the sanitized experience will be noticeably thinner than the native app for some sites.
- **In-app-browser detection.** Some sites degrade or warn when loaded in a WebView; logins may occasionally require re-auth.

---

## 10. Non-goals (explicit)

- Not an App Store product. Not multi-user. No accounts, no sync, no backend.
- Not an OS-enforced blocker. Will not claim to "block" apps in any UI copy — language is "redirect", "sanitize", "focus".
- No monetization, no analytics-of-the-user sent anywhere, no telemetry off-device.

---

## 11. Next step

Hand off to the `writing-plans` skill to produce a phased implementation plan covering: project scaffold, theme system, navigation, focus engine, presets/schedules, sanitizer, friction modals, Stats, onboarding + App Intents, and the CI build pipeline.
