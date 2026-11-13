import type {
  CrateEntry,
  FamilyExport,
  FinalProjectResponse,
  Reflection,
  Settings,
  UnitOverviewAcknowledgement,
} from '../domain/crate';
import type { FamilyRepository } from './FamilyRepository';

type Snapshot = Omit<FamilyExport, 'exportedAt'>;

const empty = (): Snapshot => ({
  settings: null,
  crate: [],
  reflections: [],
  explored: [],
  unitOverviewAcknowledgements: [],
  projectResponses: [],
});

export interface SnapshotStorage {
  read(): string | null;
  write(value: string): void;
  clear(): void;
}

/** In-memory storage, used by tests. */
export function memoryStorage(): SnapshotStorage {
  let value: string | null = null;
  return {
    read: () => value,
    write: (v) => {
      value = v;
    },
    clear: () => {
      value = null;
    },
  };
}

/** Browser localStorage, used by the web preview. Failures fall back to memory. */
export function localStorageStorage(key = 'required-listening.family.v1'): SnapshotStorage {
  const fallback = memoryStorage();
  const ls = (): Storage | null => {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  };
  return {
    read: () => {
      try {
        return ls()?.getItem(key) ?? fallback.read();
      } catch {
        return fallback.read();
      }
    },
    write: (v) => {
      fallback.write(v);
      try {
        ls()?.setItem(key, v);
      } catch {
        /* storage blocked: keep the in-memory copy */
      }
    },
    clear: () => {
      fallback.clear();
      try {
        ls()?.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

/** A repository that stores the whole family record as one JSON document. */
export class SnapshotRepository implements FamilyRepository {
  constructor(private readonly storage: SnapshotStorage) {}

  private load(): Snapshot {
    const raw = this.storage.read();
    if (!raw) return empty();
    try {
      return { ...empty(), ...(JSON.parse(raw) as Partial<Snapshot>) };
    } catch {
      return empty();
    }
  }

  private update(fn: (s: Snapshot) => Snapshot): void {
    this.storage.write(JSON.stringify(fn(this.load())));
  }

  async getSettings(): Promise<Settings | null> {
    return this.load().settings;
  }
  async saveSettings(settings: Settings): Promise<void> {
    this.update((s) => ({ ...s, settings }));
  }

  async listCrate(): Promise<CrateEntry[]> {
    return this.load().crate;
  }
  async addCrateEntry(entry: CrateEntry): Promise<void> {
    this.update((s) => ({ ...s, crate: [...s.crate.filter((e) => e.id !== entry.id), entry] }));
  }
  async removeCrateEntry(id: string): Promise<void> {
    this.update((s) => ({ ...s, crate: s.crate.filter((e) => e.id !== id) }));
  }

  async listReflections(): Promise<Reflection[]> {
    return this.load().reflections;
  }
  async addReflection(reflection: Reflection): Promise<void> {
    this.update((s) => ({ ...s, reflections: [...s.reflections, reflection] }));
  }
  async removeReflection(id: string): Promise<void> {
    this.update((s) => ({ ...s, reflections: s.reflections.filter((r) => r.id !== id) }));
  }

  async listExplored(): Promise<string[]> {
    return this.load().explored;
  }
  async setExplored(lessonId: string, explored: boolean): Promise<void> {
    this.update((s) => {
      const rest = s.explored.filter((id) => id !== lessonId);
      return { ...s, explored: explored ? [...rest, lessonId] : rest };
    });
  }

  async listUnitOverviewAcknowledgements(): Promise<UnitOverviewAcknowledgement[]> {
    return this.load().unitOverviewAcknowledgements;
  }
  async addUnitOverviewAcknowledgement(acknowledgement: UnitOverviewAcknowledgement): Promise<void> {
    this.update((s) => ({
      ...s,
      unitOverviewAcknowledgements: [
        ...s.unitOverviewAcknowledgements.filter(
          (item) => item.unitId !== acknowledgement.unitId || item.section !== acknowledgement.section
        ),
        acknowledgement,
      ],
    }));
  }

  async listFinalProjectResponses(): Promise<FinalProjectResponse[]> {
    return this.load().projectResponses;
  }
  async saveFinalProjectResponse(response: FinalProjectResponse): Promise<void> {
    this.update((s) => ({
      ...s,
      projectResponses: [...s.projectResponses.filter((item) => item.unitId !== response.unitId), response],
    }));
  }

  async exportAll(): Promise<FamilyExport> {
    return { exportedAt: new Date().toISOString(), ...this.load() };
  }
  async deleteAll(): Promise<void> {
    this.storage.clear();
  }
}
