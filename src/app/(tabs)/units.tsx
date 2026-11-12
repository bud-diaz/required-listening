import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { catalog, getUnit, visibleLessons } from '../../content';
import { Monogram } from '../../components/Monogram';
import { useFamilyStore } from '../../stores/family-store';
import { Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, RouteBadge } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

export default function Units() {
  const lane = useFamilyStore((s) => s.settings!.lane);
  const explored = useFamilyStore((s) => s.explored);

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Choose a route</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Route directory</Text>
        <Text style={[type.small, { color: colors.ink }]}>Ten artists. One passed-down track each. Start anywhere.</Text>
      </View>
      <RoadDivider />
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
              style={({ pressed }) => [styles.tile, !unit && styles.tileDisabled, pressed && { transform: [{ scale: 0.98 }] }]}
            >
              <RouteBadge unitNumber={entry.number} compact />
              <View style={styles.routeBody}>
                <Monogram text={entry.monogram} size={54} dim={!unit} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.h2, { color: unit ? colors.ink : colors.muted }]}>{entry.displayName}</Text>
                  <Text style={[type.small, { color: unit ? colors.ink : colors.muted, fontWeight: '700' }]}>
                    {unit ? `${done}/${lessons.length} explored` : 'Coming soon'}
                  </Text>
                </View>
                <Text style={styles.arrow}>{unit ? '→' : '—'}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.sm },
  tile: {
    gap: space.sm,
    padding: space.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  tileDisabled: { opacity: 0.58, borderStyle: 'dashed' },
  routeBody: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  arrow: { color: colors.ink, fontSize: 28, fontWeight: '900' },
});
