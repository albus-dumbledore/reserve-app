'use client';

import { useState } from 'react';
import Link from 'next/link';
import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';

interface Goodie {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'active' | 'coming-soon' | 'claimed';
}

const SUBSCRIPTION_GOODIES: Goodie[] = [
  {
    id: 'book-embosser',
    name: 'Personal Book Embosser',
    description: 'Custom bookplate stamp with your name for marking your personal library',
    icon: '📚',
    status: 'active'
  },
  {
    id: 'retreat-coupons',
    name: 'Retreat Coupons',
    description: 'Exclusive discounts for reading retreats and literary events',
    icon: '🏕️',
    status: 'active'
  },
  {
    id: 'blue-tokai-coffee',
    name: 'Blue Tokai Coffee Beans',
    description: 'Quarterly delivery of premium coffee beans to accompany your reading sessions',
    icon: '☕',
    status: 'coming-soon'
  },
  {
    id: 'reading-journal',
    name: 'Reading Journal',
    description: 'Thoughtfully designed journal for tracking your reading journey and reflections',
    icon: '📖',
    status: 'active'
  }
];

export default function SubscriptionPage() {
  const member = useStoredState<boolean>(STORAGE_KEYS.member, false);
  const [activeTab, setActiveTab] = useState<'overview' | 'goodies'>('overview');

  // Mock subscription data - replace with actual subscription API
  const subscriptionStatus = {
    plan: 'Annual Membership',
    status: 'active',
    renewalDate: 'March 15, 2026',
    price: '₹1,188/year'
  };

  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="Subscription" backHref="/library" />

        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-medium">Your Membership</h1>
            <p className="text-sm text-[var(--muted)]">
              Manage your subscription and explore member goodies
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-[var(--text)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('goodies')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'goodies'
                  ? 'border-b-2 border-[var(--text)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              Goodies
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Subscription Status */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Current Plan
                      </p>
                      <h2 className="text-xl font-medium">{subscriptionStatus.plan}</h2>
                      <p className="text-sm text-[var(--muted)]">{subscriptionStatus.price}</p>
                    </div>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-green-600">
                      {subscriptionStatus.status}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-[var(--border)] pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Renewal Date</span>
                      <span>{subscriptionStatus.renewalDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">Member Since</span>
                      <span>January 2025</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
                <h3 className="mb-4 text-lg font-medium">What's Included</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text)] opacity-50">✓</span>
                    <div className="flex-1">
                      <p className="text-sm">AI-curated monthly editions</p>
                      <p className="text-xs text-[var(--muted)]">
                        20 personalized book recommendations every month
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text)] opacity-50">✓</span>
                    <div className="flex-1">
                      <p className="text-sm">Concierge service</p>
                      <p className="text-xs text-[var(--muted)]">
                        On-demand book recommendations based on your mood
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text)] opacity-50">✓</span>
                    <div className="flex-1">
                      <p className="text-sm">Reading analytics</p>
                      <p className="text-xs text-[var(--muted)]">
                        Track your reading sessions and monthly progress
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--text)] opacity-50">✓</span>
                    <div className="flex-1">
                      <p className="text-sm">Member goodies</p>
                      <p className="text-xs text-[var(--muted)]">
                        Exclusive physical goods delivered to your door
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manage Subscription */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
                <h3 className="mb-4 text-lg font-medium">Manage Subscription</h3>
                <div className="space-y-3">
                  <button className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm transition-colors hover:border-[var(--text)]">
                    <div className="flex items-center justify-between">
                      <span>Update payment method</span>
                      <span className="text-[var(--muted)]">→</span>
                    </div>
                  </button>
                  <button className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm transition-colors hover:border-[var(--text)]">
                    <div className="flex items-center justify-between">
                      <span>Update billing address</span>
                      <span className="text-[var(--muted)]">→</span>
                    </div>
                  </button>
                  <button className="w-full rounded-xl border border-[var(--border)] px-4 py-3 text-left text-sm transition-colors hover:border-[var(--text)]">
                    <div className="flex items-center justify-between">
                      <span>View billing history</span>
                      <span className="text-[var(--muted)]">→</span>
                    </div>
                  </button>
                  <button className="w-full rounded-xl border border-red-500/20 px-4 py-3 text-left text-sm text-red-600 transition-colors hover:border-red-500/40">
                    <div className="flex items-center justify-between">
                      <span>Cancel subscription</span>
                      <span className="text-red-600/60">→</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Goodies Tab */}
          {activeTab === 'goodies' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
                <p className="text-sm text-[var(--muted)]">
                  As a Reserve member, you receive carefully curated physical goodies that enhance your reading experience. Items are delivered quarterly or upon availability.
                </p>
              </div>

              <div className="grid gap-4">
                {SUBSCRIPTION_GOODIES.map((goodie) => (
                  <div
                    key={goodie.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{goodie.icon}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-medium">{goodie.name}</h3>
                          {goodie.status === 'active' && (
                            <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-green-600">
                              Available
                            </span>
                          )}
                          {goodie.status === 'coming-soon' && (
                            <span className="rounded-full bg-[var(--muted)]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                              Coming Soon
                            </span>
                          )}
                          {goodie.status === 'claimed' && (
                            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-blue-600">
                              Claimed
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted)]">{goodie.description}</p>

                        {goodie.status === 'active' && (
                          <button className="mt-3 rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition-colors hover:opacity-90">
                            Claim Now
                          </button>
                        )}

                        {goodie.status === 'coming-soon' && (
                          <button className="mt-3 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--text)] hover:text-[var(--text)]">
                            Notify Me
                          </button>
                        )}

                        {goodie.status === 'claimed' && (
                          <div className="mt-3 text-xs text-[var(--muted)]">
                            Delivered on Jan 15, 2026 • Track shipment →
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
                <h3 className="mb-3 text-sm font-medium">Shipping & Delivery</h3>
                <div className="space-y-2 text-sm text-[var(--muted)]">
                  <p>
                    • Goodies are shipped to your registered address quarterly
                  </p>
                  <p>
                    • You'll receive an email notification when items are ready to claim
                  </p>
                  <p>
                    • Delivery typically takes 5-7 business days within India
                  </p>
                  <p>
                    • Update your shipping address in Settings anytime
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--muted)]">
            <Link href="/library" className="underline-offset-4 hover:underline">
              Back to Library
            </Link>
            <Link href="/settings" className="underline-offset-4 hover:underline">
              Settings
            </Link>
          </div>
        </div>
      </Container>
    </AccessGate>
  );
}
