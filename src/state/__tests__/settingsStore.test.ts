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
