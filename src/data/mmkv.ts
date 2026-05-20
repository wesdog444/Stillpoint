import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

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
