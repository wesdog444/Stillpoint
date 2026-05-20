import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { RootNavigator } from '../RootNavigator';

const opSqlite = require('@op-engineering/op-sqlite');

describe('RootNavigator', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('renders the Home screen by default', () => {
    render(<RootNavigator />);
    expect(screen.getByTestId('screen-home')).toBeTruthy();
  });

  it('shows all five tab labels', () => {
    render(<RootNavigator />);
    for (const label of ['Home', 'Social', 'Blocks', 'Stats', 'Profile']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('navigates to the Stats screen when its tab is pressed', () => {
    render(<RootNavigator />);
    fireEvent.press(screen.getByText('Stats'));
    expect(screen.getByTestId('screen-stats')).toBeTruthy();
  });
});
