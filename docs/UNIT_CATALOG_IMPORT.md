# Full unit catalog import

## Result

The 909-page `Unit-catalog.pdf` contains 68 artist routes. The strict import skips the eight routes
that overlap the existing approved curriculum and adds only the 60 genuinely new routes. The original
10 units keep their IDs, numbers, order, content, approvals, and production progression unchanged;
new catalog routes are appended as units 11–70.

| Content | Count | Publication state |
| --- | ---: | --- |
| Existing routes | 10 | approved and unchanged |
| PDF routes | 68 | 8 existing overlaps skipped, 60 new drafts |
| Total catalog routes | 70 | 10 approved, 60 draft |
| Total strict lessons | 700 | 100 approved, 600 draft |
| Generated draft track records | 808 | unverified unless explicitly instrumental |

## Source normalization

- Ja Rule and Pretty Ricky contain nine numbered lessons. The importer adds a tenth adapted
  influence/legacy checkpoint so the routes satisfy the unit contract.
- Kanye West and Stevie Wonder contain eleven numbered lessons. Lesson 11 is preserved inside lesson
  10 so no source material is dropped.
- The Diddy unit uses `2A` and `4A`–`4J`. `2A` becomes lesson 2; the artist-by-artist `4B`–`4J`
  subsections remain inside lesson 4.
- Six routes do not expose a named younger-listener selection in extractable text: Ludacris, Lil
  Wayne, Teddy Pendergrass, New Edition, Tupac Shakur, and Michael Jackson. Those routes use a clearly
  labeled caregiver-selected instrumental search until an editor supplies a specific selection.

## Safety and editorial state

Generated content is deliberately not publishable. Every new unit and lesson review is `draft`, all
provider-dependent versions are `unverified`, and each unverified track requires caregiver preview.
The importer derives conservative flags from the source text and keeps app-written prompts marked
`adapted`.

Before approval, an editor must check every track title and credited artist (especially comparison
tracks named inside influence lessons), confirm lesson lanes and content flags, review factual claims,
replace the six instrumental fallbacks, and approve or rewrite every adapted prompt. Approval should
be recorded only after those checks; the schema will reject approved lesson sets that still contain
`adapted` prompts.

## Rebuild

```bash
node scripts/import-unit-catalog.mjs docs/Unit-catalog.pdf
npm run content:audit
npx tsc --noEmit
npm run lint
```
