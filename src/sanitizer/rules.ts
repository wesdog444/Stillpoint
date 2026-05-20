import type { SiteKey, SanitizerRule } from './types';

export const SITE_KEYS: SiteKey[] = ['instagram', 'x', 'youtube', 'tiktok'];

/**
 * First-pass sanitizer rules. Site markup changes often; these selectors are a
 * starting point and are expected to need maintenance. They are intentionally
 * conservative: hide addictive surfaces, preserve messaging/search/profiles.
 */
const RULES: Record<SiteKey, SanitizerRule> = {
  instagram: {
    key: 'instagram',
    displayName: 'Instagram',
    url: 'https://www.instagram.com/',
    removed: ['Reels tab', 'Explore page', 'Suggested posts'],
    hideSelectors: [
      'a[href="/reels/"]',
      'a[href="/explore/"]',
      'div[aria-label="Explore"]',
    ],
  },
  x: {
    key: 'x',
    displayName: 'X',
    url: 'https://x.com/home',
    removed: ['"For you" feed', 'Trending sidebar', 'Explore tab'],
    hideSelectors: [
      'a[href="/explore"]',
      'div[aria-label="Timeline: Trending now"]',
      'aside[aria-label="Trending"]',
    ],
  },
  youtube: {
    key: 'youtube',
    displayName: 'YouTube',
    url: 'https://www.youtube.com/feed/subscriptions',
    removed: ['Shorts shelf', 'Recommended grid', 'Autoplay'],
    hideSelectors: [
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-reel-shelf-renderer',
      'a[title="Shorts"]',
    ],
    script:
      "document.querySelectorAll('video').forEach(function(v){v.autoplay=false;});",
  },
  tiktok: {
    key: 'tiktok',
    displayName: 'TikTok',
    url: 'https://www.tiktok.com/messages',
    removed: ['For You feed', 'Explore page'],
    hideSelectors: [
      'a[href="/foryou"]',
      'a[href="/explore"]',
      'div[data-e2e="recommend-list-item-container"]',
    ],
  },
};

/** Every rule, in SITE_KEYS order. */
export const ALL_RULES: SanitizerRule[] = SITE_KEYS.map((key) => RULES[key]);

/** Returns the rule for a site key. Throws if the key is not supported. */
export function getRule(key: SiteKey): SanitizerRule {
  const rule = RULES[key];
  if (!rule) {
    throw new Error(`Unknown site: ${key}`);
  }
  return rule;
}
