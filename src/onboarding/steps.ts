export type OnboardingStep = {
  key: 'welcome' | 'philosophy' | 'notifications' | 'shortcuts';
  title: string;
  /** Body paragraphs. */
  body: string[];
  /** Present on the notifications step; its primary button requests permission. */
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
      'It gives you a sanitized way into social sites and gentle friction during focus sessions; the calm path is the easy one.',
      'It cannot police the native apps; the rest is up to you.',
    ],
  },
  {
    key: 'notifications',
    title: 'Gentle reminders',
    body: [
      'Stillpoint can remind you when a scheduled focus session is about to start.',
      'Reminders are quiet and optional; you can change this any time in Settings.',
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
