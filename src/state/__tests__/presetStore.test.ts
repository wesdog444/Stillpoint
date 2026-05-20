import { initDatabase } from '../../data/database';
import { usePresetStore } from '../presetStore';

const opSqlite = require('@op-engineering/op-sqlite');

describe('presetStore', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
    usePresetStore.setState({ presets: [] });
  });

  it('starts with no presets', () => {
    expect(usePresetStore.getState().presets).toEqual([]);
  });

  it('setPresets replaces the list', () => {
    usePresetStore.getState().setPresets([
      { id: 1, name: 'Deep Work', durationMinutes: 90, frictionMode: 'hard' },
    ]);
    expect(usePresetStore.getState().presets).toHaveLength(1);
  });

  it('createPreset persists a preset and refreshes the list', () => {
    usePresetStore.getState().createPreset({
      name: 'Reading',
      durationMinutes: 30,
      frictionMode: 'soft',
    });
    const { presets } = usePresetStore.getState();
    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('Reading');
    expect(presets[0].durationMinutes).toBe(30);
    expect(presets[0].frictionMode).toBe('soft');
    expect(presets[0].id).toBeGreaterThan(0);
  });

  it('loadPresets reads persisted presets from the database', () => {
    usePresetStore.getState().createPreset({
      name: 'Sleep',
      durationMinutes: 480,
      frictionMode: 'hard',
    });
    usePresetStore.setState({ presets: [] });
    usePresetStore.getState().loadPresets();
    expect(usePresetStore.getState().presets).toHaveLength(1);
    expect(usePresetStore.getState().presets[0].name).toBe('Sleep');
  });

  it('editPreset updates a persisted preset', () => {
    usePresetStore.getState().createPreset({
      name: 'Focus',
      durationMinutes: 25,
      frictionMode: 'soft',
    });
    const id = usePresetStore.getState().presets[0].id;
    usePresetStore.getState().editPreset(id, {
      name: 'Focus (deep)',
      durationMinutes: 50,
      frictionMode: 'intention',
    });
    const updated = usePresetStore.getState().presets[0];
    expect(updated.name).toBe('Focus (deep)');
    expect(updated.durationMinutes).toBe(50);
    expect(updated.frictionMode).toBe('intention');
  });

  it('removePreset deletes a persisted preset', () => {
    usePresetStore.getState().createPreset({
      name: 'Temp',
      durationMinutes: 5,
      frictionMode: 'cheat',
    });
    const id = usePresetStore.getState().presets[0].id;
    usePresetStore.getState().removePreset(id);
    expect(usePresetStore.getState().presets).toEqual([]);
  });
});
