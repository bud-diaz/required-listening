import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serialize, upsertCatalogEntry } from './lib/pack-catalog.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(root, 'src/content/packs');
const outputPath = path.join(outputDirectory, 'pack-01-soul-foundation.v1.json');
const catalogPath = path.join(outputDirectory, 'catalog.remote.v1.json');

const sources = [
  ['al-green', 'src/content/artists/catalog-drafts/52-al-green.v1.json'],
  ['teddy-pendergrass', 'src/content/artists/catalog-drafts/51-teddy-pendergrass.v1.json'],
  ['ronald-isley', 'src/content/artists/catalog-drafts/45-ronald-isley.v1.json'],
  ['frankie-beverly-maze', 'src/content/artists/catalog-drafts/44-frankie-beverly-maze.v1.json'],
  ['chaka-khan', 'src/content/artists/catalog-drafts/60-chaka-khan.v1.json'],
];

const units = await Promise.all(sources.map(async ([expectedId, relativePath]) => {
  const unit = JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
  if (unit.id !== expectedId) throw new Error(`Expected ${expectedId}, received ${unit.id}`);
  if (unit.lessons.length !== 10) throw new Error(`${unit.displayName} must contribute exactly 10 lessons.`);
  if (unit.review.status !== 'draft') {
    throw new Error(`${unit.displayName} changed review status. Re-review Pack 1 before rebuilding.`);
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
  packId: 'pack-01-soul-foundation',
  version: 1,
  title: 'The Soul Foundation',
  theme: 'The Roots of Modern R&B',
  summary: 'These artists helped establish the emotional and musical foundation that modern R&B and hip-hop continue to build upon. Their music emphasizes rich instrumentation, expressive vocals, romance, storytelling, and the connection between gospel, funk, and soul.',
  educationalConnections: [
    'Understanding soul music’s relationship with R&B.',
    'Recognizing the importance of live instrumentation.',
    'Exploring how older recordings become hip-hop samples.',
    'Identifying emotional qualities of vocal performances.',
  ],
  centralLesson: 'Before hip-hop sampled soul, soul gave hip-hop something to say.',
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
  developmentOnly: false,
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
