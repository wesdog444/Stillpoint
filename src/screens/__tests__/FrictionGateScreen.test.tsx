import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { getRecentIntentions } from '../../data/intentionRepository';
import { getCheatPassStatus, useCheatPass } from '../../data/cheatPassRepository';
import { FrictionGateScreen } from '../FrictionGateScreen';

jest.mock('@op-engineering/op-sqlite');

describe('FrictionGateScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-20T12:00:00.000Z'));
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hard mode does not render a continue action', () => {
    render(
      <FrictionGateScreen
        mode="hard"
        siteKey="instagram"
        sessionId={1}
        onContinue={jest.fn()}
        onEndSession={jest.fn()}
      />,
    );

    expect(screen.getByText('Stay with this session')).toBeTruthy();
    expect(screen.queryByText(/Continue to Instagram/)).toBeNull();
    expect(screen.getByRole('button', { name: /end focus session/i })).toBeTruthy();
  });

  it('soft mode enables continue after the delay', () => {
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="soft"
        siteKey="youtube"
        sessionId={1}
        onContinue={onContinue}
        onEndSession={jest.fn()}
        softDelaySeconds={2}
      />,
    );

    fireEvent.press(screen.getByText('Continue in 2s'));
    expect(onContinue).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.press(screen.getByText('Continue to YouTube'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('intention mode requires at least 8 characters and saves the reason', () => {
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="intention"
        siteKey="x"
        sessionId={9}
        onContinue={onContinue}
        onEndSession={jest.fn()}
      />,
    );

    fireEvent.changeText(screen.getByPlaceholderText('Why are you opening this?'), 'reply');
    fireEvent.press(screen.getByText('Continue to X'));
    expect(screen.getByText('Write at least 8 characters.')).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByPlaceholderText('Why are you opening this?'),
      'Reply to one client DM',
    );
    fireEvent.press(screen.getByText('Continue to X'));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(getRecentIntentions()[0]).toMatchObject({
      text: 'Reply to one client DM',
      site_key: 'x',
      session_id: 9,
    });
  });

  it('cheat mode consumes one pass before continuing', () => {
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="cheat"
        siteKey="tiktok"
        sessionId={3}
        onContinue={onContinue}
        onEndSession={jest.fn()}
      />,
    );

    expect(screen.getByText('3 passes left today')).toBeTruthy();
    fireEvent.press(screen.getByText('Use pass'));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(getCheatPassStatus('2026-05-20', 'tiktok')).toMatchObject({
      usedCount: 1,
      remainingCount: 2,
    });
  });

  it('cheat mode blocks continue when passes are exhausted', () => {
    useCheatPass('2026-05-20', 'instagram', 1);
    const onContinue = jest.fn();
    render(
      <FrictionGateScreen
        mode="cheat"
        siteKey="instagram"
        sessionId={3}
        onContinue={onContinue}
        onEndSession={jest.fn()}
        cheatPassLimit={1}
      />,
    );

    expect(screen.getByText('No passes left today')).toBeTruthy();
    expect(screen.queryByText('Use pass')).toBeNull();
  });
});
