import catalogJson from './catalog.v1.json';
import frontMatterJson from './front-matter.v1.json';
import crateActivityJson from './crate-activity.v1.json';
import chiefKeefJson from './artists/01-chief-keef.v1.json';
import {
  Catalog,
  CrateActivity,
  FrontMatter,
  LANES,
  Unit,
  type Lane,
  type Lesson,
  type Review,
  type Track,
} from './schemas';

/** Structured unit files. Add each newly converted unit here. */
export const RAW_UNITS: unknown[] = [chiefKeefJson];

export const catalog = Catalog.parse(catalogJson);
export const frontMatter = FrontMatter.parse(frontMatterJson);
export const crateActivity = CrateActivity.parse(crateActivityJson);
export const units: Unit[] = RAW_UNITS.map((u) => Unit.parse(u));

/**
 * Unreviewed content is blocked in production builds and shown with a DRAFT
 * banner in development (docs/APP_PLAN.md §4: unknown review state is blocked).
 */
export function isPublishable(review: Review, isDev: boolean): boolean {
  return review.status === 'approved' || isDev;
}

export function laneRank(lane: Lane): number {
  return LANES.indexOf(lane);
}

/** True when content marked `minLane` may be shown to a family on `lane`. */
export function laneAllows(lane: Lane, minLane: Lane): boolean {
  return laneRank(minLane) <= laneRank(lane);
}

export function getUnit(id: string, isDev: boolean): Unit | undefined {
  const unit = units.find((u) => u.id === id);
  return unit && isPublishable(unit.review, isDev) ? unit : undefined;
}

export function getTrack(unit: Unit, trackId: string): Track | undefined {
  return unit.tracks.find((t) => t.id === trackId);
}

export function visibleLessons(unit: Unit, lane: Lane): Lesson[] {
  return unit.lessons.filter((l) => laneAllows(lane, l.minLane));
}

export function visibleTracks(unit: Unit, trackIds: string[], lane: Lane): Track[] {
  return trackIds
    .map((id) => getTrack(unit, id))
    .filter((t): t is Track => !!t && laneAllows(lane, t.minLane));
}

/**
 * Resolve a lesson for a deep link. Returns undefined when the lane hides it, so
 * restricted lessons can't be reached by URL either.
 */
export function getLesson(unit: Unit, lessonId: string, lane: Lane): Lesson | undefined {
  const lesson = unit.lessons.find((l) => l.id === lessonId);
  return lesson && laneAllows(lane, lesson.minLane) ? lesson : undefined;
}

/** The passed-down track, or the lane-appropriate substitute (the first Younger Listener pick). */
export function passedDownFor(unit: Unit, lane: Lane): { track: Track; isSubstitute: boolean } | undefined {
  const main = getTrack(unit, unit.passedDown.trackId);
  if (main && laneAllows(lane, main.minLane)) return { track: main, isSubstitute: false };
  const sub = visibleTracks(unit, unit.youngerListener.trackIds, lane)[0];
  return sub ? { track: sub, isSubstitute: true } : undefined;
}

/** Every track in every converted unit, for crate pickers. */
export function allTracks(lane: Lane): { unit: Unit; track: Track }[] {
  return units.flatMap((unit) =>
    unit.tracks.filter((t) => t.type !== 'video' && laneAllows(lane, t.minLane)).map((track) => ({ unit, track }))
  );
}

export type { Unit, Lesson, Track, Lane };
