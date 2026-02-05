'use client';

import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { TribeMembership } from '@/lib/types';
import { getCircles } from '@/lib/tribe';
import { getEdition } from '@/lib/edition';

export default function TribePage() {
  const edition = getEdition();
  const circles = getCircles();
  const memberships = useStoredState<TribeMembership[]>(
    STORAGE_KEYS.tribeMemberships,
    []
  );

  const joinedIds = new Set(memberships.value.map((item) => item.bookId));

  const toggleMembership = (bookId: string) => {
    if (joinedIds.has(bookId)) {
      memberships.setValue(memberships.value.filter((item) => item.bookId !== bookId));
      return;
    }
    memberships.setValue([
      ...memberships.value,
      { bookId, joinedAt: new Date().toISOString() }
    ]);
  };

  return (
    <AccessGate>
      <Container size="lg">
        <TopNav title="Tribe" backHref="/library" />
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium">Reading circles</h1>
            <p className="text-sm text-[var(--muted)]">
              Small, quiet circles tied to this month’s edition. No feeds, no
              notifications.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-sm text-[var(--muted)] shadow-soft">
            Circles reset when the edition ends on {edition.end_date}. This is a
            local-only prototype.
          </div>

          <div className="grid gap-4">
            {circles.map((circle) => {
              const joined = joinedIds.has(circle.bookId);
              return (
                <div
                  key={circle.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-medium">{circle.title}</h2>
                      <p className="text-sm text-[var(--muted)]">{circle.author}</p>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Up to {circle.capacity} seats
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => toggleMembership(circle.bookId)}
                      className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                        joined
                          ? 'border-[var(--text)] text-[var(--text)]'
                          : 'border-[var(--border)] text-[var(--muted)]'
                      }`}
                    >
                      {joined ? 'Leave circle' : 'Join circle'}
                    </button>
                    {joined ? (
                      <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Seat held for you
                      </span>
                    ) : null}
                  </div>
                  {joined ? (
                    <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Weekly prompt
                      </p>
                      <p className="mt-2">{circle.prompt}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </AccessGate>
  );
}
