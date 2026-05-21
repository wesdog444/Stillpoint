import { buildInjection } from '../injection';
import { getRule } from '../rules';

describe('buildInjection', () => {
  it('returns a non-empty script ending with `true;`', () => {
    const js = buildInjection(getRule('instagram'));
    expect(js.length).toBeGreaterThan(0);
    expect(js.trim().endsWith('true;')).toBe(true);
  });

  it('includes every hide selector with a display:none rule', () => {
    const rule = getRule('instagram');
    const js = buildInjection(rule);
    for (const selector of rule.hideSelectors) {
      expect(js).toContain(selector);
    }
    expect(js).toContain('display: none !important');
  });

  it('embeds the rule script when present', () => {
    const youtube = getRule('youtube');
    const js = buildInjection(youtube);
    expect(youtube.script).toBeDefined();
    expect(js).toContain('autoplay');
  });

  it('omits the script section when the rule has no script', () => {
    const instagram = getRule('instagram');
    expect(instagram.script).toBeUndefined();
    const js = buildInjection(instagram);
    expect(js).toContain('display: none !important');
  });

  it('wraps everything in an IIFE so it does not leak globals', () => {
    const js = buildInjection(getRule('x'));
    expect(js).toContain('(function()');
  });

  it('runs repeated cleanup for dynamic social pages', () => {
    const js = buildInjection(getRule('instagram'));
    expect(js).toContain('setInterval(cleanStillpointSurfaces');
    expect(js).toContain('cleanStillpointSurfaces();');
  });

  it('includes stronger instagram reels and feed selectors', () => {
    const rule = getRule('instagram');
    expect(rule.hideSelectors).toContain('a[href*="/reels/"]');
    expect(rule.hideSelectors).toContain('main[role="main"] article');
    expect(rule.hideSelectors.join(' ')).toContain('Suggested');
  });
});
