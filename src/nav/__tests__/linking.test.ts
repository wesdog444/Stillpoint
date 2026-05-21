import { linking } from '../linking';

describe('deep-link config', () => {
  it('registers the stillpoint:// scheme', () => {
    expect(linking.prefixes).toContain('stillpoint://');
  });

  it('maps the Social tab and a sanitized-browser route with a siteKey param', () => {
    const social = linking.config?.screens?.Social as
      | { screens?: Record<string, unknown> }
      | undefined;
    expect(social?.screens?.Browser).toBe('sanitized/:siteKey');
    expect(social?.screens?.SocialHome).toBe('social');
  });

  it('maps the Home tab', () => {
    expect(linking.config?.screens?.Home).toBe('home');
  });
});
