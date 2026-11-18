import { create } from 'zustand';
import { laneAllows } from '../content';
import {
  createCrateEntry,
  FinalProjectResponse,
  isDuplicate,
  newId,
  UnitOverviewAcknowledgement,
  type CrateEntry,
  type CrateEntryDraft,
  type FamilyExport,
  type FinalProjectResponse as FinalProjectResponseType,
  type Reflection,
  type Settings,
  type UnitOverviewAcknowledgement as UnitOverviewAcknowledgementType,
  type UnitOverviewSection,
} from '../domain/crate';
import type { FamilyRepository } from '../data/FamilyRepository';
import { CORE_COLLECTION_ID, contentKey, normalizeContentKey, type ContentRef } from '../domain/content-ref';
import {
  createInstalledPack,
  LessonPlanItem,
  normalizeLessonPlan,
  type InstalledPack,
  type LessonPack,
  type LessonPlanItem as LessonPlanItemType,
} from '../domain/lesson-packs';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export interface FamilyState {
  status: Status;
  error?: string;
  settings: Settings | null;
  crate: CrateEntry[];
  reflections: Reflection[];
  explored: string[];
  unitOverviewAcknowledgements: UnitOverviewAcknowledgementType[];
  projectResponses: FinalProjectResponseType[];
  installedPacks: InstalledPack[];
  lessonPlan: LessonPlanItemType[];

  init(repo: FamilyRepository): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  addToCrate(draft: CrateEntryDraft): Promise<{ ok: true; entry: CrateEntry } | { ok: false; reason: 'duplicate' }>;
  removeFromCrate(id: string): Promise<void>;
  saveReflection(input: Omit<Reflection, 'id' | 'createdAt'>): Promise<Reflection>;
  setExplored(ref: ContentRef | string, explored: boolean): Promise<void>;
  acknowledgeUnitOverview(unitId: string, section: UnitOverviewSection): Promise<UnitOverviewAcknowledgementType>;
  saveFinalProjectResponse(input: Omit<FinalProjectResponseType, 'updatedAt'>): Promise<FinalProjectResponseType>;
  installPack(pack: LessonPack): Promise<InstalledPack>;
  removePack(packId: string): Promise<void>;
  addPackToLessonPlan(packId: string, lessonIds?: string[]): Promise<number>;
  removeFromLessonPlan(id: string): Promise<void>;
  moveLessonPlanItem(id: string, direction: -1 | 1): Promise<void>;
  exportAll(): Promise<FamilyExport>;
  deleteAll(): Promise<void>;
}

let repo: FamilyRepository | null = null;
const requireRepo = (): FamilyRepository => {
  if (!repo) throw new Error('Family store used before init()');
  return repo;
};

/**
 * App state for one family. Every write goes to the repository first, then the
 * in-memory state, so what's on screen is what was saved.
 */
export const useFamilyStore = create<FamilyState>()((set, get) => ({
  status: 'idle',
  settings: null,
  crate: [],
  reflections: [],
  explored: [],
  unitOverviewAcknowledgements: [],
  projectResponses: [],
  installedPacks: [],
  lessonPlan: [],

  async init(r) {
    repo = r;
    set({ status: 'loading', error: undefined });
    try {
      const [
        settings,
        crate,
        reflections,
        explored,
        unitOverviewAcknowledgements,
        projectResponses,
        installedPacks,
        lessonPlan,
      ] = await Promise.all([
        r.getSettings(),
        r.listCrate(),
        r.listReflections(),
        r.listExplored(),
        r.listUnitOverviewAcknowledgements(),
        r.listFinalProjectResponses(),
        r.listInstalledPacks(),
        r.listLessonPlan(),
      ]);
      set({
        status: 'ready',
        settings,
        crate,
        reflections,
        explored: explored.map(normalizeContentKey),
        unitOverviewAcknowledgements,
        projectResponses,
        installedPacks,
        lessonPlan: normalizeLessonPlan(lessonPlan),
      });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
    }
  },

  async saveSettings(settings) {
    await requireRepo().saveSettings(settings);
    set({ settings });
  },

  async addToCrate(draft) {
    if (isDuplicate(get().crate, draft)) return { ok: false, reason: 'duplicate' };
    const entry = createCrateEntry(draft);
    await requireRepo().addCrateEntry(entry);
    set({ crate: [...get().crate, entry] });
    return { ok: true, entry };
  },

  async removeFromCrate(id) {
    await requireRepo().removeCrateEntry(id);
    set({ crate: get().crate.filter((e) => e.id !== id) });
  },

  async saveReflection(input) {
    const reflection: Reflection = {
      ...input,
      collectionId: input.collectionId ?? CORE_COLLECTION_ID,
      id: newId('refl'),
      createdAt: new Date().toISOString(),
    };
    await requireRepo().addReflection(reflection);
    set({ reflections: [...get().reflections, reflection] });
    return reflection;
  },

  async setExplored(ref, explored) {
    const key = contentKey(typeof ref === 'string' ? { collectionId: CORE_COLLECTION_ID, lessonId: ref } : ref);
    await requireRepo().setExplored(key, explored);
    const rest = get().explored.filter((id) => normalizeContentKey(id) !== key);
    set({ explored: explored ? [...rest, key] : rest });
  },

  async acknowledgeUnitOverview(unitId, section) {
    const acknowledgement = UnitOverviewAcknowledgement.parse({
      unitId,
      section,
      acknowledgedAt: new Date().toISOString(),
    });
    await requireRepo().addUnitOverviewAcknowledgement(acknowledgement);
    const rest = get().unitOverviewAcknowledgements.filter(
      (item) => item.unitId !== unitId || item.section !== section
    );
    set({ unitOverviewAcknowledgements: [...rest, acknowledgement] });
    return acknowledgement;
  },

  async saveFinalProjectResponse(input) {
    const response = FinalProjectResponse.parse({ ...input, updatedAt: new Date().toISOString() });
    await requireRepo().saveFinalProjectResponse(response);
    set({ projectResponses: [...get().projectResponses.filter((item) => item.unitId !== input.unitId), response] });
    return response;
  },

  async installPack(pack) {
    const current = get().installedPacks.find((item) => item.packId === pack.packId);
    const next = createInstalledPack(pack);
    const installed = current ? { ...next, installedAt: current.installedAt } : next;
    await requireRepo().saveInstalledPack(installed);
    set({ installedPacks: [...get().installedPacks.filter((item) => item.packId !== pack.packId), installed] });
    return installed;
  },

  async removePack(packId) {
    await requireRepo().removeInstalledPack(packId);
    set({
      installedPacks: get().installedPacks.filter((item) => item.packId !== packId),
      lessonPlan: normalizeLessonPlan(get().lessonPlan.filter((item) => item.content.collectionId !== packId)),
    });
  },

  async addPackToLessonPlan(packId, lessonIds) {
    const pack = get().installedPacks.find((item) => item.packId === packId)?.manifest;
    if (!pack) throw new Error('Install this lesson pack before adding it to the Lesson Plan.');
    const requested = new Set(lessonIds ?? pack.lessons.map((lesson) => lesson.id));
    const lane = get().settings?.lane ?? 'younger';
    const existing = new Set(get().lessonPlan.map((item) => contentKey(item.content)));
    const addedAt = new Date().toISOString();
    const additions = pack.lessons
      .filter((lesson) => requested.has(lesson.id))
      .filter((lesson) => laneAllows(lane, lesson.minLane))
      .filter((lesson) => !existing.has(contentKey({ collectionId: packId, lessonId: lesson.id })))
      .map((lesson, index) =>
        LessonPlanItem.parse({
          id: newId('plan'),
          content: { collectionId: packId, lessonId: lesson.id },
          position: get().lessonPlan.length + index,
          addedAt,
        })
      );
    const lessonPlan = normalizeLessonPlan([...get().lessonPlan, ...additions]);
    await requireRepo().replaceLessonPlan(lessonPlan);
    set({ lessonPlan });
    return additions.length;
  },

  async removeFromLessonPlan(id) {
    const lessonPlan = normalizeLessonPlan(get().lessonPlan.filter((item) => item.id !== id));
    await requireRepo().replaceLessonPlan(lessonPlan);
    set({ lessonPlan });
  },

  async moveLessonPlanItem(id, direction) {
    const items = normalizeLessonPlan(get().lessonPlan);
    const index = items.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    const lessonPlan = items.map((item, position) => ({ ...item, position }));
    await requireRepo().replaceLessonPlan(lessonPlan);
    set({ lessonPlan });
  },

  exportAll() {
    return requireRepo().exportAll();
  },

  async deleteAll() {
    await requireRepo().deleteAll();
    set({
      settings: null,
      crate: [],
      reflections: [],
      explored: [],
      unitOverviewAcknowledgements: [],
      projectResponses: [],
      installedPacks: [],
      lessonPlan: [],
    });
  },
}));
