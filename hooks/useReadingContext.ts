import { useState, useEffect } from 'react';
import { useStoredState } from '@/lib/hooks';
import { STORAGE_KEYS } from '@/lib/storage';
import type { ReadingContext } from '@/lib/context';
import { getReadingContext } from '@/lib/context';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const WEATHER_CACHE_VERSION = 'v2-celsius'; // Invalidate old Fahrenheit cache

interface ContextPreferences {
  useWeather: boolean;
  useSeasonal: boolean;
}

export function useReadingContext() {
  const location = useStoredState<string | null>(STORAGE_KEYS.userLocation, null);
  const preferences = useStoredState<ContextPreferences>(
    STORAGE_KEYS.contextPreferences,
    { useWeather: true, useSeasonal: true }
  );
  const cacheVersion = useStoredState<string>(STORAGE_KEYS.weatherCacheVersion, '');
  const weatherCache = useStoredState<ReadingContext['weather'] | null>(
    STORAGE_KEYS.weatherData,
    null
  );
  const lastFetch = useStoredState<number>(STORAGE_KEYS.weatherLastFetch, 0);

  // Invalidate cache if version changed (Fahrenheit → Celsius migration)
  useEffect(() => {
    if (cacheVersion.ready && cacheVersion.value !== WEATHER_CACHE_VERSION) {
      weatherCache.setValue(null);
      lastFetch.setValue(0);
      cacheVersion.setValue(WEATHER_CACHE_VERSION);
    }
  }, [cacheVersion.ready, cacheVersion.value, weatherCache, lastFetch]);

  const [context, setContext] = useState<ReadingContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location.ready || !preferences.ready) return;

    const fetchContext = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = Date.now();
        const shouldFetchWeather =
          preferences.value.useWeather &&
          location.value &&
          (!weatherCache.value || now - lastFetch.value > CACHE_DURATION);

        let weather = weatherCache.value || undefined;

        if (shouldFetchWeather && location.value) {
          try {
            const response = await fetch(
              `/api/context?location=${encodeURIComponent(location.value)}`
            );

            if (response.ok) {
              const data = await response.json();
              weather = data.weather;
              weatherCache.setValue(weather || null);
              lastFetch.setValue(now);
            }
          } catch (err) {
            // Weather fetch failed, use cached or no weather
            console.warn('Failed to fetch weather:', err);
          }
        }

        // Generate context (season, time of day, mood)
        const ctx = getReadingContext(
          location.value || undefined,
          preferences.value.useWeather ? weather : undefined
        );

        setContext(ctx);
      } catch (err) {
        setError('Failed to load reading context');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [
    location.ready,
    location.value,
    preferences.ready,
    preferences.value.useWeather,
    preferences.value.useSeasonal
  ]);

  return {
    context,
    loading,
    error,
    hasLocation: !!location.value,
    preferences: preferences.value
  };
}
