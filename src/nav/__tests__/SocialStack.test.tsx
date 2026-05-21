import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { SocialStack } from '../SocialStack';
import { useSessionStore } from '../../state/sessionStore';
import { usePresetStore } from '../../state/presetStore';

jest.mock('@op-engineering/op-sqlite');

function renderStack() {
  return render(
    <NavigationContainer>
      <SocialStack />
    </NavigationContainer>,
  );
}

describe('SocialStack', () => {
  beforeEach(() => {
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
    useSessionStore.setState({ activeSession: null });
    usePresetStore.setState({ presets: [] });
  });

  it('shows the Social cards screen first', () => {
    renderStack();
    expect(screen.getByTestId('screen-social')).toBeTruthy();
  });

  it('navigates directly to the browser when no focus session is active', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));
    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });

  it('keeps BrowserScreen as the only visible app shell when a site is open', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));
    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.queryByText('Stillpoint Social')).toBeNull();
    expect(screen.getByTestId('browser-toolbar-toggle')).toBeTruthy();
  });

  it('routes through the friction gate when a focus session is active', () => {
    useSessionStore.setState({
      activeSession: {
        sessionId: 11,
        durationMinutes: 25,
        presetId: 5,
        startedAt: '2026-05-20T12:00:00.000Z',
        remainingSeconds: 1000,
        status: 'running',
      },
    });
    usePresetStore.setState({
      presets: [{ id: 5, name: 'Strict', durationMinutes: 25, frictionMode: 'hard' }],
    });

    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));

    expect(screen.getByTestId('screen-friction-gate')).toBeTruthy();
    expect(screen.queryByTestId('mock-webview')).toBeNull();
    expect(screen.getByText('Stay with this session')).toBeTruthy();
  });

  it('continues from an intention gate to the browser', () => {
    useSessionStore.setState({
      activeSession: {
        sessionId: 12,
        durationMinutes: 25,
        presetId: 6,
        startedAt: '2026-05-20T12:00:00.000Z',
        remainingSeconds: 1000,
        status: 'running',
      },
    });
    usePresetStore.setState({
      presets: [{ id: 6, name: 'Intentional', durationMinutes: 25, frictionMode: 'intention' }],
    });

    renderStack();
    fireEvent.press(screen.getByTestId('site-card-x'));
    fireEvent.changeText(
      screen.getByPlaceholderText('Why are you opening this?'),
      'Reply to one message',
    );
    fireEvent.press(screen.getByText('Continue to X'));

    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.getByTestId('mock-webview').props.source).toEqual({ uri: 'https://x.com/home' });
  });
});
