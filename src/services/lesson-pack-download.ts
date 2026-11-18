import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import {
  MAX_PACK_DOWNLOAD_BYTES,
  LessonPackDownloadError,
  isAllowedFirstPartyPackUrl,
  normalizePackDownloadError,
  validateDownloadedPack,
  type LessonPackCatalogEntry,
} from '../domain/lesson-pack-catalog';
import type { LessonPack } from '../domain/lesson-packs';

export type PackDownloadProgress = {
  receivedBytes: number;
  totalBytes: number;
};

function digestToHex(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digestInput = new Uint8Array(bytes.byteLength);
  digestInput.set(bytes);
  return digestToHex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, digestInput.buffer));
}

async function fetchBytes(
  entry: LessonPackCatalogEntry,
  onProgress?: (progress: PackDownloadProgress) => void
): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetch(entry.manifestUrl, { headers: { Accept: 'application/json' } });
  } catch (error) {
    throw normalizePackDownloadError(error);
  }
  if (!response.ok) throw new LessonPackDownloadError('network', `Pack download failed (${response.status}).`);
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_PACK_DOWNLOAD_BYTES || declared > entry.downloadBytes) {
    throw new LessonPackDownloadError('size', 'The server declared a pack larger than the allowed size.');
  }

  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onProgress?.({ receivedBytes: bytes.byteLength, totalBytes: entry.downloadBytes });
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > MAX_PACK_DOWNLOAD_BYTES || receivedBytes > entry.downloadBytes) {
      await reader.cancel();
      throw new LessonPackDownloadError('size', 'The downloaded pack exceeded its declared size.');
    }
    chunks.push(value);
    onProgress?.({ receivedBytes, totalBytes: declared > 0 ? declared : entry.downloadBytes });
  }
  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function downloadBytes(
  entry: LessonPackCatalogEntry,
  onProgress?: (progress: PackDownloadProgress) => void
): Promise<Uint8Array> {
  if (Platform.OS === 'web') return fetchBytes(entry, onProgress);

  const { File, Paths } = await import('expo-file-system');
  const destination = new File(Paths.cache, `required-listening-${entry.packId}-${entry.version}.json`);
  const controller = new AbortController();
  let exceededSize = false;
  try {
    const downloaded = await File.downloadFileAsync(entry.manifestUrl, destination, {
      idempotent: true,
      signal: controller.signal,
      onProgress: ({ bytesWritten, totalBytes }) => {
        if (bytesWritten > MAX_PACK_DOWNLOAD_BYTES || bytesWritten > entry.downloadBytes) {
          exceededSize = true;
          controller.abort();
          return;
        }
        onProgress?.({
          receivedBytes: bytesWritten,
          totalBytes: totalBytes > 0 ? totalBytes : entry.downloadBytes,
        });
      },
    });
    return await downloaded.bytes();
  } catch (error) {
    if (exceededSize) {
      throw new LessonPackDownloadError('size', 'The downloaded pack exceeded its declared size.', { cause: error });
    }
    throw normalizePackDownloadError(error);
  } finally {
    if (destination.exists) destination.delete();
  }
}

export async function downloadAndVerifyLessonPack(input: {
  entry: LessonPackCatalogEntry;
  appVersion: string;
  isDev: boolean;
  onProgress?: (progress: PackDownloadProgress) => void;
}): Promise<LessonPack> {
  if (!isAllowedFirstPartyPackUrl(input.entry.manifestUrl)) {
    throw new LessonPackDownloadError('invalid', 'The pack URL is not an allowed first-party URL.');
  }
  const bytes = await downloadBytes(input.entry, input.onProgress);
  if (bytes.byteLength > MAX_PACK_DOWNLOAD_BYTES || bytes.byteLength > input.entry.downloadBytes) {
    throw new LessonPackDownloadError('size', 'The downloaded pack exceeded its declared size.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch (error) {
    throw new LessonPackDownloadError('invalid', 'The downloaded pack is not valid UTF-8 JSON.', { cause: error });
  }
  return validateDownloadedPack({
    entry: input.entry,
    payload,
    byteLength: bytes.byteLength,
    sha256: await sha256Hex(bytes),
    appVersion: input.appVersion,
    isDev: input.isDev,
  });
}
