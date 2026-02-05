export const STORAGE_KEYS = {
  auth: 'reserve:auth',
  member: 'reserve:member',
  theme: 'reserve:theme',
  currentSession: 'reserve:currentSession',
  sessionHistory: 'reserve:sessionHistory',
  lastSession: 'reserve:lastSession',
  monthlyStats: 'reserve:monthlyStats',
  ritualDate: 'reserve:ritualDate',
  audioSettings: 'reserve:audioSettings',
  conciergeMessages: 'reserve:conciergeMessages',
  tribeMemberships: 'reserve:tribeMemberships',
  editionGenre: 'reserve:editionGenre',
  editionShelf: 'reserve:editionShelf',
  userLibrary: 'reserve:userLibrary',
  userLocation: 'reserve:userLocation',
  weatherData: 'reserve:weatherData',
  weatherLastFetch: 'reserve:weatherLastFetch',
  weatherCacheVersion: 'reserve:weatherCacheVersion',
  contextPreferences: 'reserve:contextPreferences',
  aiEdition: 'reserve:aiEdition',
  aiEditionLoading: 'reserve:aiEditionLoading'
};

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(key);
}
