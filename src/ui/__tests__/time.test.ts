import { formatDurationLabel, formatTimer } from '../time';

describe('time UI helpers', () => {
  it('formats preset durations in minutes and hours', () => {
    expect(formatDurationLabel(25)).toBe('25 min');
    expect(formatDurationLabel(60)).toBe('1 hr');
    expect(formatDurationLabel(90)).toBe('1 hr 30 min');
  });

  it('formats countdown seconds as M:SS', () => {
    expect(formatTimer(0)).toBe('0:00');
    expect(formatTimer(9)).toBe('0:09');
    expect(formatTimer(65)).toBe('1:05');
    expect(formatTimer(3600)).toBe('60:00');
  });
});
