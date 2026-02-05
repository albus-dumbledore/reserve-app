'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AccessGate from '../components/AccessGate';
import Container from '../components/Container';
import TopNav from '../components/TopNav';
import WeatherIcon from '../components/WeatherIcon';
import BookAvailability from '../components/BookAvailability';
import { isEditionActive } from '@/lib/edition';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { EditionBook, MonthlyStatsMap, UserLibraryBook } from '@/lib/types';
import { formatMinutesShort } from '@/lib/utils';
import { getMonthStats } from '@/lib/fulfillment';
import { useReadingContext } from '@/hooks/useReadingContext';
import { formatContextDescription } from '@/lib/context';

interface AIEdition {
  theme: string;
  description: string;
  books: EditionBook[];
  month: string;
}

export default function LibraryPage() {
  const stats = useStoredState<MonthlyStatsMap>(STORAGE_KEYS.monthlyStats, {});
  const monthStats = getMonthStats(stats.value);
  const isActive = isEditionActive();
  const userLibrary = useStoredState<UserLibraryBook[]>(STORAGE_KEYS.userLibrary, []);
  const aiEdition = useStoredState<AIEdition | null>(STORAGE_KEYS.aiEdition, null);
  const [loadingEdition, setLoadingEdition] = useState(false);
  const [editionError, setEditionError] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);

  const { context, hasLocation } = useReadingContext();

  // Load AI-generated edition
  useEffect(() => {
    let cancelled = false;

    const loadAIEdition = async () => {
      setLoadingEdition(true);
      setEditionError('');
      try {
        const response = await fetch('/api/edition-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            context: context || undefined,
            cachedEdition: aiEdition.value
          })
        });

        if (!response.ok) {
          throw new Error('Failed to generate edition');
        }

        const payload = (await response.json()) as AIEdition;
        if (!cancelled) {
          aiEdition.setValue(payload);
        }
      } catch (error) {
        console.error('AI Edition error:', error);
        if (!cancelled) {
          setEditionError('Unable to generate this month\'s edition. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoadingEdition(false);
        }
      }
    };

    loadAIEdition();
    return () => {
      cancelled = true;
    };
  }, [context, aiEdition.setValue]);

  const editionBooks = aiEdition.value?.books || [];
  const visibleBooks = editionBooks.slice(0, visibleCount);
  const hasMore = visibleCount < editionBooks.length;
  const isAllShown = editionBooks.length > 0 && !hasMore;

  const handleShowMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, editionBooks.length));
  };

  return (
    <AccessGate>
      <Container size="lg">
        <TopNav title="Edition" />
        <div className="space-y-8">
          {context && hasLocation && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Your Reading Moment
                    </p>
                    <p className="text-lg font-medium capitalize">
                      {formatContextDescription(context)}
                    </p>
                    {context.weather && (
                      <p className="text-sm text-[var(--muted)]">
                        {context.weather.temp}°C • {context.season}
                      </p>
                    )}
                  </div>
                  {context.weather && (
                    <WeatherIcon
                      condition={context.weather.condition}
                      className="text-[var(--text)]"
                    />
                  )}
                </div>
                <p className="text-sm text-[var(--muted)]">
                  Perfect for: {context.readingMood} reads
                </p>
                <Link
                  href="/concierge"
                  className="inline-flex items-center gap-2 text-sm text-[var(--text)] hover:underline"
                >
                  Ask Concierge for suggestions →
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Monthly fulfillment
            </p>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-[var(--muted)]">Sessions this month</p>
                  <p className="text-2xl font-medium">{monthStats.sessions}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-sm text-[var(--muted)]">Time spent</p>
                  <p className="text-2xl font-medium">
                    {formatMinutesShort(monthStats.minutes)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">
                Quiet, cumulative, and only for this month.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {aiEdition.value && (
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                {aiEdition.value.theme}
              </p>
            )}
            <h1 className="text-3xl font-medium">The monthly edition</h1>
            {aiEdition.value && (
              <p className="text-sm text-[var(--muted)]">
                {aiEdition.value.description}
              </p>
            )}
            {!aiEdition.value && !loadingEdition && (
              <p className="text-sm text-[var(--muted)]">
                A small, editorial list curated by AI based on the season and your context.
              </p>
            )}
          </div>

          {!isActive ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] shadow-soft">
              This edition is not currently active. Please check back with the next
              rotation.
            </div>
          ) : (
            <div className="grid gap-4">
              {loadingEdition ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] shadow-soft">
                  Curating this month's edition…
                </div>
              ) : null}
              {editionError ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] shadow-soft">
                  {editionError}
                </div>
              ) : null}
              {!loadingEdition && editionBooks.length === 0 && !editionError ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] shadow-soft">
                  No books available for this edition yet.
                </div>
              ) : null}
              {visibleBooks.map((book) => {
                const isInUserLibrary = userLibrary.value.some((userBook) => userBook.id === book.id);

                const handleAddToLibrary = () => {
                  const newBook: UserLibraryBook = {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    summary: book.why_this_book || 'From monthly edition',
                    addedAt: new Date().toISOString(),
                    isCurrent: false
                  };
                  userLibrary.setValue([...userLibrary.value, newBook]);
                };

                return (
                  <div
                    key={book.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft transition hover:border-[var(--text)]"
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-lg font-medium">{book.title}</h2>
                              {isInUserLibrary && (
                                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-green-600">
                                  In Library
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--muted)]">{book.author}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                              {book.estimated_sessions} sessions
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            Why this book
                          </p>
                          <p className="text-sm">{book.why_this_book}</p>
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          Best for: {book.best_context}
                        </p>
                      </div>

                      {/* Action button: Add to Library or Start Session */}
                      {isInUserLibrary ? (
                        <Link
                          href={`/session/select?itemId=${book.id}`}
                          className="block w-full rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-[var(--bg)] hover:opacity-90 transition-opacity"
                        >
                          Start Session
                        </Link>
                      ) : (
                        <button
                          onClick={handleAddToLibrary}
                          className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--card)] transition-colors"
                        >
                          + Add to Library to Read
                        </button>
                      )}

                      <div className="border-t border-[var(--border)] pt-3">
                        <BookAvailability
                          bookTitle={book.title}
                          bookAuthor={book.author}
                          bookId={book.id}
                        />
                      </div>
                  </div>
                </div>
                );
              })}

              {hasMore && !loadingEdition && (
                <button
                  onClick={handleShowMore}
                  className="w-full rounded-2xl border border-[var(--text)] bg-transparent px-6 py-4 text-sm font-medium hover:bg-[var(--text)] hover:text-[var(--bg)] transition-colors"
                >
                  Show more books ({editionBooks.length - visibleCount} remaining)
                </button>
              )}

              {isAllShown && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
                  <p className="text-sm text-[var(--muted)]">
                    You've seen all 20 suggestions for this month's edition.
                  </p>
                  <p className="text-xs text-[var(--muted)] mt-2">
                    Check back next month for a new curated selection.
                  </p>
                </div>
              )}
            </div>
          )}

          {userLibrary.value.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                  Personal Library
                </p>
                <span className="rounded-full bg-[var(--text)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--bg)]">
                  Your Books
                </span>
              </div>
              <div className="grid gap-4">
                {userLibrary.value.map((book) => (
                  <div
                    key={book.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft transition hover:border-[var(--text)]"
                  >
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <Link href={`/session/select?itemId=${book.id}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-medium hover:underline">{book.title}</h2>
                                {book.isCurrent ? (
                                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-green-600">
                                    Current
                                  </span>
                                ) : null}
                              </div>
                              {book.author ? (
                                <p className="text-sm text-[var(--muted)] mt-1">{book.author}</p>
                              ) : null}
                              <p className="text-sm mt-2">{book.summary}</p>
                            </Link>
                          </div>
                          <Link
                            href={`/session/select?itemId=${book.id}`}
                            className="shrink-0 rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[var(--bg)] hover:opacity-90 transition-opacity"
                          >
                            Start Session
                          </Link>
                        </div>
                      </div>
                      {book.author && (
                        <div className="border-t border-[var(--border)] pt-3">
                          <BookAvailability
                            bookTitle={book.title}
                            bookAuthor={book.author}
                            bookId={book.id}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Container>
    </AccessGate>
  );
}
