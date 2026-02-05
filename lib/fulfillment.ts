import type { MonthlyStats, MonthlyStatsMap, SessionRecord } from './types';

export function getMonthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function ensureMonthEntry(
  stats: MonthlyStatsMap,
  month: string
): MonthlyStatsMap {
  if (stats[month]) return stats;
  return {
    ...stats,
    [month]: {
      month,
      sessions: 0,
      minutes: 0
    }
  };
}

export function addSessionToStats(
  stats: MonthlyStatsMap,
  record: SessionRecord
): MonthlyStatsMap {
  const month = getMonthKey(new Date(record.startedAt));
  const next = ensureMonthEntry(stats, month);
  return {
    ...next,
    [month]: {
      month,
      sessions: next[month].sessions + 1,
      minutes: next[month].minutes + record.actualMinutes
    }
  };
}

export function getMonthStats(
  stats: MonthlyStatsMap,
  date = new Date()
): MonthlyStats {
  const month = getMonthKey(date);
  return (
    stats[month] ?? {
      month,
      sessions: 0,
      minutes: 0
    }
  );
}
