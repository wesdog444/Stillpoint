import { formatElapsedSeconds } from '../sessionTimer';

describe('formatElapsedSeconds', () => {
  it('formats zero seconds', () => {
    expect(formatElapsedSeconds(0)).toBe('0:00');
  });

  it('pads seconds under ten', () => {
    expect(formatElapsedSeconds(65)).toBe('1:05');
  });

  it('keeps long sessions as total minutes', () => {
    expect(formatElapsedSeconds(3600)).toBe('60:00');
  });
});
