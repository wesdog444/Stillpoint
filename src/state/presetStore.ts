import { create } from 'zustand';
import {
  getAllPresets,
  insertPreset,
  updatePreset,
  deletePreset,
  type PresetRow,
} from '../data/presetRepository';

export type FrictionMode = 'hard' | 'soft' | 'intention' | 'cheat';

export type Preset = {
  id: number;
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
};

/** Input shape for creating/editing a preset (no id). */
export type PresetDraft = {
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
};

/** Maps a database row to the UI-facing Preset shape. */
function rowToPreset(row: PresetRow): Preset {
  return {
    id: row.id,
    name: row.name,
    durationMinutes: row.duration,
    frictionMode: row.friction_mode,
  };
}

type PresetState = {
  presets: Preset[];
  setPresets: (presets: Preset[]) => void;
  loadPresets: () => void;
  createPreset: (draft: PresetDraft) => void;
  editPreset: (id: number, draft: PresetDraft) => void;
  removePreset: (id: number) => void;
};

export const usePresetStore = create<PresetState>((set) => ({
  presets: [],

  setPresets: (presets: Preset[]) => set({ presets }),

  loadPresets: () => {
    set({ presets: getAllPresets().map(rowToPreset) });
  },

  createPreset: (draft: PresetDraft) => {
    insertPreset({
      name: draft.name,
      duration: draft.durationMinutes,
      frictionMode: draft.frictionMode,
    });
    set({ presets: getAllPresets().map(rowToPreset) });
  },

  editPreset: (id: number, draft: PresetDraft) => {
    updatePreset(id, {
      name: draft.name,
      duration: draft.durationMinutes,
      frictionMode: draft.frictionMode,
    });
    set({ presets: getAllPresets().map(rowToPreset) });
  },

  removePreset: (id: number) => {
    deletePreset(id);
    set({ presets: getAllPresets().map(rowToPreset) });
  },
}));
