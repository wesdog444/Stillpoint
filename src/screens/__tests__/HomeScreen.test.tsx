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

  afterEach(() => {
    jest.useRealTimers();
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

  it('ticks a running session while Home is mounted', () => {
    jest.useFakeTimers();
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('Create starter presets'));
    fireEvent.press(screen.getByText('Deep Work'));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('49:59')).toBeTruthy();
  });

  it('shows today focused minutes and streak stats after completion', () => {
    render(<HomeScreen />);
    expect(screen.getByText('0 min focused')).toBeTruthy();
    expect(screen.getByText('0 day streak')).toBeTruthy();
    fireEvent.press(screen.getByText('Create starter presets'));
    fireEvent.press(screen.getByText('Reading'));

    act(() => {
      for (let i = 0; i < 25 * 60; i += 1) {
        useSessionStore.getState().tick();
      }
    });

    expect(screen.getByText('25 min focused')).toBeTruthy();
    expect(screen.getByText('1 day streak')).toBeTruthy();
    expect(screen.getByText('1 longest')).toBeTruthy();
  });

  it('creates a preset from the inline editor', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('New preset'));
    fireEvent.changeText(screen.getByPlaceholderText('Preset name'), 'Study Sprint');
    fireEvent.changeText(screen.getByPlaceholderText('Duration minutes'), '45');
    fireEvent.press(screen.getByText('Hard'));
    fireEvent.press(screen.getByText('Save preset'));

    expect(screen.getByText('Study Sprint')).toBeTruthy();
    expect(screen.getByText('45 min')).toBeTruthy();
  });

  it('edits an existing preset from the inline editor', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('Create starter presets'));
    fireEvent.press(screen.getByText('Edit Reading'));
    fireEvent.changeText(screen.getByPlaceholderText('Preset name'), 'Night Read');
    fireEvent.changeText(screen.getByPlaceholderText('Duration minutes'), '35');
    fireEvent.press(screen.getByText('Save preset'));

    expect(screen.getByText('Night Read')).toBeTruthy();
    expect(screen.getByText('35 min')).toBeTruthy();
    expect(screen.queryByText('Reading')).toBeNull();
  });

  it('deletes a preset from the inline editor', () => {
    render(<HomeScreen />);
    fireEvent.press(screen.getByText('Create starter presets'));
    fireEvent.press(screen.getByText('Edit Wind Down'));
    fireEvent.press(screen.getByText('Delete preset'));

    expect(screen.queryByText('Wind Down')).toBeNull();
  });
});
