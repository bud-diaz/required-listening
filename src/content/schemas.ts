import { z } from 'zod';

/**
 * Content contract for the Required Listening curriculum.
 *
 * Every piece of curriculum text lives in versioned JSON under `src/content/`
 * and must pass these schemas. Screens never hard-code guide prose.
 */

const id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'IDs must be lowercase kebab-case');

/** Listening lanes chosen by the caregiver. Ordered from most to least restrictive. */
export const LANES = ['younger', 'guided', 'full'] as const;
export const Lane = z.enum(LANES);
export type Lane = z.infer<typeof Lane>;

/** Editorial content flags. A flag describes the content, it is never a rating. */
export const ContentFlag = z.enum([
  'explicit-language',
  'violence',
  'weapons',
  'substances',
  'sexual-content',
  'trauma',
  'artist-conduct',
  'mature-themes',
]);
export type ContentFlag = z.infer<typeof ContentFlag>;

/**
 * Review status. Only `approved` content can appear in a production build;
 * `draft` content is visible in development builds behind a DRAFT banner.
 */
export const ReviewStatus = z.enum(['draft', 'needs-changes', 'approved']);
export type ReviewStatus = z.infer<typeof ReviewStatus>;

export const Review = z
  .object({
    status: ReviewStatus,
    reviewedAt: z.string().nullable(),
    reviewedBy: z.string().nullable(),
  })
  .strict()
  .refine((r) => r.status !== 'approved' || (r.reviewedAt && r.reviewedBy), {
    message: 'Approved content needs reviewedAt and reviewedBy',
  });
export type Review = z.infer<typeof Review>;

/**
 * "Clean" is a claim about a specific provider version, so it starts unverified.
 * `instrumental` means no vocals at all.
 */
export const CleanVersionStatus = z.enum(['unverified', 'verified-clean', 'instrumental', 'explicit']);

export const TrackType = z.enum(['song', 'album', 'mixtape', 'instrumental', 'video']);

export const Track = z.object({
  id,
  title: z.string().min(1),
  artist: z.string().min(1),
  type: TrackType,
  /** Lowest lane in which this selection can be shown. */
  minLane: Lane,
  /** Caregiver-guided pick for the Younger Listener lane. Deliberately not called "clean". */
  youngerListener: z.boolean(),
  cleanVersionStatus: CleanVersionStatus,
  contentFlags: z.array(ContentFlag),
  caregiverNote: z.string().optional(),
  /** Free-text search query sent to providers. Defaults to `${title} ${artist}`. */
  searchQuery: z.string().optional(),
  sourceNotes: z.string().optional(),
  /** True when a grown-up must preview the exact provider result before playing it. */
  requiresCaregiverPreview: z.boolean(),
}).strict().superRefine((track, ctx) => {
  if (track.requiresCaregiverPreview !== (track.cleanVersionStatus === 'unverified')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['requiresCaregiverPreview'],
      message: 'Unverified tracks require caregiver preview; confirmed statuses must not use that flag.',
    });
  }
  if (track.youngerListener && track.minLane !== 'younger') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['minLane'],
      message: 'Younger Listener picks must be available on the younger lane.',
    });
  }
  if (track.minLane === 'younger' && (track.contentFlags.length > 0 || track.cleanVersionStatus === 'explicit')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contentFlags'],
      message: 'Tracks on the younger lane cannot be explicit or carry content flags.',
    });
  }
});
export type Track = z.infer<typeof Track>;

export const BodyBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text: z.string().min(1) }).strict(),
  z.object({ type: z.literal('callout'), text: z.string().min(1) }).strict(),
  z.object({
    type: z.literal('list'),
    label: z.string().optional(),
    items: z.array(z.string().min(1)).min(1),
  }).strict(),
]);
export type BodyBlock = z.infer<typeof BodyBlock>;

/**
 * `guide` = wording taken from the PDF. `adapted` = written for the app from the
 * lesson's own content and awaiting author review. `approved-adaptation` records
 * that the author approved app-specific wording without losing its provenance.
 */
export const PromptSource = z.enum(['guide', 'adapted', 'approved-adaptation']);

export const Prompt = z.object({
  text: z.string().min(1),
  source: PromptSource,
}).strict();
export type Prompt = z.infer<typeof Prompt>;

export const Influence = z.object({
  direct: z.array(z.object({ name: z.string(), note: z.string().optional(), unitId: id.optional() }).strict()),
  cultural: z.array(z.string()),
}).strict();

export const Lesson = z.object({
  id,
  number: z.number().int().min(1).max(10),
  title: z.string().min(1),
  body: z.array(BodyBlock).min(1),
  /** Track IDs (from the unit's `tracks`) to open during the Listen step. */
  listen: z.array(id),
  /** Notice: one concise cue about sound, culture or feeling. */
  notice: Prompt,
  /** Talk: one caregiver discussion prompt. */
  talk: Prompt,
  activity: Prompt.optional(),
  minLane: Lane,
  requiresCaregiverContext: z.boolean(),
  caregiverNote: z.string().optional(),
  contentFlags: z.array(ContentFlag),
  influence: Influence.optional(),
}).strict().superRefine((lesson, ctx) => {
  if (lesson.requiresCaregiverContext && !lesson.caregiverNote?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['caregiverNote'],
      message: 'Lessons requiring caregiver context must include a caregiver note.',
    });
  }
});
export type Lesson = z.infer<typeof Lesson>;

export const FinalProject = z.object({
  prompt: z.string().min(1),
  earlyOptions: z.array(id).min(1),
  laterOptions: z.array(id).min(1),
  influencedCount: z.number().int().min(1),
}).strict();

export const Unit = z
  .object({
    schemaVersion: z.literal(1),
    id,
    number: z.number().int().min(1).max(999),
    displayName: z.string().min(1),
    /** Two-letter monogram used instead of artist photos (no image rights needed). */
    monogram: z.string().min(1).max(3),
    whyItMatters: z.string().min(1),
    passedDown: z.object({ trackId: id, blurb: z.string().min(1) }).strict(),
    youngerListener: z.object({ trackIds: z.array(id).min(1), note: z.string() }).strict(),
    overview: z.object({ summary: z.array(z.string().min(1)).min(1), closing: z.string().min(1) }).strict(),
    learnOutcomes: z.array(z.string().min(1)).min(1),
    tracks: z.array(Track).min(1),
    lessons: z.array(Lesson).length(10),
    finalProject: FinalProject,
    contentFlags: z.array(ContentFlag),
    estimatedMinutesPerLesson: z.number().int().positive(),
    sourceNotes: z.string().min(1),
    lessonReview: Review,
    review: Review,
  })
  .strict()
  .superRefine((unit, ctx) => {
    const trackIds = new Set(unit.tracks.map((track) => track.id));
    const lessonIds = new Set(unit.lessons.map((lesson) => lesson.id));
    if (trackIds.size !== unit.tracks.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tracks'], message: 'Track IDs must be unique.' });
    }
    if (lessonIds.size !== unit.lessons.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['lessons'], message: 'Lesson IDs must be unique.' });
    }
    const expectedNumbers = unit.lessons.map((_, index) => index + 1);
    if (unit.lessons.some((lesson, index) => lesson.number !== expectedNumbers[index])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lessons'],
        message: 'Core unit lessons must be ordered and numbered 1 through 10.',
      });
    }
    if (unit.review.status === 'approved' && unit.lessonReview.status !== 'approved') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lessonReview', 'status'],
        message: 'A production-approved unit must also have approved lesson content.',
      });
    }
    const requireTrack = (trackId: string, path: (string | number)[]) => {
      if (!trackIds.has(trackId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: `Unknown track ID: ${trackId}` });
      }
    };
    requireTrack(unit.passedDown.trackId, ['passedDown', 'trackId']);
    unit.youngerListener.trackIds.forEach((trackId, index) => {
      requireTrack(trackId, ['youngerListener', 'trackIds', index]);
      const track = unit.tracks.find((item) => item.id === trackId);
      if (track && (!track.youngerListener || track.minLane !== 'younger')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['youngerListener', 'trackIds', index],
          message: 'Younger Listener references must point to tracks marked for the younger lane.',
        });
      }
    });
    unit.lessons.forEach((lesson, lessonIndex) => {
      lesson.listen.forEach((trackId, trackIndex) =>
        requireTrack(trackId, ['lessons', lessonIndex, 'listen', trackIndex])
      );
      if (unit.lessonReview.status === 'approved') {
        [lesson.notice, lesson.talk, lesson.activity].forEach((prompt, promptIndex) => {
          if (prompt?.source === 'adapted') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['lessons', lessonIndex, ['notice', 'talk', 'activity'][promptIndex], 'source'],
              message: 'Approved lesson sets cannot contain unapproved adapted prompts.',
            });
          }
        });
      }
    });
    unit.finalProject.earlyOptions.forEach((trackId, index) =>
      requireTrack(trackId, ['finalProject', 'earlyOptions', index])
    );
    unit.finalProject.laterOptions.forEach((trackId, index) =>
      requireTrack(trackId, ['finalProject', 'laterOptions', index])
    );
  });
export type Unit = z.infer<typeof Unit>;

export const CatalogEntry = z.object({
  id,
  number: z.number().int().min(1).max(999),
  displayName: z.string().min(1),
  monogram: z.string().min(1).max(3),
  /** True when a structured unit file exists in `src/content/artists/`. */
  available: z.boolean(),
});

export const Catalog = z.object({
  schemaVersion: z.literal(1),
  title: z.string(),
  subtitle: z.string(),
  /** Null until the public byline is confirmed (see docs/APP_PLAN.md §2). */
  byline: z.string().nullable(),
  units: z.array(CatalogEntry).min(1),
}).strict().superRefine((catalog, ctx) => {
  const ids = new Set(catalog.units.map((unit) => unit.id));
  const numbers = new Set(catalog.units.map((unit) => unit.number));
  if (ids.size !== catalog.units.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['units'], message: 'Catalog unit IDs must be unique.' });
  }
  if (numbers.size !== catalog.units.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['units'], message: 'Catalog unit numbers must be unique.' });
  }
  if (catalog.units.some((unit, index) => unit.number !== index + 1)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['units'], message: 'Catalog units must be ordered consecutively.' });
  }
});
export type Catalog = z.infer<typeof Catalog>;

export const FrontMatterSection = z.object({
  id,
  heading: z.string(),
  blocks: z.array(BodyBlock).min(1),
});

export const FrontMatter = z.object({
  schemaVersion: z.literal(1),
  sections: z.array(FrontMatterSection).min(1),
  review: Review,
});
export type FrontMatter = z.infer<typeof FrontMatter>;

export const CrateActivity = z.object({
  schemaVersion: z.literal(1),
  intro: z.string(),
  minSongs: z.number().int(),
  maxSongs: z.number().int(),
  whyOptions: z.array(z.object({ id, label: z.string() })).min(1),
  momentOptions: z.array(z.object({ id, label: z.string() })).min(1),
  shareTips: z.array(z.string()),
  closing: z.array(z.string()),
  review: Review,
});
export type CrateActivity = z.infer<typeof CrateActivity>;
