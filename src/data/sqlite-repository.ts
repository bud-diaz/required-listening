import type { SQLiteDatabase } from 'expo-sqlite';
import { CrateEntry, Reflection, Settings, type FamilyExport } from '../domain/crate';
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

  async exportAll(): Promise<FamilyExport> {
    const [settings, crate, reflections, explored] = await Promise.all([
      this.getSettings(),
      this.listCrate(),
      this.listReflections(),
      this.listExplored(),
    ]);
    return { exportedAt: new Date().toISOString(), settings, crate, reflections, explored };
  }

  async deleteAll(): Promise<void> {
    await this.ready;
    await this.db.withTransactionAsync(async () => {
      await this.db.execAsync(
        'DELETE FROM settings; DELETE FROM crate_entries; DELETE FROM reflections; DELETE FROM explored;'
      );
    });
  }
}
