'use client';

import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { getEdition } from '@/lib/edition';

export default function NotePage() {
  const edition = getEdition();
  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="Note" backHref="/library" />
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Editor's note
            </p>
            <h1 className="text-3xl font-medium">{edition.editorial_note.title}</h1>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <p className="reading-text text-[17px] text-[var(--text)]">
              {edition.editorial_note.body}
            </p>
          </div>
        </div>
      </Container>
    </AccessGate>
  );
}
