import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { ProfileScreen } from '../ProfileScreen';

const opSqlite = require('@op-engineering/op-sqlite');

describe('ProfileScreen', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('renders a real profile dashboard', () => {
    render(<ProfileScreen />);
    expect(screen.getByTestId('screen-profile')).toBeTruthy();
    expect(screen.getByText('Your Stillpoint')).toBeTruthy();
    expect(screen.getAllByText('Personal Edition').length).toBeGreaterThan(0);
  });

  it('summarizes focus, social, shortcuts, and login persistence', () => {
    render(<ProfileScreen />);
    expect(screen.getByText(/Focused today/i)).toBeTruthy();
    expect(screen.getByText(/Sanitized Social/i)).toBeTruthy();
    expect(screen.getByText(/Shortcut routes/i)).toBeTruthy();
    expect(screen.getAllByText(/Logins are remembered/i).length).toBeGreaterThan(0);
  });
});
