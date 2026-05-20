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
