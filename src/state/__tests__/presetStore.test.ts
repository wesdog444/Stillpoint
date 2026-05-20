import { usePresetStore } from '../presetStore';

describe('presetStore (skeleton)', () => {
  beforeEach(() => {
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
    expect(usePresetStore.getState().presets[0].name).toBe('Deep Work');
  });
});
