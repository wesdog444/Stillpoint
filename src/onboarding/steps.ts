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
      'Stillpoint turns the reflexive tap into a moment you can choose.',
      'Start focus sessions, open calmer social surfaces, and keep the phone from deciding the shape of your day.',
    ],
  },
  {
    key: 'philosophy',
    title: 'How Stillpoint works',
    body: [
      'Stillpoint is a personal companion, not an enforcer.',
      'It gives you a sanitized way into social sites and gentle friction during focus sessions; the calm path is the easy one.',
      'True Screen Time control needs Apple’s restricted Family Controls entitlement, so Personal Edition uses Shortcuts redirects and calmer defaults instead.',
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
      'Use stillpoint://breathe when you want a shortcut that opens straight into a breathing reset.',
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
