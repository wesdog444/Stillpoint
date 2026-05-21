import type { SiteKey, SanitizerRule } from './types';

export const SITE_KEYS: SiteKey[] = ['instagram', 'youtube', 'x', 'tiktok', 'facebook', 'snapchat'];

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
    removed: ['Reels tab', 'Explore page', 'Suggested posts', 'Main feed'],
    hideSelectors: [
      'a[href="/reels/"]',
      'a[href*="/reels/"]',
      'nav a[href*="/reels/"]',
      'a[href="/explore/"]',
      'a[href*="/explore/"]',
      'div[aria-label="Explore"]',
      'svg[aria-label="Reels"]',
      'svg[aria-label="Explore"]',
      'div[aria-label*="Suggested"]',
      'main[role="main"] article',
      'section main article',
      'a[href*="/p/"][role="link"]',
      'a[href*="/reel/"]',
      '[role="tab"][aria-label*="Reels"]',
      '[aria-label*="Reels"]',
    ],
    textBlocklist: ['Reels', 'Explore', 'Suggested', 'Recommended', 'Threads', 'Meta Verified'],
    disableVideoAutoplay: true,
  },
  youtube: {
    key: 'youtube',
    displayName: 'YouTube',
    url: 'https://www.youtube.com/feed/subscriptions',
    removed: ['Shorts shelf', 'Recommended grid', 'Autoplay', 'Comments', 'Watch next'],
    hideSelectors: [
      'ytd-rich-shelf-renderer[is-shorts]',
      'ytd-reel-shelf-renderer',
      'a[title="Shorts"]',
      'a[href*="/shorts/"]',
      'ytd-mini-guide-entry-renderer[aria-label*="Shorts"]',
      'ytd-rich-grid-renderer',
      'ytd-watch-next-secondary-results-renderer',
      'ytd-compact-video-renderer',
      'ytd-compact-playlist-renderer',
      'ytd-compact-radio-renderer',
      'ytd-comments',
      'ytd-item-section-renderer#sections',
      '.ytp-autonav-toggle-button',
      '.ytp-ce-element',
      '.ytp-endscreen-content',
      'tp-yt-paper-tab[aria-label*="Shorts"]',
    ],
    textBlocklist: ['Shorts', 'Recommended', 'Autoplay', 'Comments', 'Related', 'Trending', 'For you'],
    disableVideoAutoplay: true,
    script:
      "document.querySelectorAll('video').forEach(function(v){v.autoplay=false;v.pause();});",
  },
  x: {
    key: 'x',
    displayName: 'X',
    url: 'https://x.com/home',
    removed: ['"For you" feed', 'Trending sidebar', 'Explore tab', 'Who to follow'],
    hideSelectors: [
      'a[href="/explore"]',
      'a[href*="/explore"]',
      'div[aria-label="Timeline: Trending now"]',
      'aside[aria-label="Trending"]',
      'aside[aria-label*="Who to follow"]',
      '[aria-label*="Timeline: Trending"]',
      '[data-testid="sidebarColumn"]',
      '[data-testid="trend"]',
      '[data-testid="UserCell"]',
    ],
    textBlocklist: ['For you', 'Explore', 'Trending', 'Who to follow', 'Subscribe', 'Recommended'],
    disableVideoAutoplay: true,
  },
  tiktok: {
    key: 'tiktok',
    displayName: 'TikTok',
    url: 'https://www.tiktok.com/messages',
    removed: ['For You feed', 'Explore page', 'Discover', 'Suggested creators'],
    hideSelectors: [
      'a[href="/foryou"]',
      'a[href*="/foryou"]',
      'a[href="/explore"]',
      'a[href*="/explore"]',
      'a[href*="/discover"]',
      'div[data-e2e="recommend-list-item-container"]',
      '[data-e2e="recommend-list-item-container"]',
      '[data-e2e="feed-video"]',
      '[data-e2e="browse-video"]',
      '[data-e2e="search-common-list"]',
      '[data-e2e="suggested-account"]',
    ],
    textBlocklist: ['For You', 'Discover', 'Suggested', 'Explore', 'LIVE', 'Following feed'],
    disableVideoAutoplay: true,
  },
  facebook: {
    key: 'facebook',
    displayName: 'Facebook',
    url: 'https://m.facebook.com/',
    removed: ['Reels shelf', 'Suggested posts', 'Watch tab', 'Stories'],
    hideSelectors: [
      'a[href*="/watch/"]',
      'a[href*="/reel/"]',
      'a[href*="/reels/"]',
      'a[href*="/stories/"]',
      'a[href*="/marketplace/"]',
      'div[aria-label*="Reels"]',
      'div[aria-label*="Suggested"]',
      'div[aria-label*="Watch"]',
      '[role="feed"]',
    ],
    textBlocklist: ['Reels', 'Watch', 'Suggested', 'Recommended', 'Stories', 'People you may know'],
    disableVideoAutoplay: true,
  },
  snapchat: {
    key: 'snapchat',
    displayName: 'Snapchat',
    url: 'https://web.snapchat.com/',
    removed: ['Spotlight', 'Discover', 'Suggested creators', 'Stories recommendations'],
    hideSelectors: [
      'a[href*="/spotlight"]',
      'a[href*="/discover"]',
      '[aria-label*="Discover"]',
      '[aria-label*="Spotlight"]',
      '[data-testid*="spotlight"]',
      '[data-testid*="discover"]',
      '[data-testid*="suggested"]',
    ],
    textBlocklist: ['Spotlight', 'Discover', 'Suggested', 'Recommended', 'Stories'],
    disableVideoAutoplay: true,
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
