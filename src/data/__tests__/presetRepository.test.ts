import { initDatabase } from '../database';
import {
  getAllPresets,
  insertPreset,
  updatePreset,
  deletePreset,
} from '../presetRepository';

const opSqlite = require('@op-engineering/op-sqlite');

describe('presetRepository', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('getAllPresets is empty on a fresh database', () => {
    expect(getAllPresets()).toEqual([]);
  });

  it('insertPreset stores a preset and returns its id', () => {
    const id = insertPreset({ name: 'Deep Work', duration: 90, frictionMode: 'hard' });
    expect(id).toBeGreaterThan(0);
    const all = getAllPresets();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(id);
    expect(all[0].name).toBe('Deep Work');
    expect(all[0].duration).toBe(90);
    expect(all[0].friction_mode).toBe('hard');
  });

  it('getAllPresets returns presets ordered by id', () => {
    insertPreset({ name: 'A', duration: 10, frictionMode: 'soft' });
    insertPreset({ name: 'B', duration: 20, frictionMode: 'soft' });
    const all = getAllPresets();
    expect(all.map((p) => p.name)).toEqual(['A', 'B']);
  });

  it('updatePreset changes name, duration, and friction mode', () => {
    const id = insertPreset({ name: 'Reading', duration: 30, frictionMode: 'soft' });
    updatePreset(id, { name: 'Reading (long)', duration: 45, frictionMode: 'intention' });
    const all = getAllPresets();
    expect(all[0].name).toBe('Reading (long)');
    expect(all[0].duration).toBe(45);
    expect(all[0].friction_mode).toBe('intention');
  });

  it('deletePreset removes the preset', () => {
    const id = insertPreset({ name: 'Temp', duration: 5, frictionMode: 'cheat' });
    deletePreset(id);
    expect(getAllPresets()).toEqual([]);
  });
});
