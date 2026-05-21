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
