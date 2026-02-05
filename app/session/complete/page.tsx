'use client';

import Link from 'next/link';
import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { SessionRecord } from '@/lib/types';
import { formatMinutes } from '@/lib/utils';

export default function SessionCompletePage() {
  const lastSession = useStoredState<SessionRecord | null>(
    STORAGE_KEYS.lastSession,
    null
  );

  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="Complete" backHref="/library" />
        {!lastSession.value ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-medium">No session found</h1>
            <p className="text-sm text-[var(--muted)]">
              Begin a new reading session from the shelf.
            </p>
            <Link
              href="/library"
              className="inline-flex rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-3 text-sm font-medium text-[var(--bg)]"
            >
              Return to shelf
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Session complete
            </p>
            <h1 className="text-3xl font-medium">You kept the time.</h1>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
              <div className="space-y-2">
                <p className="text-sm text-[var(--muted)]">{lastSession.value.bookTitle}</p>
                <p className="text-lg font-medium">
                  {formatMinutes(lastSession.value.actualMinutes)} spent
                </p>
                <p className="text-sm text-[var(--muted)]">
                  Planned for {formatMinutes(lastSession.value.plannedMinutes)}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
              <Link href="/library" className="underline-offset-4 hover:underline">
                Back to edition
              </Link>
            </div>
          </div>
        )}
      </Container>
    </AccessGate>
  );
}
