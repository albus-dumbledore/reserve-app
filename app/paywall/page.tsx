'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Container from '../components/Container';
import AccessGate from '../components/AccessGate';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';

const monthly = {
  name: 'Monthly',
  price: '$9',
  note: 'Quiet access, billed monthly.'
};

const annual = {
  name: 'Annual',
  price: '$90',
  note: 'Two months on us, billed yearly.'
};

export default function PaywallPage() {
  const router = useRouter();
  const member = useStoredState<boolean>(STORAGE_KEYS.member, false);
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || '';

  useEffect(() => {
    if (member.ready && member.value) {
      router.replace('/library');
    }
  }, [member.ready, member.value, router]);

  const handleUnlock = () => {
    member.setValue(true);
    router.push('/library');
  };

  const handleStripe = () => {
    if (!checkoutUrl) return;
    window.location.assign(checkoutUrl);
  };

  return (
    <AccessGate requireMember={false}>
      <Container size="md">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Membership
            </p>
            <h1 className="text-3xl font-medium">Reserve your seat</h1>
            <p className="text-sm text-[var(--muted)]">
              A deliberate, physical-book-first ritual. One room, one session.
            </p>
          </div>

          <div className="grid gap-4">
            {[monthly, annual].map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium">{plan.name}</h2>
                    <p className="text-sm text-[var(--muted)]">{plan.note}</p>
                  </div>
                  <div className="text-2xl font-medium">{plan.price}</div>
                </div>
              </div>
            ))}
          </div>

          {checkoutUrl ? (
            <button
              onClick={handleStripe}
              className="w-full rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-3 text-sm font-medium text-[var(--bg)]"
            >
              Continue to Checkout
            </button>
          ) : (
            <button
              onClick={handleUnlock}
              className="w-full rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-3 text-sm font-medium text-[var(--bg)]"
            >
              Unlock (Test)
            </button>
          )}

          <p className="text-xs text-[var(--muted)]">
            This MVP stores membership locally. Stripe Checkout can be enabled by
            setting a test checkout URL.
          </p>
        </div>
      </Container>
    </AccessGate>
  );
}
