import books from '@/data/books.json';
import taxonomy from '@/data/taxonomy.json';
import type { BookEntry } from './types';

export const bookCatalog = books as BookEntry[];

export const taxonomyConfig = taxonomy as {
  genres: string[];
  moods: string[];
  contexts: string[];
};

export function filterBooksByTags({
  genres,
  moods,
  query,
  limit = 50
}: {
  genres?: string[];
  moods?: string[];
  query?: string;
  limit?: number;
}): BookEntry[] {
  if (bookCatalog.length === 0) return [];
  const normalizedQuery = query?.toLowerCase().trim() ?? '';
  return bookCatalog
    .filter((book) => {
      if (genres && genres.length > 0 && !genres.some((g) => book.genres.includes(g))) {
        return false;
      }
      if (moods && moods.length > 0 && !moods.some((m) => book.moods.includes(m))) {
        return false;
      }
      if (normalizedQuery) {
        const haystack = `${book.title} ${book.author} ${book.description ?? ''} ${book.subjects.join(' ')}`.toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    })
    .slice(0, limit);
}
