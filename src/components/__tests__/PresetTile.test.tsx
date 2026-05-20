import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { PresetTile } from '../PresetTile';

describe('PresetTile', () => {
  it('renders preset details', () => {
    const { getByText } = render(
      <PresetTile name="Deep Work" durationMinutes={90} frictionMode="hard" onPress={jest.fn()} />,
    );
    expect(getByText('Deep Work')).toBeTruthy();
    expect(getByText('1 hr 30 min')).toBeTruthy();
    expect(getByText('Hard')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PresetTile name="Reading" durationMinutes={30} frictionMode="soft" onPress={onPress} />,
    );
    fireEvent.press(getByText('Reading'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
