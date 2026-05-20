import React from 'react';
import { render } from '@testing-library/react-native';
import { FocusOrb } from '../FocusOrb';

describe('FocusOrb', () => {
  it('renders idle copy and zero progress', () => {
    const { getByTestId, getByText } = render(
      <FocusOrb remainingSeconds={0} durationSeconds={0} status="idle" />,
    );
    expect(getByTestId('focus-orb')).toBeTruthy();
    expect(getByTestId('focus-orb-progress').props.children).toBe('0%');
    expect(getByText('Ready')).toBeTruthy();
  });

  it('renders running timer and progress', () => {
    const { getByTestId, getByText } = render(
      <FocusOrb remainingSeconds={1500} durationSeconds={1800} status="running" />,
    );
    expect(getByTestId('focus-orb-progress').props.children).toBe('17%');
    expect(getByText('25:00')).toBeTruthy();
    expect(getByText('Focus in progress')).toBeTruthy();
  });

  it('renders complete state at full progress', () => {
    const { getByTestId, getByText } = render(
      <FocusOrb remainingSeconds={0} durationSeconds={1800} status="complete" />,
    );
    expect(getByTestId('focus-orb-progress').props.children).toBe('100%');
    expect(getByText('Complete')).toBeTruthy();
  });
});
