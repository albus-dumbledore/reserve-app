'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AccessGate from '@/app/components/AccessGate';
import Container from '@/app/components/Container';
import TopNav from '@/app/components/TopNav';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { AuthState } from '@/lib/types';
import { useReadingContext } from '@/hooks/useReadingContext';

export default function SettingsPage() {
  const router = useRouter();
  const auth = useStoredState<AuthState | null>(STORAGE_KEYS.auth, null);
  const member = useStoredState<boolean>(STORAGE_KEYS.member, false);
  const theme = useStoredState<'light' | 'dark'>(STORAGE_KEYS.theme, 'light');

  const location = useStoredState<string | null>(STORAGE_KEYS.userLocation, null);
  const preferences = useStoredState<{ useWeather: boolean; useSeasonal: boolean }>(
    STORAGE_KEYS.contextPreferences,
    { useWeather: true, useSeasonal: true }
  );

  const [locationInput, setLocationInput] = useState('');
  const { context, loading } = useReadingContext();

  useEffect(() => {
    if (!theme.ready) return;
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
  }, [theme.ready, theme.value]);

  useEffect(() => {
    if (location.ready && location.value) {
      setLocationInput(location.value);
    }
  }, [location.ready, location.value]);

  const handleSaveLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed) {
      location.setValue(trimmed);
    }
  };

  const handleClearLocation = () => {
    location.setValue(null);
    setLocationInput('');
  };

  const handleSignOut = () => {
    auth.setValue(null);
    member.setValue(false);
    router.push('/');
  };

  return (
    <AccessGate>
      <Container size="md">
        <TopNav title="Settings" backHref="/library" />
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-medium">Settings</h1>
            <p className="text-sm text-[var(--muted)]">
              Adjust your default atmosphere.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Theme
              </p>
              <div className="flex items-center gap-3">
                {(['light', 'dark'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => theme.setValue(mode)}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                      theme.value === mode
                        ? 'border-[var(--text)] text-[var(--text)]'
                        : 'border-[var(--border)] text-[var(--muted)]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Location & Context
              </p>
              <p className="text-sm text-[var(--muted)]">
                Your location helps us recommend books that match your environment and season.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Location (optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveLocation();
                    }
                  }}
                  placeholder="San Francisco, CA"
                  className="flex-1 rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--text)]"
                />
                <button
                  onClick={handleSaveLocation}
                  disabled={!locationInput.trim() || loading}
                  className="rounded-xl border border-[var(--text)] bg-[var(--text)] px-4 py-3 text-sm font-medium text-[var(--bg)] disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {context && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Currently
                </p>
                <div className="space-y-1 text-sm">
                  {context.weather && (
                    <p>
                      • Weather: {context.weather.condition}, {context.weather.temp}°C
                    </p>
                  )}
                  <p>• Season: {context.season}</p>
                  <p>• Time: {context.timeOfDay}</p>
                  <p className="text-[var(--muted)]">
                    Perfect for: {context.readingMood} reads
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.value.useWeather}
                  onChange={(e) =>
                    preferences.setValue({
                      ...preferences.value,
                      useWeather: e.target.checked
                    })
                  }
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <span className="text-sm">Factor weather into recommendations</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.value.useSeasonal}
                  onChange={(e) =>
                    preferences.setValue({
                      ...preferences.value,
                      useSeasonal: e.target.checked
                    })
                  }
                  className="h-4 w-4 rounded border-[var(--border)]"
                />
                <span className="text-sm">Include seasonal suggestions</span>
              </label>
            </div>

            {location.value && (
              <button
                onClick={handleClearLocation}
                className="text-sm text-[var(--muted)] underline underline-offset-2 hover:text-[var(--text)]"
              >
                Clear location
              </button>
            )}

            <div className="rounded-xl bg-[var(--muted)]/10 p-4">
              <p className="text-xs text-[var(--muted)]">
                <span className="font-medium">Privacy:</span> Location data is stored
                locally and never shared. Weather data is fetched anonymously.
              </p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-soft">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Account
              </p>
              <p className="text-sm text-[var(--muted)]">Signed in as</p>
              <p className="text-lg font-medium">{auth.value?.email ?? 'Unknown'}</p>
            </div>

            <div className="space-y-3 border-t border-[var(--border)] pt-4">
              <Link
                href="/subscription"
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm transition-colors hover:border-[var(--text)]"
              >
                <span>Manage subscription & goodies</span>
                <span className="text-[var(--muted)]">→</span>
              </Link>

              <button
                onClick={handleSignOut}
                className="w-full rounded-xl border border-[var(--text)] px-4 py-3 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </Container>
    </AccessGate>
  );
}
