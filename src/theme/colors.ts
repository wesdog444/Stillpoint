export const colors = {
  // Background
  bgGradient: ['#1a0f2e', '#08020f'] as const,
  bgDeep: '#08020f',
  bgRaised: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.07)',

  // Purple system color
  purple300: '#d4c2ff',
  purple400: '#a78bfa',
  purple500: '#8b5cf6',
  purple600: '#6d28d9',
  purple700: '#5b21b6',
  purple900: '#2e1065',

  // Mindful green accent (used sparingly)
  accent: '#6ee7b7',
  accentDeep: '#059669',

  // Text
  textPrimary: '#e8defc',
  textSecondary: 'rgba(232,222,252,0.6)',
  textMuted: 'rgba(232,222,252,0.4)',

  // Status
  danger: '#f87171',
} as const;

export type ColorToken = keyof typeof colors;
