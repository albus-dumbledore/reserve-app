# Manual QA Checklist

## MVP Ritual Flow
1) Open the app.
- Expect the ritual quote card to appear and fade/tap away.

2) Sign in and unlock membership.
- `/` login works with any email + password.
- `/paywall` unlocks membership (mock or Stripe).

3) Home / Monthly Edition.
- Monthly fulfillment snapshot shows sessions + time for current month only.
- Monthly edition shows 5–7 books max.
- Each item shows title, author, why, best context, estimated sessions.

4) Session start.
- Select a book and choose 30/60/90 minutes.
- Start session.

5) Session screen.
- Shows chosen book metadata and a subtle timer ticker.
- Pause/Resume works; timer stops and resumes.
- Hide ticker toggle works.
- Cafe audio autoplays; mute/unmute and volume slider work.
- No popups/toasts during session.

6) End session.
- End session shows a calm confirmation modal (no browser alert).
- Completion screen appears.
- Monthly snapshot increments sessions + minutes for current month.

7) Physical-book-first.
- No screen shows full book text or reader UI.

## Edge Cases
- Edition outside date range: list should show “not active” message.
- Audio blocked by browser: UI suggests tapping or toggling mute.

## Concierge (Phase 1.5)
1) Open `/concierge`.
- Quick prompts send and receive a response immediately.
- Responses include 3–5 suggestions with rationale.
- No typing indicators or notifications.
- If `OPENAI_API_KEY` is missing, concierge falls back to local templates.

## Tribe (Phase 2)
1) Open `/tribe`.
- Circles exist for each edition book, capacity <= 15.
- Join/leave works locally.
- Weekly prompt appears only after joining.
