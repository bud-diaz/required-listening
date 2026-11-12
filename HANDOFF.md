# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 2 (full-guide conversion). Installed and visually verified on a real iPhone; lesson
content and overall publication status for all 10 units are author-approved. Unverified tracks publish
with a repeated parent-preview requirement instead of blocking their units.
The app display name is **Listening Required**; the book/curriculum title remains *Required Listening*.
Phase 0 (product, rights and safety decisions) and the byline are still open and need the author.

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
- The Sound Traffic System worktree was built as EAS development build
  `26580b41-dc6d-452d-a184-72e680075f34` and installed successfully over USB on 2026-11-11. The
  author completed the on-device visual walkthrough and approved the direction on 2026-11-11.
  VoiceOver, Dynamic Type, keyboard-clearance, and destructive-flow checks are still pending.
- Dev client connects to Metro (`npx expo start --dev-client`) via manual LAN URL entry
  (`<host-LAN-IP>:8081`) when Bonjour auto-discovery hides the server.
- On-device walkthrough (2026-11-05): onboarding, a lesson's Listen step, and the provider-link
  hand-off (confirmation sheet → "Open <Provider>" → search opens in the external app) all
  confirmed working by the author.

**What works**
- Expo SDK 58 + Expo Router app; routes in `src/app/`.
- SDK 58 dependencies are aligned with Expo's compatibility map; `expo-doctor@1.21.8` passes all
  20 project checks.
- Sound Traffic System visual identity across Home, route directory, unit hub, lesson stages, crate,
  onboarding, settings and About. Briefing is yellow; Listen blue; Notice orange; Talk green; Crate red.
- Reusable signage components live in `src/ui/signage/`, including the accessible four-way lesson
  placard, route badges, sign panels/buttons, record signs, context notes and stage-safe screens.
- Setup for grown-ups (nickname, emoji avatar, listening lane, allowed music services, content note).
  Spotify and Apple Music remain the defaults; YouTube Music and regular YouTube are separate,
  optional providers.
- Home with a cross-unit "continue" card and Family Replay; all 10 artists are available in
  development and production builds.
- All 10 unit hubs include a passed-down track, why it matters, content labels, Younger Listener
  picks, overview, learning outcomes, 10 lessons, and final project text.
- Lesson flow: Read → Listen → Notice → Talk (feelings + saved thought) → Crate (add song, mark
  explored), with one persistent five-step navigation strip; the duplicate compact stage strip was
  removed after on-device review, and the remaining strip uses a consistent black outer border.
  After a lesson is marked explored, its Crate stage offers a next-lesson button unless it is the
  last lesson visible on the family's current lane.
- My Crate (Build Your Own Crate steps 1–3, duplicate check, private share via share sheet). When a
  lesson supplies a song, the add form shows only that selection and a “Choose a different guide
  song” action instead of forcing the family to scroll through the full catalog.
- About tab with the guide's front matter (no byline).
- Grown-up settings: change lane/providers, export data, delete all.
- Outbound links open a provider *search* after a confirmation sheet; hosts are exactly allow-listed.
  Every unverified track is labeled “Parent preview required,” and that warning repeats before every
  search because results can change. No verification choice is stored and no audio is hosted.
- Storage: Expo SQLite on iOS/Android; browser storage on the web preview.
- EAS project `29bd2171-ae38-4f5e-b974-cb451d0339ab` is linked to the `bud-diaz` account. `eas.json`
  defines an internal-distribution iOS development-client profile.
- ESLint is configured (`eslint.config.js`); JSX copy and schema type/value declarations lint cleanly.

**Content status**

| Item | Status |
| --- | --- |
| Unit 1 Chief Keef (`src/content/artists/01-chief-keef.v1.json`) | Approved 2026-11-07 by bud-diaz |
| Units 2–10 (`src/content/artists/remaining-units.v1.ts`) | All 90 lessons and overall units approved 2026-11-12 by bud-diaz; unverified tracks require parent preview |
| Front matter, Build Your Crate | Draft: needs author review |

All 10 units and their lane-appropriate tracks now appear in production. Units 2–10 record lesson
approval separately from their overall unit review; their app-specific Notice/Talk prompts are marked
`approved-adaptation`. An `unverified` selection is not represented as clean: it carries
`requiresCaregiverPreview`, and the app asks a grown-up to preview the exact provider result every time.

**Units 2–10 review resolution (2026-11-12)**
- bud-diaz reviewed and approved the lesson content across all nine newly converted units.
- Every app-specific Notice/Talk prompt moved from `adapted` to `approved-adaptation`, preserving
  provenance without implying that the wording came directly from the PDF.
- Overall unit status is `approved`. Track-version judgment stays with the caregiver: unverified
  tracks remain visibly flagged in track rows and again before every outbound provider search.

**Unit 1 review resolution (2026-11-07)**
- All 19 `adapted` Notice/Talk prompts approved as drafted; `source` flipped to `"guide"`.
- 5 tracks (Earned It, Everyday, John Madden, Kay Kay, Kobe) had `cleanVersionStatus: "unverified"`
  — the author had not actually checked a streaming service for a clean edit, so rather than
  claim one exists, these were set to `explicit` (same treatment as the unit's other explicit
  tracks). Earned It and Everyday were Younger Listener picks and moved to the guided lane as a
  result; the unit's Younger Listener picks are now just the two instrumentals
  (`love-sosa-instrumental`, `citgo-instrumental`).
- `review` set to `{"status": "approved", "reviewedAt": "2026-11-07", "reviewedBy": "bud-diaz"}`.
- Byline was **not** decided — `catalog.v1.json`'s `byline` stays `null`, unattributed, per the
  existing plan default.

**Checks (last run on current worktree after YouTube/caregiver-preview implementation, 2026-11-12)**
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test` (Vitest): 147/147 pass.
- `npx expo install --check`: pass; dependencies are up to date.
- `npx expo-doctor@latest` (`expo-doctor@1.21.8`): 20/20 checks pass.
- `npx expo export --platform web --output-dir /tmp/required-listening-youtube-web`: pass; 923
  modules bundled.
- `npx expo export --platform ios --output-dir /tmp/required-listening-youtube-ios`: pass; generated
  a 3.4 MB Hermes iOS bundle from 1,300 modules.
- EAS iOS development build `26580b41-dc6d-452d-a184-72e680075f34`: pass; signed with the active
  ad hoc profile and installed successfully on "CJ's iPhone 2" over USB.
- Headless Chromium mobile renders: onboarding and seeded Home at 390×844; Briefing + interactive
  placard at 390×844 and the 320×720 minimum target. No horizontal overflow or clipped primary
  controls in the reviewed captures.
- Programmatic contrast check: the intended body/heading pairings pass WCAG AA (ink on yellow 12.58,
  ink on orange 8.39, paper on blue 6.23, paper on green 5.51, paper on red 4.80).
- Last real-device check remains 2026-11-05 (pre-redesign): onboarding, a lesson's Listen step, and
  provider hand-off passed. The redesigned UI still needs an on-device visual/accessibility pass.

**Open decisions (need the author)**
1. Public byline: the PDF says "C. Roberts"; the plan says show none until confirmed. Set
   `byline` in `src/content/catalog.v1.json` once decided. Still `null`.
2. Phase 0 items in the plan §2: audience/age floor, rights, privacy, providers, business model.

**Known gaps / deliberate deviations**
- Routes live in `src/app/` (Expo SDK 58 convention) rather than `app/` as sketched in the plan.
- The concept-only listening focus wheel and conversation-route choices are intentionally omitted;
  the content schema has no approved options for them. Notice uses the allowed unsaved “I noticed
  something” acknowledgement instead of fabricated answers.
- No caregiver PIN, Final Project workspace, voice notes or annual crate snapshot yet (Phase 2).
- No Maestro E2E flow yet; the web walkthrough script is not committed.

---

## Next step

**Complete accessibility QA and the remaining nonblocking metadata audit.**

1. Run VoiceOver, Dynamic Type, provider hand-off (including separate YouTube and YouTube Music
   choices), Talk keyboard clearance, crate persistence, and
   destructive-data checks on the registered iPhone.
2. Review remaining track spelling, search metadata, and safety lanes. Keep unverified tracks under
   the caregiver-preview policy; this audit no longer blocks approved units from publishing.
3. Decide the byline (see Open decisions) whenever convenient — it doesn't block curriculum use.

---

## Log

Newest first. One line per commit: date, short hash once known, what changed.

- 2026-11-12: Added regular YouTube as a separate opt-in, exactly allow-listed search provider;
  published all author-approved units; replaced central track-verification blocking with repeated
  parent-preview warnings for every unverified selection.
- 2026-11-12: Recorded bud-diaz's approval of all lesson content in Units 2–10, added distinct
  approved-adaptation provenance for app-written prompts; the follow-up caregiver-preview policy
  then cleared those units for production without making unsupported clean-version claims.
- 2026-11-11: Collapsed the full guide-track catalog on lesson-originated crate forms; the selected
  song appears immediately with an explicit option to choose a different guide track.
- 2026-11-11: Added a lane-aware “Proceed to next lesson” action after marking a lesson explored;
  it skips restricted checkpoints and stays hidden on the final visible lesson.
- 2026-11-11: Made the remaining five-step lesson navigation strip use a black outer border on
  every colored stage.
- 2026-11-11: Removed the duplicate compact lesson-stage strip seen on every non-Briefing screen;
  the complete Briefing/Listen/Notice/Talk/Crate navigation remains.
- 2026-11-11: Converted Units 2–10 into structured in-app drafts (90 new lessons), integrated all
  10 units with the Sound Traffic flows, added every-lane coverage, blocked draft tracks from
  production crate search, and expanded content-contract coverage to the full 100-lesson guide.
- 2026-11-11: Author approved the Sound Traffic System visual direction after an on-device pass;
  detailed accessibility and persistence checks remain pending.
- 2026-11-11: Built the current Sound Traffic System worktree as signed EAS iOS development build
  `26580b41-dc6d-452d-a184-72e680075f34` and installed it successfully on "CJ's iPhone 2" over USB.
- 2026-11-11: Repaired the interrupted npm install, aligned seven Expo packages with the current
  SDK 58 compatibility map, and restored clean Expo Doctor (20/20), lint, typecheck, test, and iOS
  bundle checks.
- 2026-11-11: Implemented the Sound Traffic System visual overhaul from the design handoff and
  concept sheet while preserving filtering, provider safety, reflection/crate persistence and the
  manual explored state; added reusable signage primitives and the five-stage lesson environments.
- 2026-11-11: Renamed the app display name to Listening Required and replaced iOS, Android, and web launcher icons with the supplied traffic-sign artwork; the book title remains Required Listening.
- 2026-11-11: Added the interactive-mobile-app implementation plan artifact under `.hermes/plans/`.
- 2026-11-07: Unit 1 (Chief Keef) approved by the author. All adapted prompts kept as drafted;
  5 tracks with unverified clean status reclassified as explicit rather than assumed clean (two
  moved out of the Younger Listener picks as a result); `review.status` set to `approved`.
- 2026-11-05 `89131a3`: Installed the dev build on "CJ's iPhone 2" via `xtool install` and
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
