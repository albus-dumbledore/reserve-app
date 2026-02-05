import { describe, expect, it } from 'vitest';
import { addSessionToStats, getMonthKey, getMonthStats } from '@/lib/fulfillment';
import type { MonthlyStatsMap, SessionRecord } from '@/lib/types';

const makeRecord = (startedAt: string, minutes: number): SessionRecord => ({
  id: 'session',
  bookId: 'book',
  bookTitle: 'Book',
  startedAt,
  endedAt: startedAt,
  plannedMinutes: minutes,
  actualMinutes: minutes
});

describe('fulfillment stats', () => {
  it('creates a month key from date', () => {
    const key = getMonthKey(new Date('2026-02-03T08:00:00'));
    expect(key).toBe('2026-02');
  });

  it('adds sessions to the correct month', () => {
    let stats: MonthlyStatsMap = {};
    stats = addSessionToStats(stats, makeRecord('2026-02-10T10:00:00', 30));
    stats = addSessionToStats(stats, makeRecord('2026-02-11T10:00:00', 45));

    const month = getMonthStats(stats, new Date('2026-02-15T10:00:00'));
    expect(month.sessions).toBe(2);
    expect(month.minutes).toBe(75);
  });

  it('handles month rollover without mixing totals', () => {
    let stats: MonthlyStatsMap = {};
    stats = addSessionToStats(stats, makeRecord('2026-01-31T23:00:00', 20));
    stats = addSessionToStats(stats, makeRecord('2026-02-01T09:00:00', 40));

    const jan = getMonthStats(stats, new Date('2026-01-15T10:00:00'));
    const feb = getMonthStats(stats, new Date('2026-02-15T10:00:00'));

    expect(jan.sessions).toBe(1);
    expect(jan.minutes).toBe(20);
    expect(feb.sessions).toBe(1);
    expect(feb.minutes).toBe(40);
  });
});
