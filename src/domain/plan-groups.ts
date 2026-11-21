import { CORE_COLLECTION_ID } from './content-ref';
import type { InstalledPack, LessonPack, LessonPlanItem, PackLesson, PackSection } from './lesson-packs';

export interface ResolvedPlanItem {
  item: LessonPlanItem;
  globalIndex: number;
  pack?: LessonPack;
  lesson?: PackLesson;
  section?: PackSection;
}

export interface PlanGroup {
  key: string;
  title: string;
  monogram?: string;
  entries: ResolvedPlanItem[];
}

export function resolvePlanItems(
  plan: readonly LessonPlanItem[],
  installed: readonly InstalledPack[]
): ResolvedPlanItem[] {
  return plan.map((item, globalIndex) => {
    const pack = installed.find((candidate) => candidate.packId === item.content.collectionId)?.manifest;
    const lesson = pack?.lessons.find((candidate) => candidate.id === item.content.lessonId);
    const section = pack?.sections.find((candidate) => candidate.lessonIds.includes(item.content.lessonId));
    return { item, globalIndex, pack, lesson, section };
  });
}

/** Groups resolved plan items by their pack section ("artist"), preserving first-seen order. */
export function groupPlanItemsByArtist(resolved: readonly ResolvedPlanItem[]): PlanGroup[] {
  const groups: PlanGroup[] = [];
  const indexByKey = new Map<string, number>();
  for (const entry of resolved) {
    const key =
      entry.pack && entry.section
        ? `${entry.pack.packId}:${entry.section.unitId}`
        : `unresolved:${entry.item.content.collectionId}`;
    let index = indexByKey.get(key);
    if (index === undefined) {
      const title =
        entry.pack && entry.section
          ? entry.section.title
          : entry.item.content.collectionId === CORE_COLLECTION_ID
            ? 'Core units'
            : 'Unavailable pack';
      index = groups.length;
      indexByKey.set(key, index);
      groups.push({ key, title, monogram: entry.section?.monogram, entries: [] });
    }
    groups[index].entries.push(entry);
  }
  return groups;
}
