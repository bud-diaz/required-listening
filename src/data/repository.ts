import { openDatabaseSync } from 'expo-sqlite';
import type { FamilyRepository } from './FamilyRepository';
import { SQLiteFamilyRepository } from './sqlite-repository';

/** Native (iOS/Android): Expo SQLite. See `repository.web.ts` for the web preview. */
export function createRepository(): FamilyRepository {
  return new SQLiteFamilyRepository(openDatabaseSync('required-listening.db'));
}
