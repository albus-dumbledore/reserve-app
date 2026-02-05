'use client';

import { useMemo, useState } from 'react';
import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import { makeId, formatMonthYear, groupByMonth } from '@/lib/utils';
import type { UserLibraryBook } from '@/lib/types';

interface BookOption {
  title: string;
  author: string;
  summary: string;
  year?: number | null;
}

export default function MyLibraryPage() {
  const library = useStoredState<UserLibraryBook[]>(STORAGE_KEYS.userLibrary, []);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [bookOptions, setBookOptions] = useState<BookOption[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const currentBook = useMemo(
    () => library.value.find((book) => book.isCurrent) ?? null,
    [library.value]
  );

  const groupedBooks = useMemo(() => {
    return groupByMonth(library.value);
  }, [library.value]);

  const handleFetchDetails = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || loading) return;
    setError('');
    setLoading(true);
    setBookOptions([]);
    setSelectedBook(null);

    try {
      const response = await fetch('/api/book-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle, author: author.trim() })
      });

      if (response.ok) {
        const payload = (await response.json()) as { books: BookOption[] };
        const books = payload.books || [];
        setBookOptions(books);
        // Auto-select first option if only one result
        if (books.length === 1) {
          setSelectedBook(books[0]);
          setAuthor(books[0].author);
        }
      } else {
        setBookOptions([{
          title: trimmedTitle,
          author: author.trim() || '',
          summary: 'A physical book in your reading room.',
          year: null
        }]);
      }
    } catch (err) {
      setBookOptions([{
        title: trimmedTitle,
        author: author.trim() || '',
        summary: 'A physical book in your reading room.',
        year: null
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedBook) return;

    const nextBook: UserLibraryBook = {
      id: makeId(),
      title: selectedBook.title,
      author: selectedBook.author || undefined,
      summary: selectedBook.summary,
      addedAt: new Date().toISOString(),
      isCurrent: true
    };

    const updated = [
      nextBook,
      ...library.value.map((book) => ({ ...book, isCurrent: false }))
    ];
    library.setValue(updated);
    setTitle('');
    setAuthor('');
    setBookOptions([]);
    setSelectedBook(null);
    setShowForm(false);
  };

  const handleSetCurrent = (id: string) => {
    const updated = library.value.map((book) => ({
      ...book,
      isCurrent: book.id === id
    }));
    library.setValue(updated);
  };

  const handleRemove = (id: string) => {
    const updated = library.value.filter((book) => book.id !== id);
    library.setValue(updated);
    setConfirmRemove(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setTitle('');
    setAuthor('');
    setBookOptions([]);
    setSelectedBook(null);
    setError('');
  };

  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="My library" backHref="/library" />
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium">Your library</h1>
            <p className="text-sm text-[var(--muted)]">
              Track the physical books you are reading right now.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Current book
                </p>
                {currentBook ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-lg font-medium">{currentBook.title}</p>
                    {currentBook.author ? (
                      <p className="text-sm text-[var(--muted)]">
                        {currentBook.author}
                      </p>
                    ) : null}
                    <p className="text-sm">{currentBook.summary}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    No current book set.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowForm((prev) => !prev)}
                className="rounded-full border border-[var(--text)] px-4 py-2 text-xs uppercase tracking-[0.2em]"
              >
                {showForm ? 'Close' : 'Add current'}
              </button>
            </div>

            {showForm ? (
              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text)]"
                    placeholder="Focus on What Matters"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Author (optional)
                  </label>
                  <input
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text)]"
                    placeholder="Darius Foroux"
                  />
                </div>

                {bookOptions.length === 0 ? (
                  <button
                    onClick={handleFetchDetails}
                    disabled={loading || !title.trim()}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-medium ${
                      loading || !title.trim()
                        ? 'border border-[var(--border)] text-[var(--muted)]'
                        : 'border border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                    }`}
                  >
                    {loading ? 'Searching…' : 'Search Books'}
                  </button>
                ) : (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Select your book ({bookOptions.length} found)
                      </p>
                      {bookOptions.map((book, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedBook(book)}
                          className={`w-full rounded-xl border p-4 text-left transition-colors ${
                            selectedBook === book
                              ? 'border-[var(--text)] bg-[var(--text)]/5'
                              : 'border-[var(--border)] hover:border-[var(--text)]'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium">{book.title}</p>
                              {selectedBook === book ? (
                                <span className="text-xs text-[var(--text)]">✓</span>
                              ) : null}
                            </div>
                            <p className="text-sm text-[var(--muted)]">
                              {book.author}{book.year ? ` (${book.year})` : ''}
                            </p>
                            <p className="text-sm">{book.summary}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleCancel}
                        className="flex-1 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--muted)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAdd}
                        disabled={!selectedBook}
                        className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium ${
                          selectedBook
                            ? 'border border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                            : 'border border-[var(--border)] text-[var(--muted)]'
                        }`}
                      >
                        Save Book
                      </button>
                    </div>
                  </>
                )}

                {error ? <p className="text-xs text-red-500">{error}</p> : null}
                <p className="text-xs text-[var(--muted)]">
                  Summaries are AI-generated and may be imperfect.
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              Library History
            </p>
            {library.value.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm text-[var(--muted)] shadow-soft">
                Your library is empty.
              </div>
            ) : (
              <div className="space-y-8">
                {Array.from(groupedBooks.entries()).map(([monthKey, books]) => (
                  <div key={monthKey} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium tracking-[0.2em]">
                        {formatMonthYear(books[0].addedAt)}
                      </h3>
                      <span className="text-xs text-[var(--muted)]">
                        ({books.length} {books.length === 1 ? 'book' : 'books'})
                      </span>
                    </div>
                    <div className="grid gap-4">
                      {books.map((book) => (
                        <div
                          key={book.id}
                          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-medium">{book.title}</p>
                                {book.isCurrent ? (
                                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                                    ✓
                                  </span>
                                ) : null}
                              </div>
                              {book.author ? (
                                <p className="text-sm text-[var(--muted)]">
                                  {book.author}
                                </p>
                              ) : null}
                              <p className="text-sm">{book.summary}</p>
                              <p className="text-xs text-[var(--muted)]">
                                Added: {new Date(book.addedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => setConfirmRemove(book.id)}
                                className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)] hover:border-red-500 hover:text-red-500"
                              >
                                ×
                              </button>
                              {!book.isCurrent ? (
                                <button
                                  onClick={() => handleSetCurrent(book.id)}
                                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
                                >
                                  Set Current
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {confirmRemove ? (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-6">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm shadow-soft">
              <p className="mb-4 text-base font-medium">Remove this book?</p>
              <div className="mb-4">
                {(() => {
                  const book = library.value.find((b) => b.id === confirmRemove);
                  return book ? (
                    <>
                      <p className="font-medium">{book.title}</p>
                      {book.author ? (
                        <p className="text-[var(--muted)]">{book.author}</p>
                      ) : null}
                    </>
                  ) : null;
                })()}
              </div>
              <p className="mb-6 text-sm text-[var(--muted)]">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRemove(null)}
                  className="flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemove(confirmRemove)}
                  className="flex-1 rounded-full border border-red-500 bg-red-500 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                >
                  Remove Book
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Container>
    </AccessGate>
  );
}
