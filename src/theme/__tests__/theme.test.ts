import { colors } from '../colors';
import { spacing, radius } from '../spacing';

describe('colors', () => {
  it('exposes the Calm Wellness purple system color', () => {
    expect(colors.purple500).toBe('#8b5cf6');
  });
  it('exposes the single mindful-green accent', () => {
    expect(colors.accent).toBe('#6ee7b7');
  });
  it('exposes background gradient stops', () => {
    expect(colors.bgGradient).toEqual(['#1a0f2e', '#08020f']);
  });
  it('exposes primary text color', () => {
    expect(colors.textPrimary).toBe('#e8defc');
  });
});

describe('spacing', () => {
  it('follows a 4pt scale', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
    expect(spacing.md).toBe(16);
    expect(spacing.lg).toBe(24);
    expect(spacing.xl).toBe(32);
  });
  it('exposes a card radius', () => {
    expect(radius.card).toBe(14);
  });
});
