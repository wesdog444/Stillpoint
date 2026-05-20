import { colors } from './colors';
import { spacing, radius } from './spacing';
import { typography, fontFamily } from './typography';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  fontFamily,
} as const;

export type Theme = typeof theme;

/**
 * The theme is static in v1 (no light mode, no runtime switching), so the hook
 * just returns the constant. It exists so screens depend on a hook, not a
 * module global — when theming becomes dynamic later, only this file changes.
 */
export function useTheme(): Theme {
  return theme;
}
