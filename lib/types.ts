export type EditionBook = {
  id: string;
  title: string;
  author: string;
  why_this_book: string;
  best_context: string;
  estimated_sessions: number;
  genres?: string[];
};

export type Edition = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  editorial_note: {
    title: string;
    body: string;
  };
  books: EditionBook[];
};

export type Quote = {
  text: string;
  source: string;
  category?: 'stoicism' | 'books';
};

export type AudioTrack = {
  id: string;
  title: string;
  file: string;
  attribution: string;
};

export type ConciergeSuggestion = {
  bookId: string;
  rationale: string;
  title?: string;
  author?: string;
};

export type ConciergeResponse = {
  intent: string;
  title: string;
  suggestions: ConciergeSuggestion[];
};

export type ConciergeMessage = {
  id: string;
  role: 'user' | 'concierge';
  text: string;
  createdAt: string;
  suggestions?: ConciergeSuggestion[];
};

export type TribeConfig = {
  default_capacity: number;
  weekly_prompt: string;
};

export type TribeCircle = {
  id: string;
  bookId: string;
  title: string;
  author: string;
  capacity: number;
  prompt: string;
};

export type TribeMembership = {
  bookId: string;
  joinedAt: string;
};

export type AuthState = {
  email: string;
  createdAt: string;
};

export type CurrentSession = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  startedAt: string;
  plannedMinutes: number;
  elapsedSeconds: number;
  lastTickAt: string;
  isPaused: boolean;
  trackId: string;
};

export type SessionRecord = {
  id: string;
  bookId: string;
  bookTitle: string;
  startedAt: string;
  endedAt: string;
  plannedMinutes: number;
  actualMinutes: number;
};

export type MonthlyStats = {
  month: string;
  sessions: number;
  minutes: number;
};

export type MonthlyStatsMap = Record<string, MonthlyStats>;

export type BookEntry = {
  id: string;
  title: string;
  author: string;
  genres: string[];
  moods: string[];
  subjects: string[];
  description?: string;
  source: 'openlibrary';
  open_library_key: string;
};

export type UserLibraryBook = {
  id: string;
  title: string;
  author?: string;
  summary: string;
  addedAt: string;
  isCurrent: boolean;
};
