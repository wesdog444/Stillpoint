import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StatsScreen } from '../StatsScreen';
import { initDatabase } from '../../data/database';
import { insertSession, completeSession } from '../../data/sessionRepository';
import { todayKey } from '../../lib/dates';

const opSqlite = require('@op-engineering/op-sqlite');

describe('StatsScreen', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('shows a zero week total on a fresh database', () => {
    render(<StatsScreen onOpenJournal={() => {}} />);
    expect(screen.getByText(/0 min this week/i)).toBeTruthy();
  });

  it('sums completed sessions into the week total', () => {
    const id = insertSession({
      startedAt: `${todayKey()}T09:00:00`,
      durationPlanned: 40,
      presetId: null,
    });
    completeSession(id, `${todayKey()}T09:40:00`);
    render(<StatsScreen onOpenJournal={() => {}} />);
    expect(screen.getByText(/40 min this week/i)).toBeTruthy();
  });

  it('renders the weekly chart (7 bars)', () => {
    render(<StatsScreen onOpenJournal={() => {}} />);
    expect(screen.getByTestId(`chart-bar-${todayKey()}`)).toBeTruthy();
  });

  it('calls onOpenJournal when the journal preview is tapped', () => {
    const onOpenJournal = jest.fn();
    render(<StatsScreen onOpenJournal={onOpenJournal} />);
    fireEvent.press(screen.getByTestId('journal-preview'));
    expect(onOpenJournal).toHaveBeenCalled();
  });
});
