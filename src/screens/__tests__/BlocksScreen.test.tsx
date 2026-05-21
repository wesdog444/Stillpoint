import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { BlocksScreen } from '../BlocksScreen';

describe('BlocksScreen', () => {
  it('renders the scheduler control center', () => {
    render(<BlocksScreen />);
    expect(screen.getByTestId('screen-blocks')).toBeTruthy();
    expect(screen.getByText('Redirect scheduler')).toBeTruthy();
    expect(screen.getByText('Active hours')).toBeTruthy();
  });

  it('shows the breathe shortcut URL and automation limits', () => {
    render(<BlocksScreen />);
    expect(screen.getByText('stillpoint://breathe')).toBeTruthy();
    expect(screen.getByText(/iOS keeps automation toggles under your control/i)).toBeTruthy();
  });
});
