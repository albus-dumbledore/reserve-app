# Current State Audit

## Repo Architecture Snapshot
- Framework: Next.js App Router with TypeScript and Tailwind CSS.
- App entrypoints: `app/layout.tsx`, `app/page.tsx`.
- Routes: `/` (landing), `/paywall`, `/library`, `/session/select`, `/read/[id]`, `/session/complete`, `/note`, `/settings`, `/concierge`, `/tribe`.
- State management: local React state + `useStoredState` hook (`lib/hooks.ts`) backed by `localStorage`.
- Storage keys: `lib/storage.ts` (`reserve:auth`, `reserve:member`, `reserve:currentSession`, `reserve:sessionHistory`, `reserve:lastSession`, `reserve:savedPassages`, `reserve:theme`, `reserve:fontSize`).
- UI components: `app/components/Container.tsx`, `app/components/TopNav.tsx`, `app/components/AccessGate.tsx`.
- Styling: global CSS variables and Tailwind, serif reading class in `app/globals.css`.
- Content: `data/edition.json`, `data/quotes.json`, `data/audio.json`, `data/concierge-responses.json`, `data/tribe.json`.

## Feature Inventory
### Existing Features (✅)
- Membership gate with local auth and member flag (`/paywall`, `AccessGate`).
- Opening ritual quote on app open (daily deterministic).
- Monthly edition model with start/end dates and curated physical-book list metadata.
- Enforced max list length (<= 7) for curated edition.
- Monthly fulfillment snapshot (current month only).
- Session ritual with pause/resume, hide ticker, and calm completion screen.
- Built-in cafe ambience audio with mute/volume controls.
- Editorial note page (`/note`).
- Digital concierge (local-only curated responses).
- Tribe circles (local-only prototype, edition-scoped).
- Product spec, QA checklist, and audio attribution docs.
- Tests for session accumulation, month rollover, edition expiry, and list-length constraint.

### Partial / Buggy (⚠️)
- No backend sync (local-only by design for MVP).

### Missing (❌)
- Real Stripe Checkout session creation (still requires backend).
- Remote concierge or tribe services (not required for MVP).

## Principle Alignment
- No in-app reading or full-text content exists.
- Physical-book-first principle is enforced in data and UI.

## Tech Debt / Risk Notes
- `localStorage` is used directly throughout; no versioning or migration for future schema changes.
- Audio files are bundled locally and increase repo size.
