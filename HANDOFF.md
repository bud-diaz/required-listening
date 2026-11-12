# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 2 (full-guide conversion). Installed and visually verified on a real iPhone; Unit 1 content is author-approved and ready to ship, and Units 2–10 are complete in-app editorial drafts awaiting author review.
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
- Home with a cross-unit "continue" card and Family Replay; all 10 artists are available in
  development builds (production continues to block draft units).
- All 10 unit hubs include a passed-down track, why it matters, content labels, Younger Listener
  picks, overview, learning outcomes, 10 lessons, and final project text.
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
| Unit 1 Chief Keef (`src/content/artists/01-chief-keef.v1.json`) | Approved 2026-11-07 by bud-diaz |
| Units 2–10 (`src/content/artists/remaining-units.v1.ts`) | Complete app drafts: 90 lessons; author review and provider-specific clean-version verification required |
| Front matter, Build Your Crate | Draft: needs author review |

Draft units only appear in development builds; production builds show Units 2–10 as "Coming soon"
and omit their tracks from the generic crate picker. Unit 1 is approved and no longer gated by the
draft banner. Every new Notice/Talk prompt is marked `adapted`; every guide-recommended younger
pick is `unverified` until a specific provider version is manually checked.

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

**Checks (last run on current worktree after full-guide conversion, 2026-11-11)**
- `npm run lint`: pass
- `npm run typecheck`: pass
- `npm test` (Vitest): 134/134 pass.
- `npx expo install --check`: pass; dependencies are up to date.
- `npx expo-doctor@latest` (`expo-doctor@1.21.8`): 20/20 checks pass.
- `npx expo export --platform web --output-dir /tmp/required-listening-full-guide-web`: pass; 923
  modules bundled after adding all units.
- `npx expo export --platform ios --output-dir /tmp/required-listening-ios`: pass; generated a
  3.4 MB Hermes iOS bundle. Rechecked after the dependency alignment with 1,299 modules bundled.
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

**Review the nine newly converted unit drafts, then complete accessibility QA.**

1. Review Units 2–10 one at a time in the development build. Confirm body wording, every adapted
   Notice/Talk prompt, track spelling, safety lanes, and factual claims; then set approved review
   metadata only after the author signs off.
2. Verify each guide-recommended younger pick against a specific provider version. Replace
   `unverified` with `verified-clean` only when the exact version is confirmed; otherwise move it to
   a more restrictive lane or use an instrumental.
3. Run VoiceOver, Dynamic Type, provider hand-off, Talk keyboard clearance, crate persistence, and
   destructive-data checks on the registered iPhone.
4. Decide the byline (see Open decisions) whenever convenient — it doesn't block shipping Unit 1.

---

## Log

Newest first. One line per commit: date, short hash once known, what changed.

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
