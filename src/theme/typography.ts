import type { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Fraunces',
  displayLight: 'Fraunces-Light',
  body: 'Raleway',
  bodyMedium: 'Raleway-Medium',
  bodySemibold: 'Raleway-SemiBold',
} as const;

export const typography = {
  heroNumber: {
    fontFamily: fontFamily.displayLight,
    fontSize: 64,
    letterSpacing: -2,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  cardTitle: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.body,
    fontSize: 14,
  } satisfies TextStyle,
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
  } satisfies TextStyle,
} as const;

export type TypographyToken = keyof typeof typography;
