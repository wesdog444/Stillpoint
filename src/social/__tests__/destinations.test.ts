import { getSocialDestinations } from '../destinations';

describe('getSocialDestinations', () => {
  it('does not include Reels as an Instagram destination', () => {
    const labels = getSocialDestinations('instagram').map((destination) => destination.label);
    expect(labels).toEqual(['Messages', 'Search', 'Profile', 'Account', 'Breathe']);
    expect(labels).not.toContain('Reels');
  });

  it('provides URL destinations for web-backed account actions', () => {
    const account = getSocialDestinations('instagram').find((destination) => destination.key === 'account');
    expect(account?.kind).toBe('url');
    expect(account?.url).toContain('instagram.com');
  });
});
