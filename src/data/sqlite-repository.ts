import type { SQLiteDatabase } from 'expo-sqlite';
import {
  CrateEntry,
  FinalProjectResponse,
  Reflection,
  Settings,
  UnitOverviewAcknowledgement,
  type FamilyExport,
} from '../domain/crate';
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
    return rows.map((r) => r.lesson_id);
  }

  async setExplored(lessonId: string, explored: boolean): Promise<void> {
    await this.ready;
    if (explored) {
      await this.db.runAsync(
        'INSERT OR IGNORE INTO explored (lesson_id, explored_at) VALUES (?, ?)',
        lessonId,
        new Date().toISOString()
      );
    } else {
      await this.db.runAsync('DELETE FROM explored WHERE lesson_id = ?', lessonId);
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

  async exportAll(): Promise<FamilyExport> {
    const [settings, crate, reflections, explored, unitOverviewAcknowledgements, projectResponses] = await Promise.all([
      this.getSettings(),
      this.listCrate(),
      this.listReflections(),
      this.listExplored(),
      this.listUnitOverviewAcknowledgements(),
      this.listFinalProjectResponses(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      settings,
      crate,
      reflections,
      explored,
      unitOverviewAcknowledgements,
      projectResponses,
    };
  }

  async deleteAll(): Promise<void> {
    await this.ready;
    await this.db.withTransactionAsync(async () => {
      await this.db.execAsync(
        'DELETE FROM settings; DELETE FROM crate_entries; DELETE FROM reflections; DELETE FROM explored; DELETE FROM unit_overview_acknowledgements; DELETE FROM project_responses;'
      );
    });
  }
}
