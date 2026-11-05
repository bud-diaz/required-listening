# Plan: REQUIRED LISTENING → interactive mobile app

## Context
`docs/Required_Listening_11-5.pdf` (77 pages, by C. Roberts) is a parent-led curriculum for passing Hip-Hop & R&B down to kids. Its structure maps cleanly onto an app:

- **Front matter**: dedication ("To my son"), A Note on This Guide, Intro (how to use it: casual exposure, no quizzes, context over censorship).
- **10 units**: Chief Keef, Rihanna, Migos, Mac Miller, Frank Ocean, Soulja Boy, Bow Wow, Chris Brown, 50 Cent, Beyoncé. Each unit has:
  - a "why they still matter" intro
  - a **Passed Down Track** with its write-up
  - a **Toddler-Friendly** list (clean, safe options)
  - a **Unit Overview** plus "Your kid gon' learn" outcomes
  - **10 lessons**, each with a title, teaching points, ► Play / Key Tracks / Listening Lab tracks, and an Ask / Activity / Teach prompt
  - an **Influence Tree** (Lesson 10) and a **Final Project**
- **Closing activity, "Build Your Crate"**: pick 3–5 songs, then say why (move/calm/confident/cool/don't know yet), when you'd play it (car/clean-up/bed/party/sad/happy), share it, and keep the crate open. It ends with "An Open Crate".

The goal is to keep the guide's voice and its "use it, don't study it" approach while making it tappable and playable, and letting families track progress. Decisions so far: **Expo/React Native**, **30-sec in-app previews plus links out** for full songs, author shown as **C. Roberts**, data **on-device first with an optional cloud sync later**.

## Repo layout (new, on branch `claude/required-listening-mobile-app-eoahs8`)
```
app/                    Expo Router screens
  (tabs)/index.tsx      Home: Continue, Passed-Down Track of the day
  (tabs)/units.tsx      10-unit grid
  (tabs)/crate.tsx      My Crate
  (tabs)/about.tsx      Dedication, Note, Intro
  unit/[id].tsx         Unit hub
  lesson/[unitId]/[n].tsx
  project/[unitId].tsx  Final project
content/
  units/01-chief-keef.json … 10-beyonce.json
  front-matter.json, crate-activity.json
  schema.ts             zod types for the content
scripts/
  extract-pdf.ts        PDF text → draft JSON (one-time, hand-edited after)
  resolve-tracks.ts     iTunes Search API → trackId/previewUrl/artwork cache
components/ TrackRow, PreviewPlayer, LessonCard, InfluenceTree, ProgressRing
lib/ store.ts (zustand + persisted storage), audio.ts, links.ts
```

## Phase 1: Content to structured data (the foundation)
1. `scripts/extract-pdf.ts` runs `pdftotext` and splits the text on `UNIT n` / `LESSON n` / `PASSED DOWN TRACK` / `TODDLER-FRIENDLY` / `FINAL PROJECT` headings to draft one JSON file per unit.
2. Clean up the drafts by hand. The PDF lost many bullet markers (lone `–` lines), so lists need repair.
3. Data model (`content/schema.ts`):
   - `Unit {id, artist, whyItMatters, passedDown: Track & {blurb}, toddler: Track[], overview: string[], learnOutcomes: string[], lessons: Lesson[], finalProject}`
   - `Lesson {n, title, subtitle?, points: string[], tracks: Track[], prompt?: {type: 'ask'|'activity'|'teach'|'lab', text}, influence?: {direct: string[], cultural: string[]}}`
   - `Track {title, artist, kind: 'song'|'album'|'mixtape'|'instrumental'|'video', clean?: boolean, appleId?, previewUrl?, spotifyUrl?, youtubeQuery?}`
4. `scripts/resolve-tracks.ts` looks up each track in the free iTunes Search API to get its `trackId`, 30-second `previewUrl` and artwork. It also builds Spotify and YouTube search links. Results are cached into the JSON, and ambiguous matches are flagged for manual review. Prefer clean/explicit-free versions when `clean: true`.

## Phase 2: App MVP (Expo SDK, TypeScript, Expo Router)
- **Units grid**: artist cards in the guide's order, each with a progress ring.
- **Unit hub**: the "Why they still matter" intro, then a Passed Down Track hero card with a big play button for the preview and "Open in Spotify / Apple Music / YouTube" links. Below that sit the Toddler-Friendly carousel, the Overview, "Your kid gon' learn", the 10-lesson list and the Final Project.
- **Lesson screen**: teaching points, a track list with inline preview, and the Ask/Activity prompt as a highlighted card. It has a "Mark as listened" control and a parent note field.
- **Kid Mode toggle**: shows only the passed-down track and the toddler picks, as big tappable artwork. It hides heavy lessons, for example Chief Keef L1 or Chris Brown L5. It's a parent-gated switch, which keeps the guide's "adult discretion" stance.
- **Preview player** (`expo-audio`): one global mini-player that plays 30-second clips, with a queue so you can play a whole lesson's tracks.
- **Influence Tree** (Lesson 10): tappable chips. When an influenced artist is also a unit (for example SZA appears in the Rihanna and Frank Ocean trees), the chip links across.
- **About tab**: the dedication, A Note on This Guide and the Intro, verbatim, with the byline "C. Roberts".

## Phase 3: Interactive layer (the guide's own activities)
- **Build Your Crate**: a 5-step guided flow matching the closing section. Pick 3–5 songs from the guide or search the iTunes catalog, tag each with a "Why" and a "When", then use Share to make an image card or text through the native share sheet. The crate is editable at any time, and the app saves a dated snapshot each year ("marking time").
- **Final Project workspace** for each unit: pick an early track and a later track from the curated options, compare them side by side, and pick influenced artists from the tree. There is free-text or voice-memo reflection (`expo-audio` recording). It's saved locally, with no grading, in keeping with the "no right answers" rule.
- **Kid profiles** (local): several kids per device, each with their own progress and crate.
- **Listening log**: "Played in the car / during clean-up / at bedtime" quick tags, which mirror the Intro's use cases.

## Phase 4: Optional cloud sync and release
- Storage stays behind `lib/store.ts`, with AsyncStorage/MMKV by default. Add opt-in Supabase (or Firebase) sync later for multi-parent households. Accounts are for parents only, and no kid PII is collected, to stay COPPA-safe.
- Publish with EAS Build/Submit to the App Store and Google Play under a "Parents" category listing, not "Made for Kids", and point the app's privacy policy at the on-device design.
- **Rights**: the guide text is the author's own. Previews come through Apple's terms, which require artwork attribution and an Apple Music link. Use no artist photos without licensing; use iTunes artwork or illustrated monograms instead.

## Build order / milestones
1. Scaffold Expo app, content schema, extraction script, Unit 1 (Chief Keef) fully hand-verified.
2. Unit hub, lesson screen, preview player and deep links, working end-to-end for Unit 1.
3. Remaining 9 units of content plus track resolution.
4. Progress, Kid Mode, Influence Tree cross-links.
5. Build Your Crate, Final Project workspace, profiles.
6. Polish (theming in "crate"/vinyl visual language, dark mode, accessibility), store builds.

## Verification
- `npx tsc --noEmit` plus a content test (`jest`) that validates every `content/units/*.json` against the zod schema. It also asserts 10 units × 10 lessons, a passed-down track on every unit, and no unresolved tracks without a manual-review flag.
- Spot-check the extracted text against the PDF (`pdftotext docs/Required_Listening_11-5.pdf -`) for every unit's intro and final project.
- `npx expo start --web`, then check the flows with Playwright screenshots at phone size: the units grid, Unit 1 hub, lesson playback (preview starts and stops), the deep-link URLs, Kid Mode hiding lessons, and a crate built across an app reload so persistence is tested.
- Device test via Expo Go on iOS and Android for audio playback and the share sheet.
