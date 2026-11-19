import { z } from 'zod';
import { ContentRef } from './content-ref';
import { ContentFlag, Lesson, Review, Track } from '../content/schemas';

const packId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Pack IDs must be lowercase kebab-case');

export const PackSection = z.object({
  unitId: packId,
  number: z.number().int().positive(),
  monogram: z.string().min(1).max(3),
  title: z.string().min(1),
  summary: z.string().min(1),
  lessonIds: z.array(packId).min(1).max(10),
}).strict();
export type PackSection = z.infer<typeof PackSection>;

export const PackLesson = Lesson.safeExtend({
  number: z.number().int().min(1).max(50),
});
export type PackLesson = z.infer<typeof PackLesson>;

export const LessonPack = z
  .object({
    schemaVersion: z.literal(1),
    packId,
    version: z.number().int().positive(),
    title: z.string().min(1),
    theme: z.string().min(1),
    summary: z.string().min(1),
    educationalConnections: z.array(z.string().min(1)).min(1),
    centralLesson: z.string().min(1),
    publisher: z.string().min(1),
    publishedAt: z.string(),
    minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Minimum app version must use major.minor.patch.'),
    downloadBytes: z.number().int().nonnegative(),
    contentFlags: z.array(ContentFlag),
    estimatedMinutesPerLesson: z.number().int().positive(),
    tracks: z.array(Track),
    lessons: z.array(PackLesson).min(1).max(50),
    sections: z.array(PackSection).min(1),
    review: Review,
    developmentOnly: z.boolean().default(false),
  })
  .strict()
  .superRefine((pack, ctx) => {
    const lessonIds = new Set<string>();
    const trackIds = new Set(pack.tracks.map((track) => track.id));
    if (trackIds.size !== pack.tracks.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tracks'], message: 'Track IDs must be unique' });
    }
    for (const [index, lesson] of pack.lessons.entries()) {
      if (lessonIds.has(lesson.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessons', index, 'id'],
          message: 'Lesson IDs must be unique',
        });
      }
      lessonIds.add(lesson.id);
      if (lesson.number !== index + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lessons', index, 'number'],
          message: 'Pack lessons must be ordered and numbered consecutively from 1.',
        });
      }
      for (const id of lesson.listen) {
        if (!trackIds.has(id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['lessons', index, 'listen'],
            message: `Unknown track ID: ${id}`,
          });
        }
      }
      if (pack.review.status === 'approved') {
        const prompts = [lesson.notice, lesson.talk, lesson.activity];
        const names = ['notice', 'talk', 'activity'] as const;
        prompts.forEach((prompt, promptIndex) => {
          if (prompt?.source === 'adapted') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['lessons', index, names[promptIndex], 'source'],
              message: 'Approved packs cannot contain unapproved adapted prompts.',
            });
          }
        });
      }
    }

    const sectionUnitIds = new Set<string>();
    const sectionLessonIds = new Set<string>();
    for (const [sectionIndex, section] of pack.sections.entries()) {
      if (sectionUnitIds.has(section.unitId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', sectionIndex, 'unitId'],
          message: 'Section unit IDs must be unique.',
        });
      }
      sectionUnitIds.add(section.unitId);
      for (const lessonId of section.lessonIds) {
        if (!lessonIds.has(lessonId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections', sectionIndex, 'lessonIds'],
            message: `Unknown lesson ID: ${lessonId}`,
          });
        }
        if (sectionLessonIds.has(lessonId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['sections', sectionIndex, 'lessonIds'],
            message: `Lesson appears in more than one section: ${lessonId}`,
          });
        }
        sectionLessonIds.add(lessonId);
      }
    }
    for (const lessonId of lessonIds) {
      if (!sectionLessonIds.has(lessonId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections'],
          message: `Every pack lesson must belong to one section: ${lessonId}`,
        });
      }
    }
  });
export type LessonPack = z.infer<typeof LessonPack>;

export const InstalledPack = z
  .object({
    packId,
    version: z.number().int().positive(),
    installedAt: z.string(),
    updatedAt: z.string(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable().default(null),
    downloadBytes: z.number().int().nonnegative().default(0),
    manifest: LessonPack,
  })
  .refine((installed) =>
    installed.packId === installed.manifest.packId && installed.version === installed.manifest.version,
  { message: 'Installed pack identity must match its manifest' });
export type InstalledPack = z.infer<typeof InstalledPack>;

export const LessonPlanItem = z.object({
  id: z.string().min(1),
  content: ContentRef,
  position: z.number().int().nonnegative(),
  addedAt: z.string(),
});
export type LessonPlanItem = z.infer<typeof LessonPlanItem>;

export function createInstalledPack(
  pack: LessonPack,
  metadata: { sha256?: string | null; downloadBytes?: number } = {},
  now = new Date()
): InstalledPack {
  const timestamp = now.toISOString();
  return InstalledPack.parse({
    packId: pack.packId,
    version: pack.version,
    installedAt: timestamp,
    updatedAt: timestamp,
    sha256: metadata.sha256 ?? null,
    downloadBytes: metadata.downloadBytes ?? pack.downloadBytes,
    manifest: pack,
  });
}

export function assertSafePackUpdate(current: LessonPack, next: LessonPack): void {
  if (current.packId !== next.packId) throw new Error('A pack update cannot change its pack ID.');
  if (next.version < current.version) throw new Error('A lesson pack cannot be downgraded.');
  const nextLessonIds = new Set(next.lessons.map((lesson) => lesson.id));
  const removed = current.lessons.filter((lesson) => !nextLessonIds.has(lesson.id)).map((lesson) => lesson.id);
  if (removed.length > 0) {
    throw new Error(`Pack update removed stable lesson IDs without a migration: ${removed.join(', ')}`);
  }
}

export function normalizeLessonPlan(items: readonly LessonPlanItem[]): LessonPlanItem[] {
  return [...items]
    .sort((a, b) => a.position - b.position || a.addedAt.localeCompare(b.addedAt))
    .map((item, position) => LessonPlanItem.parse({ ...item, position }));
}
