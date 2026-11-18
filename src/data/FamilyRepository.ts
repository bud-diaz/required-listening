import type {
  CrateEntry,
  FamilyExport,
  FinalProjectResponse,
  Reflection,
  Settings,
  UnitOverviewAcknowledgement,
} from '../domain/crate';
import type { InstalledPack, LessonPlanItem } from '../domain/lesson-packs';

/**
 * Local-first storage for one family. Native builds use Expo SQLite
 * (`sqlite-repository.ts`); web previews and tests use a JSON snapshot
 * (`snapshot-repository.ts`). Optional cloud sync would be another adapter.
 */
export interface FamilyRepository {
  getSettings(): Promise<Settings | null>;
  saveSettings(settings: Settings): Promise<void>;

  listCrate(): Promise<CrateEntry[]>;
  addCrateEntry(entry: CrateEntry): Promise<void>;
  removeCrateEntry(id: string): Promise<void>;

  listReflections(): Promise<Reflection[]>;
  addReflection(reflection: Reflection): Promise<void>;
  removeReflection(id: string): Promise<void>;

  listExplored(): Promise<string[]>;
  setExplored(contentKey: string, explored: boolean): Promise<void>;

  listUnitOverviewAcknowledgements(): Promise<UnitOverviewAcknowledgement[]>;
  addUnitOverviewAcknowledgement(acknowledgement: UnitOverviewAcknowledgement): Promise<void>;

  listFinalProjectResponses(): Promise<FinalProjectResponse[]>;
  saveFinalProjectResponse(response: FinalProjectResponse): Promise<void>;

  listInstalledPacks(): Promise<InstalledPack[]>;
  saveInstalledPack(pack: InstalledPack): Promise<void>;
  removeInstalledPack(packId: string): Promise<void>;

  listLessonPlan(): Promise<LessonPlanItem[]>;
  replaceLessonPlan(items: LessonPlanItem[]): Promise<void>;

  exportAll(): Promise<FamilyExport>;
  /** Wipes every family record on this device. */
  deleteAll(): Promise<void>;
}
