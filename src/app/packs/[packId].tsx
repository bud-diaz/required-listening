import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { availableLessonPacks } from '../../content/packs';
import { laneAllows } from '../../content';
import { isContentExplored } from '../../domain/content-ref';
import { useFamilyStore } from '../../stores/family-store';
import { Body, DraftBanner, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignButton, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

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
  const pack = saved?.manifest ?? availableLessonPacks(__DEV__).find((item) => item.packId === packId);

  if (!pack) {
    return <Screen><SignPanel title="Pack unavailable"><Body>This lesson pack isn’t available on this device.</Body></SignPanel></Screen>;
  }
  const planned = new Set(
    lessonPlan.filter((item) => item.content.collectionId === pack.packId).map((item) => item.content.lessonId)
  );
  const visibleLessons = pack.lessons.filter((lesson) => laneAllows(lane, lesson.minLane));
  const allVisiblePlanned = visibleLessons.length > 0 && visibleLessons.every((lesson) => planned.has(lesson.id));

  const addAll = async () => {
    await addPackToLessonPlan(pack.packId);
    router.push('/plan');
  };

  const addOne = async (lessonId: string) => {
    await addPackToLessonPlan(pack.packId, [lessonId]);
  };

  const confirmRemove = () => Alert.alert(
    'Remove lesson pack?',
    'The downloaded pack and its Lesson Plan items will be removed. Saved progress and reflections stay on this device.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void removePack(pack.packId).then(() => router.back()) },
    ]
  );

  return (
    <Screen>
      {pack.review.status !== 'approved' ? (
        <DraftBanner message="DRAFT DEMO · This pack is available only in development builds." />
      ) : null}
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>{pack.publisher} · version {pack.version}</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{pack.title}</Text>
        <Body>{pack.summary}</Body>
        <Text style={styles.metadata}>
          {pack.lessons.length} lessons · about {Math.max(1, Math.round(pack.downloadBytes / 1024))} KB
        </Text>
      </View>
      <RoadDivider />
      {!saved ? (
        <SignPanel title="Download first">
          <Body>Save this pack for offline use. Downloading it does not change your Lesson Plan.</Body>
          <SignButton label="Download to this device ↓" variant="ink" onPress={() => void installPack(pack)} />
        </SignPanel>
      ) : (
        <SignButton
          label={allVisiblePlanned ? 'All lane-visible lessons are in your plan ✓' : 'Add all to Lesson Plan →'}
          variant="ink"
          disabled={allVisiblePlanned}
          onPress={addAll}
        />
      )}

      <View style={{ gap: space.sm }}>
        {pack.lessons.map((lesson) => {
          const done = isContentExplored(explored, { collectionId: pack.packId, lessonId: lesson.id });
          const isPlanned = planned.has(lesson.id);
          const laneVisible = laneAllows(lane, lesson.minLane);
          return (
            <SignPanel key={lesson.id} title={`Lesson ${String(lesson.number).padStart(2, '0')}${done ? ' · explored' : ''}`}>
              <Text style={[type.h2, { color: colors.ink }]}>{lesson.title}</Text>
              <SignButton
                label={!laneVisible ? 'Not on current listening lane' : !saved ? 'Download pack to add' : isPlanned ? 'In Lesson Plan ✓' : 'Add this lesson +'}
                variant={isPlanned || !saved || !laneVisible ? 'outline' : 'yellow'}
                disabled={isPlanned || !saved || !laneVisible}
                onPress={() => void addOne(lesson.id)}
              />
            </SignPanel>
          );
        })}
      </View>

      {saved ? (
        <SignButton label="Remove downloaded pack" variant="outline" onPress={confirmRemove} />
      ) : null}
      <Text style={styles.note}>Downloads stay on this device. Removing a pack does not erase family responses.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  metadata: { ...type.small, color: colors.ink, fontWeight: '800' },
  note: { ...type.small, color: colors.ink, textAlign: 'center' },
});
