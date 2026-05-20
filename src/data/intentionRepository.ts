import { getDatabase } from './database';
import type { SiteKey } from '../sanitizer/types';

export type IntentionRow = {
  id: number;
  created_at: string;
  text: string;
  site_key: SiteKey | null;
  session_id: number | null;
};

type InsertIntentionInput = {
  createdAt: string;
  text: string;
  siteKey: SiteKey;
  sessionId: number;
};

/** Inserts an intention-check reason and returns the new row id. */
export function insertIntention(input: InsertIntentionInput): number {
  const result = getDatabase().execute(
    'INSERT INTO intentions (created_at, text, site_key, session_id) VALUES (?, ?, ?, ?)',
    [input.createdAt, input.text, input.siteKey, input.sessionId],
  );
  return Number((result as { insertId?: number }).insertId);
}

/** Most recent intention entries, newest first. */
export function getRecentIntentions(limit = 20): IntentionRow[] {
  const result = getDatabase().execute(
    'SELECT * FROM intentions ORDER BY created_at DESC, id DESC LIMIT ?',
    [limit],
  );
  return result.rows as IntentionRow[];
}
