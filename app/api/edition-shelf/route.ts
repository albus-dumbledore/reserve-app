import { NextResponse } from 'next/server';
import { bookCatalog, filterBooksByTags, taxonomyConfig } from '@/lib/books';
import { MAX_BOOKS } from '@/lib/edition';
import type { BookEntry, EditionBook } from '@/lib/types';

export const runtime = 'nodejs';

const fallbackContexts = [
  'slow mornings',
  'late evenings',
  'travel days',
  'weekend afternoons',
  'quiet nights',
  'by a window',
  'with tea',
  'between meetings'
];

const whyTemplates = [
  'A {mood} {genre} pick meant for unhurried sessions and quiet return.',
  'A {genre} work with a {mood} tone, best read in measured sittings.',
  'A {mood} selection that rewards slow attention and a steady ritual.',
  'A {genre} companion for a calmer pace and longer, attentive reads.'
];

function normalizeGenre(genre: string) {
  return genre.replace(/-/g, ' ');
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFrom<T>(items: T[], seed: string) {
  if (items.length === 0) return undefined;
  const idx = hashString(seed) % items.length;
  return items[idx];
}

function buildEditionBook(book: BookEntry, index: number): EditionBook {
  const genre = book.genres[0] || 'literary';
  const mood = book.moods[0] || 'quiet';
  const contexts = taxonomyConfig.contexts?.length
    ? taxonomyConfig.contexts
    : fallbackContexts;
  const context = pickFrom(contexts, `${book.id}-${index}`) || 'quiet nights';
  const template =
    pickFrom(whyTemplates, `${book.id}-${genre}-${index}`) ||
    whyTemplates[0];

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    why_this_book: template
      .replace('{genre}', normalizeGenre(genre))
      .replace('{mood}', normalizeGenre(mood)),
    best_context: context,
    estimated_sessions: 3 + (hashString(book.id) % 5),
    genres: book.genres
  };
}

function pickShelf(filtered: BookEntry[], genre: string) {
  if (filtered.length === 0) return [];
  const sorted = [...filtered].sort((a, b) => a.id.localeCompare(b.id));
  if (sorted.length <= MAX_BOOKS) return sorted;
  const monthKey = new Date().toISOString().slice(0, 7);
  const offsetMax = Math.max(1, sorted.length - MAX_BOOKS + 1);
  const offset = hashString(`${genre}-${monthKey}`) % offsetMax;
  return sorted.slice(offset, offset + MAX_BOOKS);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = String(searchParams.get('genre') || '').trim().toLowerCase();

    if (!genre || genre === 'all') {
      return NextResponse.json({ books: [] });
    }

    const filtered = filterBooksByTags({
      genres: [genre],
      limit: 200
    });

    if (bookCatalog.length === 0) {
      return NextResponse.json({ books: [] });
    }

    const shelf = pickShelf(filtered, genre);
    const books = shelf.map((book, index) => buildEditionBook(book, index));

    return NextResponse.json({ books });
  } catch (error) {
    return NextResponse.json({ books: [] }, { status: 500 });
  }
}
