'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { AuthState } from '@/lib/types';

export default function AccessGate({
  children,
  requireMember = true
}: {
  children: ReactNode;
  requireMember?: boolean;
}) {
  const router = useRouter();
  const auth = useStoredState<AuthState | null>(STORAGE_KEYS.auth, null);
  const member = useStoredState<boolean>(STORAGE_KEYS.member, false);

  useEffect(() => {
    if (!auth.ready || !member.ready) return;
    if (!auth.value) {
      router.replace('/');
      return;
    }
    if (requireMember && !member.value) {
      router.replace('/paywall');
    }
  }, [auth.ready, auth.value, member.ready, member.value, requireMember, router]);

  if (!auth.ready || !member.ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
        Preparing your room...
      </div>
    );
  }

  if (!auth.value) return null;
  if (requireMember && !member.value) return null;

  return <>{children}</>;
}
