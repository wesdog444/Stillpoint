import type { SiteKey } from '../sanitizer/types';

export type SocialDestination = {
  key: 'messages' | 'search' | 'profile' | 'account' | 'breathe';
  label: string;
  kind: 'url' | 'breathe';
  url?: string;
};

const DESTINATIONS: Record<SiteKey, SocialDestination[]> = {
  instagram: [
    { key: 'messages', label: 'Messages', kind: 'url', url: 'https://www.instagram.com/direct/inbox/' },
    { key: 'search', label: 'Search', kind: 'url', url: 'https://www.instagram.com/explore/search/keyword/' },
    { key: 'profile', label: 'Profile', kind: 'url', url: 'https://www.instagram.com/accounts/edit/' },
    { key: 'account', label: 'Account', kind: 'url', url: 'https://www.instagram.com/accounts/edit/' },
    { key: 'breathe', label: 'Breathe', kind: 'breathe' },
  ],
  youtube: [
    { key: 'messages', label: 'Subscriptions', kind: 'url', url: 'https://www.youtube.com/feed/subscriptions' },
    { key: 'search', label: 'Search', kind: 'url', url: 'https://www.youtube.com/results?search_query=' },
    { key: 'profile', label: 'Library', kind: 'url', url: 'https://www.youtube.com/feed/you' },
    { key: 'account', label: 'Account', kind: 'url', url: 'https://www.youtube.com/account' },
    { key: 'breathe', label: 'Breathe', kind: 'breathe' },
  ],
  x: [
    { key: 'messages', label: 'Messages', kind: 'url', url: 'https://x.com/messages' },
    { key: 'search', label: 'Search', kind: 'url', url: 'https://x.com/search' },
    { key: 'profile', label: 'Profile', kind: 'url', url: 'https://x.com/settings/profile' },
    { key: 'account', label: 'Account', kind: 'url', url: 'https://x.com/settings/account' },
    { key: 'breathe', label: 'Breathe', kind: 'breathe' },
  ],
  tiktok: [
    { key: 'messages', label: 'Messages', kind: 'url', url: 'https://www.tiktok.com/messages' },
    { key: 'search', label: 'Search', kind: 'url', url: 'https://www.tiktok.com/search' },
    { key: 'profile', label: 'Profile', kind: 'url', url: 'https://www.tiktok.com/profile' },
    { key: 'account', label: 'Account', kind: 'url', url: 'https://www.tiktok.com/setting' },
    { key: 'breathe', label: 'Breathe', kind: 'breathe' },
  ],
  facebook: [
    { key: 'messages', label: 'Messages', kind: 'url', url: 'https://m.facebook.com/messages/' },
    { key: 'search', label: 'Search', kind: 'url', url: 'https://m.facebook.com/search/top/' },
    { key: 'profile', label: 'Profile', kind: 'url', url: 'https://m.facebook.com/me' },
    { key: 'account', label: 'Account', kind: 'url', url: 'https://m.facebook.com/settings/' },
    { key: 'breathe', label: 'Breathe', kind: 'breathe' },
  ],
  snapchat: [
    { key: 'messages', label: 'Messages', kind: 'url', url: 'https://web.snapchat.com/' },
    { key: 'search', label: 'Search', kind: 'url', url: 'https://web.snapchat.com/' },
    { key: 'profile', label: 'Profile', kind: 'url', url: 'https://accounts.snapchat.com/' },
    { key: 'account', label: 'Account', kind: 'url', url: 'https://accounts.snapchat.com/accounts/v2/manage_account' },
    { key: 'breathe', label: 'Breathe', kind: 'breathe' },
  ],
};

export function getSocialDestinations(siteKey: SiteKey): SocialDestination[] {
  return DESTINATIONS[siteKey];
}
