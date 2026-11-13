import { z } from 'zod';
import { Lane } from '../content/schemas';
import { PROVIDERS } from '../lib/links';

/** A song a child chose for their crate (the guide's "Build Your Own Crate"). */
export const CrateEntry = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Add a song title'),
  artist: z.string().trim().min(1, 'Add who made it'),
  /** Set when the song came from the guide. */
  trackId: z.string().optional(),
  unitId: z.string().optional(),
  why: z.array(z.string()).min(1, 'Pick at least one reason'),
  moment: z.string().min(1, 'Pick when you would play it'),
  note: z.string().max(500).optional(),
  addedAt: z.string(),
});
export type CrateEntry = z.infer<typeof CrateEntry>;

export const CrateEntryDraft = CrateEntry.omit({ id: true, addedAt: true });
export type CrateEntryDraft = z.infer<typeof CrateEntryDraft>;

/** A saved Talk-step response. Private to the device. */
export const Reflection = z.object({
  id: z.string().min(1),
  unitId: z.string(),
  lessonId: z.string(),
  feelings: z.array(z.string()),
  text: z.string().max(1000).optional(),
  createdAt: z.string(),
});
export type Reflection = z.infer<typeof Reflection>;

export const UNIT_OVERVIEW_SECTIONS = ['why', 'music', 'briefing'] as const;
export const UnitOverviewSection = z.enum(UNIT_OVERVIEW_SECTIONS);
export type UnitOverviewSection = z.infer<typeof UnitOverviewSection>;

export const UnitOverviewAcknowledgement = z.object({
  unitId: z.string().min(1),
  section: UnitOverviewSection,
  acknowledgedAt: z.string(),
});
export type UnitOverviewAcknowledgement = z.infer<typeof UnitOverviewAcknowledgement>;

/** One private, editable Final Project response per unit. */
export const FinalProjectResponse = z.object({
  unitId: z.string().min(1),
  text: z.string().trim().min(1).max(3000),
  earlyTrackIds: z.array(z.string()),
  laterTrackIds: z.array(z.string()),
  updatedAt: z.string(),
});
export type FinalProjectResponse = z.infer<typeof FinalProjectResponse>;

export const Settings = z.object({
  nickname: z.string().trim().min(1).max(24),
  avatar: z.string().min(1),
  lane: Lane,
  providers: z.array(z.enum(PROVIDERS)).min(1),
  onboardedAt: z.string(),
  /** Set after the family finishes the one-time, three-page Field Manual gate. */
  fieldManualCompletedAt: z.string().optional(),
});
export type Settings = z.infer<typeof Settings>;

export const FamilyExport = z.object({
  exportedAt: z.string(),
  settings: Settings.nullable(),
  crate: z.array(CrateEntry),
  reflections: z.array(Reflection),
  explored: z.array(z.string()),
  unitOverviewAcknowledgements: z.array(UnitOverviewAcknowledgement),
  projectResponses: z.array(FinalProjectResponse),
});
export type FamilyExport = z.infer<typeof FamilyExport>;

/** Feeling chips for the Talk step. Simple words a kid can tap. */
export const FEELINGS = ['hyped', 'happy', 'calm', 'sad', 'curious', 'confused', 'brave', 'bored'] as const;

/** Local avatars only: no photos, no real names. */
export const AVATARS = ['🎧', '📻', '🎤', '🥁', '🎹', '💿', '🔊', '⭐'] as const;

export const MAX_CRATE_SIZE_HINT = 5;

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createCrateEntry(draft: CrateEntryDraft, now = new Date()): CrateEntry {
  const parsed = CrateEntryDraft.parse(draft);
  return CrateEntry.parse({ ...parsed, id: newId('crate'), addedAt: now.toISOString() });
}

/** Has this song already been added? Matches by guide track, otherwise by title + artist. */
export function isDuplicate(crate: CrateEntry[], draft: Pick<CrateEntry, 'title' | 'artist' | 'trackId'>): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  return crate.some((e) =>
    draft.trackId && e.trackId
      ? e.trackId === draft.trackId
      : norm(e.title) === norm(draft.title) && norm(e.artist) === norm(draft.artist)
  );
}

/** Plain-text crate card for the native share sheet. No public feed exists. */
export function crateShareText(
  nickname: string,
  crate: CrateEntry[],
  labels: { why: Record<string, string>; moment: Record<string, string> }
): string {
  const lines = crate.map((e, i) => {
    const why = e.why.map((w) => labels.why[w] ?? w).join(', ');
    const moment = labels.moment[e.moment] ?? e.moment;
    return `${i + 1}. "${e.title}" — ${e.artist}\n   Why: ${why}\n   When: ${moment}`;
  });
  return [`${nickname}'s Crate`, '', ...lines, '', 'Keep it open. Keep listening.'].join('\n');
}
