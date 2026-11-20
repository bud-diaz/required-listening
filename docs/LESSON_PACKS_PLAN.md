# Lesson Packs Plan

## Implementation status (2026-11-18)

Phase 1 is implemented. The app now has namespaced content references, a strict pack manifest,
native SQLite and web-snapshot persistence, installed-pack management, an ordered Lesson Plan,
pack-aware progress/reflections/crate provenance, export/Delete All coverage, and pack lessons running
through the existing five-stage lesson flow. A clearly labeled draft demo pack is bundled only in
development builds so the complete flow can be exercised offline without publishing unapproved
editorial content.

Phase 2 infrastructure is implemented. The app now reads a strict first-party catalog from the exact
HTTPS host `paperweighthq.com`, caches successful catalog checks for 24 hours, downloads native
artifacts through an Expo FileSystem cache file (and through capped Fetch streaming on web), verifies
their exact byte count and SHA-256 digest before parsing, enforces app-version and editorial gates,
and replaces an installed version only after every check passes. Browse/detail screens expose refresh,
progress, retry, update, storage, offline fallback, and removal states.

Pack 01 — **The Soul Foundation** is reproducibly bundled from the five units named in
[`docs/req_packs.md`](req_packs.md). Pack 02 — **The New Wave** is reproducibly bundled from
catalog-drafts units 11–15 in their existing catalog order (Drake, Future, The Weeknd, Young Thug,
Wale); its title, theme, summary, educational connections, and central lesson are drafted copy, since
this grouping doesn't come from `docs/req_packs.md` (whose Pack 02 and Pack 06 use a different artist
lineup).

**bud-diaz reviewed and approved all 10 source units across both packs on 2026-11-18** — every
adapted Notice/Talk/Activity prompt was moved to `approved-adaptation`, and each pack's own
`review.status` is `approved` (`reviewedBy: bud-diaz`). **Both packs are now released to production**:
`developmentOnly: false`, and `catalog.v1.json` plus both pack manifests are deployed and live at
`paperweighthq.com` (hosted on the `paperweight-systems-web` Vercel project; see
[PR #17](https://github.com/bud-diaz/paperweight-systems-web/pull/17) and
[#18](https://github.com/bud-diaz/paperweight-systems-web/pull/18)). Byte count and SHA-256 were
verified directly against the production domain, not just a preview deployment. Track clean-version
status was left `unverified` throughout by design — the schema permits `unverified` +
`requiresCaregiverPreview` on every lane including younger, so this is a valid steady state, not
something approval needed to resolve.

**On-device verification against the production endpoint is complete (2026-11-20)**, on the
registered iPhone ("CJ's iPhone 2") running a fresh EAS development build with `expo-crypto` and
`expo-file-system` compiled in: fresh install of both Pack 01 and Pack 02, offline launch of an
installed pack's lessons, a failed download classified as retryable and recovered via Retry, and
removal followed by reinstall reconnecting prior explored/reflection state by stable content
reference. Pack-activated routes (the artists from an installed, planned pack appearing on Home and
in the Artist Directory) were also confirmed live. Update-replacement wasn't exercised since neither
pack has a published v2 yet. This closes the Phase 2 exit criterion.

The app's main unit seed (`src/content/index.ts`) includes only the 10 author-approved core units in
both development and production; the remaining catalog-drafts units stay unseeded source material
(their own per-unit `review.status` stays `draft` permanently — that field is only a build-time
sanity check, not a publication gate), validated by a standalone schema test, until an editor bundles
them into further packs the same way.

`npm run pack:build` now rebuilds every pack (`pack:build:01`, `pack:build:02` run it individually) and
upserts each pack's `src/content/packs/catalog.remote.v1.json` entry by `packId` without disturbing the
others.

All new pack content must begin with
[`docs/content-templates/lesson-pack.v1.template.json`](content-templates/lesson-pack.v1.template.json)
and follow the checklist in [`docs/content-templates/README.md`](content-templates/README.md).

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

**Status: complete.** Both Pack 1 and Pack 2 are editorially approved and live on the production
endpoint (byte/SHA-256 verified against `paperweighthq.com` directly), and both have been installed,
used offline, retried after a failed download, and removed/reinstalled on the registered iPhone via
the real production download path (2026-11-20). Update-replacement is implemented and covered by
`assertSafePackUpdate`/tests but hasn't been exercised on-device yet, since neither pack has shipped a
v2 — the first real pack update will be the first chance to verify that specific path live.

### Phase 3 — commerce or outside publishers (only if needed)

- Decide entitlement/account model, restore purchases, refund behavior, and family sharing.
- Add signed manifests and a publisher review/revocation process.
- Define privacy, analytics, moderation, rights, and support policies before accepting outside content.

## Decisions to make before Phase 2

1. Are initial packs free and first-party only? **Recommended: yes.**
2. Does “Add pack” mean add every lesson or open a selection screen? **Recommended: offer both.**
3. Should a plan be a queue or calendar? **Recommended: queue first.**
4. Can packs include images? **Recommended: text and track metadata first; add compressed images later.**
5. Where will the catalog be hosted? **Selected in code: `paperweighthq.com` only.** Deploy the
   generated catalog to `/required-listening/packs/catalog.v1.json` and each immutable manifest to
   `/required-listening/packs/{packId}/{version}/pack.json`.
