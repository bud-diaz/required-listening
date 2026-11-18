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

## Required checks

```bash
npm test
npx tsc --noEmit
npm run lint
```

The tests parse all three templates against the live schemas. If a schema changes, update the
templates and this guide in the same commit.
