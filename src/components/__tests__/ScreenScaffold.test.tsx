import React from 'react';
import { render } from '@testing-library/react-native';
import { ScreenScaffold } from '../ScreenScaffold';

describe('ScreenScaffold', () => {
  it('renders the title', () => {
    const { getByText } = render(<ScreenScaffold title="Home" />);
    expect(getByText('Home')).toBeTruthy();
  });

  it('exposes a testID derived from the title', () => {
    const { getByTestId } = render(<ScreenScaffold title="Stats" />);
    expect(getByTestId('screen-stats')).toBeTruthy();
  });

  it('renders an optional subtitle when provided', () => {
    const { getByText } = render(
      <ScreenScaffold title="Blocks" subtitle="What gets gated" />,
    );
    expect(getByText('What gets gated')).toBeTruthy();
  });
});
