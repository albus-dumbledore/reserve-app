'use client';

import { useState } from 'react';

interface LocalBookstore {
  id: string;
  name: string;
  address: string;
  distance: string;
  phone: string;
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'unknown';
  price?: string;
}

interface BookAvailabilityProps {
  bookTitle: string;
  bookAuthor: string;
  bookId: string;
}

// Mock data - replace with actual API call
const MOCK_BOOKSTORES: LocalBookstore[] = [
  {
    id: '1',
    name: 'Bahrisons Booksellers',
    address: 'Khan Market, New Delhi',
    distance: '2.5 km',
    phone: '+91 11 2469 4610',
    availability: 'in-stock',
    price: '₹450'
  },
  {
    id: '2',
    name: 'Full Circle Bookstore',
    address: 'Connaught Place, New Delhi',
    distance: '3.8 km',
    phone: '+91 11 4158 7444',
    availability: 'low-stock',
    price: '₹475'
  },
  {
    id: '3',
    name: 'The Bookshop',
    address: 'Jor Bagh, New Delhi',
    distance: '4.2 km',
    phone: '+91 11 2469 7102',
    availability: 'in-stock',
    price: '₹450'
  },
  {
    id: '4',
    name: 'Midland Bookshop',
    address: 'Aurobindo Marg, New Delhi',
    distance: '5.1 km',
    phone: '+91 11 2656 4934',
    availability: 'out-of-stock'
  }
];

export default function BookAvailability({ bookTitle, bookAuthor, bookId }: BookAvailabilityProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<LocalBookstore[]>([]);

  const handleCheckAvailability = async () => {
    setIsOpen(true);
    setLoading(true);

    // Simulate API call - replace with actual bookstore API
    setTimeout(() => {
      setStores(MOCK_BOOKSTORES);
      setLoading(false);
    }, 800);
  };

  const getAvailabilityBadge = (availability: LocalBookstore['availability']) => {
    switch (availability) {
      case 'in-stock':
        return (
          <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-green-600">
            In Stock
          </span>
        );
      case 'low-stock':
        return (
          <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-orange-600">
            Low Stock
          </span>
        );
      case 'out-of-stock':
        return (
          <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-red-600">
            Out of Stock
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-[var(--muted)]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            Unknown
          </span>
        );
    }
  };

  return (
    <>
      <button
        onClick={handleCheckAvailability}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm transition-colors hover:border-[var(--text)] hover:bg-[var(--card)]"
      >
        <span>📍</span>
        <span>Check local availability</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-6 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-medium">{bookTitle}</h2>
                  <p className="text-sm text-[var(--muted)]">by {bookAuthor}</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--card)] hover:text-[var(--text)]"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Available at nearby bookstores
              </p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="h-4 w-1/3 rounded bg-[var(--muted)]/20"></div>
                    <div className="mt-2 h-3 w-2/3 rounded bg-[var(--muted)]/20"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Bookstores List */}
            {!loading && stores.length > 0 && (
              <div className="space-y-4">
                {stores.map((store) => (
                  <div
                    key={store.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-[var(--text)]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium">{store.name}</h3>
                          <p className="text-sm text-[var(--muted)]">{store.address}</p>
                        </div>
                        {getAvailabilityBadge(store.availability)}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-[var(--muted)]">
                          <span>📍</span>
                          <span>{store.distance} away</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[var(--muted)]">
                          <span>📞</span>
                          <a
                            href={`tel:${store.phone}`}
                            className="hover:text-[var(--text)] hover:underline"
                          >
                            {store.phone}
                          </a>
                        </div>
                        {store.price && (
                          <div className="flex items-center gap-1.5 font-medium">
                            <span>💰</span>
                            <span>{store.price}</span>
                          </div>
                        )}
                      </div>

                      {store.availability === 'in-stock' && (
                        <div className="flex gap-2 border-t border-[var(--border)] pt-3">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + ' ' + store.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 rounded-lg border border-[var(--text)] bg-[var(--text)] px-4 py-2 text-center text-sm font-medium text-[var(--bg)] transition-colors hover:opacity-90"
                          >
                            Get Directions
                          </a>
                          <a
                            href={`tel:${store.phone}`}
                            className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-center text-sm font-medium transition-colors hover:border-[var(--text)] hover:bg-[var(--card)]"
                          >
                            Call to Reserve
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && stores.length === 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
                <p className="text-[var(--muted)]">
                  No local bookstores found. Try checking online retailers or request the book at your nearest bookstore.
                </p>
              </div>
            )}

            {/* Footer Note */}
            <div className="mt-6 rounded-xl bg-[var(--muted)]/10 p-4">
              <p className="text-xs text-[var(--muted)]">
                <span className="font-medium">Note:</span> Availability is updated regularly but may not be real-time. We recommend calling ahead to confirm before visiting.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
