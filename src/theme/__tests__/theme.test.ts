import { colors } from '../colors';
import { spacing, radius } from '../spacing';
import { typography, fontFamily } from '../typography';

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

describe('typography', () => {
  it('maps the display family to Fraunces', () => {
    expect(fontFamily.display).toBe('Fraunces');
    expect(fontFamily.displayLight).toBe('Fraunces-Light');
  });
  it('maps the body family to Raleway', () => {
    expect(fontFamily.body).toBe('Raleway');
    expect(fontFamily.bodyMedium).toBe('Raleway-Medium');
  });
  it('exposes a hero number text style using the display font', () => {
    expect(typography.heroNumber.fontFamily).toBe('Fraunces-Light');
    expect(typography.heroNumber.fontSize).toBe(64);
  });
  it('exposes a label style using the body font', () => {
    expect(typography.label.fontFamily).toBe('Raleway-Medium');
    expect(typography.label.letterSpacing).toBeGreaterThan(0);
  });
});

import { theme, useTheme } from '../theme';

describe('theme', () => {
  it('bundles colors, spacing, radius, and typography', () => {
    expect(theme.colors.accent).toBe('#6ee7b7');
    expect(theme.spacing.md).toBe(16);
    expect(theme.radius.card).toBe(14);
    expect(theme.typography.title.fontSize).toBe(24);
  });
  it('useTheme returns the same theme object', () => {
    expect(useTheme()).toBe(theme);
  });
});
