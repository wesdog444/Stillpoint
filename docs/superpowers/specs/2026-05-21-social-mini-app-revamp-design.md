# Stillpoint Social Mini-App Revamp Design

## Goal

Turn the Social experience from a lightly wrapped WebView into a Stillpoint-owned mini-app shell. The WebView remains the rendering engine for each site, but Stillpoint controls the entry points, chrome, timer, toolbar behavior, account surface, and schedule/friction guidance.

## Approved Direction

Use the "Sanitized Mini-App" approach:

- Each social platform opens into a Stillpoint shell, not a raw browser.
- The top chrome shows only a session timer.
- The site page still loads inside WebView, but addictive navigation surfaces are aggressively hidden.
- The toolbar controls Stillpoint behavior:
  - Back: WebView goBack.
  - Home: return to Stillpoint Social inside the app.
  - Refresh: WebView reload.
  - Forward: WebView goForward.
  - Account: open an account manager view.
  - Settings: reserved for site preferences.
- Instagram should not expose Reels or the scroll trap as a primary path.

## In Scope

### Social Browser

- Remove the ads/suggested/count copy from the top bar.
- Replace it with a single stable timer at top left.
- Compute the timer from a start timestamp instead of incrementing blindly, so it does not drift or count oddly during re-renders.
- Keep WebView login persistence:
  - `sharedCookiesEnabled`
  - `domStorageEnabled`
  - `thirdPartyCookiesEnabled`
  - `incognito={false}`
- Add a mini-app destination rail for the current platform, using destinations such as Messages, Search, Profile, Account, and Breathe.
- Add an account manager overlay/screen from the account icon. It is not a password manager; it gives account-related destinations and tells the user login state is remembered by the site.
- Make Home return to the Stillpoint Social list by calling a navigation callback, not by reloading the website.

### Sanitizer

- Strengthen Instagram rules for:
  - Reels tab and `/reels/` links.
  - Explore links.
  - Suggested/recommended surfaces.
  - Main scrolling feed containers where selectors are identifiable.
- Add an injected script that repeatedly removes matching elements for dynamic pages.
- Keep the selectors conservative enough that login/search/messages/profile can still work.

### Profile Tab

- Replace the placeholder Profile tab with a real summary/settings surface:
  - Today focus summary.
  - Current and longest streak.
  - Social mode status.
  - Shortcut/deep-link reminders.
  - Personal Edition constraints.
  - Login persistence note.

### Blocks Tab

- Replace the placeholder Blocks tab with a scheduler/control center:
  - Active hours cards.
  - Per-site redirect mode guidance.
  - Shortcut setup instructions.
  - Breathe shortcut URL.
  - Clear note that iOS does not allow Stillpoint to silently create, enable, or disable personal automations.

### Shortcuts

- Keep `stillpoint://breathe` as the reliable route for Shortcuts automations.
- Do not try to automate the Shortcuts app itself. Apple exposes app actions through App Intents, but personal automation creation/enabling remains user-controlled.

## Out of Scope

- Native Screen Time / Family Controls permission.
- Programmatically creating, enabling, or disabling personal Shortcuts automations.
- A native Instagram/X/TikTok clone.
- Secure credential storage for third-party accounts; site cookies own login persistence.

## Testing

- Unit tests for toolbar callbacks and WebView persistence props.
- Unit tests for the timer label helper.
- Unit tests for new sanitizer injection behavior.
- Screen tests for Profile and Blocks replacing placeholders.
- Existing navigation and full Jest suite must remain green.

