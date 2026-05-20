import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { usePresetStore } from '../../state/presetStore';
import { useSessionStore } from '../../state/sessionStore';
import { HomeScreen } from '../HomeScreen';

const opSqlite = require('@op-engineering/op-sqlite');

describe('HomeScreen', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
    usePresetStore.setState({ presets: [] });
    useSessionStore.setState({ activeSession: null });
  });

  it('creates starter presets from the empty state', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('Create starter presets'));
    expect(screen.getByText('Deep Work')).toBeTruthy();
    expect(screen.getByText('Reading')).toBeTruthy();
    expect(screen.getByText('Wind Down')).toBeTruthy();
  });

  it('starts a session when a preset is tapped', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('Create starter presets'));
    fireEvent.press(screen.getByText('Deep Work'));
    expect(useSessionStore.getState().activeSession?.durationMinutes).toBe(50);
    expect(screen.getByText('50:00')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('shows completed session controls', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('Create starter presets'));
    fireEvent.press(screen.getByText('Reading'));
    act(() => {
      for (let i = 0; i < 25 * 60; i += 1) {
        useSessionStore.getState().tick();
      }
    });
    render(<HomeScreen />);
    expect(screen.getByText('Complete')).toBeTruthy();
    fireEvent.press(screen.getByText('Done'));
    expect(useSessionStore.getState().activeSession).toBeNull();
  });
});
