# Lesson Packs Plan

## Implementation status (2026-11-18)

Phase 1 is implemented. The app now has namespaced content references, a strict pack manifest,
native SQLite and web-snapshot persistence, installed-pack management, an ordered Lesson Plan,
pack-aware progress/reflections/crate provenance, export/Delete All coverage, and pack lessons running
through the existing five-stage lesson flow. A clearly labeled draft demo pack is bundled only in
development builds so the complete flow can be exercised offline without publishing unapproved
editorial content.

Phase 2 remains intentionally unimplemented until Paperweight has an approved pack and catalog host.
The bundled catalog already sits behind a `LessonPackCatalog` interface; the next adapter can add the
allow-listed HTTPS catalog, temporary downloads, SHA-256 verification, compatibility checks, retry
states, and atomic updates described below without changing the screen or repository contracts.

## Recommendation

Start with **curated, first-party, text-only packs** published by Paperweight. A pack is an immutable,
versioned content bundle that can be downloaded for offline use. Installing a pack and adding lessons
to the family's Lesson Plan are separate actions:

1. **Browse** available packs.
2. **Download** a pack to the device.
3. **Add all or selected lessons** to an ordered Lesson Plan.
4. **Reorder, start, or remove** plan items without deleting the downloaded pack or its progress.

This keeps the first release local-first, avoids accounts and DRM, preserves the existing provider-search
policy, and leaves room for paid or third-party packs later without designing a marketplace now.

## Product model

### Pack

A pack is a published collection of lessons and track metadata. It is not executable code and never
contains hosted music. Each release is immutable; an update creates a new version.

Minimum manifest fields:

- `schemaVersion`, `packId`, `version`, `title`, `summary`, `publisher`
- `publishedAt`, `minAppVersion`, `downloadBytes`
- `review` and caregiver-facing `contentFlags`
- `lessons`, `tracks`, and optional lightweight image assets
- a SHA-256 digest supplied by the catalog

Pack and lesson IDs must be stable. Every content reference is namespaced as
`{ collectionId, lessonId }`, where the built-in guide uses `collectionId: "core-v1"` and a pack uses
its `packId`. Progress must not use a bare `lessonId`, because two publishers could choose the same ID.

Do not reuse the current `Unit` schema unchanged: it requires exactly ten lessons and a final project.
Extract the shared `Track`, `BodyBlock`, `Prompt`, lane, review, and safety fields into a reusable lesson
collection contract, then keep the ten-lesson artist unit as one collection type.

### Installed pack

An installed pack records the verified manifest JSON plus install state:

- `pack_id`, `version`, `installed_at`, `updated_at`
- `status`: `downloading | installed | failed`
- `manifest_json`, `sha256`, `download_bytes`
- `last_error` for a retryable failure

Keep the prior installed version active until a replacement has fully downloaded, hashed, parsed, and
committed. A failed update must never break an already installed pack.

### Lesson Plan

The Lesson Plan is an ordered list independent of pack installation:

- `id`
- `collection_id` + `lesson_id`
- `position`
- `added_at`
- optional `scheduled_for` later; omit it from v1

The first version should be a simple queue, not a calendar. Families can add a whole pack or choose
individual lessons, drag/reorder, start the next unfinished lesson, and remove items. Removing an item
does not erase reflections or explored state.

## User experience

Add a **Lesson Packs** entry from Home or Settings and a **Lesson Plan** section on Home.

Pack detail should show title, publisher, lesson count, approximate size, listening-lane coverage,
content notes, and review status before Download. After installation, offer **Add all to Lesson Plan**
and per-lesson add/remove controls. Download management should show installed version, storage size,
update availability, and Remove Download.

If a pack is removed while its lessons remain in the plan, explain that those plan items will also be
removed while saved family responses remain archived. Reinstalling the same `packId` should reconnect
that progress by stable content reference.

## Download and trust pipeline

Use an HTTPS catalog such as:

- `GET /required-listening/packs/catalog.v1.json`
- `GET /required-listening/packs/{packId}/{version}/pack.json`

For SDK 58, `expo-file-system` supports network downloads and device files, and `expo-crypto` supports
SHA-256 hashing. Add them only when implementation begins, using `npx expo install` so Expo selects SDK
58-compatible versions.

Install in this order:

1. Fetch the first-party catalog from one exactly allowed host.
2. Reject incompatible schema/app versions and unreasonable declared sizes.
3. Download into a temporary cache location with a practical size limit.
4. Verify the SHA-256 digest before parsing.
5. Parse with a strict Zod schema; reject unknown/invalid IDs, duplicate IDs, invalid track references,
   unapproved production content, and unsafe provider URLs.
6. Commit the manifest and installed version in one SQLite transaction.
7. Delete the temporary file; expose the pack only after the transaction succeeds.

HTTPS plus a catalog digest is sufficient for a first-party beta. Before accepting third-party catalogs
or sideloaded files, add public-key signature verification with a key pinned in the app. Never evaluate
pack JavaScript, HTML, Markdown with embedded HTML, or arbitrary deep links.

## Storage and progress migration

Add these tables to both native SQLite and the web snapshot repository:

- `installed_packs`
- `lesson_plan_items`
- optionally `pack_assets` when packs first include images

Before pack lessons can use the existing lesson flow, introduce a `ContentRef` and migrate persisted
records that currently depend on bare unit/lesson IDs:

- `explored`
- `reflections`
- crate entries sourced from guide tracks
- any future saved pack project responses

Treat existing rows as `collectionId: "core-v1"`. Include installed packs and Lesson Plan items in Export
and Delete All. The export should contain manifest identity/version and family-created state, but it does
not need to duplicate the entire downloaded pack payload.

## Updates and deletion rules

- Check the small catalog on explicit refresh and no more than once per day automatically.
- Never auto-download a pack or silently add lessons to the plan.
- Keep progress keyed to stable `packId + lessonId`, not the pack version.
- Require an explicit migration map when an update renames or removes lesson IDs.
- Show release notes and content-note changes before updating.
- Removing a download is reversible by redownloading; deleting family progress remains a separate,
  confirmed action.

## Delivery phases

### Phase 1 — local vertical slice

- Extract reusable collection/content-reference schemas.
- Add repository methods and tables for installed packs and Lesson Plan items.
- Bundle one fixture pack locally and exercise install, add, reorder, remove, export, and Delete All.
- Reuse the current lesson flow and caregiver-preview rules.

Exit: the entire flow works offline with one fixture pack and survives app restarts.

**Status: complete.** The fixture is development-only and remains visibly marked draft.

### Phase 2 — first-party downloads

- Add the catalog client, `expo-file-system`, SHA-256 verification, retries, and atomic installation.
- Add Browse, pack detail, download progress/error states, update, and storage management.
- Test interrupted downloads, corrupt JSON, bad hashes, incompatible versions, duplicate IDs, offline
  launch, low storage, and app upgrade from pre-pack data.

Exit: a production-approved Paperweight pack can be installed, used fully offline, updated safely, and
removed without corrupting family data.

### Phase 3 — commerce or outside publishers (only if needed)

- Decide entitlement/account model, restore purchases, refund behavior, and family sharing.
- Add signed manifests and a publisher review/revocation process.
- Define privacy, analytics, moderation, rights, and support policies before accepting outside content.

## Decisions to make before Phase 2

1. Are initial packs free and first-party only? **Recommended: yes.**
2. Does “Add pack” mean add every lesson or open a selection screen? **Recommended: offer both.**
3. Should a plan be a queue or calendar? **Recommended: queue first.**
4. Can packs include images? **Recommended: text and track metadata first; add compressed images later.**
5. Where will the catalog be hosted? **Recommended: the existing Paperweight domain/CDN on one
   exactly allow-listed HTTPS host.**
