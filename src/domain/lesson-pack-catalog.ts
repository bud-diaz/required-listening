import { z } from 'zod';
import { ContentFlag, Review } from '../content/schemas';
import { LessonPack, type LessonPack as LessonPackType } from './lesson-packs';

export const FIRST_PARTY_PACK_HOST = 'paperweighthq.com';
export const FIRST_PARTY_CATALOG_URL = `https://${FIRST_PARTY_PACK_HOST}/required-listening/packs/catalog.v1.json`;
export const MAX_PACK_DOWNLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_CATALOG_DOWNLOAD_BYTES = 256 * 1024;

const kebabId = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const semver = z.string().regex(/^\d+\.\d+\.\d+$/);
const sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export function isAllowedFirstPartyPackUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.hostname === FIRST_PARTY_PACK_HOST && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export const LessonPackCatalogEntry = z.object({
  packId: kebabId,
  version: z.number().int().positive(),
  title: z.string().min(1),
  theme: z.string().min(1),
  summary: z.string().min(1),
  publisher: z.string().min(1),
  publishedAt: z.string(),
  minAppVersion: semver,
  downloadBytes: z.number().int().positive().max(MAX_PACK_DOWNLOAD_BYTES),
  lessonCount: z.number().int().min(1).max(50),
  contentFlags: z.array(ContentFlag),
  review: Review,
  developmentOnly: z.boolean().default(false),
  sha256,
  manifestUrl: z.string().url(),
}).strict().superRefine((entry, ctx) => {
  if (!isAllowedFirstPartyPackUrl(entry.manifestUrl)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['manifestUrl'],
      message: `Pack downloads must use HTTPS on ${FIRST_PARTY_PACK_HOST}.`,
    });
  }
});
export type LessonPackCatalogEntry = z.infer<typeof LessonPackCatalogEntry>;

export const LessonPackCatalogDocument = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  packs: z.array(LessonPackCatalogEntry),
}).strict().superRefine((catalog, ctx) => {
  const identities = new Set<string>();
  for (const [index, entry] of catalog.packs.entries()) {
    const identity = `${entry.packId}@${entry.version}`;
    if (identities.has(identity)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['packs', index],
        message: `Duplicate catalog entry: ${identity}`,
      });
    }
    identities.add(identity);
  }
});
export type LessonPackCatalogDocument = z.infer<typeof LessonPackCatalogDocument>;

export type LessonPackDownloadErrorCode =
  | 'network'
  | 'size'
  | 'hash'
  | 'invalid'
  | 'incompatible'
  | 'storage'
  | 'unapproved';

export class LessonPackDownloadError extends Error {
  constructor(readonly code: LessonPackDownloadErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LessonPackDownloadError';
  }
}

export function normalizePackDownloadError(error: unknown): LessonPackDownloadError {
  if (error instanceof LessonPackDownloadError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/enospc|no space|disk full|storage|quota/i.test(message)) {
    return new LessonPackDownloadError('storage', 'There is not enough device storage for this pack.', { cause: error });
  }
  return new LessonPackDownloadError('network', 'The pack could not be downloaded. Check the connection and retry.', {
    cause: error,
  });
}

export function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number);
  const right = b.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function validateDownloadedPack(input: {
  entry: LessonPackCatalogEntry;
  payload: unknown;
  byteLength: number;
  sha256: string;
  appVersion: string;
  isDev: boolean;
}): LessonPackType {
  const { entry, byteLength, sha256: actualSha256, appVersion, isDev } = input;
  if (byteLength !== entry.downloadBytes) {
    throw new LessonPackDownloadError('size', `Expected ${entry.downloadBytes} bytes but received ${byteLength}.`);
  }
  if (actualSha256.toLowerCase() !== entry.sha256) {
    throw new LessonPackDownloadError('hash', 'The downloaded pack did not match its catalog digest.');
  }
  if (compareVersions(appVersion, entry.minAppVersion) < 0) {
    throw new LessonPackDownloadError(
      'incompatible',
      `This pack requires app version ${entry.minAppVersion} or newer.`
    );
  }

  const parsed = LessonPack.safeParse(input.payload);
  if (!parsed.success) {
    throw new LessonPackDownloadError('invalid', 'The downloaded pack does not match the required content schema.', {
      cause: parsed.error,
    });
  }
  const pack = parsed.data;
  const identityMatches =
    pack.packId === entry.packId &&
    pack.version === entry.version &&
    pack.title === entry.title &&
    pack.theme === entry.theme &&
    pack.publisher === entry.publisher &&
    pack.downloadBytes === entry.downloadBytes &&
    pack.lessons.length === entry.lessonCount;
  if (!identityMatches) {
    throw new LessonPackDownloadError('invalid', 'The pack manifest does not match its catalog entry.');
  }
  if (!isDev && (entry.developmentOnly || pack.developmentOnly || pack.review.status !== 'approved')) {
    throw new LessonPackDownloadError('unapproved', 'This pack has not been approved for production.');
  }
  return pack;
}
