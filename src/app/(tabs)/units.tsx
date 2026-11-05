import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { catalog, getUnit, visibleLessons } from '../../content';
import { Monogram } from '../../components/Monogram';
import { useFamilyStore } from '../../stores/family-store';
import { Kicker, Screen } from '../../ui/primitives';
import { colors, space, type } from '../../ui/theme';

export default function Units() {
  const lane = useFamilyStore((s) => s.settings!.lane);
  const explored = useFamilyStore((s) => s.explored);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker>Contents</Kicker>
        <Text style={[type.h1, { color: colors.ink }]}>Ten artists</Text>
        <Text style={[type.small, { color: colors.muted }]}>One passed-down track each. Start anywhere.</Text>
      </View>
      <View style={styles.grid}>
        {catalog.units.map((entry) => {
          const unit = entry.available ? getUnit(entry.id, __DEV__) : undefined;
          const lessons = unit ? visibleLessons(unit, lane) : [];
          const done = lessons.filter((l) => explored.includes(l.id)).length;
          return (
            <Pressable
              key={entry.id}
              disabled={!unit}
              accessibilityRole="button"
              accessibilityLabel={`Unit ${entry.number}, ${entry.displayName}${unit ? `, ${done} of ${lessons.length} explored` : ', coming soon'}`}
              onPress={() => router.push(`/unit/${entry.id}`)}
              style={({ pressed }) => [styles.tile, pressed && { backgroundColor: colors.goldSoft }]}
            >
              <Monogram text={entry.monogram} size={64} dim={!unit} />
              <Text style={[type.kicker, { color: colors.muted, fontSize: 10 }]}>Unit {entry.number}</Text>
              <Text style={[type.h2, { color: unit ? colors.ink : colors.muted, textAlign: 'center' }]}>{entry.displayName}</Text>
              <Text style={[type.small, { color: unit ? colors.goldDeep : colors.muted }]}>
                {unit ? `${done}/${lessons.length} explored` : 'Coming soon'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: space.xs,
    padding: space.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.paper,
  },
});
