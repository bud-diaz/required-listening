# Required Listening

A parent-led iOS/Android companion for *Required Listening: The Art of Passing Down the Bangers*
(`docs/Required_Listening_11-5.pdf`). It guides a family through **Listen → Notice → Talk → Add to Crate**,
one lesson at a time. It is not a music player: it opens a search in the music services the caregiver allows.

See [`docs/APP_PLAN.md`](docs/APP_PLAN.md) for the full plan and [`HANDOFF.md`](HANDOFF.md) for where
things stand and what to do next. This repo currently holds the structured, approved **10-unit
curriculum** and its local-first family listening flows.

## Run it

```bash
npm install
npx expo start          # press i / a for a simulator, or scan with a development build
npx expo start --web    # quick browser preview
```

Expo SDK 58 with Expo Router. Routes live in `src/app/`.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm test            # Vitest: content contract, lanes, links, crate persistence
```

## How it's organised

| Path | What |
| --- | --- |
| `src/content/*.v1.json`, `src/content/artists/` | Curriculum as versioned, reviewable data. Screens never hard-code guide text. |
| `src/content/schemas.ts` | Zod content contract: tracks, lessons, content flags, lanes, review status. |
| `src/content/index.ts` | Loading, the review gate, and listening-lane filtering (also applied to deep links). |
| `src/lib/links.ts` | Provider search URLs and the allowed-host check. |
| `src/domain/crate.ts` | Crate entries, reflections, settings, share text. |
| `src/data/` | Local storage: Expo SQLite on iOS/Android, browser storage for the web preview. |
| `src/stores/family-store.ts` | App state; every write is saved before it shows on screen. |
| `scripts/extract-pdf.mjs` | Draft aid: splits the PDF into per-unit text in `drafts/` (git-ignored). |

## Content review rules

- Every unit starts as `review.status: "draft"`. **Draft content appears only in development builds**,
  with a DRAFT banner; production builds show the unit as "Coming soon".
- Prompts marked `"source": "adapted"` were written for the app from the lesson's own content and need
  the author's sign-off. Approved app-written wording uses `"approved-adaptation"` to preserve its
  provenance.
- "Clean" is never assumed. Every `unverified` track must set `requiresCaregiverPreview`, shows
  “Parent preview required,” and repeats that warning before every provider search. Search results
  can change, so the app does not remember a prior check or claim that a result is clean.
- Spotify, Apple Music, YouTube Music, and regular YouTube are separate provider choices with exact
  HTTPS host allowlists. Spotify and Apple Music remain the onboarding defaults.
- The byline is `null` until authorship is confirmed (plan §2).
