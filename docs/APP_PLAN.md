# Required Listening Interactive Mobile App Plan

> **For Hermes:** Use `subagent-driven-development` to execute this plan task-by-task.

**Goal:** Turn *Required Listening: The Art of Passing Down the Bangers* into a safe, parent-led iOS/Android companion that makes its artist units, listening prompts, conversations, and “Build Your Own Crate” activity interactive—without becoming a music-streaming service.

**Architecture:** Build one Expo/React Native TypeScript app with a local-first, versioned curriculum bundle. A caregiver owns setup and safety controls; a child uses a simple listening-and-reflection experience. Cloud sync is an optional later layer, not an MVP prerequisite.

**Tech stack:** Expo SDK, React Native, TypeScript, Expo Router, Zustand, Expo SQLite, Zod, React Hook Form, Vitest, React Native Testing Library, Maestro. Use Supabase only if the pilot proves multi-device caregiver sync is valuable.

---

## 1. Source review and product thesis

`docs/Required_Listening_11-5.pdf` is a 77-page, roughly 9,551-word parent-led Hip-Hop/R&B teaching guide. It has 10 units—Chief Keef, Rihanna, Migos, Mac Miller, Frank Ocean, Soulja Boy, Bow Wow, Chris Brown, 50 Cent, and Beyoncé. Every unit includes:

- why the artist still matters;
- a **Passed Down Track** and editorial explanation;
- toddler-friendly/clean-option recommendations;
- an overview and learning outcomes;
- 10 lessons with listening selections and Ask/Activity/Teach prompts;
- an influence tree and a final project.

Its closing **Build Your Crate** section is the strongest repeat-use loop: choose songs, name why they matter, attach them to a moment, share, and return to the crate over time.

### Product thesis

The app should preserve the guide’s “use it, don’t study it” ethos. The point is not to turn this into school or move a long PDF onto a phone. It is to help a caregiver and child create an easier, richer shared listening ritual.

The central interaction is:

1. **Listen** — open a family-selected, legal music-service destination.
2. **Notice** — see one concise cue about sound, culture, or feeling.
3. **Talk** — save a child response or use a caregiver conversation prompt.
4. **Add to Crate** — make the song part of the family’s living collection.

### Design direction

Preserve the PDF’s editorial visual language: black/white/caramel-gold, bold uppercase sans headings, warm labels, thin rules, and deliberate whitespace. Do not transfer page-density to the phone. Mobile should show one clear idea at a time with a large `LISTEN`, `NOTICE`, `TALK`, `ADD TO CRATE` rhythm.

### V1 boundaries

- Education/discovery companion, **not** a player, public social network, or unmoderated playlist service.
- Do not host copyrighted full songs, copied lyrics, or artist photos without rights.
- Start with outbound provider links. An optional 30-second preview may be considered only after validating its provider terms, metadata/artwork attribution requirements, and availability; it must never be required for the core lesson flow.
- No child public profiles, comments, messaging, or public user-generated content.
- Treat every recommendation, track label, and historical/influence claim as editorial content that needs a review trail.

## 2. Decisions to resolve before build

1. **Audience and age floor:** Recommended first audience is caregiver + child ages 8–13. “Younger Listener” should remain caregiver-led because the guide also addresses violence, trauma, adult behavior, and other mature context.
2. **Author/legal identity:** The cover says `C. Roberts`; Bud created the guide under Pearl N. Schett. Confirm the public byline, copyright holder, privacy-policy entity, and App Store/Google Play seller before release. Until confirmed, show no assumed author metadata in the app.
3. **Editorial safety policy:** Define content classifications for language, explicit themes, violence, substances, legal history, and artist conduct. “Clean” must refer to a reviewed, provider-specific version—not a blanket safety guarantee.
4. **Music providers:** Choose supported providers at launch, allowed outbound hosts, and whether a caregiver can set a default service. Start without provider logins.
5. **Business model:** Validate the value with a free or paid pilot before adding subscriptions. No ads or behavioral advertising.
6. **Data posture:** Local-only must remain fully useful. Exact birth dates, child emails, and child public identities are out of scope.

## 3. User experience

### Caregiver onboarding

- Explain: “Pass down the songs, then let them build their own crate.”
- Select a listening lane: `Younger Listener`, `Guided`, or `Full Guide`.
- Select permitted providers and set an optional caregiver PIN.
- Create only a local child nickname/avatar; do not request an exact birthday.
- Present a clear content note: the app retains context and supports conversation rather than promising every record is appropriate for every age.

### Child home: The Crate

- Current unit or “pick a record together” hero.
- **Start a Unit**, **My Crate**, and **Family Replay** entry points.
- Progress means lessons explored and reflections saved—not scores, streak pressure, rankings, or leaderboards.

### Artist unit

1. Artist landing: editorial intro, passed-down track, “why this matters,” time estimate, and mature-topic labels.
2. One lesson at a time: read / open music / notice / talk.
3. Save a thought with age-appropriate choices: feeling chips, short response, optional voice note, or later drawing/photo attachment.
4. Mark a lesson as explored manually; do not claim that external music was played.
5. Offer final projects as optional guided creations, never graded homework.

### My Crate

- Add a guide track, search/add a manual title and artist, or save from a lesson.
- Capture: why it was picked; feeling tags; moment (`car ride`, `clean-up`, `bedtime`, `party`, `sad`, `happy`, `anytime`); note/voice reflection; date added.
- Generate a private visual crate card or PDF through the native share sheet; no in-app public feed.
- Offer an opt-in annual rebuild prompt—never a pressure-based streak notification.

### Caregiver dashboard

- Recent family reflections, clearly labeled private.
- Enable/filter units and tracks using content tags.
- Local export, reset, and deletion.
- If sync comes later, it is opt-in and owned by the caregiver account.

## 4. Content model and editorial workflow

Use structured, versioned data—not prose hardcoded into screens:

```text
app/
  (tabs)/index.tsx                 # Home / family replay
  (tabs)/units.tsx                 # Artist grid
  (tabs)/crate.tsx                 # My Crate
  (tabs)/about.tsx                 # Dedication, note, intro
  unit/[id].tsx                    # Unit hub
  lesson/[unitId]/[lessonId].tsx   # Lesson flow
  project/[unitId].tsx             # Final project
src/
  content/
    catalog.v1.json
    front-matter.v1.json
    crate-activity.v1.json
    artists/01-chief-keef.v1.json … 10-beyonce.v1.json
    schemas.ts
    content-audit.ts
  components/
    LessonFlow.tsx
    TrackRow.tsx
    CrateEntryForm.tsx
    InfluenceTree.tsx
  domain/crate.ts
  features/safety/ContentGate.tsx
  features/caregiver/CaregiverSettingsScreen.tsx
  features/progress/ProgressRepository.ts
  stores/crate-store.ts
  lib/links.ts
scripts/
  extract-pdf.ts                    # draft aid only; never publish raw extraction
  resolve-tracks.ts                 # link/metadata draft aid; manual review required
tests/
  content-schema.test.ts
  content-audit.test.ts
  crate-store.test.ts
maestro/
  first-listening-flow.yaml
```

### Required schema fields

Each artist/unit record needs stable IDs, display name, artwork/illustration asset, intro, passed-down track, `sourceNotes`, `reviewedAt`, and `reviewedBy`.

Each track needs title, artist, type (`song`, `album`, `mixtape`, `instrumental`, `video`), provider URLs, allowed-provider validation, `ageBands`, `contentFlags`, caregiver notes, and clean-version verification status. Keep `youngerListener` recommendations separate from the word “clean.”

Each lesson needs a heading, body blocks, listening selections, one observation prompt, one caregiver discussion prompt, and an optional activity. Final projects and influence references should also be structured.

### Editorial rules

- Preserve Pearl’s voice; clarify facts without sanding off the cultural point of view.
- Run a factual pass for dates, names, influence claims, labels, track spelling, and music-service links.
- Do not bulk-convert the PDF directly into production. `extract-pdf.ts` may create drafts only; every unit is hand-edited and reviewed.
- The Chris Brown/Rihanna material needs explicit age gating and caregiver framing. The app should maintain the guide’s valuable “art, accountability, and consequences” discussion rather than flattening it.
- Add `requiresCaregiverContext` to mature content. Unknown review state is a blocked state, not a silent publish.

## 5. Delivery plan

### Phase 0 — Product, rights, and safety foundation

**Objective:** Resolve the decisions that make the product legally, ethically, and editorially coherent.

**Create:**
- `docs/product-brief.md`
- `docs/editorial-policy.md`
- `docs/content-review-checklist.md`
- `docs/music-link-policy.md`
- `docs/privacy-and-child-safety-decisions.md`

**Steps:**
1. Write the product brief: audience, caregiver role, v1 boundaries, provider policy, and one success metric.
2. Resolve author/byline/copyright/store-seller metadata and rights for app text/art.
3. Convert the guide’s adult-discretion stance into content classifications and caregiver-control rules.
4. Get qualified legal/privacy review before child-directed marketing, analytics, accounts, sync, or any in-app audio previews.
5. Define the one-unit pilot acceptance test: caregiver + child discover a track, have a conversation, and save a crate entry in under 10 minutes.

**Verification:** Sign-off exists for audience, authorship, rights, safety, privacy, providers, and business model.

### Phase 1 — One-unit interactive prototype

**Objective:** Prove the guide feels alive before converting all 77 pages or adding a backend.

**Create:**
- Expo project and the `app/`, `src/`, `tests/`, and `maestro/` paths above.
- `src/content/schemas.ts`, `src/content/catalog.v1.json`, and one complete reviewed unit (recommended: Rihanna for broad accessibility or Chief Keef to test context/safety rigor).
- `src/domain/crate.ts`, `src/stores/crate-store.ts`, `src/components/LessonFlow.tsx`, `src/components/CrateEntryForm.tsx`.
- `tests/content-schema.test.ts` and `tests/crate-store.test.ts`.

**Steps:**
1. Scaffold Expo TypeScript + Expo Router without modifying `docs/Required_Listening_11-5.pdf`.
2. Write failing Zod schema tests for unit, lesson, track, content flag, provider link, and crate entry.
3. Add `scripts/extract-pdf.ts` to produce a private draft JSON; hand-edit and review the one chosen unit.
4. Implement welcome/setup, artist landing, one complete Listen → Notice → Talk flow, and My Crate.
5. Persist crate entries with Expo SQLite; implement export/delete before accounts.
6. Validate allowed external URL hosts and use Expo Linking. Render unavailable/unsupported states honestly.
7. Test no-network, no-installed-provider, and relaunch/persistence behavior.

**Verification:** A family completes a lesson, saves a song/reason/moment, relaunches the app, and safely finds that crate entry again.

### Phase 2 — Full guide conversion and caregiver controls

**Objective:** Convert the complete guide into reviewable app curriculum.

**Create:**
- Remaining structured unit files under `src/content/artists/`.
- `src/features/safety/ContentGate.tsx`
- `src/features/caregiver/CaregiverSettingsScreen.tsx`
- `src/features/progress/ProgressRepository.ts`
- `tests/content-audit.test.ts`

**Steps:**
1. Convert and review units one at a time; use two-person editorial review where possible.
2. Implement content lanes, mature-topic labels, hidden-by-default material, and caregiver-PIN setting changes.
3. Add manual explored progress, favorites, text reflection, and local voice notes only after permission/deletion copy is finished.
4. Add final-project templates, influence-tree links across app units, and private crate-card export.
5. Add an audit that fails on missing metadata, unapproved hosts, unreviewed flags, empty safety notes, duplicate IDs, or unresolved track records without a manual-review flag.

**Verification:** Ten structured units render correctly; safety settings change discoverability exactly as specified; restricted material cannot be reached through search or deep links.

### Phase 3 — Family pilot and iteration

**Objective:** Determine if this creates a meaningful family practice rather than a better-looking PDF.

**Create:**
- `docs/pilot-script.md`
- `docs/research-consent.md`
- `docs/pilot-findings-template.md`
- `maestro/first-listening-flow.yaml`

**Steps:**
1. Recruit 5–10 trusted caregiver/child pairs within the selected age range; collect appropriate consent and no unnecessary child identifiers.
2. Observe onboarding, unit use, provider handoff friction, conversation quality, and crate creation.
3. Record only privacy-respecting signals: lesson start/finish locally, crate entry creation, caregiver-reported conversation quality, and return intent.
4. Fix the three highest-friction issues and re-run the flow.
5. Decide whether cross-device sync solves a real pilot need before building it.

**Verification:** A pilot report identifies top friction, safety concerns, and a clear go/no-go recommendation for public release.

### Phase 4 — Optional sync and release hardening

**Objective:** Add cloud capability only if justified, then clear privacy, accessibility, and store-release gates.

**Create only if approved:**
- `supabase/migrations/001_family_profiles.sql`
- `src/features/sync/SyncAdapter.ts`
- `docs/app-store-checklist.md`
- `docs/privacy-policy.md`
- `docs/support.md`

**Steps:**
1. Keep caregiver identity separate from local child profiles; store only what sync requires and use row-level security.
2. Add opt-in sync for a family’s private crate/reflections; local-only remains complete.
3. Complete App Store/Google Play disclosures based on actual SDK/data behavior.
4. Validate Dynamic Type, VoiceOver/TalkBack, contrast, focus order, reduced motion, and touch targets.
5. Run TestFlight/internal testing, production device tests, deletion/export tests, privacy review, and store metadata review.

**Verification:** The release candidate passes automated tests, device smoke tests, accessibility checks, privacy/deletion tests, and store-review requirements.

## 6. Tests and release gates

- **Unit:** Zod schemas, content filtering, allowed-provider URLs, crate reducers, export/delete.
- **Content contract:** Assert 10 units × 10 lessons, one passed-down track per unit, a final project per unit, and no unreviewed content flags.
- **Component:** A lesson renders required sections; caregiver gates permit/block intended units only.
- **E2E:** Setup → start lesson → outbound-provider confirmation → save reflection → relaunch persistence → caregiver hide/unhide a sensitive unit.
- **Manual:** iOS and Android, offline use, no music app present, largest Dynamic Type, VoiceOver/TalkBack, and caregiver-control escape attempts.
- **Editorial:** Every title, artist, clean/explicit designation, link, historical claim, content warning, and final author credit has review evidence.

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Hosted playback creates licensing obligations | Use outbound links in v1; obtain music-law guidance before previews or embedded playback. |
| “Toddler-friendly” sounds like a blanket safety promise | Use a caregiver-guided Younger Listener lane with explicit flags. |
| Mature artist/context material is oversimplified | Use age bands, caregiver notes, opt-in gates, and an editorial review checklist. |
| The app becomes a tedious PDF reader | Prove the short lesson + crate loop with one unit first. |
| Child privacy exposure | Local-first profiles, no social features or behavioral ads, explicit export/delete, opt-in sync later. |
| Links and content become stale | Version content, validate hosts, maintain `reviewedAt`, and schedule editorial review. |

## 8. Recommended next move

Execute **Phase 0**, then build **one fully playable Phase 1 unit**. Do not convert all 77 pages, build a subscription system, or add a backend until the prototype proves a caregiver and child leave with a better shared listening moment than they would get from the PDF and a playlist.
