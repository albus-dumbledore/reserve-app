'use client';

import { useState } from 'react';
import Link from 'next/link';
import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { ConciergeMessage, ConciergeSuggestion, UserLibraryBook } from '@/lib/types';
import { makeId } from '@/lib/utils';
import { useReadingContext } from '@/hooks/useReadingContext';

const quickPrompts = [
  'Books by Indian authors',
  'Something for a cozy winter evening',
  'Help me focus better',
  'Light and uplifting',
  'Books for my 8-year-old',
  'Surprise me'
];

export default function ConciergePage() {
  const messages = useStoredState<ConciergeMessage[]>(
    STORAGE_KEYS.conciergeMessages,
    []
  );
  const userLibrary = useStoredState<UserLibraryBook[]>(STORAGE_KEYS.userLibrary, []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showOldConversations, setShowOldConversations] = useState(false);
  const [addingToLibrary, setAddingToLibrary] = useState<string | null>(null);

  const { context } = useReadingContext();

  // Show only current conversation (last 2 messages = 1 user query + 1 concierge response)
  const RECENT_MESSAGE_COUNT = 2;
  const recentMessages = messages.value.slice(-RECENT_MESSAGE_COUNT);
  const oldMessages = messages.value.slice(0, -RECENT_MESSAGE_COUNT);
  const hasOldMessages = oldMessages.length > 0;

  const handleSend = async (text: string, excludeBookIds?: string[]) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError('');

    // Hide old conversations when starting a new conversation
    setShowOldConversations(false);

    const userMessage: ConciergeMessage = {
      id: makeId(),
      role: 'user',
      text: trimmed,
      createdAt: new Date().toISOString()
    };

    if (!excludeBookIds) {
      messages.setValue([...messages.value, userMessage]);
      setInput('');
    }
    setLoading(true);

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          excludeBookIds: excludeBookIds || [],
          context: context || undefined
        })
      });
      if (!response.ok) {
        throw new Error('Concierge is unavailable.');
      }
      const payload = (await response.json()) as {
        title: string;
        suggestions: ConciergeSuggestion[];
      };

      const conciergeMessage: ConciergeMessage = {
        id: makeId(),
        role: 'concierge',
        text: payload.title,
        createdAt: new Date().toISOString(),
        suggestions: payload.suggestions
      };

      if (excludeBookIds) {
        messages.setValue([...messages.value, conciergeMessage]);
      } else {
        messages.setValue([...messages.value, userMessage, conciergeMessage]);
      }
    } catch (err) {
      setError('Concierge is quiet right now. Try again soon.');
      if (!excludeBookIds) {
        messages.setValue([...messages.value, userMessage]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(null);
    }
  };

  const handleSuggestMore = async (userQuery: string, messageId: string) => {
    setLoadingMore(messageId);
    const allSuggestedBookIds = messages.value
      .filter((msg) => msg.role === 'concierge' && msg.suggestions)
      .flatMap((msg) => msg.suggestions?.map((s) => s.bookId) || []);

    await handleSend(userQuery, allSuggestedBookIds);
  };

  const handleClear = () => {
    if (window.confirm('Clear conversation history?')) {
      messages.setValue([]);
      setError('');
    }
  };

  const handleAddToLibrary = (suggestion: ConciergeSuggestion) => {
    if (!suggestion.title || !suggestion.author) return;

    // Check if already in library
    const existsInLibrary = userLibrary.value.some((book) => book.id === suggestion.bookId);
    if (existsInLibrary) return;

    setAddingToLibrary(suggestion.bookId);

    const newBook: UserLibraryBook = {
      id: suggestion.bookId,
      title: suggestion.title,
      author: suggestion.author,
      summary: suggestion.rationale,
      addedAt: new Date().toISOString(),
      isCurrent: false
    };

    const updatedLibrary = [...userLibrary.value, newBook];
    userLibrary.setValue(updatedLibrary);

    // Reset after a short delay to show feedback
    setTimeout(() => {
      setAddingToLibrary(null);
    }, 1500);
  };

  const isInLibrary = (bookId: string) => {
    return userLibrary.value.some((book) => book.id === bookId);
  };

  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="Concierge" backHref="/library" />
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium">Digital Concierge</h1>
            <p className="text-sm text-[var(--muted)]">
              Ask for book recommendations from this edition
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <div className="space-y-4">
              <label className="text-sm font-medium">
                What would you like to read?
              </label>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(input);
                  }
                }}
                className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text)]"
                placeholder="I want something light and gentle..."
                disabled={loading}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-[var(--muted)]">
                  Press Enter to send
                </div>
                <button
                  onClick={() => handleSend(input)}
                  disabled={loading || !input.trim()}
                  className={`rounded-full px-5 py-2 text-sm font-medium ${
                    loading || !input.trim()
                      ? 'border border-[var(--border)] text-[var(--muted)]'
                      : 'border border-[var(--text)] bg-[var(--text)] text-[var(--bg)]'
                  }`}
                >
                  {loading ? 'Sending...' : 'Send request'}
                </button>
              </div>
              {error ? <p className="text-xs text-red-500">{error}</p> : null}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-[var(--muted)]">Or try:</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] hover:border-[var(--text)] hover:text-[var(--text)] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {messages.value.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Conversation</h2>
                <button
                  onClick={handleClear}
                  className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--text)]"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-6">
                {/* Show recent messages (newest on top) */}
                {recentMessages.reverse().map((message, index) => (
                  <div key={message.id} className="space-y-3">
                    {message.role === 'user' ? (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                        <p className="text-sm">{message.text}</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft">
                        <p className="mb-4 text-sm font-medium">{message.text}</p>
                        {message.suggestions && message.suggestions.length > 0 ? (
                          <div className="space-y-3">
                            {message.suggestions.map((suggestion) => (
                              <div
                                key={`${message.id}-${suggestion.bookId}`}
                                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4"
                              >
                                <Link
                                  href={`/session/select?itemId=${suggestion.bookId}`}
                                  className="block transition hover:opacity-80"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm">📖</span>
                                        <p className="text-sm font-medium">
                                          {suggestion.title ?? 'Recommendation'}
                                        </p>
                                      </div>
                                      {suggestion.author ? (
                                        <p className="text-xs text-[var(--muted)]">
                                          {suggestion.author}
                                        </p>
                                      ) : null}
                                      <p className="text-sm text-[var(--muted)]">
                                        {suggestion.rationale}
                                      </p>
                                    </div>
                                    <span className="text-sm text-[var(--muted)]">→</span>
                                  </div>
                                </Link>
                                <div className="mt-3 border-t border-[var(--border)] pt-3">
                                  {!isInLibrary(suggestion.bookId) ? (
                                    <button
                                      onClick={() => handleAddToLibrary(suggestion)}
                                      disabled={addingToLibrary === suggestion.bookId || !suggestion.title || !suggestion.author}
                                      className={`w-full rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                        addingToLibrary === suggestion.bookId
                                          ? 'border-green-500/20 bg-green-500/10 text-green-600'
                                          : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--card)]'
                                      }`}
                                    >
                                      {addingToLibrary === suggestion.bookId ? '✓ Added' : '+ Add to Library'}
                                    </button>
                                  ) : (
                                    <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-600">
                                      <span>✓</span>
                                      <span>In Library</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                // Find the user message that came before this concierge message
                                const messageIndex = messages.value.findIndex((m) => m.id === message.id);
                                const prevUserMessage = messages.value
                                  .slice(0, messageIndex)
                                  .reverse()
                                  .find((msg) => msg.role === 'user');
                                if (prevUserMessage) {
                                  handleSuggestMore(prevUserMessage.text, message.id);
                                }
                              }}
                              disabled={loadingMore === message.id}
                              className="mt-3 w-full rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)] transition hover:border-[var(--text)] hover:text-[var(--text)] disabled:opacity-50"
                            >
                              {loadingMore === message.id ? 'Finding more...' : 'Suggest more books'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}

                {/* Old conversations toggle */}
                {hasOldMessages && (
                  <div className="space-y-4 border-t border-[var(--border)] pt-6">
                    <button
                      onClick={() => setShowOldConversations(!showOldConversations)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm transition-colors hover:border-[var(--text)]"
                    >
                      <span className="text-[var(--muted)]">
                        {showOldConversations ? 'Hide' : 'Show'} older conversations ({oldMessages.length} messages)
                      </span>
                      <span className="text-[var(--muted)]">
                        {showOldConversations ? '↑' : '↓'}
                      </span>
                    </button>

                    {showOldConversations && (
                      <div className="space-y-6">
                        {oldMessages.reverse().map((message, index) => (
                          <div key={message.id} className="space-y-3 opacity-60">
                            {message.role === 'user' ? (
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                                <p className="text-sm">{message.text}</p>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft">
                                <p className="mb-4 text-sm font-medium">{message.text}</p>
                                {message.suggestions && message.suggestions.length > 0 ? (
                                  <div className="space-y-3">
                                    {message.suggestions.map((suggestion) => (
                                      <div
                                        key={`${message.id}-${suggestion.bookId}`}
                                        className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4"
                                      >
                                        <Link
                                          href={`/session/select?itemId=${suggestion.bookId}`}
                                          className="block transition hover:opacity-80"
                                        >
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm">📖</span>
                                                <p className="text-sm font-medium">
                                                  {suggestion.title ?? 'Recommendation'}
                                                </p>
                                              </div>
                                              {suggestion.author ? (
                                                <p className="text-xs text-[var(--muted)]">
                                                  {suggestion.author}
                                                </p>
                                              ) : null}
                                              <p className="text-sm text-[var(--muted)]">
                                                {suggestion.rationale}
                                              </p>
                                            </div>
                                            <span className="text-sm text-[var(--muted)]">→</span>
                                          </div>
                                        </Link>
                                        <div className="mt-3 border-t border-[var(--border)] pt-3">
                                          {!isInLibrary(suggestion.bookId) ? (
                                            <button
                                              onClick={() => handleAddToLibrary(suggestion)}
                                              disabled={addingToLibrary === suggestion.bookId || !suggestion.title || !suggestion.author}
                                              className={`w-full rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                                addingToLibrary === suggestion.bookId
                                                  ? 'border-green-500/20 bg-green-500/10 text-green-600'
                                                  : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--text)] hover:bg-[var(--card)]'
                                              }`}
                                            >
                                              {addingToLibrary === suggestion.bookId ? '✓ Added' : '+ Add to Library'}
                                            </button>
                                          ) : (
                                            <div className="flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-medium text-green-600">
                                              <span>✓</span>
                                              <span>In Library</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <p className="text-sm text-[var(--muted)]">
                No conversation yet. Ask for a recommendation above.
              </p>
            </div>
          )}
        </div>
      </Container>
    </AccessGate>
  );
}
