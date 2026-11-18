import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import packJson from '../src/content/packs/pack-01-soul-foundation.v1.json';
import catalogJson from '../src/content/packs/catalog.remote.v1.json';
import {
  LessonPackCatalogDocument,
  LessonPackDownloadError,
  isAllowedFirstPartyPackUrl,
  normalizePackDownloadError,
  validateDownloadedPack,
} from '../src/domain/lesson-pack-catalog';
import { assertSafePackUpdate, InstalledPack, LessonPack } from '../src/domain/lesson-packs';

const pack = LessonPack.parse(packJson);
const catalog = LessonPackCatalogDocument.parse(catalogJson);
const entry = catalog.packs[0];
const artifact = readFileSync(new URL('../src/content/packs/pack-01-soul-foundation.v1.json', import.meta.url));
const digest = createHash('sha256').update(artifact).digest('hex');

function expectDownloadError(run: () => unknown, code: LessonPackDownloadError['code']) {
  try {
    run();
    throw new Error('Expected validation to fail.');
  } catch (error) {
    expect(error).toBeInstanceOf(LessonPackDownloadError);
    expect((error as LessonPackDownloadError).code).toBe(code);
  }
}

describe('Pack 1 bundle', () => {
  it('matches req_packs.md exactly and preserves source-unit order', () => {
    expect(pack.title).toBe('The Soul Foundation');
    expect(pack.theme).toBe('The Roots of Modern R&B');
    expect(pack.centralLesson).toBe('Before hip-hop sampled soul, soul gave hip-hop something to say.');
    expect(pack.sections.map((section) => section.unitId)).toEqual([
      'al-green',
      'teddy-pendergrass',
      'ronald-isley',
      'frankie-beverly-maze',
      'chaka-khan',
    ]);
    expect(pack.sections.map((section) => section.title)).toEqual([
      'Al Green',
      'Teddy Pendergrass',
      'Ronald Isley',
      'Frankie Beverly & Maze',
      'Chaka Khan',
    ]);
    expect(pack.lessons).toHaveLength(50);
    expect(pack.lessons.map((lesson) => lesson.number)).toEqual(Array.from({ length: 50 }, (_, index) => index + 1));
    expect(pack.sections.flatMap((section) => section.lessonIds)).toEqual(pack.lessons.map((lesson) => lesson.id));
  });

  it('keeps draft source material development-only', () => {
    expect(pack.review.status).toBe('draft');
    expect(pack.developmentOnly).toBe(true);
  });

  it('emits a byte-accurate, SHA-256-addressed catalog artifact', () => {
    expect(artifact.byteLength).toBe(pack.downloadBytes);
    expect(entry.downloadBytes).toBe(artifact.byteLength);
    expect(entry.sha256).toBe(digest);
    expect(entry.lessonCount).toBe(50);
  });
});

describe('verified first-party downloads', () => {
  const valid = () => validateDownloadedPack({
    entry,
    payload: packJson,
    byteLength: artifact.byteLength,
    sha256: digest,
    appVersion: '0.1.0',
    isDev: true,
  });

  it('accepts the exact catalog artifact in development', () => {
    expect(valid().packId).toBe(pack.packId);
  });

  it('allows only the exact HTTPS Paperweight host', () => {
    expect(isAllowedFirstPartyPackUrl(entry.manifestUrl)).toBe(true);
    expect(isAllowedFirstPartyPackUrl(entry.manifestUrl.replace('https:', 'http:'))).toBe(false);
    expect(isAllowedFirstPartyPackUrl('https://www.paperweighthq.com/required-listening/packs/pack.json')).toBe(false);
    expect(isAllowedFirstPartyPackUrl('https://paperweighthq.com.evil.example/pack.json')).toBe(false);
  });

  it('rejects truncated or oversized payloads', () => {
    expectDownloadError(() => validateDownloadedPack({
      entry,
      payload: packJson,
      byteLength: artifact.byteLength - 1,
      sha256: digest,
      appVersion: '0.1.0',
      isDev: true,
    }), 'size');
  });

  it('rejects a bad digest before parsing', () => {
    expectDownloadError(() => validateDownloadedPack({
      entry,
      payload: packJson,
      byteLength: artifact.byteLength,
      sha256: '0'.repeat(64),
      appVersion: '0.1.0',
      isDev: true,
    }), 'hash');
  });

  it('rejects incompatible app versions, corrupt manifests, and duplicate IDs', () => {
    expectDownloadError(() => validateDownloadedPack({
      entry: { ...entry, minAppVersion: '2.0.0' },
      payload: packJson,
      byteLength: artifact.byteLength,
      sha256: digest,
      appVersion: '0.1.0',
      isDev: true,
    }), 'incompatible');

    expectDownloadError(() => validateDownloadedPack({
      entry,
      payload: { broken: true },
      byteLength: artifact.byteLength,
      sha256: digest,
      appVersion: '0.1.0',
      isDev: true,
    }), 'invalid');

    const duplicate = structuredClone(packJson);
    duplicate.lessons[1].id = duplicate.lessons[0].id;
    expectDownloadError(() => validateDownloadedPack({
      entry,
      payload: duplicate,
      byteLength: artifact.byteLength,
      sha256: digest,
      appVersion: '0.1.0',
      isDev: true,
    }), 'invalid');
  });

  it('never exposes the draft pack in production', () => {
    expectDownloadError(() => validateDownloadedPack({
      entry,
      payload: packJson,
      byteLength: artifact.byteLength,
      sha256: digest,
      appVersion: '0.1.0',
      isDev: false,
    }), 'unapproved');
  });

  it('rejects duplicate catalog versions', () => {
    expect(LessonPackCatalogDocument.safeParse({ ...catalogJson, packs: [entry, entry] }).success).toBe(false);
  });

  it('classifies interrupted downloads as retryable network failures and low storage separately', () => {
    expect(normalizePackDownloadError(new Error('connection reset')).code).toBe('network');
    expect(normalizePackDownloadError(new Error('ENOSPC: no space left on device')).code).toBe('storage');
  });

  it('migrates Phase 1 installed records with download metadata defaults', () => {
    const legacy = InstalledPack.parse({
      packId: pack.packId,
      version: pack.version,
      installedAt: '2026-11-18T00:00:00.000Z',
      updatedAt: '2026-11-18T00:00:00.000Z',
      manifest: pack,
    });
    expect(legacy.sha256).toBeNull();
    expect(legacy.downloadBytes).toBe(0);
  });

  it('prevents downgrades and lesson-ID removal without an explicit migration', () => {
    expect(() => assertSafePackUpdate(pack, { ...pack, version: 0 })).toThrow('downgraded');
    expect(() => assertSafePackUpdate(pack, {
      ...pack,
      version: 2,
      lessons: pack.lessons.slice(1),
      sections: pack.sections.map((section, index) => index === 0
        ? { ...section, lessonIds: section.lessonIds.slice(1) }
        : section),
    })).toThrow('without a migration');
  });
});
