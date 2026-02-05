'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Container from './components/Container';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { AuthState } from '@/lib/types';

export default function LandingPage() {
  const router = useRouter();
  const auth = useStoredState<AuthState | null>(STORAGE_KEYS.auth, null);
  const member = useStoredState<boolean>(STORAGE_KEYS.member, false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!auth.ready || !member.ready) return;
    if (auth.value && member.value) {
      router.replace('/library');
      return;
    }
    if (auth.value && !member.value) {
      router.replace('/paywall');
    }
  }, [auth.ready, auth.value, member.ready, member.value, router]);

  const handleSignIn = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter an email and password.');
      return;
    }
    const payload: AuthState = {
      email: email.trim(),
      createdAt: new Date().toISOString()
    };
    auth.setValue(payload);
    setError('');
    router.push('/paywall');
  };

  return (
    <Container size="md">
      <div className="flex min-h-[80vh] flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              A physical-book-first reading room
            </p>
            <h1 className="text-4xl font-medium tracking-quiet text-[var(--text)]">
              Reservé
            </h1>
          </div>
          <p className="text-base text-[var(--muted)]">
            A paid, calm place for intentional reading. Bring a physical book, choose
            a session, and let the room hold the time.
          </p>
        </div>

        <div className="mt-10 space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
          <div className="space-y-2">
            <h2 className="text-lg font-medium">Enter with your email</h2>
            <p className="text-sm text-[var(--muted)]">
              Local-only sign in for this MVP. Your membership stays on this device.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text)]"
                placeholder="you@reserve.club"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text)]"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-3 text-sm font-medium text-[var(--bg)]"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
