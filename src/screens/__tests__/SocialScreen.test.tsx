import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SocialScreen } from '../SocialScreen';

describe('SocialScreen', () => {
  it('renders a card for every supported site', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(screen.getByText('Instagram')).toBeTruthy();
    expect(screen.getByText('YouTube')).toBeTruthy();
    expect(screen.getAllByText('X').length).toBeGreaterThan(0);
    expect(screen.getByText('TikTok')).toBeTruthy();
    expect(screen.getByText('Facebook')).toBeTruthy();
    expect(screen.getByText('Snapchat')).toBeTruthy();
  });

  it('renders the integrated SocialLite-style shell copy', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(screen.getByText('Stillpoint Social')).toBeTruthy();
    expect(screen.getByText('Focus forward')).toBeTruthy();
    expect(screen.getByText('Add apps to Home Screen')).toBeTruthy();
  });

  it('calls onOpenSite with the site key when a card is tapped', () => {
    const onOpenSite = jest.fn();
    render(<SocialScreen onOpenSite={onOpenSite} />);
    fireEvent.press(screen.getByTestId('site-card-youtube'));
    expect(onOpenSite).toHaveBeenCalledWith('youtube');
  });

  it('exposes each card as an accessible button', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(
      screen.getByRole('button', { name: /open sanitized youtube/i }),
    ).toBeTruthy();
  });

  it('exposes per-site preference buttons without opening the site', () => {
    const onOpenSite = jest.fn();
    render(<SocialScreen onOpenSite={onOpenSite} />);
    fireEvent.press(screen.getByTestId('site-settings-instagram'));
    expect(onOpenSite).not.toHaveBeenCalled();
  });
});
