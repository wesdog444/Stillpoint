import { create } from 'zustand';

export type FrictionMode = 'hard' | 'soft' | 'intention' | 'cheat';

export type Preset = {
  id: number;
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
};

type PresetState = {
  presets: Preset[];
  setPresets: (presets: Preset[]) => void;
};

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],
  setPresets: (presets: Preset[]) => set({ presets }),
}));
