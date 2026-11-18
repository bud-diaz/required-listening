import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CrateEntry,
  FinalProjectResponse,
  Reflection,
  Settings,
  UnitOverviewAcknowledgement,
  type FamilyExport,
} from '../domain/crate';
import { normalizeContentKey } from '../domain/content-ref';
import { InstalledPack, LessonPlanItem, normalizeLessonPlan } from '../domain/lesson-packs';
import type { FamilyRepository } from './FamilyRepository';

const SCHEMA = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS crate_entries (
  id TEXT PRIMARY KEY NOT NULL,
  added_at TEXT NOT NULL,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY NOT NULL,
  lesson_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS explored (lesson_id TEXT PRIMARY KEY NOT NULL, explored_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS unit_overview_acknowledgements (
  unit_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  acknowledged_at TEXT NOT NULL,
  json TEXT NOT NULL,
  PRIMARY KEY (unit_id, section_id)
);
CREATE TABLE IF NOT EXISTS project_responses (
  unit_id TEXT PRIMARY KEY NOT NULL,
  updated_at TEXT NOT NULL,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS installed_packs (
  pack_id TEXT PRIMARY KEY NOT NULL,
  version INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lesson_plan_items (
  id TEXT PRIMARY KEY NOT NULL,
  position INTEGER NOT NULL,
  collection_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  json TEXT NOT NULL
);
`;

type JsonRow = { json: string };

/**
 * Expo SQLite storage for native builds. Rows hold validated JSON so the
 * schema can grow without a migration for every field; indexes cover lookups.
 */
export class SQLiteFamilyRepository implements FamilyRepository {
  private ready: Promise<void>;

  constructor(private readonly db: SQLiteDatabase) {
    this.ready = db.execAsync(SCHEMA);
  }

  async getSettings(): Promise<Settings | null> {
    await this.ready;
    const row = await this.db.getFirstAsync<JsonRow>('SELECT json FROM settings WHERE id = 1');
    return row ? Settings.parse(JSON.parse(row.json)) : null;
  }

  async saveSettings(settings: Settings): Promise<void> {
    await this.ready;
    await this.db.runAsync(
      'INSERT INTO settings (id, json) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json',
      JSON.stringify(Settings.parse(settings))
    );
  }

  async listCrate(): Promise<CrateEntry[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<JsonRow>('SELECT json FROM crate_entries ORDER BY added_at');
    return rows.map((r) => CrateEntry.parse(JSON.parse(r.json)));
  }

  async addCrateEntry(entry: CrateEntry): Promise<void> {
    await this.ready;
    const valid = CrateEntry.parse(entry);
    await this.db.runAsync(
      'INSERT OR REPLACE INTO crate_entries (id, added_at, json) VALUES (?, ?, ?)',
      valid.id,
      valid.addedAt,
      JSON.stringify(valid)
    );
  }

  async removeCrateEntry(id: string): Promise<void> {
    await this.ready;
    await this.db.runAsync('DELETE FROM crate_entries WHERE id = ?', id);
  }

  async listReflections(): Promise<Reflection[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<JsonRow>('SELECT json FROM reflections ORDER BY created_at');
    return rows.map((r) => Reflection.parse(JSON.parse(r.json)));
  }

  async addReflection(reflection: Reflection): Promise<void> {
    await this.ready;
    const valid = Reflection.parse(reflection);
    await this.db.runAsync(
      'INSERT OR REPLACE INTO reflections (id, lesson_id, created_at, json) VALUES (?, ?, ?, ?)',
      valid.id,
      valid.lessonId,
      valid.createdAt,
      JSON.stringify(valid)
    );
  }

  async removeReflection(id: string): Promise<void> {
    await this.ready;
    await this.db.runAsync('DELETE FROM reflections WHERE id = ?', id);
  }

  async listExplored(): Promise<string[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<{ lesson_id: string }>('SELECT lesson_id FROM explored ORDER BY explored_at');
    return [...new Set(rows.map((r) => normalizeContentKey(r.lesson_id)))];
  }

  async setExplored(contentKey: string, explored: boolean): Promise<void> {
    await this.ready;
    const key = normalizeContentKey(contentKey);
    const legacyCoreId = key.startsWith('core-v1:') ? key.slice('core-v1:'.length) : key;
    if (explored) {
      await this.db.withTransactionAsync(async () => {
        if (legacyCoreId !== key) await this.db.runAsync('DELETE FROM explored WHERE lesson_id = ?', legacyCoreId);
        await this.db.runAsync(
          'INSERT OR IGNORE INTO explored (lesson_id, explored_at) VALUES (?, ?)',
          key,
          new Date().toISOString()
        );
      });
    } else {
      await this.db.runAsync('DELETE FROM explored WHERE lesson_id IN (?, ?)', key, legacyCoreId);
    }
  }

  async listUnitOverviewAcknowledgements(): Promise<UnitOverviewAcknowledgement[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<JsonRow>(
      'SELECT json FROM unit_overview_acknowledgements ORDER BY acknowledged_at'
    );
    return rows.map((row) => UnitOverviewAcknowledgement.parse(JSON.parse(row.json)));
  }

  async addUnitOverviewAcknowledgement(acknowledgement: UnitOverviewAcknowledgement): Promise<void> {
    await this.ready;
    const valid = UnitOverviewAcknowledgement.parse(acknowledgement);
    await this.db.runAsync(
      'INSERT OR REPLACE INTO unit_overview_acknowledgements (unit_id, section_id, acknowledged_at, json) VALUES (?, ?, ?, ?)',
      valid.unitId,
      valid.section,
      valid.acknowledgedAt,
      JSON.stringify(valid)
    );
  }

  async listFinalProjectResponses(): Promise<FinalProjectResponse[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<JsonRow>('SELECT json FROM project_responses ORDER BY updated_at');
    return rows.map((row) => FinalProjectResponse.parse(JSON.parse(row.json)));
  }

  async saveFinalProjectResponse(response: FinalProjectResponse): Promise<void> {
    await this.ready;
    const valid = FinalProjectResponse.parse(response);
    await this.db.runAsync(
      'INSERT OR REPLACE INTO project_responses (unit_id, updated_at, json) VALUES (?, ?, ?)',
      valid.unitId,
      valid.updatedAt,
      JSON.stringify(valid)
    );
  }

  async listInstalledPacks(): Promise<InstalledPack[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<JsonRow>('SELECT json FROM installed_packs ORDER BY updated_at DESC');
    return rows.flatMap((row) => {
      const result = InstalledPack.safeParse(JSON.parse(row.json));
      return result.success ? [result.data] : [];
    });
  }

  async saveInstalledPack(pack: InstalledPack): Promise<void> {
    await this.ready;
    const valid = InstalledPack.parse(pack);
    await this.db.runAsync(
      'INSERT OR REPLACE INTO installed_packs (pack_id, version, updated_at, json) VALUES (?, ?, ?, ?)',
      valid.packId,
      valid.version,
      valid.updatedAt,
      JSON.stringify(valid)
    );
  }

  async removeInstalledPack(packId: string): Promise<void> {
    await this.ready;
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync('DELETE FROM installed_packs WHERE pack_id = ?', packId);
      await this.db.runAsync('DELETE FROM lesson_plan_items WHERE collection_id = ?', packId);
    });
  }

  async listLessonPlan(): Promise<LessonPlanItem[]> {
    await this.ready;
    const rows = await this.db.getAllAsync<JsonRow>('SELECT json FROM lesson_plan_items ORDER BY position');
    return normalizeLessonPlan(
      rows.flatMap((row) => {
        const result = LessonPlanItem.safeParse(JSON.parse(row.json));
        return result.success ? [result.data] : [];
      })
    );
  }

  async replaceLessonPlan(items: LessonPlanItem[]): Promise<void> {
    await this.ready;
    const valid = normalizeLessonPlan(items.map((item) => LessonPlanItem.parse(item)));
    await this.db.withTransactionAsync(async () => {
      await this.db.execAsync('DELETE FROM lesson_plan_items');
      for (const item of valid) {
        await this.db.runAsync(
          'INSERT INTO lesson_plan_items (id, position, collection_id, lesson_id, json) VALUES (?, ?, ?, ?, ?)',
          item.id,
          item.position,
          item.content.collectionId,
          item.content.lessonId,
          JSON.stringify(item)
        );
      }
    });
  }

  async exportAll(): Promise<FamilyExport> {
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
      this.getSettings(),
      this.listCrate(),
      this.listReflections(),
      this.listExplored(),
      this.listUnitOverviewAcknowledgements(),
      this.listFinalProjectResponses(),
      this.listInstalledPacks(),
      this.listLessonPlan(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      settings,
      crate,
      reflections,
      explored,
      unitOverviewAcknowledgements,
      projectResponses,
      installedPacks,
      lessonPlan,
    };
  }

  async deleteAll(): Promise<void> {
    await this.ready;
    await this.db.withTransactionAsync(async () => {
      await this.db.execAsync(
        'DELETE FROM settings; DELETE FROM crate_entries; DELETE FROM reflections; DELETE FROM explored; DELETE FROM unit_overview_acknowledgements; DELETE FROM project_responses; DELETE FROM installed_packs; DELETE FROM lesson_plan_items;'
      );
    });
  }
}
