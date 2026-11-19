import { describe, expect, it } from 'vitest';
import { units } from '../src/content';
import { soulFoundationPack, theNewWavePack } from '../src/content/packs';
import { createInstalledPack, LessonPlanItem, normalizeLessonPlan } from '../src/domain/lesson-packs';
import { activatedPackRoutes, coreRoutes, plannedUnitCount } from '../src/domain/routes';

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

describe('coreRoutes', () => {
  it('builds one route per seeded unit, in catalog order', () => {
    const routes = coreRoutes(units, 'full');
    expect(routes).toHaveLength(10);
    expect(routes.map((route) => route.id)).toEqual(units.map((unit) => unit.id));
    expect(routes.every((route) => route.requiresOverview)).toBe(true);
    expect(routes[0].lessonIds).toHaveLength(10);
    expect(routes[0].unitHref).toBe(`/unit/${units[0].id}`);
    expect(routes[0].lessonHref(routes[0].lessonIds[0])).toBe(`/lesson/${units[0].id}/${routes[0].lessonIds[0]}`);
  });
});

describe('activatedPackRoutes', () => {
  it('shows no routes until a lesson is added to the Lesson Plan', () => {
    expect(activatedPackRoutes([installedSoul], [], 'full')).toHaveLength(0);
  });

  it('activates exactly the section one of its lessons was added from', () => {
    const firstSection = soulFoundationPack.sections[0];
    const plan = normalizeLessonPlan([planItem(soulFoundationPack.packId, firstSection.lessonIds[0], 0)]);
    const routes = activatedPackRoutes([installedSoul], plan, 'full');
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      id: `${soulFoundationPack.packId}:${firstSection.unitId}`,
      number: firstSection.number,
      monogram: firstSection.monogram,
      displayName: firstSection.title,
      requiresOverview: false,
      unitHref: `/packs/${soulFoundationPack.packId}`,
    });
    // The whole section's lane-visible lessons become explorable, not only the one added.
    expect(routes[0].lessonIds).toEqual(firstSection.lessonIds);
    expect(routes[0].lessonHref(firstSection.lessonIds[1])).toBe(
      `/pack-lesson/${soulFoundationPack.packId}/${firstSection.lessonIds[1]}`
    );
  });

  it('sorts activated routes by their original catalog number across packs', () => {
    const soulSection = soulFoundationPack.sections[0];
    const waveSection = theNewWavePack.sections[0];
    const plan = normalizeLessonPlan([
      planItem(soulFoundationPack.packId, soulSection.lessonIds[0], 0),
      planItem(theNewWavePack.packId, waveSection.lessonIds[0], 1),
    ]);
    const routes = activatedPackRoutes([installedSoul, installedNewWave], plan, 'full');
    expect(routes).toHaveLength(2);
    expect(routes.map((route) => route.number)).toEqual(
      [soulSection.number, waveSection.number].sort((a, b) => a - b)
    );
  });
});

describe('plannedUnitCount', () => {
  it('counts distinct activated artists, not individual lessons', () => {
    const firstSection = soulFoundationPack.sections[0];
    const secondSection = soulFoundationPack.sections[1];
    const plan = normalizeLessonPlan([
      planItem(soulFoundationPack.packId, firstSection.lessonIds[0], 0),
      planItem(soulFoundationPack.packId, firstSection.lessonIds[1], 1),
      planItem(soulFoundationPack.packId, secondSection.lessonIds[0], 2),
    ]);
    expect(plannedUnitCount([installedSoul], plan)).toBe(2);
  });

  it('is zero with no installed packs or an empty plan', () => {
    expect(plannedUnitCount([], [])).toBe(0);
    expect(plannedUnitCount([installedSoul], [])).toBe(0);
  });
});
