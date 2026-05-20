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
