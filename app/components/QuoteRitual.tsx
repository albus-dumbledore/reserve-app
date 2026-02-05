'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDailyQuote, getLocalDateKey } from '@/lib/ritual';
import { STORAGE_KEYS, writeJSON } from '@/lib/storage';

const SESSION_KEY = 'reserve:ritualShown';

export default function QuoteRitual() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const quote = useMemo(() => getDailyQuote(), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const shown = window.sessionStorage.getItem(SESSION_KEY);
    if (shown) return;
    window.sessionStorage.setItem(SESSION_KEY, 'true');
    const today = getLocalDateKey();
    writeJSON(STORAGE_KEYS.ritualDate, today);
    setVisible(true);
    const timer = window.setTimeout(() => handleClose(), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setFading(true);
    window.setTimeout(() => {
      setVisible(false);
      setFading(false);
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)] px-6 text-center transition-opacity ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
      role="presentation"
    >
      <div className="max-w-md space-y-3">
        <p className="text-lg font-medium text-[var(--text)]">{quote.text}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          {quote.source}
        </p>
      </div>
    </div>
  );
}
