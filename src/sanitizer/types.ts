/** The social sites Stillpoint can sanitize. */
export type SiteKey = 'instagram' | 'youtube' | 'x' | 'tiktok' | 'facebook' | 'snapchat';

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
  /** Visible labels that should hide their closest addictive navigation/card surface. */
  textBlocklist: string[];
  /** When true, injected JS pauses videos and disables autoplay repeatedly. */
  disableVideoAutoplay?: boolean;
  /** Optional extra JavaScript run after the stylesheet is injected. */
  script?: string;
};
