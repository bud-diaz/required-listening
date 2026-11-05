import type { FamilyRepository } from './FamilyRepository';
import { SnapshotRepository, localStorageStorage } from './snapshot-repository';

/**
 * Web preview: browser storage. Expo SQLite on web needs extra hosting headers,
 * and the shipping product is iOS/Android, so the preview keeps it simple.
 */
export function createRepository(): FamilyRepository {
  return new SnapshotRepository(localStorageStorage());
}
