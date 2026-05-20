import { getDatabase } from './database';
import type { FrictionMode } from '../state/presetStore';

export type PresetRow = {
  id: number;
  name: string;
  duration: number;
  blocklist_id: number | null;
  friction_mode: FrictionMode;
  schedule_enabled: number;
  schedule_start: string | null;
  schedule_end: string | null;
  schedule_weekdays: string | null;
};

type PresetInput = {
  name: string;
  duration: number;
  frictionMode: FrictionMode;
};

/** All presets, ordered by id (creation order). */
export function getAllPresets(): PresetRow[] {
  const result = getDatabase().execute('SELECT * FROM presets ORDER BY id');
  return result.rows as PresetRow[];
}

/** Inserts a preset. Returns the new row id. */
export function insertPreset(input: PresetInput): number {
  const result = getDatabase().execute(
    'INSERT INTO presets (name, duration, friction_mode) VALUES (?, ?, ?)',
    [input.name, input.duration, input.frictionMode],
  );
  return Number((result as { insertId?: number }).insertId);
}

/** Updates a preset's name, duration, and friction mode. */
export function updatePreset(id: number, input: PresetInput): void {
  getDatabase().execute(
    'UPDATE presets SET name = ?, duration = ?, friction_mode = ? WHERE id = ?',
    [input.name, input.duration, input.frictionMode, id],
  );
}

/** Deletes a preset by id. */
export function deletePreset(id: number): void {
  getDatabase().execute('DELETE FROM presets WHERE id = ?', [id]);
}
