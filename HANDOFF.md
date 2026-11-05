# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 1 (one-unit interactive prototype). Installed and verified on a real iPhone; next up is content review.
Phase 0 (product, rights and safety decisions) is still open and needs the author.

**Signed build installed and verified on-device**
- Device "CJ's iPhone 2" (UDID `00008110-000974400A23A01E`) is registered on the Apple team
  (6PA43G2WVX, Rolling Woods Media, LLC — same team/credentials used for the `/4lake` project;
  `xtool auth status` and EAS both authenticate against it).
- `expo-dev-client` was added as a dependency so the EAS `development` profile's dev client works.
  Committed in `a9bc012` along with `ITSAppUsesNonExemptEncryption`.
- EAS build `849aa32e-564a-4ed7-95ce-7311e07a2208` (`eas build --platform ios --profile development
  --non-interactive --wait`) and installed via `xtool install --usb --udid
  00008110-000974400A23A01E <path-to-ipa>`. Rebuild with the same `eas build` command if a fresh
  `.ipa` is needed — device credentials are already provisioned, no re-registration required.
- Dev client connects to Metro (`npx expo start --dev-client`) via manual LAN URL entry
  (`<host-LAN-IP>:8081`) when Bonjour auto-discovery hides the server.
- On-device walkthrough (2026-11-05): onboarding, a lesson's Listen step, and the provider-link
  hand-off (confirmation sheet → "Open <Provider>" → search opens in the external app) all
  confirmed working by the author.

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
- Real device (iPhone, dev client via EAS build `849aa32e-564a-4ed7-95ce-7311e07a2208`): onboarding,
  a lesson's Listen step, and the provider-link hand-off confirmed working by the author
  (2026-11-05). SQLite force-quit/relaunch persistence and the destructive-data confirmation were
  not explicitly called out as tested — worth a quick re-check before content review wraps up.

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

**Build and install are done and verified. Content review is the remaining blocker.**

1. (Optional, quick) On-device, double check SQLite persistence after a force-quit/relaunch and
   the destructive-data confirmation in Settings — not explicitly exercised yet.
2. The author reviews Unit 1: read `src/content/artists/01-chief-keef.v1.json`. Edit or approve each `"adapted"` prompt
   (switch `source` to `"guide"` once it's your wording), confirm each track, then set
   `review` to `{"status": "approved", "reviewedAt": "<date>", "reviewedBy": "<name>"}`.
   `npm test` will refuse the approval while anything is still unreviewed.
3. Then convert Unit 2 (Rihanna) from `drafts/02-rihanna.txt` the same way. Add it to `RAW_UNITS` in
   `src/content/index.ts` and set `available: true` in the catalog.

---

## Log

Newest first. One line per commit: date, short hash once known, what changed.

- 2026-11-05 (uncommitted): Installed the dev build on "CJ's iPhone 2" via `xtool install` and
  verified onboarding, a lesson's Listen step, and the provider-link hand-off on-device.
- 2026-11-05 `a9bc012`: Added `expo-dev-client`, built a signed iOS development `.ipa` via EAS
  (build `849aa32e-564a-4ed7-95ce-7311e07a2208`) using the already-registered "CJ's iPhone 2"
  device on the Rolling Woods Media, LLC Apple team.
- 2026-11-05 `284bc16`: Linked the EAS iOS development-build profile, added ESLint, and passed lint, type,
  test, Expo diagnostics, and iOS JS-bundle export.
- 2026-11-05: Added this HANDOFF.md.
- 2026-11-05 `2dcb0cc`: Phase 1 prototype: Expo app, content schema, Chief Keef draft unit,
  lanes, provider links, local storage, tests, PDF draft extractor.
- 2026-11-05 `feacee1`: Plan expanded on `main` (outbound links only in v1, review gate, byline held).
- 2026-11-05 `b49fa79`: First app plan added (merged in PR #1).
