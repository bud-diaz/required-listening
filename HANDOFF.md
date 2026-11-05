# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 1 (one-unit interactive prototype), built and waiting on content review.
Phase 0 (product, rights and safety decisions) is still open and needs the author.

**What works**
- Expo SDK 58 + Expo Router app; routes in `src/app/`.
- Setup for grown-ups (nickname, emoji avatar, listening lane, allowed music services, content note).
- Home with "continue" card and Family Replay; 10-artist grid (only Chief Keef available).
- Chief Keef unit hub: passed-down track, why it matters, content labels, Younger Listener picks,
  overview, learning outcomes, lessons, final project text.
- Lesson flow: Read → Listen → Notice → Talk (feelings + saved thought) → Crate (add song, mark explored).
- My Crate (Build Your Own Crate steps 1–3, duplicate check, private share via share sheet).
- About tab with the guide's front matter (no byline).
- Grown-up settings: change lane/providers, export data, delete all.
- Outbound links open a provider *search* after a confirmation sheet; hosts are allow-listed. No audio.
- Storage: Expo SQLite on iOS/Android; browser storage on the web preview.

**Content status**

| Item | Status |
| --- | --- |
| Unit 1 Chief Keef (`src/content/artists/01-chief-keef.v1.json`) | Draft: needs author review |
| Units 2–10 | Not converted (raw text via `npm run extract:draft`) |
| Front matter, Build Your Crate | Draft: needs author review |

Drafts only appear in development builds; production builds show them as "Coming soon".

**Checks (last run on this commit)**
- `npx tsc --noEmit`: pass
- `npm test` (Vitest): 32/32 pass
- Web walkthrough (Playwright, iPhone 13 size): setup, lesson, reflection, crate, provider link,
  reload persistence, lane-blocked deep link, production draft gate: all pass, no console errors
- **Not yet run:** a real iOS/Android device or simulator; `npx expo lint` (no ESLint config yet)

**Open decisions (need the author)**
1. Public byline: the PDF says "C. Roberts"; the plan says show none until confirmed. Set
   `byline` in `src/content/catalog.v1.json` once decided.
2. Review of Chief Keef: every prompt marked `"source": "adapted"` (all Notice prompts, several Talk
   prompts) and every track with `needsManualReview: true` (clean edits and instrumentals unconfirmed).
3. Phase 0 items in the plan §2: audience/age floor, rights, privacy, providers, business model.

**Known gaps / deliberate deviations**
- Routes live in `src/app/` (Expo SDK 58 convention) rather than `app/` as sketched in the plan.
- No caregiver PIN, Final Project workspace, voice notes or annual crate snapshot yet (Phase 2).
- No Maestro E2E flow yet; the web walkthrough script is not committed.

---

## Next step

**Author reviews Unit 1, then convert Unit 2.**

1. Read through `src/content/artists/01-chief-keef.v1.json`. Edit or approve each `"adapted"` prompt
   (switch `source` to `"guide"` once it's your wording), confirm each track, then set
   `review` to `{"status": "approved", "reviewedAt": "<date>", "reviewedBy": "<name>"}`.
   `npm test` will refuse the approval while anything is still unreviewed.
2. Run the app on a phone (`npx expo start`, development build) to check SQLite storage and the
   hand-off to music apps.
3. Then convert Unit 2 (Rihanna) from `drafts/02-rihanna.txt` the same way. Add it to `RAW_UNITS` in
   `src/content/index.ts` and set `available: true` in the catalog.

---

## Log

Newest first. One line per commit: date, short hash once known, what changed.

- 2026-11-05: Added this HANDOFF.md.
- 2026-11-05 `2dcb0cc`: Phase 1 prototype: Expo app, content schema, Chief Keef draft unit,
  lanes, provider links, local storage, tests, PDF draft extractor.
- 2026-11-05 `feacee1`: Plan expanded on `main` (outbound links only in v1, review gate, byline held).
- 2026-11-05 `b49fa79`: First app plan added (merged in PR #1).
