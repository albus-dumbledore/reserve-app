import { describe, expect, it } from 'vitest';
import { calculateActualMinutes } from '@/lib/session';

describe('session time accumulation', () => {
  it('rounds seconds to minutes with a minimum of 1', () => {
    expect(calculateActualMinutes(0)).toBe(1);
    expect(calculateActualMinutes(30)).toBe(1);
    expect(calculateActualMinutes(59)).toBe(1);
    expect(calculateActualMinutes(60)).toBe(1);
    expect(calculateActualMinutes(90)).toBe(2);
    expect(calculateActualMinutes(120)).toBe(2);
  });

  it('handles invalid inputs', () => {
    expect(calculateActualMinutes(Number.NaN)).toBe(1);
    expect(calculateActualMinutes(-10)).toBe(1);
  });
});
