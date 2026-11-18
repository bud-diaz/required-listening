import type { Lane } from '../schemas';
import { isPublishable, laneAllows } from '..';
import { demoFamilyAnthemsPack } from './demo-family-anthems.v1';
import soulFoundationJson from './pack-01-soul-foundation.v1.json';
import remoteCatalogJson from './catalog.remote.v1.json';
import type { InstalledPack, LessonPack, PackLesson } from '../../domain/lesson-packs';
import { LessonPack as LessonPackSchema } from '../../domain/lesson-packs';
import { LessonPackCatalogDocument } from '../../domain/lesson-pack-catalog';

export const soulFoundationPack = LessonPackSchema.parse(soulFoundationJson);
export const bundledPackCatalogDocument = LessonPackCatalogDocument.parse(remoteCatalogJson);
const bundledPacks: LessonPack[] = [soulFoundationPack, demoFamilyAnthemsPack];

export function getBundledPackCatalogEntry(packId: string) {
  return bundledPackCatalogDocument.packs.find((entry) => entry.packId === packId);
}

export function availableLessonPacks(isDev: boolean): LessonPack[] {
  return bundledPacks.filter(
    (pack) => (!pack.developmentOnly || isDev) && isPublishable(pack.review, isDev)
  );
}

/** Replace this adapter with a signed remote catalog without changing screens or storage. */
export interface LessonPackCatalog {
  list(isDev: boolean): Promise<LessonPack[]>;
  get(packId: string, isDev: boolean): Promise<LessonPack | undefined>;
}

export const bundledLessonPackCatalog: LessonPackCatalog = {
  async list(isDev) {
    return availableLessonPacks(isDev);
  },
  async get(packId, isDev) {
    const packs = await this.list(isDev);
    return packs.find((pack) => pack.packId === packId);
  },
};

export function getInstalledPack(installed: readonly InstalledPack[], packId: string): LessonPack | undefined {
  return installed.find((item) => item.packId === packId)?.manifest;
}

export function getPackLesson(pack: LessonPack, lessonId: string, lane: Lane): PackLesson | undefined {
  const lesson = pack.lessons.find((item) => item.id === lessonId);
  return lesson && laneAllows(lane, lesson.minLane) ? lesson : undefined;
}

export function visiblePackLessons(pack: LessonPack, lane: Lane): PackLesson[] {
  return pack.lessons.filter((lesson) => laneAllows(lane, lesson.minLane));
}
