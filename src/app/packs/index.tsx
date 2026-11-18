import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { availableLessonPacks } from '../../content/packs';
import type { LessonPackCatalogEntry } from '../../domain/lesson-pack-catalog';
import {
  cachedRemoteLessonPacks,
  refreshRemoteLessonPackCatalog,
} from '../../services/lesson-pack-catalog';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignButton, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

type PackCard = {
  packId: string;
  version: number;
  title: string;
  theme: string;
  summary: string;
  publisher: string;
  lessonCount: number;
  downloadBytes: number;
};

export default function LessonPacksScreen() {
  const installed = useFamilyStore((state) => state.installedPacks);
  const bundled = availableLessonPacks(__DEV__);
  const [remote, setRemote] = useState<LessonPackCatalogEntry[]>(() => cachedRemoteLessonPacks(__DEV__));
  const [refreshing, setRefreshing] = useState(true);
  const [catalogError, setCatalogError] = useState<string>();

  const refresh = async (force: boolean) => {
    setRefreshing(true);
    setCatalogError(undefined);
    try {
      setRemote(await refreshRemoteLessonPackCatalog({ isDev: __DEV__, force }));
    } catch (error) {
      setRemote(cachedRemoteLessonPacks(__DEV__));
      setCatalogError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;
    void refreshRemoteLessonPackCatalog({ isDev: __DEV__ })
      .then((entries) => {
        if (active) setRemote(entries);
      })
      .catch((error) => {
        if (!active) return;
        setRemote(cachedRemoteLessonPacks(__DEV__));
        setCatalogError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const packs = useMemo(() => {
    const cards = new Map<string, PackCard>();
    for (const pack of [...bundled, ...installed.map((item) => item.manifest)]) {
      const existing = cards.get(pack.packId);
      if (!existing || pack.version >= existing.version) {
        cards.set(pack.packId, {
          packId: pack.packId,
          version: pack.version,
          title: pack.title,
          theme: pack.theme,
          summary: pack.summary,
          publisher: pack.publisher,
          lessonCount: pack.lessons.length,
          downloadBytes: pack.downloadBytes,
        });
      }
    }
    for (const entry of remote) {
      const existing = cards.get(entry.packId);
      if (!existing || entry.version > existing.version) {
        cards.set(entry.packId, {
          packId: entry.packId,
          version: entry.version,
          title: entry.title,
          theme: entry.theme,
          summary: entry.summary,
          publisher: entry.publisher,
          lessonCount: entry.lessonCount,
          downloadBytes: entry.downloadBytes,
        });
      }
    }
    return [...cards.values()];
  }, [bundled, installed, remote]);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Optional downloads</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Lesson packs</Text>
        <Body>Add a collection to this device, then choose its lessons for your family’s plan.</Body>
      </View>
      <RoadDivider />

      <View style={styles.catalogActions}>
        <Text style={styles.catalogStatus}>
          {refreshing
            ? 'Checking the Paperweight catalog…'
            : catalogError
              ? 'Offline or catalog unavailable. Showing saved and bundled packs.'
              : 'Paperweight catalog checked.'}
        </Text>
        <SignButton
          label={refreshing ? 'Checking…' : 'Refresh catalog ↻'}
          variant="outline"
          disabled={refreshing}
          onPress={() => void refresh(true)}
        />
      </View>

      {packs.length === 0 ? (
        <SignPanel title="No packs available yet">
          <Body>Approved lesson packs will appear here when they’re published.</Body>
        </SignPanel>
      ) : packs.map((pack) => {
        const saved = installed.find((item) => item.packId === pack.packId);
        const updateAvailable = Boolean(saved && pack.version > saved.version);
        return (
          <SignPanel key={pack.packId} title={`${pack.lessonCount} lessons · ${Math.max(1, Math.round(pack.downloadBytes / 1024))} KB`}>
            <Text style={[type.h1, styles.title]}>{pack.title}</Text>
            <Text style={styles.theme}>{pack.theme}</Text>
            <Body>{pack.summary}</Body>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{pack.publisher}</Text>
              <Text style={styles.meta}>
                {updateAvailable ? `UPDATE TO V${pack.version}` : saved ? `DOWNLOADED · V${saved.version}` : `VERSION ${pack.version}`}
              </Text>
            </View>
            <SignButton
              label={updateAvailable ? 'Review update →' : saved ? 'Manage pack →' : 'View pack →'}
              variant={saved ? 'ink' : 'yellow'}
              onPress={() => router.push(`/packs/${pack.packId}`)}
            />
          </SignPanel>
        );
      })}

      <SignButton label="Open Lesson Plan →" variant="paper" onPress={() => router.push('/plan')} />
      {__DEV__ ? (
        <Text style={[type.small, { color: colors.ink }]}>Draft pack content is visible in development builds only.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink },
  theme: { ...type.kicker, color: colors.ink },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  meta: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  catalogActions: { gap: space.xs },
  catalogStatus: { ...type.small, color: colors.ink },
});
