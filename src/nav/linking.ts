import type { LinkingOptions } from '@react-navigation/native';

/**
 * Deep-link config for the stillpoint:// scheme. Shortcuts redirect
 * automations can open URLs like stillpoint://sanitized/instagram.
 */
export const linking: LinkingOptions<any> = {
  prefixes: ['stillpoint://'],
  config: {
    screens: {
      Home: 'home',
      Social: {
        screens: {
          SocialHome: 'social',
          Browser: 'sanitized/:siteKey',
        },
      },
      Blocks: 'blocks',
      Stats: 'stats',
      Profile: 'profile',
      Breathe: 'breathe',
    },
  },
};
