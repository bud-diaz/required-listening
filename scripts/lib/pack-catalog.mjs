import { readFile, writeFile } from 'node:fs/promises';

export const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * Upsert one pack's catalog entry by packId, preserving every other pack's entry and
 * position so running one pack's build script never clobbers another pack's catalog row.
 */
export async function upsertCatalogEntry(catalogPath, entry, generatedAt) {
  let catalog = { schemaVersion: 1, generatedAt, packs: [] };
  try {
    catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const index = catalog.packs.findIndex((existing) => existing.packId === entry.packId);
  if (index >= 0) catalog.packs[index] = entry;
  else catalog.packs.push(entry);
  catalog.generatedAt = generatedAt;
  await writeFile(catalogPath, serialize(catalog));
}
