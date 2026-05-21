import { SITE_KEYS, getRule, ALL_RULES } from '../rules';

describe('sanitizer rules', () => {
  it('lists the six supported sites', () => {
    expect(SITE_KEYS).toEqual(['instagram', 'youtube', 'x', 'tiktok', 'facebook', 'snapchat']);
  });

  it('provides a rule for every site key', () => {
    for (const key of SITE_KEYS) {
      const rule = getRule(key);
      expect(rule.key).toBe(key);
      expect(rule.url).toMatch(/^https:\/\//);
      expect(rule.displayName.length).toBeGreaterThan(0);
      expect(rule.removed.length).toBeGreaterThan(0);
      expect(rule.hideSelectors.length).toBeGreaterThan(0);
    }
  });

  it('ALL_RULES has one entry per site key', () => {
    expect(ALL_RULES.map((r) => r.key)).toEqual(SITE_KEYS);
  });

  it('the instagram rule targets Reels and Explore', () => {
    const rule = getRule('instagram');
    expect(rule.removed.join(' ').toLowerCase()).toContain('reels');
    expect(rule.removed.join(' ').toLowerCase()).toContain('explore');
  });

  it('getRule throws for an unknown key', () => {
    // @ts-expect-error testing the runtime guard with an invalid key
    expect(() => getRule('myspace')).toThrow(/unknown site/i);
  });
});
