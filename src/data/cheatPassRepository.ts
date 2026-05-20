import { getDatabase } from './database';
import type { SiteKey } from '../sanitizer/types';

export const DEFAULT_CHEAT_PASS_LIMIT = 3;

export type CheatPassStatus = {
  date: string;
  siteKey: SiteKey;
  usedCount: number;
  remainingCount: number;
  limit: number;
};

function getUsedCount(date: string, siteKey: SiteKey): number {
  const result = getDatabase().execute(
    'SELECT used_count FROM cheat_passes WHERE date = ? AND site_key = ?',
    [date, siteKey],
  );
  const row = result.rows[0] as { used_count: number } | undefined;
  return row?.used_count ?? 0;
}

/** Returns today's cheat-pass status for one site. */
export function getCheatPassStatus(
  date: string,
  siteKey: SiteKey,
  limit = DEFAULT_CHEAT_PASS_LIMIT,
): CheatPassStatus {
  const usedCount = getUsedCount(date, siteKey);
  return {
    date,
    siteKey,
    usedCount,
    remainingCount: Math.max(limit - usedCount, 0),
    limit,
  };
}

/** Consumes one pass if any remain. Returns true when a pass was consumed. */
export function useCheatPass(
  date: string,
  siteKey: SiteKey,
  limit = DEFAULT_CHEAT_PASS_LIMIT,
): boolean {
  const status = getCheatPassStatus(date, siteKey, limit);
  if (status.remainingCount <= 0) {
    return false;
  }

  getDatabase().execute(
    `INSERT INTO cheat_passes (date, site_key, used_count) VALUES (?, ?, 1)
     ON CONFLICT(date, site_key) DO UPDATE SET used_count = used_count + 1`,
    [date, siteKey],
  );
  return true;
}
