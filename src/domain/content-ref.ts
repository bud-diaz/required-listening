import { z } from 'zod';

export const CORE_COLLECTION_ID = 'core-v1';

export const ContentRef = z.object({
  collectionId: z.string().min(1),
  lessonId: z.string().min(1),
});
export type ContentRef = z.infer<typeof ContentRef>;

/** Stable storage key for a lesson across the core guide and optional packs. */
export function contentKey(ref: ContentRef): string {
  return `${ref.collectionId}:${ref.lessonId}`;
}

export function coreContentRef(lessonId: string): ContentRef {
  return { collectionId: CORE_COLLECTION_ID, lessonId };
}

/** Existing releases stored bare lesson IDs. Treat those as core guide progress. */
export function normalizeContentKey(value: string): string {
  return value.includes(':') ? value : contentKey(coreContentRef(value));
}

export function isContentExplored(explored: readonly string[], ref: ContentRef): boolean {
  const key = contentKey(ref);
  return explored.some((value) => normalizeContentKey(value) === key);
}
