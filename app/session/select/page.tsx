'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { getEdition } from '@/lib/edition';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import { makeId } from '@/lib/utils';
import type { CurrentSession, EditionBook, UserLibraryBook } from '@/lib/types';
import { pickTrack, audioTracks } from '@/lib/audio';

const options = [30, 60, 90];

interface AIEdition {
  theme: string;
  description: string;
  books: EditionBook[];
  month: string;
}

function SessionSelectContent() {
  const router = useRouter();
  const params = useSearchParams();
  const itemId = params.get('itemId') ?? '';
  const edition = getEdition();
  const genreFilter = useStoredState<string>(STORAGE_KEYS.editionGenre, 'all');
  const genreShelf = useStoredState<EditionBook[]>(STORAGE_KEYS.editionShelf, []);
  const userLibrary = useStoredState<UserLibraryBook[]>(STORAGE_KEYS.userLibrary, []);
  const aiEdition = useStoredState<AIEdition | null>(STORAGE_KEYS.aiEdition, null);
  const [shelfLoaded, setShelfLoaded] = useState(false);
  const shelfBooks =
    genreFilter.value === 'all' ? edition.books : genreShelf.value;

  const item = useMemo(() => {
    // Check AI-generated edition first (priority)
    if (aiEdition.value?.books) {
      const aiBook = aiEdition.value.books.find((book) => book.id === itemId);
      if (aiBook) return aiBook;
    }

    // Check static edition books
    const editionBook = shelfBooks.find((book) => book.id === itemId) ??
      edition.books.find((book) => book.id === itemId);
    if (editionBook) return editionBook;

    // Check user library
    const userBook = userLibrary.value.find((book) => book.id === itemId);
    if (userBook) {
      // Convert UserLibraryBook to EditionBook format
      return {
        id: userBook.id,
        title: userBook.title,
        author: userBook.author || 'Unknown Author',
        why_this_book: userBook.summary,
        best_context: 'Any quiet place',
        estimated_sessions: 3
      } as EditionBook;
    }

    return null;
  }, [aiEdition.value, shelfBooks, edition.books, userLibrary.value, itemId]);
  const [selected, setSelected] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const currentSession = useStoredState<CurrentSession | null>(
    STORAGE_KEYS.currentSession,
    null
  );

  // Check if book is already in user's library
  const isInLibrary = useMemo(() => {
    if (!item) return false;
    return userLibrary.value.some((book) => book.id === item.id);
  }, [item, userLibrary.value]);

  useEffect(() => {
    if (genreFilter.value === 'all') return;
    if (genreShelf.value.length > 0) return;
    if (!itemId || shelfLoaded) return;
    let cancelled = false;
    const loadShelf = async () => {
      setShelfLoaded(true);
      try {
        const response = await fetch(
          `/api/edition-shelf?genre=${encodeURIComponent(genreFilter.value)}`
        );
        if (!response.ok) return;
        const payload = (await response.json()) as { books: EditionBook[] };
        if (!cancelled) {
          genreShelf.setValue(payload.books ?? []);
        }
      } catch {
        // ignore fetch errors
      }
    };
    loadShelf();
    return () => {
      cancelled = true;
    };
  }, [genreFilter.value, genreShelf.value.length, genreShelf.setValue, itemId, shelfLoaded]);

  const handleStart = () => {
    if (!item || !selected) return;
    const track = selectedTrack
      ? audioTracks.find((candidate) => candidate.id === selectedTrack) ?? pickTrack(`${item.id}-${Date.now()}`)
      : pickTrack(`${item.id}-${Date.now()}`);
    const session: CurrentSession = {
      id: makeId(),
      bookId: item.id,
      bookTitle: item.title,
      bookAuthor: item.author,
      startedAt: new Date().toISOString(),
      plannedMinutes: selected,
      elapsedSeconds: 0,
      lastTickAt: new Date().toISOString(),
      isPaused: false,
      trackId: track.id
    };
    currentSession.setValue(session);
    router.push(`/read/${item.id}`);
  };

  const handleAddToLibrary = () => {
    if (!item || isInLibrary) return;
    setIsAddingToLibrary(true);

    const newBook: UserLibraryBook = {
      id: item.id,
      title: item.title,
      author: item.author,
      summary: item.why_this_book || 'Added from monthly edition',
      addedAt: new Date().toISOString(),
      isCurrent: false
    };

    const updatedLibrary = [...userLibrary.value, newBook];
    userLibrary.setValue(updatedLibrary);

    // Reset after a short delay to show feedback
    setTimeout(() => {
      setIsAddingToLibrary(false);
    }, 1500);
  };

  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="Session" backHref="/library" />
        {!item ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-medium">Item not found</h1>
            <p className="text-sm text-[var(--muted)]">
              The shelf has shifted. Choose a different piece.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <h1 className="text-2xl font-medium">{item.title}</h1>
                  <p className="text-sm text-[var(--muted)]">{item.author}</p>
                </div>
                {!isInLibrary && (
                  <button
                    onClick={handleAddToLibrary}
                    disabled={isAddingToLibrary}
                    className={`shrink-0 rounded-xl border px-4 py-2 text-xs font-medium transition-colors ${
                      isAddingToLibrary
                        ? 'border-green-500/20 bg-green-500/10 text-green-600'
                        : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--card)]'
                    }`}
                  >
                    {isAddingToLibrary ? '✓ Added' : '+ Add to Library'}
                  </button>
                )}
                {isInLibrary && (
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    <span className="rounded-full bg-green-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-green-600">
                      In Your Library
                    </span>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      Ready to read
                    </p>
                  </div>
                )}
              </div>
              <p className="text-sm">{item.why_this_book}</p>
              <p className="text-sm text-[var(--muted)]">
                Best context: {item.best_context}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Select a session length
              </p>
              <div className="grid grid-cols-3 gap-3">
                {options.map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => setSelected(minutes)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      selected === minutes
                        ? 'border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--border)] bg-transparent text-[var(--text)]'
                    }`}
                  >
                    {minutes} min
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Curated music
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTrack('')}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                    selectedTrack === ''
                      ? 'border-[var(--text)] text-[var(--text)]'
                      : 'border-[var(--border)] text-[var(--muted)]'
                  }`}
                >
                  Surprise me
                </button>
                {audioTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setSelectedTrack(track.id)}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                      selectedTrack === track.id
                        ? 'border-[var(--text)] text-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {track.title}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!selected}
              className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${
                selected
                  ? 'border border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                  : 'border border-[var(--border)] bg-transparent text-[var(--muted)]'
              }`}
            >
              Begin session
            </button>
          </div>
        )}
      </Container>
    </AccessGate>
  );
}

export default function SessionSelectPage() {
  return (
    <Suspense fallback={
      <AccessGate>
        <Container size="md">
          <TopNav title="Session" backHref="/library" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-[var(--card)]"></div>
            <div className="h-4 w-1/2 animate-pulse rounded bg-[var(--card)]"></div>
          </div>
        </Container>
      </AccessGate>
    }>
      <SessionSelectContent />
    </Suspense>
  );
}
