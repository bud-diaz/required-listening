# Required Listening content templates

These files are the canonical starting point for all new curriculum content. Copy the closest JSON
template, rename it with the next versioned filename, and replace every `Replace ...` value. Do not
remove required fields, invent a second format, or add the new file to a production catalog until it
passes validation and editorial review.

## Choose the right template

- `lesson.v1.template.json` — one reusable lesson block. Copy it into a unit or pack; it is not a
  standalone route.
- `unit.v1.template.json` — one core artist route. A core unit always has exactly 10 ordered lessons,
  a passed-down selection, Younger Listener selections, and a Final Project.
- `lesson-pack.v1.template.json` — one optional first-party pack. Packs contain 1–50 ordered lessons
  and do not require an artist-route briefing or Final Project.

## Rules that are not negotiable

1. IDs are stable lowercase kebab-case. Never rename a published `unit`, `pack`, `lesson`, or `track`
   ID. Progress is keyed to those IDs.
2. Lesson numbers are consecutive and match array order. Units use 1–10; packs use 1–N.
3. Every `listen` ID and every unit project/passed-down ID must exist in that collection's `tracks`.
4. `cleanVersionStatus: "unverified"` always pairs with `requiresCaregiverPreview: true`. Every other
   clean-version status pairs with `false`.
5. A track on the `younger` lane cannot be explicit or carry content flags. A track marked
   `youngerListener: true` must be on that lane.
6. `requiresCaregiverContext: true` requires a concrete `caregiverNote`.
7. Use `source: "guide"` only for wording taken from the source guide, `"adapted"` for new wording
   awaiting review, and `"approved-adaptation"` only after the author approves it.
8. Keep both review objects in `draft` while authoring. Approval requires a real reviewer and date;
   approved units/packs cannot contain `adapted` prompts.
9. Packs contain data only: no JavaScript, HTML, hosted audio, arbitrary URLs, or provider deep links.
   Track playback continues through the app's allow-listed provider search.
10. Content flags describe the content; they are not age ratings. When uncertain, use the more
    restrictive lane and write a caregiver note.

## Authoring sequence

1. Copy the template and replace all placeholder text and IDs.
2. Add tracks first, then connect lessons by track ID.
3. Assign lanes, flags, clean-version status, and caregiver notes conservatively.
4. Record prompt provenance and source notes.
5. Keep review status `draft`; run the checks below.
6. Get author/editor approval. Update prompt sources and review metadata only after approval.
7. Register the file in `src/content/index.ts` or `src/content/packs/index.ts` last.

## Full-catalog PDF imports

`scripts/import-unit-catalog.mjs` converts `docs/Unit-catalog.pdf` into one strict draft JSON file per
new route under `src/content/artists/catalog-drafts/`. It skips overlaps with the existing 10 approved
units, then regenerates the static TypeScript import index and appends new entries to the route catalog.
The importer is intentionally conservative:

- every generated lesson and unit review remains `draft`;
- every provider version starts `unverified` unless the source explicitly names an instrumental;
- app-written Notice/Talk language remains `adapted`;
- source units with 9 or 11 numbered lessons are normalized to exactly 10 and called out in
  `sourceNotes`;
- routes with no named younger-listener selection receive a caregiver-selected instrumental search,
  never an invented claim that a vocal track is safe.

Run the importer only when the source PDF changes, then complete the normal editorial and safety
review before changing any generated review object to `approved`.

## Pack 1 bundle

`npm run pack:build` rebuilds **Pack 01 — The Soul Foundation** from the five strict catalog units
named in `docs/req_packs.md`, in this fixed order: Al Green, Teddy Pendergrass, Ronald Isley, Frankie
Beverly & Maze, and Chaka Khan. The generator writes the 50-lesson manifest and its deployable
catalog record under `src/content/packs/`, stabilizes the manifest's byte count, and calculates the
catalog SHA-256 digest from the exact serialized artifact.

The generator deliberately stops if a source unit is no longer `draft`. A review-status change means
the pack itself must be reviewed and versioned explicitly; rebuilding must never silently turn five
independently edited units into a production release. After any source edit, run `npm run pack:build`,
review the generated diff, and run the required checks below.

## Required checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run pack:build
```

The tests parse all three templates against the live schemas. If a schema changes, update the
templates and this guide in the same commit.
