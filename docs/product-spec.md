# Reservé Product Spec (Physical-Book-First)

## Principles
- Physical-book-first. The app never renders full book text or EPUB/PDF content.
- Ritual + atmosphere over gamification.
- Fulfillment metrics only (sessions + time), no targets or streaks.
- Minimal, premium, quiet UI.

## Edition Model
- A monthly edition is defined in `data/edition.json` with:
  - `start_date` and `end_date`
  - `books[]` (5–7 max)
  - `editorial_note`
- The app enforces a hard max of 7 books in code.
- Editions are considered active only between the date bounds.

## Session Ritual
- User selects a book and a session length (30/60/90).
- Session screen shows book context and a subtle timer ticker.
- Controls: Pause/Resume, End Session (with gentle confirmation), Hide ticker.
- No in-app reading content is shown.

## Fulfillment Metrics
- Monthly fulfillment snapshot shows:
  - `number_of_sessions`
  - `total_reading_time` (hours + minutes)
- Stored locally per month, designed for future sync.

## Opening Ritual Quote
- A short quote card appears once per app open (per session) and fades out.
- Quotes are stored in `data/quotes.json`.
- Selection is deterministic by local date.

## Book Catalog (Recommendations)
- `data/books.json` is a locally generated catalog sourced from Open Library dumps.
- Tags (`genres`, `moods`) are derived by the build script for recommendation use.
- The catalog is used by the concierge; the monthly edition remains curated.

## Cafe Music
- Ambient tracks are bundled locally in `public/audio/`.
- A single track is selected per session (no browsing).
- Controls: mute/unmute, volume slider.
- Attribution is in `docs/audio-attribution.md`.

## Concierge + Tribe Constraints
- Concierge (Phase 1.5): curated, template-based replies only. No real-time chat,
  no typing indicators, and no notifications. Suggestions are limited to the
  current edition by default, with optional catalog-based suggestions.
- Concierge responses are generated server-side and never expose API keys to the client.
- Tribe (Phase 2): small circles (5–15), edition-scoped, no feeds/likes/DMs or
  follower graphs. One weekly prompt max and no notifications by default.
- Both must avoid social-app drift and remain quiet, bounded, and optional.
