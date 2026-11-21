import { describe, expect, it } from 'vitest';
import { soulFoundationPack, theNewWavePack } from '../src/content/packs';
import { createInstalledPack, LessonPlanItem, normalizeLessonPlan } from '../src/domain/lesson-packs';
import { groupPlanItemsByArtist, resolvePlanItems } from '../src/domain/plan-groups';

const installedSoul = createInstalledPack(soulFoundationPack);
const installedNewWave = createInstalledPack(theNewWavePack);

function planItem(packId: string, lessonId: string, position: number) {
  return LessonPlanItem.parse({
    id: `${packId}:${lessonId}`,
    content: { collectionId: packId, lessonId },
    position,
    addedAt: '2026-11-18T00:00:00.000Z',
  });
}

describe('groupPlanItemsByArtist', () => {
  it('groups all lessons from the same pack section into one artist group', () => {
    const section = soulFoundationPack.sections[0];
    const plan = normalizeLessonPlan([
      planItem(soulFoundationPack.packId, section.lessonIds[0], 0),
      planItem(soulFoundationPack.packId, section.lessonIds[1], 1),
    ]);
    const groups = groupPlanItemsByArtist(resolvePlanItems(plan, [installedSoul]));
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: `${soulFoundationPack.packId}:${section.unitId}`,
      title: section.title,
      monogram: section.monogram,
    });
    expect(groups[0].entries).toHaveLength(2);
  });

  it('creates separate groups for lessons from different packs, in first-added order', () => {
    const soulSection = soulFoundationPack.sections[0];
    const waveSection = theNewWavePack.sections[0];
    const plan = normalizeLessonPlan([
      planItem(theNewWavePack.packId, waveSection.lessonIds[0], 0),
      planItem(soulFoundationPack.packId, soulSection.lessonIds[0], 1),
    ]);
    const groups = groupPlanItemsByArtist(resolvePlanItems(plan, [installedSoul, installedNewWave]));
    expect(groups.map((group) => group.key)).toEqual([
      `${theNewWavePack.packId}:${waveSection.unitId}`,
      `${soulFoundationPack.packId}:${soulSection.unitId}`,
    ]);
  });

  it('falls back to an "Unavailable pack" group for an uninstalled pack', () => {
    const plan = normalizeLessonPlan([planItem('ghost-pack', 'ghost-lesson', 0)]);
    const groups = groupPlanItemsByArtist(resolvePlanItems(plan, [installedSoul]));
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Unavailable pack');
    expect(groups[0].entries[0].pack).toBeUndefined();
  });

  it('keeps a lane-hidden lesson in its correct artist group rather than dropping it', () => {
    const section = soulFoundationPack.sections[0];
    const hiddenLesson = soulFoundationPack.lessons.find(
      (lesson) => section.lessonIds.includes(lesson.id) && lesson.minLane !== 'younger'
    );
    expect(hiddenLesson).toBeDefined();
    const plan = normalizeLessonPlan([planItem(soulFoundationPack.packId, hiddenLesson!.id, 0)]);
    const groups = groupPlanItemsByArtist(resolvePlanItems(plan, [installedSoul]));
    expect(groups).toHaveLength(1);
    expect(groups[0].entries[0].lesson?.id).toBe(hiddenLesson!.id);
  });

  it('preserves globalIndex against the full flat plan for move()/disabled-arrow logic', () => {
    const soulSection = soulFoundationPack.sections[0];
    const waveSection = theNewWavePack.sections[0];
    const plan = normalizeLessonPlan([
      planItem(soulFoundationPack.packId, soulSection.lessonIds[0], 0),
      planItem(theNewWavePack.packId, waveSection.lessonIds[0], 1),
    ]);
    const resolved = resolvePlanItems(plan, [installedSoul, installedNewWave]);
    const groups = groupPlanItemsByArtist(resolved);
    expect(groups[0].entries[0].globalIndex).toBe(0);
    expect(groups[1].entries[0].globalIndex).toBe(1);
  });
});
