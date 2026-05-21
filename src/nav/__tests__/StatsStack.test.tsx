import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StatsStack } from '../StatsStack';
import { initDatabase } from '../../data/database';

const opSqlite = require('@op-engineering/op-sqlite');

function renderStack() {
  return render(
    <NavigationContainer>
      <StatsStack />
    </NavigationContainer>,
  );
}

describe('StatsStack', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('shows the Stats overview first', () => {
    renderStack();
    expect(screen.getByTestId('screen-stats')).toBeTruthy();
  });

  it('navigates to the intentions journal when the preview is tapped', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('journal-preview'));
    expect(screen.getByTestId('screen-intentions-journal')).toBeTruthy();
  });
});
