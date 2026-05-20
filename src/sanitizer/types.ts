/** The social sites Stillpoint can sanitize. */
export type SiteKey = 'instagram' | 'x' | 'youtube' | 'tiktok';

/** A sanitization rule for one site. */
export type SanitizerRule = {
  key: SiteKey;
  /** Human-readable site name, shown on the Social card. */
  displayName: string;
  /** The web URL the in-app browser loads. */
  url: string;
  /** Short human-readable list of what is stripped, shown on the card. */
  removed: string[];
  /** CSS selectors hidden via an injected stylesheet. */
  hideSelectors: string[];
  /** Optional extra JavaScript run after the stylesheet is injected. */
  script?: string;
};
