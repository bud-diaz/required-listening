import { create } from 'zustand';
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

  init(repo: FamilyRepository): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  addToCrate(draft: CrateEntryDraft): Promise<{ ok: true; entry: CrateEntry } | { ok: false; reason: 'duplicate' }>;
  removeFromCrate(id: string): Promise<void>;
  saveReflection(input: Omit<Reflection, 'id' | 'createdAt'>): Promise<Reflection>;
  setExplored(lessonId: string, explored: boolean): Promise<void>;
  acknowledgeUnitOverview(unitId: string, section: UnitOverviewSection): Promise<UnitOverviewAcknowledgementType>;
  saveFinalProjectResponse(input: Omit<FinalProjectResponseType, 'updatedAt'>): Promise<FinalProjectResponseType>;
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

  async init(r) {
    repo = r;
    set({ status: 'loading', error: undefined });
    try {
      const [settings, crate, reflections, explored, unitOverviewAcknowledgements, projectResponses] = await Promise.all([
        r.getSettings(),
        r.listCrate(),
        r.listReflections(),
        r.listExplored(),
        r.listUnitOverviewAcknowledgements(),
        r.listFinalProjectResponses(),
      ]);
      set({ status: 'ready', settings, crate, reflections, explored, unitOverviewAcknowledgements, projectResponses });
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
    const reflection: Reflection = { ...input, id: newId('refl'), createdAt: new Date().toISOString() };
    await requireRepo().addReflection(reflection);
    set({ reflections: [...get().reflections, reflection] });
    return reflection;
  },

  async setExplored(lessonId, explored) {
    await requireRepo().setExplored(lessonId, explored);
    const rest = get().explored.filter((id) => id !== lessonId);
    set({ explored: explored ? [...rest, lessonId] : rest });
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
    });
  },
}));
