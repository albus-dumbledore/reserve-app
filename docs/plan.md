# Implementation Plan

This plan aligns with the current Next.js App Router structure, local JSON content, and localStorage-backed state.

## MVP (Phase 1) — Physical-Book-First
1) Data model shift to physical-book edition.
- Update `lib/types.ts` to replace `LibraryItem` with `Edition` and `EditionBook` types (no `content` field).
- Replace `data/library.json` with `data/edition.json` (monthly edition metadata: `start_date`, `end_date`, `books[]`, `editorial_note`).
- Replace `lib/library.ts` with `lib/edition.ts` to load edition and enforce max 7 items.
- Update `app/library/page.tsx` to present the monthly edition and curated physical-book list.
- Remove in-app reading text usage in `app/read/[id]/page.tsx` and rename internal language from “read” to “session”.

2) Opening ritual quote.
- Add `data/quotes.json` with short quotes.
- Add `lib/ritual.ts` for deterministic daily selection (or true random) and last-seen storage.
- Add a lightweight overlay component in `app/page.tsx` or a shared wrapper to show the quote on app open, then fade/tap to continue.

3) Monthly fulfillment snapshot.
- Add `lib/fulfillment.ts` to compute current month keys and accumulate sessions.
- Add storage keys in `lib/storage.ts` for monthly totals.
- Update `app/library/page.tsx` (or new `/home`) to show only current month sessions + total time.

4) Session ritual rework.
- Update `app/session/select/page.tsx` to select a book and duration.
- Update `app/read/[id]/page.tsx` to become the session screen (no full text), with pause/resume, end confirmation, and hide ticker toggle.
- Remove text selection and passage saving logic from `app/read/[id]/page.tsx`.

5) Audio ambience.
- Add `public/audio/` with 3–5 licensed ambient tracks.
- Add `data/audio.json` with track metadata and a simple picker (random or deterministic).
- Add `docs/audio-attribution.md` (or `public/audio/ATTRIBUTION.txt`) per license.
- Add minimal audio controls in session screen (mute, volume).

6) Silence mode enforcement.
- Remove in-session toasts/popups and any non-essential UI updates.
- Ensure session screen only shows minimal controls.

7) Documentation.
- Add `docs/product-spec.md` describing physical-book-first, edition model, session ritual, fulfillment metrics, concierge + tribe constraints.
- Add `docs/qa.md` with manual test steps.
- Update `README.md` for new flow, edition rotation, audio setup, and tribe rules.

8) Tests.
- Add a test harness (recommend `vitest`) and unit tests for:
- Monthly rollover logic.
- Session time accumulation.
- Edition expiry and max list constraint.

## Phase 1.5 — Concierge (Bounded, Local)
1) Add concierge UI.
- Add `/concierge` route and minimal message view.
- Add `data/concierge-responses.json` with curated response templates.
- Store conversations locally with `localStorage`.

2) Update docs.
- Extend `docs/product-spec.md` and `docs/qa.md` for concierge.

## Phase 2 — Tribe (Quiet Circles)
1) Add tribe prototype.
- Add `/tribe` route with edition-scoped circles (local-only prototype unless backend exists).
- Enforce small group limits and expiry with edition end date.

2) Update docs.
- Extend `docs/product-spec.md` and `docs/qa.md` for tribe constraints.

## File-Level Checklist (Phase 1)
- Update: `app/library/page.tsx`, `app/session/select/page.tsx`, `app/read/[id]/page.tsx`, `lib/types.ts`, `lib/storage.ts`, `README.md`.
- Replace: `data/library.json` → `data/edition.json`.
- Add: `data/quotes.json`, `data/audio.json`, `lib/edition.ts`, `lib/ritual.ts`, `lib/fulfillment.ts`, `docs/product-spec.md`, `docs/qa.md`, `docs/audio-attribution.md`.
- Remove: `app/archive/page.tsx` (saved passages feature) and related nav links.
