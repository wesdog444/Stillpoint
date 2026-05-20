import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SocialScreen } from '../SocialScreen';

describe('SocialScreen', () => {
  it('renders a card for every supported site', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(screen.getByText('Instagram')).toBeTruthy();
    expect(screen.getByText('X')).toBeTruthy();
    expect(screen.getByText('YouTube')).toBeTruthy();
    expect(screen.getByText('TikTok')).toBeTruthy();
  });

  it('shows what each site strips', () => {
    render(<SocialScreen onOpenSite={() => {}} />);
    expect(screen.getByText(/Reels tab/)).toBeTruthy();
  });

  it('calls onOpenSite with the site key when a card is tapped', () => {
    const onOpenSite = jest.fn();
    render(<SocialScreen onOpenSite={onOpenSite} />);
    fireEvent.press(screen.getByTestId('site-card-youtube'));
    expect(onOpenSite).toHaveBeenCalledWith('youtube');
  });
});
