#!/usr/bin/env node
/**
 * Draft aid only (docs/APP_PLAN.md §4): splits the guide PDF into one rough text
 * file per unit under `drafts/` (git-ignored) to speed up hand conversion into
 * `src/content/artists/*.v1.json`. Never publish its output directly.
 *
 * Requires `pdftotext` (poppler-utils).
 * Usage: npm run extract:draft
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PDF = 'docs/Required_Listening_11-5.pdf';
const OUT = 'drafts';

const text = execFileSync('pdftotext', ['-layout', PDF, '-'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

const lines = text
  .split('\n')
  .map((l) => l.replace(/\s+$/, ''))
  .filter((l) => l.trim() !== '');

// Unit headings in the body look like "  UNIT 3" on their own line.
const starts = [];
lines.forEach((l, i) => {
  const m = l.trim().match(/^UNIT (\d+)$/);
  if (m) starts.push({ n: Number(m[1]), i });
});
const crateStart = lines.findIndex((l) => l.trim() === 'BUILD YOUR OWN CRATE');

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, '00-front-matter.txt'), lines.slice(0, starts[0]?.i ?? 0).join('\n') + '\n');

starts.forEach((s, k) => {
  const end = starts[k + 1]?.i ?? (crateStart > 0 ? crateStart : lines.length);
  const body = lines.slice(s.i, end);
  const name = (body[1] ?? `unit-${s.n}`).trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const lessons = body.filter((l) => /^LESSON \d+$/.test(l.trim())).length;
  const file = `${String(s.n).padStart(2, '0')}-${name}.txt`;
  writeFileSync(join(OUT, file), body.join('\n') + '\n');
  console.log(`${file}: ${body.length} lines, ${lessons} lessons`);
});

if (crateStart > 0) writeFileSync(join(OUT, '11-build-your-crate.txt'), lines.slice(crateStart).join('\n') + '\n');

console.log(`\nDrafts written to ${OUT}/. Repair bullet lists by hand; lone "–" markers in the PDF lose their text alignment.`);
