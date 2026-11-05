# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 1 (one-unit interactive prototype). A signed iOS development build exists and is staged for install; waiting on phone connection and content review.
Phase 0 (product, rights and safety decisions) is still open and needs the author.

**Signed build ready to install**
- Device "CJ's iPhone 2" (UDID `00008110-000974400A23A01E`) is already registered on the Apple
  team (6PA43G2WVX, Rolling Woods Media, LLC — same team/credentials used for the `/4lake` project;
  `xtool auth status` and EAS both authenticate against it).
- `expo-dev-client` was added as a dependency so the EAS `development` profile's dev client works.
- EAS build `849aa32e-564a-4ed7-95ce-7311e07a2208` (`eas build --platform ios --profile development
  --non-interactive --wait`) finished successfully and is downloaded at
  `/tmp/claude-1000/-home-bud-required-listening/c0392c8c-3414-4827-a2fe-f0765402e6ee/scratchpad/build/RequiredListening-dev.ipa`
  (25 MB) — note this path is a session scratchpad, not stored in the repo; re-download from
  https://expo.dev/accounts/bud-diaz/projects/required-listening/builds/849aa32e-564a-4ed7-95ce-7311e07a2208
  if it's gone.
- Once the phone is connected over USB and trusted, install with:
  `xtool install --usb --udid 00008110-000974400A23A01E <path-to-ipa>`
- `app.json`, `package.json`, and `package-lock.json` have uncommitted changes (adding
  `expo-dev-client` and `ITSAppUsesNonExemptEncryption`) that this build was made from — commit
  them once reviewed.

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

**Connect the iPhone — device registration and the signed build are already done.**

1. Connect, unlock, and trust the iPhone. Confirm it is visible with `xtool devices --usb --no-wait`.
2. Install the already-built `.ipa` (see Current state above for the path/rebuild link) with
   `xtool install --usb --udid 00008110-000974400A23A01E <path-to-ipa>`. `xtool` is the installer
   here; this Expo app's signed native build is produced by EAS, not by xtool's Swift-package
   build flow. If the `.ipa` is no longer on disk, re-run `npx eas-cli@latest build --platform ios
   --profile development --non-interactive --wait` to rebuild it — device credentials are already
   provisioned, so no re-registration is needed.
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

- 2026-11-05 (uncommitted): Added `expo-dev-client`, built and downloaded a signed iOS development
  `.ipa` via EAS (build `849aa32e-564a-4ed7-95ce-7311e07a2208`) using the already-registered
  "CJ's iPhone 2" device on the Rolling Woods Media, LLC Apple team — staged for `xtool install`
  once the phone reconnects.
- 2026-11-05 `284bc16`: Linked the EAS iOS development-build profile, added ESLint, and passed lint, type,
  test, Expo diagnostics, and iOS JS-bundle export.
- 2026-11-05: Added this HANDOFF.md.
- 2026-11-05 `2dcb0cc`: Phase 1 prototype: Expo app, content schema, Chief Keef draft unit,
  lanes, provider links, local storage, tests, PDF draft extractor.
- 2026-11-05 `feacee1`: Plan expanded on `main` (outbound links only in v1, review gate, byline held).
- 2026-11-05 `b49fa79`: First app plan added (merged in PR #1).
