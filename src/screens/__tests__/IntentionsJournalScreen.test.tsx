import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { IntentionsJournalScreen } from '../IntentionsJournalScreen';
import { initDatabase } from '../../data/database';
import { insertIntention } from '../../data/intentionRepository';

const opSqlite = require('@op-engineering/op-sqlite');

describe('IntentionsJournalScreen', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('shows an empty state when there are no intentions', () => {
    render(<IntentionsJournalScreen />);
    expect(screen.getByText(/no intentions logged yet/i)).toBeTruthy();
  });

  it('lists every saved intention', () => {
    insertIntention({
      createdAt: '2026-05-20T09:00:00',
      text: 'reply to Sam',
      siteKey: 'instagram',
      sessionId: 1,
    });
    insertIntention({
      createdAt: '2026-05-20T11:00:00',
      text: 'post an update',
      siteKey: 'x',
      sessionId: 2,
    });
    render(<IntentionsJournalScreen />);
    expect(screen.getByText('"reply to Sam"')).toBeTruthy();
    expect(screen.getByText('"post an update"')).toBeTruthy();
  });
});
