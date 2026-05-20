import { Fraunces_300Light, Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import {
  Raleway_400Regular,
  Raleway_500Medium,
  Raleway_600SemiBold,
} from '@expo-google-fonts/raleway';

/**
 * Maps the font-family names used in `typography.ts` to their bundled font
 * assets. Passed to `useFonts` in App.tsx. The keys MUST match `fontFamily`
 * values exactly (Fraunces, Fraunces-Light, Raleway, Raleway-Medium,
 * Raleway-SemiBold).
 */
export const fontAssets = {
  Fraunces: Fraunces_400Regular,
  'Fraunces-Light': Fraunces_300Light,
  Raleway: Raleway_400Regular,
  'Raleway-Medium': Raleway_500Medium,
  'Raleway-SemiBold': Raleway_600SemiBold,
} as const;
