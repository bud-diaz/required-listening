# Handoff

> **Keep this file current.** Update it in the same commit as any change: refresh **Current state**,
> add a line to the top of **Log**, and rewrite **Next step**. Anyone (person or agent) picking up the
> work should be able to start from here without reading the whole history.

Plan of record: [`docs/APP_PLAN.md`](docs/APP_PLAN.md) · Source guide: `docs/Required_Listening_11-5.pdf`

---

## Current state

**Phase:** Phase 2 (full-catalog conversion). Installed and visually verified on a real iPhone; lesson
content and overall publication status for the original 10 routes are author-approved and unchanged.
The 909-page unit catalog import still produced 60 additional strict draft routes (skipping eight
overlaps with the existing curriculum), but as of 2026-11-18 those routes are **no longer seeded into
the app** in either development or production — `src/content/index.ts`'s `RAW_UNITS` seeds only the
10 approved units, and the route directory/Home carousel show exactly those 10. The 60 catalog-drafts
files remain on disk as unseeded, strict-schema-valid source material for Lesson Packs (covered by a
standalone test), to be bundled into further packs the same way Pack 01 and Pack 02 were.
Unverified tracks publish only behind a repeated parent-preview requirement.
The app display name is **Listening Required**; the book/curriculum title remains *Required Listening*.
Phase 0 (product, rights and safety decisions) and the byline are still open and need the author.
Lesson Packs Phase 2 is implemented. Pack 01 — The Soul Foundation bundles its five requested units
(per `docs/req_packs.md`); Pack 02 — The New Wave bundles catalog-drafts units 11–15 (Drake, Future,
The Weeknd, Young Thug, Wale) in their existing catalog order — its title/theme/summary were drafted
copy since this grouping doesn't match any `docs/req_packs.md` pack. **bud-diaz reviewed and approved
all 10 source units across both packs on 2026-11-18**: every adapted Notice/Talk/Activity prompt
moved to `approved-adaptation`, and each pack's own `review.status` is now `approved` (reviewedBy
`bud-diaz`). Track clean-version status was intentionally left `unverified` throughout — that's a
valid, schema-legal steady state (caregiver preview required before every provider search), not an
approval blocker. Both packs remain `developmentOnly: true` and therefore hidden in production until
deployed to `paperweighthq.com` (see Next step); `npm run pack:build` rebuilds every pack and upserts
each one's entry in `src/content/packs/catalog.remote.v1.json` by `packId` without disturbing others.
Native lesson-pack modules are loaded on demand so the previously installed development client can
still boot and use bundled content; remote pack downloads require a fresh native build containing
Expo Crypto and Expo FileSystem.

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
- The currently installed development client predates the Phase 2 `expo-crypto` dependency. A static
  import originally caused an `ExpoCrypto` startup error; the on-demand import fix lets that client
  boot from Metro. Rebuild the native client before testing remote pack verification.
- On-device walkthrough (2026-11-05): onboarding, a lesson's Listen step, and the provider-link
  hand-off (confirmation sheet → "Open <Provider>" → search opens in the external app) all
  confirmed working by the author.

**What works**
- Expo SDK 58 + Expo Router app; routes in `src/app/`.
- SDK 58 dependencies are aligned with Expo's compatibility map; `expo-doctor@1.21.8` passes all
  20 project checks.
- Sound Traffic System visual identity across Home, route directory, unit hub, lesson stages, crate,
  onboarding, settings and About. Briefing is yellow; Listen blue; Notice orange; Talk green; Crate red.
- Launcher, Android adaptive/themed, and web favicon assets now use the supplied yellow-and-black
  Listening Required railroad sign; the original 1254px source is preserved under `docs/`.
- Reusable signage components live in `src/ui/signage/`, including the accessible four-way lesson
  placard, route badges, sign panels/buttons, record signs, context notes and stage-safe screens.
- Setup for grown-ups (nickname, emoji avatar, listening lane, allowed music services, content note).
  Spotify and Apple Music remain the defaults; YouTube Music and regular YouTube are separate,
  optional providers.
- Initial setup now flows into a persistent three-page Field Manual gate covering “Intro,” “A Note
  on This Guide,” and “We're not archiving careers.” Existing installs see it once after updating,
  completed families skip it thereafter, and protected routes prevent direct-link bypasses.
- Home with a cross-unit route carousel and Family Replay; the card starts on the first unfinished
  artist and supports horizontal swipes plus accessible previous/next controls across the 10 core
  routes plus any installed-pack artist with at least one lesson in the family's Lesson Plan (see
  `src/domain/routes.ts`). Artist Directory shows the same combined route list. Home's action row is
  Artist directory / My crate / Family replay; Lesson Plan and Lesson Packs entry points moved to
  About (see below).
- All 10 unit hubs use a persistent three-step briefing gate: families explicitly check off the
  artist/why page, passed-down track + Younger Listener picks, and unit briefing before checkpoints
  unlock. Locked lesson deep links return to the briefing; unlocked hubs retain review links to all
  three sections.
- Lesson flow: Read → Listen → Notice → Talk (feelings + saved thought) → Crate (add song, mark
  explored), with one persistent five-step navigation strip; the duplicate compact stage strip was
  removed after on-device review, and the remaining strip uses a consistent black outer border.
  After a lesson is marked explored, its Crate stage offers a next-lesson button unless it is the
  last lesson visible on the family's current lane. Completing every lane-visible lesson reveals
  both the optional Final Project and the next-route action; the final route returns to the Artist
  Directory instead.
- Each route now has an optional Final Project workspace with one private saved response (up to
  3,000 characters), optional multi-select early/later track picks, and a next-route action. The
  workspace remains available only while the route is complete for the family's current lane.
- My Crate (Build Your Own Crate steps 1–3, duplicate check, private share via share sheet). When a
  lesson supplies a song, the add form shows only that selection and a “Choose a different guide
  song” action instead of forcing the family to scroll through the full catalog.
- About tab with the guide's front matter (no byline); every Field Manual section is an accessible,
  independently collapsible accordion that starts closed. Sections follow Intro → A Note on This
  Guide → We're not archiving careers → To my son. The Get the Guide panel follows the accordions;
  its side-by-side Paperweight-logo and book-icon buttons link to the Paperweight Required Listening
  page and requested Amazon search. Of the three placeholder slots beneath them, the first is now a
  live Lesson Plan button (shows the count of distinct artists with a planned lesson, not lesson
  count) linking to `/plan`; the other two remain disabled future-link placeholders. Lesson Packs
  stays reachable from the Lesson Plan screen's "Browse lesson packs" button.
- Grown-up settings: change lane/providers, export data, delete all.
- Outbound links open a provider *search* after a confirmation sheet; hosts are exactly allow-listed.
  Every unverified track is labeled “Parent preview required,” and that warning repeats before every
  search because results can change. No verification choice is stored and no audio is hosted.
- Storage: Expo SQLite on iOS/Android; browser storage on the web preview. Unit briefing
  acknowledgements and Final Project responses persist, export, survive older snapshots, and clear
  with Delete All.
- Lesson Packs Phases 1 and 2 are implemented end to end. Pack 01 — The Soul Foundation is generated
  from Al Green, Teddy Pendergrass, Ronald Isley, Frankie Beverly & Maze, and Chaka Khan as five
  sections / 50 ordered lessons. The first-party catalog uses only `https://paperweighthq.com`, caches
  successful checks for 24 hours, enforces size/app/editorial gates, downloads through a temporary
  cache file on native, verifies SHA-256 before strict parsing, and atomically preserves the prior
  installed version through failed updates. Browse/detail UI includes refresh, progress, retry,
  update, offline fallback, storage, and removal states. Installed packs work fully offline and feed
  the ordered Lesson Plan and existing five-stage lesson flow. Pack 1 and the short demo remain
  development-only pending editorial approval and host deployment.
- Canonical copy-ready content templates live in `docs/content-templates/` for standalone lesson
  blocks, 10-lesson core units, and flexible lesson packs. Their README is the required authoring and
  review checklist. Tests parse every template against the live strict schemas, which now reject
  undeclared fields, unsafe younger-lane tracks, missing caregiver context, duplicate IDs, broken
  references, misnumbered lessons, and approval records that still contain adapted draft prompts.
- The full `docs/Unit-catalog.pdf` source and reproducible `scripts/import-unit-catalog.mjs` importer
  produce one strict JSON file per new route under `src/content/artists/catalog-drafts/`, a static
  import index, and a consecutive 70-route catalog without changing the existing 10 units. The import preserves source page ranges, keeps
  new reviews in draft, marks provider versions unverified, normalizes the four 9/11-lesson
  exceptions to 10 lessons, and gives six units without named younger picks an explicit caregiver-
  selected instrumental fallback. `docs/UNIT_CATALOG_IMPORT.md` records the audit queue.
- EAS project `29bd2171-ae38-4f5e-b974-cb451d0339ab` is linked to the `bud-diaz` account. `eas.json`
  defines an internal-distribution iOS development-client profile.
- ESLint is configured (`eslint.config.js`); JSX copy and schema type/value declarations lint cleanly.
- The lesson-pack architecture, completed local vertical slice, and remaining verified-download work
  are documented in `docs/LESSON_PACKS_PLAN.md`.

**Content status**

| Item | Status |
| --- | --- |
| Unit 1 Chief Keef (`src/content/artists/01-chief-keef.v1.json`) | Approved 2026-11-07 by bud-diaz |
| Units 2–10 (`src/content/artists/remaining-units.v1.ts`) | All 90 lessons and overall units approved 2026-11-12 by bud-diaz; unverified tracks require parent preview |
| Full catalog import (`src/content/artists/catalog-drafts/`) | 60 units / 600 lessons; strict-schema valid; unseeded (not part of the live app). 10 (Al Green, Teddy Pendergrass, Ronald Isley, Frankie Beverly & Maze, Chaka Khan, Drake, Future, The Weeknd, Young Thug, Wale) reviewed/approved via Packs 01–02; their own `review.status` field stays `draft` by design (a build-time tripwire, not a publication gate — see Pack build pipeline). 50 remain draft, awaiting further packs |
| Pack 01 — The Soul Foundation | 5 source units / 50 lessons bundled; strict-schema and digest valid; reviewed and approved 2026-11-18 by bud-diaz; development-only pending deployment |
| Pack 02 — The New Wave | 5 source units (units 11–15) / 50 lessons bundled; strict-schema and digest valid; reviewed and approved 2026-11-18 by bud-diaz; development-only pending deployment |
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

**Checks (last run after approving both packs' source units, 2026-11-18)**
- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npm test` (Vitest): 187/187 pass, including updated Pack 1/Pack 2 assertions for `review.status:
  approved` while `developmentOnly: true`, a standalone strict-schema check of the 60 unseeded
  catalog-drafts units, `tests/routes.test.ts` coverage for core/pack route activation and
  planned-unit counting, all templates, catalog/digest guards, links, lane/review gates, and content
  references.
- `npm run pack:build`: pass; reproducibly (and idempotently — reruns produce byte-identical output)
  emits a 111,767-byte Pack 1 artifact and a 131,118-byte Pack 2 artifact (sizes grew after approval:
  `approved-adaptation` is one character longer than `adapted`, plus the recorded `reviewedAt`/
  `reviewedBy`), each with a matching SHA-256 catalog digest upserted into `catalog.remote.v1.json`
  by `packId`.
- `npx expo export --platform web --output-dir /tmp/required-listening-routes-web`: pass; web bundles
  confirming Home, Artist Directory, and About still bundle cleanly with the new route logic.
- Browser-based visual verification was not possible this session: the connected Claude-in-Chrome
  browser is on a different host than this sandbox and cannot reach its localhost dev server. Typecheck,
  lint, tests, and export are the verification that ran; an on-device or same-host browser pass is
  still owed before shipping this UI change.
- `npx expo install --check`: pass against the local SDK compatibility map; network validation was
  unavailable in the sandbox, and dependencies are reported up to date.
- `npx expo config --type public`: pass; new launcher, adaptive, monochrome and favicon paths resolve.
- `npx expo export --platform web --output-dir /tmp/required-listening-about-icon-buttons-web`: pass;
  928 modules bundled, including the copied Paperweight brand-mark asset.
- `npx expo export --platform web --output-dir /tmp/required-listening-lesson-packs-web-final`: pass;
  936 modules bundled, including the new pack, plan, and pack-lesson routes.
- `npx expo export --platform web --output-dir /tmp/required-listening-pack-phase2-web`: pass; 1,028
  modules bundled, including Pack 1 and the verified Phase 2 catalog/download flow.
- `npx expo export --platform ios --output-dir /tmp/required-listening-pack-phase2-ios`: pass; 1,407
  modules bundled, including the SDK 58 FileSystem and Crypto download-verification path.
- `npx expo-doctor@latest` (`expo-doctor@1.21.8`): 20/20 checks pass.
- `npx expo export --platform web --output-dir /tmp/required-listening-field-manual-web`: pass; 926
  modules bundled.
- `npx expo export --platform ios --output-dir /tmp/required-listening-field-manual-ios`: pass;
  generated a 3.5 MB Hermes iOS bundle from 1,303 modules.
- EAS iOS development build `26580b41-dc6d-452d-a184-72e680075f34`: pass; signed with the active
  ad hoc profile and installed successfully on "CJ's iPhone 2" over USB.
- Headless Chromium mobile renders: onboarding and seeded Home at 390×844; Briefing + interactive
  placard at 390×844 and the 320×720 minimum target; new briefing gate at both target sizes; and the
  Final Project workspace at 390×844. The post-onboarding Field Manual gate was reviewed at 390×844,
  and the closed accordion list at both 390×844 and 320×720. No horizontal overflow or clipped
  primary controls in the reviewed captures.
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
- No caregiver PIN, voice notes or annual crate snapshot yet (Phase 2).
- No Maestro E2E flow yet; the web walkthrough script is not committed.

---

## Next step

**Deploy Pack 1 and Pack 2's approved artifacts, then complete accessibility QA.**

1. ~~Editorially review Pack 1 and Pack 2's source units~~ — done 2026-11-18: bud-diaz approved all
   10 source units (Al Green, Teddy Pendergrass, Ronald Isley, Frankie Beverly & Maze, Chaka Khan,
   Drake, Future, The Weeknd, Young Thug, Wale). Both packs' own `review.status` is `approved`.
   Pack 2's drafted title/theme/summary/educational connections/central lesson ("The New Wave")
   were part of that approval and need no further confirmation unless the author wants to revise the
   copy later.
2. Deploy `src/content/packs/catalog.remote.v1.json` as
   `/required-listening/packs/catalog.v1.json` and each pack's exact generated JSON as
   `/required-listening/packs/{packId}/{version}/pack.json` on `paperweighthq.com`. Confirm byte count
   and SHA-256 survive deployment, then test fresh install, interrupted retry, offline launch, update
   replacement, and removal on the registered iPhone for both packs.
3. Continue bundling the remaining 50 catalog-drafts units (`docs/UNIT_CATALOG_IMPORT.md`) into further
   packs the same way, rather than re-adding them to `RAW_UNITS`; do not approve a unit until its
   lesson prompts and provider-version notes are reviewed.
4. Run VoiceOver, Dynamic Type, provider hand-off (including separate YouTube and YouTube Music
   choices), Home route swiping, the Field Manual and unit briefing gates, Final Project flow, Talk
   keyboard clearance, persistence, destructive-data checks, and the About icon-button rows at the
   320px minimum width on the registered iPhone.
5. Review remaining track spelling, search metadata, and safety lanes. Keep unverified tracks under
   the caregiver-preview policy; this audit no longer blocks approved units from publishing.
6. Decide the byline (see Open decisions) whenever convenient — it doesn't block curriculum use.

---

## Log

Newest first. One line per commit: date, short hash once known, what changed.

- 2026-11-18: bud-diaz reviewed and approved all 10 source units across Pack 1 (Al Green, Teddy
  Pendergrass, Ronald Isley, Frankie Beverly & Maze, Chaka Khan) and Pack 2 (Drake, Future, The
  Weeknd, Young Thug, Wale). Every adapted Notice/Talk/Activity prompt moved to
  `approved-adaptation`; both packs' `review.status` is now `approved` (`reviewedBy: bud-diaz`),
  while `developmentOnly` stays `true` pending deployment to `paperweighthq.com`. Track
  clean-version status was deliberately left `unverified` — a valid, schema-legal state requiring
  caregiver preview, not an approval blocker.
- 2026-11-18: Gave pack content its own artist routes: once a family adds any lesson from a pack
  section to their Lesson Plan, that artist now appears as a full route on Home's carousel and in
  the Artist Directory (`src/domain/routes.ts` unifies core units and activated pack sections).
  `PackSection` gained stable `number`/`monogram` fields (propagated from the source catalog-drafts
  unit) to support this. The About tab's Lesson Plan button now shows the count of distinct artists
  with a planned lesson instead of the raw lesson count. Added `tests/routes.test.ts`.
- 2026-11-18: Moved the Lesson Plan entry point from Home to the first of About's three placeholder
  slots (now a live button showing the plan's artist count) and removed the Lesson Packs button from
  Home; Lesson Packs stays reachable from the Lesson Plan screen's "Browse lesson packs" button.
- 2026-11-18: Unseeded the 60 catalog-drafts units from the live app (now only the 10 approved units
  appear in development and production), bundled catalog-drafts units 11–15 (Drake, Future, The
  Weeknd, Young Thug, Wale) as Pack 02 — The New Wave, generalized `npm run pack:build` and the
  catalog-entry writer to support multiple packs without clobbering each other, and added a
  standalone schema-validity test preserving regression coverage for the now-unseeded draft units.
- 2026-11-18: Deferred Expo Crypto loading until a remote pack is verified so older development
  clients no longer crash during route discovery; missing native pack modules now produce an
  actionable compatibility error while bundled content remains usable.
- 2026-11-18: Bundled Pack 01 — The Soul Foundation from its five requested catalog units and
  implemented Lesson Packs Phase 2: strict first-party catalog, 24-hour cache, capped temporary
  downloads, SHA-256/app/editorial verification, safe updates, retry/progress/offline/storage UI,
  reproducible artifacts, templates/docs, and failure-path tests.
- 2026-11-18: Converted the 909-page, 68-route unit catalog into 60 new strict draft JSON units while
  skipping eight approved overlaps and leaving the existing 10 units unchanged; appended the drafts
  as routes 11–70, added a reproducible importer and audit guide, preserved review/safety gates,
  and validated all 700 lessons against the live schemas.
- 2026-11-18: Added mandatory lesson, core-unit, and lesson-pack authoring templates with a review
  checklist; tightened the live schemas and tests to enforce safety, references, numbering,
  provenance, review state, and strict declared fields.
- 2026-11-18: Implemented Lesson Packs Phase 1 with namespaced progress migration, offline pack
  installation, an ordered persistent Lesson Plan, pack-aware lesson/crate/reflection flows,
  export/Delete All coverage, development-only fixture content, routes, and tests.
- 2026-11-18: Moved Get the Guide after the About accordions, replaced link copy with side-by-side
  Paperweight-logo and book-icon buttons, and added a three-slot placeholder row.
- 2026-11-18: Replaced app/adaptive/web icons with the supplied Listening Required railroad sign,
  reordered About front matter, added Paperweight and Amazon buttons, and documented a local-first
  lesson-pack and Lesson Plan architecture.
- 2026-11-12: Added a persistent three-page Field Manual gate after onboarding with protected-route
  enforcement, and converted every About section into an accessible closed-by-default accordion.
- 2026-11-12: Added a persistent three-page unit briefing gate, strict locked-lesson redirects,
  lane-aware route completion actions, an optional saved Final Project workspace, and next-route
  navigation; aligned Expo's three required SDK 58 patch versions and expanded coverage to 152 tests.
- 2026-11-12: Turned the Home route card into a swipeable 10-artist carousel with per-route
  progress/actions, accessible previous/next controls, stable card height, and a 320px adaptation.
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
