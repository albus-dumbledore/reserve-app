import { describe, expect, it } from 'vitest';
import { getEdition, isEditionActive, MAX_BOOKS } from '@/lib/edition';


describe('edition model', () => {
  it('enforces max curated books', () => {
    const edition = getEdition();
    expect(edition.books.length).toBeLessThanOrEqual(MAX_BOOKS);
  });

  it('reports edition active within date range', () => {
    const active = isEditionActive(new Date('2026-02-10T12:00:00'));
    const inactive = isEditionActive(new Date('2026-03-10T12:00:00'));
    expect(active).toBe(true);
    expect(inactive).toBe(false);
  });
});
