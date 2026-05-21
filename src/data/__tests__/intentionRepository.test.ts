import { initDatabase } from '../database';
import {
  insertIntention,
  getRecentIntentions,
  getAllIntentions,
  type IntentionRow,
} from '../intentionRepository';

jest.mock('@op-engineering/op-sqlite');

describe('intentionRepository', () => {
  beforeEach(() => {
    const sqlite = jest.requireMock('@op-engineering/op-sqlite');
    sqlite.__resetMock();
    initDatabase();
  });

  it('inserts an intention row and returns its id', () => {
    const id = insertIntention({
      createdAt: '2026-05-20T12:00:00.000Z',
      text: 'I need to reply to one message',
      siteKey: 'instagram',
      sessionId: 42,
    });

    expect(id).toBeGreaterThan(0);
    const rows = getRecentIntentions();
    expect(rows[0]).toMatchObject<IntentionRow>({
      id,
      created_at: '2026-05-20T12:00:00.000Z',
      text: 'I need to reply to one message',
      site_key: 'instagram',
      session_id: 42,
    });
  });

  it('returns recent intentions newest first and honors the limit', () => {
    insertIntention({
      createdAt: '2026-05-20T10:00:00.000Z',
      text: 'First reason',
      siteKey: 'x',
      sessionId: 1,
    });
    insertIntention({
      createdAt: '2026-05-20T11:00:00.000Z',
      text: 'Second reason',
      siteKey: 'youtube',
      sessionId: 2,
    });

    const rows = getRecentIntentions(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].text).toBe('Second reason');
  });
});

describe('intentionRepository — getAllIntentions', () => {
  beforeEach(() => {
    const opSqlite = require('@op-engineering/op-sqlite');
    opSqlite.__resetMock();
    require('../database').initDatabase();
  });

  it('getAllIntentions is empty on a fresh database', () => {
    expect(getAllIntentions()).toEqual([]);
  });

  it('getAllIntentions returns every saved reason, newest first', () => {
    insertIntention({
      createdAt: '2026-05-20T09:00:00',
      text: 'reply to Sam',
      siteKey: 'instagram',
      sessionId: 1,
    });
    insertIntention({
      createdAt: '2026-05-20T11:00:00',
      text: 'check DMs',
      siteKey: 'x',
      sessionId: 2,
    });
    const all = getAllIntentions();
    expect(all).toHaveLength(2);
    expect(all[0].text).toBe('check DMs');
    expect(all[1].text).toBe('reply to Sam');
  });
});
