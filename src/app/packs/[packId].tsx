import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import appJson from '../../../app.json';
import {
  availableLessonPacks,
  getBundledPackCatalogEntry,
} from '../../content/packs';
import { laneAllows } from '../../content';
import { isContentExplored } from '../../domain/content-ref';
import type { LessonPackCatalogEntry } from '../../domain/lesson-pack-catalog';
import {
  getCachedRemoteLessonPack,
  refreshRemoteLessonPackCatalog,
} from '../../services/lesson-pack-catalog';
import { downloadAndVerifyLessonPack } from '../../services/lesson-pack-download';
import { useFamilyStore } from '../../stores/family-store';
import { Body, DraftBanner, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignButton, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

type DownloadState = 'idle' | 'downloading' | 'installing' | 'failed';

export default function LessonPackDetailScreen() {
  const { packId } = useLocalSearchParams<{ packId: string }>();
  const installed = useFamilyStore((state) => state.installedPacks);
  const lessonPlan = useFamilyStore((state) => state.lessonPlan);
  const explored = useFamilyStore((state) => state.explored);
  const lane = useFamilyStore((state) => state.settings?.lane ?? 'younger');
  const installPack = useFamilyStore((state) => state.installPack);
  const removePack = useFamilyStore((state) => state.removePack);
  const addPackToLessonPlan = useFamilyStore((state) => state.addPackToLessonPlan);
  const saved = installed.find((item) => item.packId === packId);
  const bundled = availableLessonPacks(__DEV__).find((item) => item.packId === packId);
  const bundledEntry = getBundledPackCatalogEntry(packId);
  const [remoteEntry, setRemoteEntry] = useState<LessonPackCatalogEntry | undefined>(() =>
    getCachedRemoteLessonPack(packId, __DEV__)
  );
  const [catalogLoading, setCatalogLoading] = useState(!saved && !bundled);
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [receivedBytes, setReceivedBytes] = useState(0);
  const [downloadError, setDownloadError] = useState<string>();

  useEffect(() => {
    let active = true;
    void refreshRemoteLessonPackCatalog({ isDev: __DEV__ })
      .then(() => {
        if (active) setRemoteEntry(getCachedRemoteLessonPack(packId, __DEV__));
      })
      .catch(() => {
        if (active) setRemoteEntry(getCachedRemoteLessonPack(packId, __DEV__));
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => {
      active = false;
    };
  }, [packId]);

  const targetEntry = useMemo<LessonPackCatalogEntry | undefined>(() => {
    const entries = [bundledEntry, remoteEntry].filter((entry): entry is LessonPackCatalogEntry => Boolean(entry));
    return entries.sort((a, b) => b.version - a.version)[0];
  }, [bundledEntry, remoteEntry]);
  const updateAvailable = Boolean(saved && targetEntry && targetEntry.version > saved.version);
  const targetBundled = bundled && (!targetEntry || bundled.version === targetEntry.version) ? bundled : undefined;
  const pack = updateAvailable ? targetBundled ?? saved?.manifest : saved?.manifest ?? bundled;
  const display = targetEntry ?? pack;

  const planned = new Set(
    lessonPlan.filter((item) => item.content.collectionId === packId).map((item) => item.content.lessonId)
  );
  const visibleLessons = pack?.lessons.filter((lesson) => laneAllows(lane, lesson.minLane)) ?? [];
  const allVisiblePlanned = visibleLessons.length > 0 && visibleLessons.every((lesson) => planned.has(lesson.id));

  const addAll = async () => {
    await addPackToLessonPlan(packId);
    router.push('/plan');
  };

  const addOne = async (lessonId: string) => {
    await addPackToLessonPlan(packId, [lessonId]);
  };

  const download = async () => {
    if (!targetEntry && !targetBundled) return;
    setDownloadError(undefined);
    setReceivedBytes(0);
    setDownloadState('downloading');
    try {
      const downloaded = targetBundled ?? await downloadAndVerifyLessonPack({
        entry: targetEntry!,
        appVersion: appJson.expo.version,
        isDev: __DEV__,
        onProgress: ({ receivedBytes: received }) => setReceivedBytes(received),
      });
      setDownloadState('installing');
      await installPack(downloaded, {
        sha256: targetEntry?.sha256 ?? null,
        downloadBytes: targetEntry?.downloadBytes ?? downloaded.downloadBytes,
      });
      setReceivedBytes(targetEntry?.downloadBytes ?? downloaded.downloadBytes);
      setDownloadState('idle');
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : String(error));
      setDownloadState('failed');
    }
  };

  const confirmRemove = () => Alert.alert(
    'Remove lesson pack?',
    'The downloaded pack and its Lesson Plan items will be removed. Saved progress and reflections stay on this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void removePack(packId).then(() => router.back()) },
    ]
  );

  if (!display) {
    return (
      <Screen>
        <SignPanel title={catalogLoading ? 'Checking catalog…' : 'Pack unavailable'}>
          <Body>{catalogLoading ? 'Looking for this lesson pack.' : 'This lesson pack isn’t available on this device.'}</Body>
        </SignPanel>
      </Screen>
    );
  }

  const lessonCount = 'lessonCount' in display ? display.lessonCount : display.lessons.length;
  const downloadBytes = targetEntry?.downloadBytes ?? pack?.downloadBytes ?? 0;
  const sectionStarts = new Map(pack?.sections.map((section) => [section.lessonIds[0], section]) ?? []);
  const progressPercent = downloadBytes > 0 ? Math.min(100, Math.round((receivedBytes / downloadBytes) * 100)) : 0;

  return (
    <Screen>
      {display.review.status !== 'approved' ? (
        <DraftBanner message="DRAFT PACK · Development builds only. Editorial review is required before publishing." />
      ) : null}
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>{display.publisher} · version {display.version}</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{display.title}</Text>
        <Text style={styles.theme}>{display.theme}</Text>
        <Body>{display.summary}</Body>
        <Text style={styles.metadata}>
          {lessonCount} lessons · about {Math.max(1, Math.round(downloadBytes / 1024))} KB
        </Text>
      </View>
      <RoadDivider />

      {pack ? (
        <SignPanel title="The lesson at the center">
          <Body>{pack.centralLesson}</Body>
          {pack.educationalConnections.map((connection) => (
            <Text key={connection} style={styles.connection}>• {connection}</Text>
          ))}
        </SignPanel>
      ) : null}

      {!saved || updateAvailable ? (
        <SignPanel title={updateAvailable ? `Update from version ${saved?.version} to ${targetEntry?.version}` : 'Download first'}>
          <Body>
            {updateAvailable
              ? 'The current version stays active until the replacement is fully downloaded, verified, and saved.'
              : 'Save this pack for offline use. Downloading it does not change your Lesson Plan.'}
          </Body>
          {downloadState === 'downloading' ? <Text style={styles.progress}>Downloading and verifying… {progressPercent}%</Text> : null}
          {downloadState === 'installing' ? <Text style={styles.progress}>Installing verified pack…</Text> : null}
          {downloadError ? <Text style={styles.error}>{downloadError}</Text> : null}
          <SignButton
            label={downloadState === 'failed' ? 'Retry download ↻' : updateAvailable ? 'Download verified update ↓' : 'Download to this device ↓'}
            variant="ink"
            disabled={downloadState === 'downloading' || downloadState === 'installing'}
            onPress={() => void download()}
          />
        </SignPanel>
      ) : (
        <SignButton
          label={allVisiblePlanned ? 'All lane-visible lessons are in your plan ✓' : 'Add all to Lesson Plan →'}
          variant="ink"
          disabled={allVisiblePlanned}
          onPress={addAll}
        />
      )}

      {pack ? (
        <View style={{ gap: space.sm }}>
          {pack.lessons.map((lesson) => {
            const section = sectionStarts.get(lesson.id);
            const done = isContentExplored(explored, { collectionId: pack.packId, lessonId: lesson.id });
            const isPlanned = planned.has(lesson.id);
            const laneVisible = laneAllows(lane, lesson.minLane);
            return (
              <View key={lesson.id} style={{ gap: space.sm }}>
                {section ? (
                  <View style={styles.sectionHeading}>
                    <Kicker color={colors.yellow}>Source unit</Kicker>
                    <Text style={[type.h1, { color: colors.paper }]}>{section.title}</Text>
                    <Text style={[type.small, { color: colors.paper }]}>{section.summary}</Text>
                  </View>
                ) : null}
                <SignPanel title={`Lesson ${String(lesson.number).padStart(2, '0')}${done ? ' · explored' : ''}`}>
                  <Text style={[type.h2, { color: colors.ink }]}>{lesson.title}</Text>
                  <SignButton
                    label={!laneVisible ? 'Not on current listening lane' : !saved ? 'Download pack to add' : isPlanned ? 'In Lesson Plan ✓' : 'Add this lesson +'}
                    variant={isPlanned || !saved || !laneVisible ? 'outline' : 'yellow'}
                    disabled={isPlanned || !saved || !laneVisible}
                    onPress={() => void addOne(lesson.id)}
                  />
                </SignPanel>
              </View>
            );
          })}
        </View>
      ) : (
        <SignPanel title="Lesson list downloads with the pack">
          <Body>The verified manifest contains all {lessonCount} lessons and their listening metadata.</Body>
        </SignPanel>
      )}

      {saved ? (
        <SignPanel title="Storage">
          <Body>Version {saved.version} uses about {Math.max(1, Math.round(saved.downloadBytes / 1024))} KB on this device.</Body>
          <SignButton label="Remove downloaded pack" variant="outline" onPress={confirmRemove} />
        </SignPanel>
      ) : null}
      <Text style={styles.note}>Downloads stay on this device. Removing a pack does not erase family responses.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metadata: { ...type.small, color: colors.ink, fontWeight: '800' },
  theme: { ...type.h2, color: colors.ink },
  note: { ...type.small, color: colors.ink, textAlign: 'center' },
  connection: { ...type.small, color: colors.ink },
  progress: { ...type.small, color: colors.ink, fontWeight: '900' },
  error: { ...type.small, color: colors.red, fontWeight: '800' },
  sectionHeading: { backgroundColor: colors.ink, padding: space.md, gap: space.xs },
});
