# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 1 (one-unit interactive prototype), EAS-linked and ready for a device-specific iOS development build; waiting on phone connection and content review.
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
- EAS project `29bd2171-ae38-4f5e-b974-cb451d0339ab` is linked to the `bud-diaz` account. `eas.json`
  defines an internal-distribution iOS development-client profile.
- ESLint is configured (`eslint.config.js`); JSX copy and schema type/value declarations lint cleanly.

**Content status**

| Item | Status |
| --- | --- |
| Unit 1 Chief Keef (`src/content/artists/01-chief-keef.v1.json`) | Draft: needs author review |
| Units 2–10 | Not converted (raw text via `npm run extract:draft`) |
| Front matter, Build Your Crate | Draft: needs author review |

Drafts only appear in development builds; production builds show them as "Coming soon".

**Checks (last run on this commit)**
- `npm exec expo -- lint`: pass
- `npm run typecheck`: pass
- `npm test` (Vitest): 32/32 pass
- `npx expo-doctor`: 20/20 checks pass
- `npx expo export --platform ios`: pass; generated a 3.4 MB Hermes iOS bundle (1,308 modules).
- Web walkthrough (Playwright, iPhone 13 size): setup, lesson, reflection, crate, provider link,
  reload persistence, lane-blocked deep link, production draft gate: all pass, no console errors
- **Not yet run:** a real iOS/Android device or simulator. No signed `.ipa` exists yet: an iOS
  internal-development build must provision the specific phone's UDID first.

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

**Connect the iPhone so its UDID can be provisioned, then install the development build with xtool.**

1. Connect, unlock, and trust the iPhone. Confirm it is visible with `xtool devices --usb --no-wait` (or the
   equivalent `xtool` device-listing command available on this host), then register it through
   `npx eas-cli@latest device:create`. This is required before EAS can sign an internal iOS build
   for that phone.
2. Create the signed artifact with `npx eas-cli@latest build --platform ios --profile development
   --wait`, download the resulting `.ipa`, and install it with `xtool install --usb --udid <UDID>
   <path-to-ipa>`. `xtool` is the installer here; this Expo app's signed native build is produced
   by EAS, not by xtool's Swift-package build flow.
3. On-device, verify onboarding, SQLite persistence after force-quit/relaunch, a provider search
   hand-off, and the destructive-data confirmation.
4. Then the author reviews Unit 1: read `src/content/artists/01-chief-keef.v1.json`. Edit or approve each `"adapted"` prompt
   (switch `source` to `"guide"` once it's your wording), confirm each track, then set
   `review` to `{"status": "approved", "reviewedAt": "<date>", "reviewedBy": "<name>"}`.
   `npm test` will refuse the approval while anything is still unreviewed.
5. Then convert Unit 2 (Rihanna) from `drafts/02-rihanna.txt` the same way. Add it to `RAW_UNITS` in
   `src/content/index.ts` and set `available: true` in the catalog.

---

## Log

Newest first. One line per commit: date, short hash once known, what changed.

- 2026-11-05: Linked the EAS iOS development-build profile, added ESLint, and passed lint, type,
  test, Expo diagnostics, and iOS JS-bundle export. Pending commit hash.
- 2026-11-05: Added this HANDOFF.md.
- 2026-11-05 `2dcb0cc`: Phase 1 prototype: Expo app, content schema, Chief Keef draft unit,
  lanes, provider links, local storage, tests, PDF draft extractor.
- 2026-11-05 `feacee1`: Plan expanded on `main` (outbound links only in v1, review gate, byline held).
- 2026-11-05 `b49fa79`: First app plan added (merged in PR #1).
