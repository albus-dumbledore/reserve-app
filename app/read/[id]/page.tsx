'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AccessGate from '@/app/components/AccessGate';
import { getEdition } from '@/lib/edition';
import { getTrackById, pickTrack } from '@/lib/audio';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import { addSessionToStats } from '@/lib/fulfillment';
import { formatMinutesShort, makeId } from '@/lib/utils';
import type { CurrentSession, EditionBook, MonthlyStatsMap, SessionRecord } from '@/lib/types';
import { calculateActualMinutes } from '@/lib/session';

const DEFAULT_AUDIO = {
  volume: 0.6,
  muted: false
};

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const edition = getEdition();
  const genreFilter = useStoredState<string>(STORAGE_KEYS.editionGenre, 'all');
  const genreShelf = useStoredState<EditionBook[]>(STORAGE_KEYS.editionShelf, []);
  const shelfBooks =
    genreFilter.value === 'all' ? edition.books : genreShelf.value;
  const book = useMemo(
    () =>
      shelfBooks.find((entry) => entry.id === itemId) ??
      edition.books.find((entry) => entry.id === itemId) ??
      null,
    [shelfBooks, edition.books, itemId]
  );

  const session = useStoredState<CurrentSession | null>(
    STORAGE_KEYS.currentSession,
    null
  );
  const history = useStoredState<SessionRecord[]>(
    STORAGE_KEYS.sessionHistory,
    []
  );
  const lastSession = useStoredState<SessionRecord | null>(
    STORAGE_KEYS.lastSession,
    null
  );
  const monthlyStats = useStoredState<MonthlyStatsMap>(
    STORAGE_KEYS.monthlyStats,
    {}
  );
  const audioSettings = useStoredState<typeof DEFAULT_AUDIO>(
    STORAGE_KEYS.audioSettings,
    DEFAULT_AUDIO
  );

  const sessionRef = useRef<CurrentSession | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hideTicker, setHideTicker] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);

  useEffect(() => {
    if (!session.value) {
      sessionRef.current = null;
      setElapsedSeconds(0);
      return;
    }
    const nowIso = new Date().toISOString();
    const needsUpdate =
      !session.value.bookId ||
      !session.value.bookTitle ||
      !Number.isFinite(session.value.elapsedSeconds) ||
      !session.value.lastTickAt ||
      typeof session.value.isPaused !== 'boolean' ||
      !session.value.trackId;
    const normalized: CurrentSession = {
      ...session.value,
      bookId: session.value.bookId ?? (session.value as unknown as { itemId?: string }).itemId ?? '',
      bookTitle:
        session.value.bookTitle ??
        (session.value as unknown as { itemTitle?: string }).itemTitle ??
        '',
      elapsedSeconds: Number.isFinite(session.value.elapsedSeconds)
        ? session.value.elapsedSeconds
        : 0,
      lastTickAt: session.value.lastTickAt ?? nowIso,
      isPaused: session.value.isPaused ?? false,
      trackId: session.value.trackId || pickTrack(session.value.id).id
    };
    sessionRef.current = normalized;
    setElapsedSeconds(normalized.elapsedSeconds);
    if (needsUpdate) {
      session.setValue(normalized);
    }
  }, [session.value, session.setValue]);

  useEffect(() => {
    if (!session.ready) return;
    if (!itemId) return;
    if (!session.value || session.value.bookId !== itemId) {
      router.replace(`/session/select?itemId=${itemId}`);
    }
  }, [itemId, router, session.ready, session.value]);

  useEffect(() => {
    if (!session.ready) return;
    const timer = window.setInterval(() => {
      const current = sessionRef.current;
      if (!current || current.isPaused) return;
      const lastTick = new Date(current.lastTickAt).getTime();
      const now = Date.now();
      const delta = Math.max(0, Math.floor((now - lastTick) / 1000));
      if (delta <= 0) return;
      const nextElapsed = current.elapsedSeconds + delta;
      const updated: CurrentSession = {
        ...current,
        elapsedSeconds: nextElapsed,
        lastTickAt: new Date().toISOString()
      };
      sessionRef.current = updated;
      session.setValue(updated);
      setElapsedSeconds(nextElapsed);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session.ready, session.setValue]);

  const track = useMemo(() => {
    if (!session.value) return null;
    return getTrackById(session.value.trackId) ?? pickTrack(session.value.id);
  }, [session.value]);

  useEffect(() => {
    if (!track || !audioRef.current) return;
    const el = audioRef.current;
    el.volume = audioSettings.value.volume;
    el.muted = audioSettings.value.muted;
    if (!session.value?.isPaused) {
      el.play().catch(() => setAudioBlocked(true));
    }
  }, [audioSettings.value.muted, audioSettings.value.volume, session.value?.isPaused, track]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (session.value?.isPaused) {
      audioRef.current.pause();
    }
  }, [session.value?.isPaused]);

  const handlePauseToggle = () => {
    if (!sessionRef.current) return;
    const now = new Date().toISOString();
    const updated: CurrentSession = sessionRef.current.isPaused
      ? { ...sessionRef.current, isPaused: false, lastTickAt: now }
      : { ...sessionRef.current, isPaused: true, lastTickAt: now };
    sessionRef.current = updated;
    session.setValue(updated);
  };

  const handleEndSession = () => {
    setConfirmEnd(true);
  };

  const confirmEndSession = () => {
    if (!sessionRef.current) return;
    const resolvedBook: EditionBook = book ?? {
      id: sessionRef.current.bookId,
      title: sessionRef.current.bookTitle || 'Untitled',
      author: sessionRef.current.bookAuthor || 'Unknown',
      why_this_book: 'Selected for a quiet session.',
      best_context: 'Any quiet place.',
      estimated_sessions: 0
    };
    const endedAt = new Date().toISOString();
    const actualMinutes = calculateActualMinutes(elapsedSeconds);
    const record: SessionRecord = {
      id: makeId(),
      bookId: resolvedBook.id,
      bookTitle: resolvedBook.title,
      startedAt: sessionRef.current.startedAt,
      endedAt,
      plannedMinutes: sessionRef.current.plannedMinutes,
      actualMinutes
    };
    history.setValue([...history.value, record]);
    lastSession.setValue(record);
    monthlyStats.setValue(addSessionToStats(monthlyStats.value, record));
    session.setValue(null);
    setConfirmEnd(false);
    router.push('/session/complete');
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timerLabel = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const resolvedBook: EditionBook | null =
    book ??
    (session.value && session.value.bookId
      ? {
          id: session.value.bookId,
          title: session.value.bookTitle || 'Untitled',
          author: session.value.bookAuthor || 'Unknown',
          why_this_book: 'Selected for a quiet session.',
          best_context: 'Any quiet place.',
          estimated_sessions: 0
        }
      : null);

  if (!resolvedBook) {
    return (
      <AccessGate>
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          This book is no longer in the edition.
        </div>
      </AccessGate>
    );
  }

  return (
    <AccessGate>
      <div className="relative min-h-screen bg-[var(--bg)] px-6 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
            <span>Session</span>
            {!hideTicker ? <span>{timerLabel}</span> : <span>Timer hidden</span>}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-medium tracking-quiet">{resolvedBook.title}</h1>
            <p className="text-sm text-[var(--muted)]">{resolvedBook.author}</p>
            <p className="text-sm">{resolvedBook.why_this_book}</p>
            <p className="text-sm text-[var(--muted)]">
              Best context: {resolvedBook.best_context}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Planned session
              </p>
              <p className="text-2xl font-medium">
                {formatMinutesShort(session.value?.plannedMinutes ?? 0)}
              </p>
              <p className="text-sm text-[var(--muted)]">
                Settle in with your physical copy. The room will keep the time.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handlePauseToggle}
                className="rounded-full border border-[var(--text)] px-4 py-2 text-xs uppercase tracking-[0.2em]"
              >
                {session.value?.isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => setHideTicker((prev) => !prev)}
                className="rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
              >
                {hideTicker ? 'Show ticker' : 'Hide ticker'}
              </button>
              <button
                onClick={handleEndSession}
                className="rounded-full border border-[var(--text)] bg-[var(--text)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--bg)]"
              >
                End session
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)] shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Cafe ambience
                  </p>
                  <p className="text-sm text-[var(--text)]">
                    {track?.title ?? 'Ambient track'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      audioSettings.setValue({
                        ...audioSettings.value,
                        muted: !audioSettings.value.muted
                      })
                    }
                    className="rounded-full border border-[var(--border)] px-3 py-2 text-xs uppercase tracking-[0.2em]"
                  >
                    {audioSettings.value.muted ? 'Unmute' : 'Mute'}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioSettings.value.volume}
                    onChange={(event) =>
                      audioSettings.setValue({
                        ...audioSettings.value,
                        volume: Number(event.target.value)
                      })
                    }
                    className="w-24"
                    aria-label="Volume"
                  />
                </div>
              </div>
              {audioBlocked ? (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  Tap the page or toggle mute to enable audio.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {confirmEnd ? (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-6">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-sm shadow-soft">
              <p className="mb-4 text-base font-medium">End this session?</p>
              <p className="mb-6 text-sm text-[var(--muted)]">
                Your time will be logged toward this month’s fulfillment snapshot.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEndSession}
                  className="flex-1 rounded-full border border-[var(--text)] bg-[var(--text)] px-4 py-2 text-xs uppercase tracking-[0.2em] text-[var(--bg)]"
                >
                  End session
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {track?.file ? (
          <audio ref={audioRef} src={track.file} loop preload="auto" />
        ) : null}
      </div>
    </AccessGate>
  );
}
