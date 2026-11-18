import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { isContentExplored } from '../domain/content-ref';
import { laneAllows } from '../content';
import { useFamilyStore } from '../stores/family-store';
import { Body, Kicker, Screen } from '../ui/primitives';
import { RoadDivider, SignButton, SignPanel } from '../ui/signage';
import { colors, space, type } from '../ui/theme';

export default function LessonPlanScreen() {
  const plan = useFamilyStore((state) => state.lessonPlan);
  const installed = useFamilyStore((state) => state.installedPacks);
  const explored = useFamilyStore((state) => state.explored);
  const lane = useFamilyStore((state) => state.settings?.lane ?? 'younger');
  const remove = useFamilyStore((state) => state.removeFromLessonPlan);
  const move = useFamilyStore((state) => state.moveLessonPlanItem);

  const resolved = plan.map((item) => {
    const pack = installed.find((candidate) => candidate.packId === item.content.collectionId)?.manifest;
    return { item, pack, lesson: pack?.lessons.find((lesson) => lesson.id === item.content.lessonId) };
  });

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Your family’s queue</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Lesson Plan</Text>
        <Body>Choose the order. Progress is still something your family marks for yourselves.</Body>
      </View>
      <RoadDivider />

      {resolved.length === 0 ? (
        <SignPanel title="Your plan is open">
          <Body>Browse lesson packs and add one lesson or a whole pack.</Body>
          <SignButton label="Browse lesson packs →" variant="yellow" onPress={() => router.push('/packs')} />
        </SignPanel>
      ) : resolved.map(({ item, pack, lesson }, index) => {
        const done = isContentExplored(explored, item.content);
        const laneVisible = lesson ? laneAllows(lane, lesson.minLane) : false;
        return (
          <SignPanel key={item.id} title={`${String(index + 1).padStart(2, '0')} · ${pack?.title ?? 'Unavailable pack'}`}>
            <Text style={[type.h2, { color: colors.ink }]}>{lesson?.title ?? item.content.lessonId}</Text>
            <Text style={styles.status}>{!laneVisible ? 'HIDDEN ON CURRENT LANE' : done ? 'EXPLORED ✓' : 'READY'}</Text>
            {pack && lesson && laneVisible ? (
              <SignButton
                label={done ? 'Open again →' : 'Start lesson →'}
                variant="ink"
                onPress={() => router.push(`/pack-lesson/${pack.packId}/${lesson.id}`)}
              />
            ) : null}
            <View style={styles.controls}>
              <SignButton label="↑" variant="paper" disabled={index === 0} onPress={() => void move(item.id, -1)} style={styles.control} />
              <SignButton label="↓" variant="paper" disabled={index === resolved.length - 1} onPress={() => void move(item.id, 1)} style={styles.control} />
              <SignButton label="Remove" variant="outline" onPress={() => void remove(item.id)} style={styles.remove} />
            </View>
          </SignPanel>
        );
      })}

      {resolved.length > 0 ? <SignButton label="Browse more packs →" variant="paper" onPress={() => router.push('/packs')} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  controls: { flexDirection: 'row', gap: space.xs },
  control: { width: 54 },
  remove: { flex: 1 },
});
