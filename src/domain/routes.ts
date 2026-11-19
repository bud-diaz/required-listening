import { visibleLessons, type Lane, type Unit } from '../content';
import { visiblePackLessons } from '../content/packs';
import { coreContentRef, type ContentRef } from './content-ref';
import type { InstalledPack, LessonPack, LessonPlanItem, PackSection } from './lesson-packs';

/**
 * A route the family can explore: either a core guide unit, or an artist section from an
 * installed pack once at least one of its lessons has been added to the Lesson Plan.
 */
export interface DisplayRoute {
  id: string;
  number: number;
  displayName: string;
  monogram: string;
  lessonIds: string[];
  /** Core units gate lessons behind the unit briefing; pack sections don't have one. */
  requiresOverview: boolean;
  contentRef(lessonId: string): ContentRef;
  unitHref: string;
  lessonHref(lessonId: string): string;
}

export function coreRoutes(units: readonly Unit[], lane: Lane): DisplayRoute[] {
  return units.map((unit) => ({
    id: unit.id,
    number: unit.number,
    displayName: unit.displayName,
    monogram: unit.monogram,
    lessonIds: visibleLessons(unit, lane).map((lesson) => lesson.id),
    requiresOverview: true,
    contentRef: (lessonId) => coreContentRef(lessonId),
    unitHref: `/unit/${unit.id}`,
    lessonHref: (lessonId) => `/lesson/${unit.id}/${lessonId}`,
  }));
}

function isSectionActive(
  pack: LessonPack,
  section: PackSection,
  lessonPlan: readonly LessonPlanItem[]
): boolean {
  return lessonPlan.some(
    (item) => item.content.collectionId === pack.packId && section.lessonIds.includes(item.content.lessonId)
  );
}

/** Pack sections with at least one lesson in the family's Lesson Plan, in catalog order. */
export function activatedPackRoutes(
  installedPacks: readonly InstalledPack[],
  lessonPlan: readonly LessonPlanItem[],
  lane: Lane
): DisplayRoute[] {
  const routes = installedPacks.flatMap(({ manifest: pack }) =>
    pack.sections
      .filter((section) => isSectionActive(pack, section, lessonPlan))
      .map((section) => {
        const sectionLessonIds = new Set(section.lessonIds);
        return {
          id: `${pack.packId}:${section.unitId}`,
          number: section.number,
          displayName: section.title,
          monogram: section.monogram,
          lessonIds: visiblePackLessons(pack, lane)
            .filter((lesson) => sectionLessonIds.has(lesson.id))
            .map((lesson) => lesson.id),
          requiresOverview: false,
          contentRef: (lessonId: string) => ({ collectionId: pack.packId, lessonId }),
          unitHref: `/packs/${pack.packId}`,
          lessonHref: (lessonId: string) => `/pack-lesson/${pack.packId}/${lessonId}`,
        };
      })
  );
  return routes.sort((a, b) => a.number - b.number);
}

/** Number of distinct artists (core units or activated pack sections) in the Lesson Plan. */
export function plannedUnitCount(
  installedPacks: readonly InstalledPack[],
  lessonPlan: readonly LessonPlanItem[]
): number {
  const keys = new Set<string>();
  for (const { manifest: pack } of installedPacks) {
    for (const section of pack.sections) {
      if (isSectionActive(pack, section, lessonPlan)) keys.add(`${pack.packId}:${section.unitId}`);
    }
  }
  return keys.size;
}
