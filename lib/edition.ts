import editionData from '@/data/edition.json';
import type { Edition, EditionBook } from './types';

export const MAX_BOOKS = 7;

export function getEdition(): Edition {
  const edition = editionData as Edition;
  if (edition.books.length > MAX_BOOKS) {
    return {
      ...edition,
      books: edition.books.slice(0, MAX_BOOKS)
    };
  }
  return edition;
}

export function getEditionBookById(id: string): EditionBook | null {
  const edition = getEdition();
  return edition.books.find((book) => book.id === id) ?? null;
}

export function isEditionActive(date = new Date()): boolean {
  const edition = getEdition();
  const start = new Date(`${edition.start_date}T00:00:00`);
  const end = new Date(`${edition.end_date}T23:59:59`);
  return date >= start && date <= end;
}
