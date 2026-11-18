import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { availableLessonPacks } from '../../content/packs';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignButton, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

export default function LessonPacksScreen() {
  const installed = useFamilyStore((state) => state.installedPacks);
  const catalog = availableLessonPacks(__DEV__);
  const packs = [...new Map([...catalog, ...installed.map((item) => item.manifest)].map((pack) => [pack.packId, pack])).values()];

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Optional downloads</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Lesson packs</Text>
        <Body>Add a short collection to this device, then choose its lessons for your family’s plan.</Body>
      </View>
      <RoadDivider />

      {packs.length === 0 ? (
        <SignPanel title="No packs available yet">
          <Body>Approved lesson packs will appear here when they’re published.</Body>
        </SignPanel>
      ) : packs.map((pack) => {
        const saved = installed.find((item) => item.packId === pack.packId);
        return (
          <SignPanel key={pack.packId} title={`${pack.lessons.length} lessons · about ${pack.estimatedMinutesPerLesson} min each`}>
            <Text style={[type.h1, styles.title]}>{pack.title}</Text>
            <Body>{pack.summary}</Body>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{pack.publisher}</Text>
              <Text style={styles.meta}>{saved ? 'DOWNLOADED' : `${Math.max(1, Math.round(pack.downloadBytes / 1024))} KB`}</Text>
            </View>
            <SignButton
              label={saved ? 'Manage pack →' : 'View pack →'}
              variant={saved ? 'ink' : 'yellow'}
              onPress={() => router.push(`/packs/${pack.packId}`)}
            />
          </SignPanel>
        );
      })}

      <SignButton label="Open Lesson Plan →" variant="paper" onPress={() => router.push('/plan')} />
      {__DEV__ ? (
        <Text style={[type.small, { color: colors.ink }]}>Draft demo content is visible in development builds only.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  meta: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
});
