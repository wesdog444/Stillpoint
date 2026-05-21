# Installing Stillpoint on your iPhone

Stillpoint is a Personal Edition app — it is not on the App Store. You build it
in the cloud and install it yourself with Sideloadly.

## 1. Build the IPA

1. Push to `master` (or open the repo on GitHub → **Actions** →
   **Build unsigned IPA** → **Run workflow**).
2. Wait for the macOS build to finish (~15-30 min).
3. Open the finished run → **Artifacts** → download **Stillpoint-unsigned-ipa**.
4. Unzip it — inside is `Stillpoint.ipa`.

## 2. Sign and install with Sideloadly

1. Install Sideloadly on your Windows PC (https://sideloadly.io) and iTunes +
   iCloud (the non-Microsoft-Store versions) so Sideloadly can see your device.
2. Connect your iPhone by USB and trust the computer.
3. Open Sideloadly, drag in `Stillpoint.ipa`, enter your Apple ID, and click
   **Start**. Sideloadly re-signs the app with your Apple ID and installs it.
4. On the iPhone: **Settings → General → VPN & Device Management** → trust your
   Apple ID's developer profile.
5. Launch Stillpoint.

### The 7-day reality

A free Apple ID signs apps for **7 days**. After that Stillpoint stops
launching — reconnect the phone and re-run Sideloadly to re-sign. A paid Apple
Developer account ($99/yr) extends this to 1 year.

## 3. Set up redirect Shortcuts (optional but recommended)

Stillpoint's in-app onboarding walks you through this. In short, for each social
app you want to redirect: open the **Shortcuts** app → **Automation** → **+** →
**App** → choose the app → **Is Opened** + **Run Immediately** → action
**Open App → Stillpoint**. Now every reflexive tap on that app bounces you into
Stillpoint's calm, sanitized version instead.

## What this build can and cannot do

- **Can:** sanitized in-app browser, focus sessions, friction, streaks, stats,
  the `stillpoint://` deep links the redirect automations use.
- **Cannot:** OS-enforced blocking of the native apps — that needs Apple's
  Family Controls entitlement, which is not available to a sideloaded build.
  See the design spec, section 2.
