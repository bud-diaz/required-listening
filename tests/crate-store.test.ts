import { beforeEach, describe, expect, it } from 'vitest';
import { SnapshotRepository, memoryStorage, type SnapshotStorage } from '../src/data/snapshot-repository';
import { useFamilyStore } from '../src/stores/family-store';
import {
  CrateEntryDraft,
  FinalProjectResponse,
  Settings,
  crateShareText,
  isDuplicate,
} from '../src/domain/crate';

const settings: Settings = {
  nickname: 'Lil Listener',
  avatar: '🎧',
  lane: 'guided',
  providers: ['spotify'],
  onboardedAt: '2026-11-05T00:00:00.000Z',
};

const completedSettings: Settings = {
  ...settings,
  fieldManualCompletedAt: '2026-11-12T00:00:00.000Z',
};

const loveSosa = {
  title: 'Love Sosa',
  artist: 'Chief Keef',
  trackId: 'love-sosa',
  unitId: 'chief-keef',
  why: ['move'],
  moment: 'car-ride',
};

describe('settings validation', () => {
  it('keeps older onboarding records valid and accepts Field Manual completion', () => {
    expect(Settings.safeParse(settings).success).toBe(true);
    expect(Settings.safeParse(completedSettings).success).toBe(true);
    expect(Settings.safeParse({ ...settings, fieldManualCompletedAt: 123 }).success).toBe(false);
  });
});

describe('crate entry validation', () => {
  it('requires a title, an artist, a reason and a moment', () => {
    expect(CrateEntryDraft.safeParse({ ...loveSosa, title: '  ' }).success).toBe(false);
    expect(CrateEntryDraft.safeParse({ ...loveSosa, why: [] }).success).toBe(false);
    expect(CrateEntryDraft.safeParse({ ...loveSosa, moment: '' }).success).toBe(false);
    expect(CrateEntryDraft.safeParse(loveSosa).success).toBe(true);
  });

  it('spots duplicates by guide track or by title and artist', () => {
    const crate = [{ ...loveSosa, id: 'a', addedAt: 'x' }];
    expect(isDuplicate(crate, { title: 'other', artist: 'x', trackId: 'love-sosa' })).toBe(true);
    expect(isDuplicate(crate, { title: ' love sosa ', artist: 'CHIEF KEEF' })).toBe(true);
    expect(isDuplicate(crate, { title: 'Kobe', artist: 'Chief Keef' })).toBe(false);
  });

  it('builds share text with readable labels', () => {
    const text = crateShareText('Lil Listener', [{ ...loveSosa, id: 'a', addedAt: 'x' }], {
      why: { move: 'It makes me want to move' },
      moment: { 'car-ride': 'Car ride' },
    });
    expect(text).toContain("Lil Listener's Crate");
    expect(text).toContain('"Love Sosa" — Chief Keef');
    expect(text).toContain('It makes me want to move');
    expect(text).toContain('Car ride');
  });
});

describe('family store persistence', () => {
  let storage: SnapshotStorage;

  beforeEach(async () => {
    storage = memoryStorage();
    await useFamilyStore.getState().init(new SnapshotRepository(storage));
  });

  /** Simulates closing and reopening the app on the same device. */
  const relaunch = () => useFamilyStore.getState().init(new SnapshotRepository(storage));

  it('starts empty and not onboarded', () => {
    const s = useFamilyStore.getState();
    expect(s.status).toBe('ready');
    expect(s.settings).toBeNull();
    expect(s.crate).toEqual([]);
    expect(s.unitOverviewAcknowledgements).toEqual([]);
    expect(s.projectResponses).toEqual([]);
  });

  it('keeps settings, crate, reflections and progress across a relaunch', async () => {
    const s = useFamilyStore.getState();
    await s.saveSettings(completedSettings);
    const added = await s.addToCrate(loveSosa);
    expect(added.ok).toBe(true);
    await s.saveReflection({ unitId: 'chief-keef', lessonId: 'ck-02-the-sound', feelings: ['hyped'], text: 'the bass slides' });
    await s.setExplored('ck-02-the-sound', true);
    await s.acknowledgeUnitOverview('chief-keef', 'why');
    await s.saveFinalProjectResponse({
      unitId: 'chief-keef',
      text: 'The sound changed while the influence kept moving.',
      earlyTrackIds: ['love-sosa'],
      laterTrackIds: ['kobe'],
    });

    await relaunch();
    const after = useFamilyStore.getState();
    expect(after.settings).toEqual(completedSettings);
    expect(after.crate).toHaveLength(1);
    expect(after.crate[0]).toMatchObject({ title: 'Love Sosa', why: ['move'], moment: 'car-ride' });
    expect(after.reflections[0]).toMatchObject({ lessonId: 'ck-02-the-sound', text: 'the bass slides' });
    expect(after.explored).toEqual(['ck-02-the-sound']);
    expect(after.unitOverviewAcknowledgements).toMatchObject([{ unitId: 'chief-keef', section: 'why' }]);
    expect(after.projectResponses).toMatchObject([{
      unitId: 'chief-keef',
      text: 'The sound changed while the influence kept moving.',
      earlyTrackIds: ['love-sosa'],
      laterTrackIds: ['kobe'],
    }]);
  });

  it('refuses a duplicate crate entry', async () => {
    await useFamilyStore.getState().addToCrate(loveSosa);
    const again = await useFamilyStore.getState().addToCrate({ ...loveSosa, why: ['cool'] });
    expect(again).toEqual({ ok: false, reason: 'duplicate' });
    expect(useFamilyStore.getState().crate).toHaveLength(1);
  });

  it('removes a crate entry and un-marks a lesson', async () => {
    const res = await useFamilyStore.getState().addToCrate(loveSosa);
    if (!res.ok) throw new Error('expected add');
    await useFamilyStore.getState().setExplored('ck-01-chicago', true);
    await useFamilyStore.getState().removeFromCrate(res.entry.id);
    await useFamilyStore.getState().setExplored('ck-01-chicago', false);
    await relaunch();
    expect(useFamilyStore.getState().crate).toEqual([]);
    expect(useFamilyStore.getState().explored).toEqual([]);
  });

  it('exports everything and deletes everything', async () => {
    const s = useFamilyStore.getState();
    await s.saveSettings(settings);
    await s.addToCrate(loveSosa);
    await s.acknowledgeUnitOverview('chief-keef', 'why');
    await s.saveFinalProjectResponse({
      unitId: 'chief-keef',
      text: 'A private project response.',
      earlyTrackIds: [],
      laterTrackIds: [],
    });
    const exported = await s.exportAll();
    expect(exported.settings?.nickname).toBe('Lil Listener');
    expect(exported.crate).toHaveLength(1);
    expect(exported.unitOverviewAcknowledgements).toHaveLength(1);
    expect(exported.projectResponses).toHaveLength(1);

    await s.deleteAll();
    await relaunch();
    const after = useFamilyStore.getState();
    expect(after.settings).toBeNull();
    expect(after.crate).toEqual([]);
    expect(after.unitOverviewAcknowledgements).toEqual([]);
    expect(after.projectResponses).toEqual([]);
  });

  it('loads older snapshots without briefing or project fields', async () => {
    storage.write(JSON.stringify({ settings, crate: [], reflections: [], explored: ['ck-01-chicago'] }));
    await relaunch();
    const after = useFamilyStore.getState();
    expect(after.explored).toEqual(['ck-01-chicago']);
    expect(after.unitOverviewAcknowledgements).toEqual([]);
    expect(after.projectResponses).toEqual([]);
    expect(after.settings?.fieldManualCompletedAt).toBeUndefined();
  });

  it('survives corrupted storage', async () => {
    storage.write('{not json');
    await relaunch();
    expect(useFamilyStore.getState().status).toBe('ready');
    expect(useFamilyStore.getState().crate).toEqual([]);
  });
});

describe('Final Project validation', () => {
  it('requires a response and limits it to 3000 characters', () => {
    const base = {
      unitId: 'chief-keef',
      earlyTrackIds: [],
      laterTrackIds: [],
      updatedAt: '2026-11-12T00:00:00.000Z',
    };
    expect(FinalProjectResponse.safeParse({ ...base, text: '  ' }).success).toBe(false);
    expect(FinalProjectResponse.safeParse({ ...base, text: 'x'.repeat(3001) }).success).toBe(false);
    expect(FinalProjectResponse.safeParse({ ...base, text: 'Our family response' }).success).toBe(true);
  });
});
