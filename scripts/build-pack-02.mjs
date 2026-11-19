import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serialize, upsertCatalogEntry } from './lib/pack-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'src/content/packs');
const outputPath = path.join(outputDirectory, 'pack-02-the-new-wave.v1.json');
const catalogPath = path.join(outputDirectory, 'catalog.remote.v1.json');

const sources = [
  ['drake', 'src/content/artists/catalog-drafts/11-drake.v1.json'],
  ['future', 'src/content/artists/catalog-drafts/12-future.v1.json'],
  ['the-weeknd', 'src/content/artists/catalog-drafts/13-the-weeknd.v1.json'],
  ['young-thug', 'src/content/artists/catalog-drafts/14-young-thug.v1.json'],
  ['wale', 'src/content/artists/catalog-drafts/15-wale.v1.json'],
];

const units = await Promise.all(sources.map(async ([expectedId, relativePath]) => {
  const unit = JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  if (unit.id !== expectedId) throw new Error(`Expected ${expectedId}, received ${unit.id}`);
  if (unit.lessons.length !== 10) throw new Error(`${unit.displayName} must contribute exactly 10 lessons.`);
  if (unit.review.status !== 'draft') {
    throw new Error(`${unit.displayName} changed review status. Re-review Pack 2 before rebuilding.`);
  }
  return unit;
}));

const lessons = units.flatMap((unit) => unit.lessons).map((lesson, index) => ({
  ...lesson,
  number: index + 1,
}));
const tracks = units.flatMap((unit) => unit.tracks);
const contentFlags = [...new Set(units.flatMap((unit) => unit.contentFlags))];

const pack = {
  schemaVersion: 1,
  packId: 'pack-02-the-new-wave',
  version: 1,
  title: 'The New Wave',
  theme: 'Melody Takes Over Hip-Hop',
  summary: 'These artists blurred the line between rapping and singing, bringing Auto-Tune, atmospheric production, and emotional vulnerability into the center of mainstream hip-hop and R&B.',
  educationalConnections: [
    'Understanding how melody and rap blend into one style.',
    'Exploring Auto-Tune and vocal effects as creative tools.',
    'Recognizing atmospheric and moody production choices.',
    'Comparing different artists’ approaches to emotional storytelling.',
  ],
  centralLesson: 'Hip-hop didn’t stop evolving. It just learned to sing.',
  publisher: 'Paperweight',
  publishedAt: '2026-11-18T00:00:00.000Z',
  minAppVersion: '0.1.0',
  downloadBytes: 0,
  contentFlags,
  estimatedMinutesPerLesson: 10,
  tracks,
  lessons,
  sections: units.map((unit) => ({
    unitId: unit.id,
    number: unit.number,
    monogram: unit.monogram,
    title: unit.displayName,
    summary: unit.whyItMatters,
    lessonIds: unit.lessons.map((lesson) => lesson.id),
  })),
  review: { status: 'approved', reviewedAt: '2026-11-18T00:00:00.000Z', reviewedBy: 'bud-diaz' },
  developmentOnly: true,
};

for (let attempts = 0; attempts < 10; attempts += 1) {
  const bytes = Buffer.byteLength(serialize(pack));
  if (pack.downloadBytes === bytes) break;
  pack.downloadBytes = bytes;
}
const payload = serialize(pack);
if (pack.downloadBytes !== Buffer.byteLength(payload)) {
  throw new Error('Pack byte count did not stabilize.');
}
const sha256 = createHash('sha256').update(payload).digest('hex');

const entry = {
  packId: pack.packId,
  version: pack.version,
  title: pack.title,
  theme: pack.theme,
  summary: pack.summary,
  publisher: pack.publisher,
  publishedAt: pack.publishedAt,
  minAppVersion: pack.minAppVersion,
  downloadBytes: pack.downloadBytes,
  lessonCount: pack.lessons.length,
  contentFlags: pack.contentFlags,
  review: pack.review,
  developmentOnly: pack.developmentOnly,
  sha256,
  manifestUrl: `https://paperweighthq.com/required-listening/packs/${pack.packId}/${pack.version}/pack.json`,
};

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, payload);
await upsertCatalogEntry(catalogPath, entry, '2026-11-18T00:00:00.000Z');

console.log(`Built ${pack.packId} v${pack.version}: ${pack.lessons.length} lessons, ${pack.downloadBytes} bytes, ${sha256}`);
