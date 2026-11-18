import { Platform } from 'react-native';
import {
  FIRST_PARTY_CATALOG_URL,
  MAX_CATALOG_DOWNLOAD_BYTES,
  LessonPackCatalogDocument,
  LessonPackDownloadError,
  isAllowedFirstPartyPackUrl,
  type LessonPackCatalogEntry,
} from '../domain/lesson-pack-catalog';

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
const CACHE_KEY = 'required-listening.pack-catalog.v1';
let cachedEntries: LessonPackCatalogEntry[] = [];
let lastSuccessfulRefresh = 0;
let hydration: Promise<void> | undefined;

type CatalogCache = {
  fetchedAt: number;
  catalog: unknown;
};

async function readCatalogCache(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(CACHE_KEY);
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, `${CACHE_KEY}.json`);
    return file.exists ? await file.text() : null;
  } catch {
    return null;
  }
}

async function writeCatalogCache(value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(CACHE_KEY, value);
      return;
    }
    const { File, Paths } = await import('expo-file-system');
    const file = new File(Paths.cache, `${CACHE_KEY}.json`);
    if (!file.exists) file.create();
    await file.write(value);
  } catch {
    // Cache writes are best-effort; the verified catalog remains in memory.
  }
}

async function hydrateCatalogCache(): Promise<void> {
  if (hydration) return hydration;
  hydration = (async () => {
    const raw = await readCatalogCache();
    if (!raw) return;
    try {
      const cached = JSON.parse(raw) as CatalogCache;
      const parsed = LessonPackCatalogDocument.safeParse(cached.catalog);
      if (!Number.isFinite(cached.fetchedAt) || !parsed.success) return;
      cachedEntries = parsed.data.packs;
      lastSuccessfulRefresh = cached.fetchedAt;
    } catch {
      // Ignore malformed cache data and fetch a fresh signed-by-digest catalog.
    }
  })();
  return hydration;
}

export function cachedRemoteLessonPacks(isDev: boolean): LessonPackCatalogEntry[] {
  return cachedEntries.filter((entry) => isDev || (!entry.developmentOnly && entry.review.status === 'approved'));
}

export function getCachedRemoteLessonPack(packId: string, isDev: boolean): LessonPackCatalogEntry | undefined {
  return cachedRemoteLessonPacks(isDev)
    .filter((entry) => entry.packId === packId)
    .sort((a, b) => b.version - a.version)[0];
}

export async function refreshRemoteLessonPackCatalog(input: {
  isDev: boolean;
  force?: boolean;
  now?: number;
}): Promise<LessonPackCatalogEntry[]> {
  await hydrateCatalogCache();
  const now = input.now ?? Date.now();
  if (!input.force && lastSuccessfulRefresh > 0 && now - lastSuccessfulRefresh < REFRESH_INTERVAL_MS) {
    return cachedRemoteLessonPacks(input.isDev);
  }
  if (!isAllowedFirstPartyPackUrl(FIRST_PARTY_CATALOG_URL)) {
    throw new LessonPackDownloadError('invalid', 'The configured lesson-pack catalog URL is not allowed.');
  }

  let response: Response;
  try {
    response = await fetch(FIRST_PARTY_CATALOG_URL, { headers: { Accept: 'application/json' } });
  } catch (error) {
    throw new LessonPackDownloadError('network', 'The lesson-pack catalog is unavailable offline.', { cause: error });
  }
  if (!response.ok) {
    throw new LessonPackDownloadError('network', `The lesson-pack catalog is unavailable (${response.status}).`);
  }
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_CATALOG_DOWNLOAD_BYTES) {
    throw new LessonPackDownloadError('size', 'The lesson-pack catalog exceeded its size limit.');
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_CATALOG_DOWNLOAD_BYTES) {
    throw new LessonPackDownloadError('size', 'The lesson-pack catalog exceeded its size limit.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new LessonPackDownloadError('invalid', 'The lesson-pack catalog is not valid JSON.', { cause: error });
  }
  const parsed = LessonPackCatalogDocument.safeParse(payload);
  if (!parsed.success) {
    throw new LessonPackDownloadError('invalid', 'The lesson-pack catalog does not match the required schema.', {
      cause: parsed.error,
    });
  }
  cachedEntries = parsed.data.packs;
  lastSuccessfulRefresh = now;
  await writeCatalogCache(JSON.stringify({ fetchedAt: now, catalog: parsed.data } satisfies CatalogCache));
  return cachedRemoteLessonPacks(input.isDev);
}
