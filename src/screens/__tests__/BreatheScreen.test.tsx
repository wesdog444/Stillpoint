import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { BreatheScreen } from '../BreatheScreen';

describe('BreatheScreen', () => {
  it('renders a calm shortcut landing screen', () => {
    render(<BreatheScreen />);
    expect(screen.getByTestId('screen-breathe')).toBeTruthy();
    expect(screen.getByText('Breathe')).toBeTruthy();
    expect(screen.getByText(/open this from shortcuts/i)).toBeTruthy();
  });

  it('cycles the breathing phase when tapped', () => {
    render(<BreatheScreen />);
    expect(screen.getByText('Inhale')).toBeTruthy();
    fireEvent.press(screen.getByTestId('breathe-orb'));
    expect(screen.getByText('Hold')).toBeTruthy();
  });
});
