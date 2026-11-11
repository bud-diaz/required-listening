# Required Listening Interactive Mobile App Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Turn *Required Listening: The Art of Passing Down the Bangers* into a safe, parent-led iOS/Android companion that makes its 10 artist units, listening prompts, conversations, and “Build Your Own Crate” activity genuinely interactive—without trying to become a music-streaming service.

**Architecture:** Build a single Expo/React Native TypeScript app with a local-first curriculum bundle and a thin content/service layer. A caregiver owns setup and safety controls; a child uses a simple listening-and-reflection experience. Ship the guide’s fixed first edition as versioned structured content in the app; add a Supabase backend only when cross-device family syncing or editorial publishing is needed.

**Tech Stack:** Expo SDK + React Native + TypeScript, Expo Router, Zustand, SQLite/`expo-sqlite`, Zod, React Hook Form, Vitest, React Native Testing Library, Maestro; later Supabase Auth/Postgres/Storage only for opt-in caregiver sync.

---

## 1. Review findings and product thesis

### Source reviewed
- `docs/Required_Listening_11-5.pdf` — 77 pages, roughly 9,551 words.
- It contains **10 artist units**: Chief Keef, Rihanna, Migos, Mac Miller, Frank Ocean, Soulja Boy, Bow Wow, Chris Brown, 50 Cent, and Beyoncé.
- Each unit has: a passed-down track, a toddler-friendly/clean-options list, a unit overview, 10 lessons, listening selections, teaching/discussion prompts, and a final project.
- The closing “Build Your Own Crate” worksheet already supplies the app’s strongest repeat-use loop: choose 3–5 songs, say why, attach a moment, share, revisit.

### What should translate directly
1. **The crate metaphor** is the home screen and core retention loop—not a generic course catalog.
2. **Passed-down track + “why it matters”** becomes the quick-start of every artist unit.
3. **Listen / Notice / Talk** becomes the repeatable lesson interaction:
   - Listen: open a legal music-provider link or family-selected service.
   - Notice: one concise observation or listening cue.
   - Talk: an optional child response, spoken or typed, then an adult conversation prompt.
4. **Toddler-friendly selections** become a visible “younger listener” lane, not a buried footnote.
5. **Final projects** become lightweight creations: a comparison card, influence map, voice note, or family discussion—not schoolwork with a grade.
6. **Build Your Own Crate** becomes a persistent, editable, shareable family artifact.

### Design direction from the PDF
Preserve the black/white/caramel-gold editorial system: bold uppercase sans headings, warm gold labels, thin rules, and uncluttered cards. Do **not** copy the desktop-PDF density onto a phone. Use a large `LISTEN`, `NOTICE`, `TALK`, `ADD TO CRATE` rhythm with one idea per screen, readable type, and a caregiver/child mode distinction.

### Product boundaries for v1
- This is an **education/discovery companion**, not a music player, social network, or unmoderated playlist platform.
- Do not embed or host copyrighted full tracks. Launch externally through user-selected provider links (Apple Music, Spotify, YouTube/YouTube Music) and clearly state that availability, clean edits, and subscription access vary.
- Do not let children publish public profiles, comments, direct messages, or user-generated playlists in v1.
- Treat every song recommendation and claim as editorial content requiring a review trail.

## 2. Decisions to make before implementation

1. **Audience and age floor:** Choose the first target (recommended: caregiver + child aged 8–13; “Younger Listener” is caregiver-led). The PDF includes toddler-oriented options but also mature subjects, so “for children” cannot be a blanket promise.
2. **Author identity:** The cover credits `C. Roberts`; Bud says the pen name is Pearl N. Schett. Confirm the in-app byline, copyright holder, privacy-policy entity, and App Store seller name before release.
3. **Editorial safety:** Establish a written age/content policy for language, explicit themes, violence, substances, and artist conduct. A “clean” label must mean something specific and be verified per provider/version.
4. **Music-provider scope:** Start with outbound deep links and no provider login. Choose which providers to support at launch and whether users can select a default.
5. **Business model:** Validate value before subscriptions. Recommended first release: paid app or free pilot with an invitation/waitlist; no ads and no behavioral advertising.

## 3. Proposed user experience

### Caregiver onboarding
- Explain the premise: “Pass down the songs, then let them build their own crate.”
- Select child age band and listening-safety preference: `Younger Listener`, `Guided`, or `Full Guide`.
- Select enabled music providers and set an optional caregiver PIN.
- Create a local child nickname/avatar only; no email or exact birth date required.
- Show a transparent content note: the app preserves adult context and flags discussions rather than pretending all music is child-safe.

### Child home: “The Crate”
- Hero: current unit or “pick a record together.”
- Three clear paths: **Start a Unit**, **My Crate**, **Family Replay**.
- Show progress as records listened to and reflections saved, never scores, streak pressure, or leaderboards.

### Artist unit
1. Artist landing card: editorial intro, passed-down track, `why this matters`, time estimate, and mature-topic labels.
2. One lesson at a time: read / play externally / notice / talk.
3. “Save this thought” offers age-appropriate choices: feelings chips, short response, draw/photo later, or voice note stored locally.
4. Mark lesson as explored manually; do not claim a streamed song was played.
5. Final project uses guided templates and is optional.

### My Crate
- Add a guide song, search/add a manual title and artist, or add from a completed lesson.
- For each record: “why I picked it,” feeling tags, best moment (car ride, cleanup, bedtime, party, sad, happy, anytime), note/voice reflection, and date added.
- Caregiver can generate a private visual “crate card” image or PDF for sharing outside the app; no in-app public feed.
- Annual “rebuild your crate” prompt is opt-in and non-notifying by default.

### Caregiver dashboard
- Recent discussions and saved reflections, with clear labels that they are family-private.
- Filter/enable units and tracks based on content tags.
- Reset/export/delete child data locally. Sync, if later enabled, must be optional.

## 4. Content model and editorial workflow

### Canonical, versioned data
Create one source of truth rather than hardcoding prose in components:

```text
src/content/
  catalog.v1.json
  artists/
    chief-keef.v1.json
    rihanna.v1.json
    ...
  schemas.ts
  content-audit.ts
```

Every artist JSON should include:
- Stable IDs, display name, cover/illustration asset, intro, passed-down track, and source/last-reviewed date.
- `ageBands`, `contentFlags`, caregiver notes, and clean-version verification status per track.
- A `youngerListener` collection that is separate from “clean” marketing language.
- 10 lesson records with heading, body blocks, listening selections, observation prompt, adult discussion prompt, and optional activity.
- Final-project template and structured influence/artist references.
- Provider URL fields stored as external links, validated as allowed hostnames.

### Editorial requirements
- Preserve Pearl’s voice; editing must clarify claims without sanding off the cultural point of view.
- Run a factual/editorial verification pass before publication: artist history, dates, influence claims, labels, track spelling, and especially content/safety notes.
- Add `reviewedAt`, `reviewedBy`, `sourceNotes`, and `requiresCaregiverContext` metadata. Never invent a clean version or guarantee a platform’s current edit.
- Create a content-review checklist for material with violence, trauma, legal history, or adult themes. The Chris Brown/Rihanna unit needs explicit age gating and careful caregiver framing; the existing guide already models a valuable “art, accountability, and consequence” discussion.

## 5. Delivery plan

### Phase 0 — Product, rights, and safety foundation
**Objective:** Make the first release legally and ethically coherent before engineering the experience.

**Files:**
- Create: `docs/product-brief.md`
- Create: `docs/editorial-policy.md`
- Create: `docs/content-review-checklist.md`
- Create: `docs/music-link-policy.md`
- Create: `docs/privacy-and-child-safety-decisions.md`

**Steps:**
1. Write a one-page product brief stating audience, parent role, v1 boundaries, provider policy, and success metric.
2. Resolve author/byline/copyright metadata and obtain rights to use all app art and guide text.
3. Turn the PDF’s implied adult discretion into explicit content classifications and caregiver control rules.
4. Decide jurisdiction/privacy posture with qualified legal review before child-directed marketing, account creation, analytics, or cloud sync.
5. Define a one-unit pilot acceptance test: a caregiver and child can discover a track, have a conversation, and save a crate entry in under 10 minutes.

**Verification:** Product brief has signed-off answers for audience, author, rights, providers, safety, privacy, and business model.

### Phase 1 — Structured content and interaction prototype
**Objective:** Prove the curriculum feels alive without building auth, streaming, or backend complexity.

**Files:**
- Create: `app/` Expo Router screens
- Create: `src/content/schemas.ts`
- Create: `src/content/artists/chief-keef.v1.json`
- Create: `src/content/catalog.v1.json`
- Create: `src/domain/crate.ts`
- Create: `src/stores/crate-store.ts`
- Create: `src/components/LessonFlow.tsx`
- Create: `src/components/CrateEntryForm.tsx`
- Create: `tests/content-schema.test.ts`
- Create: `tests/crate-store.test.ts`

**Steps:**
1. Scaffold Expo TypeScript app in the existing repository without modifying `docs/Required_Listening_11-5.pdf`.
2. Write Zod schemas and failing tests for artist, lesson, track, safety flag, provider link, and crate-entry data.
3. Manually transcribe and editorially review **one complete unit** (recommended: Rihanna for broad accessibility or Chief Keef for the hardest safety/context test). Do not bulk-convert PDF text automatically into production content.
4. Build four working screens: welcome/setup, artist landing, one `Listen → Notice → Talk` lesson, and My Crate.
5. Persist crate entries locally in SQLite; implement export/delete before adding cloud accounts.
6. Use Expo Linking to open an allowed external provider URL; render a truthful unavailable/unsupported state.
7. Test on Android and iOS simulators/devices where available; test no-network and no-provider scenarios.

**Verification:** A family can complete one lesson, add a song with a reason/moment, relaunch the app, and see the entry safely persisted.

### Phase 2 — Full guide conversion and caregiver controls
**Objective:** Turn the completed PDF into reviewable, structured, safe in-app curriculum.

**Files:**
- Create: `src/content/artists/{migos,mac-miller,frank-ocean,soulja-boy,bow-wow,chris-brown,fifty-cent,beyonce}.v1.json`
- Create: `src/features/safety/ContentGate.tsx`
- Create: `src/features/caregiver/CaregiverSettingsScreen.tsx`
- Create: `src/features/progress/ProgressRepository.ts`
- Create: `tests/content-audit.test.ts`

**Steps:**
1. Build a content-entry template and convert each unit one at a time; use two-person editorial review where possible.
2. Add age-band filters, mature-topic labels, hidden-by-default content, and a caregiver PIN gate for changing settings.
3. Implement manual “explored” progress, favorites, and reflection options (text + local voice note only after permission copy and deletion controls exist).
4. Implement final-project templates and a private exportable crate card.
5. Add an automated audit that fails on missing track metadata, unapproved link hosts, unreviewed content flags, empty safety notes, and duplicate IDs.

**Verification:** All 10 units render from structured data, safety settings change discoverability as specified, and no restricted content leaks through search/navigation.

### Phase 3 — Pilot, research, and iteration
**Objective:** Find out whether this creates meaningful family listening moments rather than merely moving a PDF to a phone.

**Files:**
- Create: `docs/pilot-script.md`
- Create: `docs/research-consent.md`
- Create: `docs/pilot-findings-template.md`
- Create: `maestro/first-listening-flow.yaml`

**Steps:**
1. Recruit 5–10 trusted caregiver/child pairs that match the chosen age range; obtain appropriate consent and do not collect child identifiers unnecessarily.
2. Observe first use: can adults understand the guardrails; can children choose music and express a reason without coaching; does external linking interrupt the moment too much?
3. Measure only privacy-respecting pilot signals: lesson started/finished locally, crate entry created, caregiver-reported conversation quality, and return intent. No ad SDKs or third-party child profiling.
4. Fix the three highest-friction issues; retest the pilot flow.
5. Decide whether cross-device sync is actually necessary before adding Supabase.

**Verification:** Pilot report identifies top friction, safety concerns, and a clear go/no-go hypothesis for a public launch.

### Phase 4 — Optional account/sync and release hardening
**Objective:** Add only the cloud features that the pilot proves valuable, then meet store and privacy requirements.

**Files:**
- Create: `supabase/migrations/001_family_profiles.sql` (only if sync is approved)
- Create: `src/features/sync/SyncAdapter.ts`
- Create: `docs/app-store-checklist.md`
- Create: `docs/privacy-policy.md`
- Create: `docs/support.md`

**Steps:**
1. Keep caregiver identity separate from child profiles; store the minimum data and use row-level security.
2. Add opt-in encrypted-in-transit sync for the family’s own crate/reflections; make local-only use fully functional.
3. Complete App Store/Google Play privacy disclosures based on actual SDK behavior, not aspirational copy.
4. Add accessibility: Dynamic Type, screen-reader labels, color contrast, focus order, reduced motion, and touch targets.
5. Run store builds, TestFlight/internal testing, privacy review, and manual parent/child acceptance testing.

**Verification:** Release candidate passes automated tests, device smoke tests, accessibility checks, privacy/data-deletion tests, and store metadata review.

## 6. Tests and release gates

- Unit: Zod content schema, safety filtering, provider-link validation, crate reducers, export/delete behavior.
- Component: lesson renders all required blocks; caregiver gate blocks/permits exactly the intended units.
- E2E (Maestro): first-run setup → start lesson → outbound link confirmation → save reflection → crate persists after relaunch → caregiver hides/unhides sensitive unit.
- Manual: iOS and Android; offline mode; no music service installed; Dynamic Type largest setting; VoiceOver/TalkBack; child tries to exit or change gated settings.
- Editorial: every song link, title, explicit/clean designation, historical claim, content warning, and author credit is reviewed before publication.

## 7. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Full-song playback implies music licensing obligations | Open providers externally in v1; use no hosted audio or copied lyrics. Obtain music-law counsel before previews/embedded playback. |
| “Toddler-friendly” reads as a safety guarantee | Rename as a caregiver-guided younger-listener lane; show explicit context flags and avoid absolute claims. |
| Mature topics and real artist behavior need nuance | Age bands, adult notes, opt-in gates, and an editorial review policy; preserve discussion rather than sanitize. |
| The PDF becomes a tedious app reader | Start with one unit and a crate loop; prioritize short cards, choices, voice/reflection, and family discussion. |
| Child privacy exposure | Local-first, nicknames only, no public UGC, no behavioral ads, explicit delete/export, opt-in cloud later. |
| Content goes stale or link rot occurs | Version content, maintain provider-link validation, keep `lastReviewedAt`, and schedule editorial audits. |

## 8. Recommended next move

Build **Phase 1 as a one-unit playable prototype** before spending time on all 77 pages or backend infrastructure. The key question is not “can this PDF be an app?”—it clearly can. The key question is whether a caregiver and child come away with a better shared listening ritual than they would with the PDF and a playlist. The prototype should answer that in one sitting.
