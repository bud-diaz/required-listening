import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { catalog, getUnit, visibleLessons } from '../../content';
import { Monogram } from '../../components/Monogram';
import { coreContentRef, isContentExplored } from '../../domain/content-ref';
import { activatedPackRoutes } from '../../domain/routes';
import { useFamilyStore } from '../../stores/family-store';
import { Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, RouteBadge } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

interface RouteTile {
  id: string;
  number: number;
  monogram: string;
  displayName: string;
  done: number;
  total: number;
  available: boolean;
  href: string;
}

export default function Units() {
  const lane = useFamilyStore((s) => s.settings!.lane);
  const explored = useFamilyStore((s) => s.explored);
  const installedPacks = useFamilyStore((s) => s.installedPacks);
  const lessonPlan = useFamilyStore((s) => s.lessonPlan);

  const coreTiles: RouteTile[] = catalog.units.map((entry) => {
    const unit = entry.available ? getUnit(entry.id, __DEV__) : undefined;
    const lessons = unit ? visibleLessons(unit, lane) : [];
    const done = lessons.filter((l) => isContentExplored(explored, coreContentRef(l.id))).length;
    return {
      id: entry.id,
      number: entry.number,
      monogram: entry.monogram,
      displayName: entry.displayName,
      done,
      total: lessons.length,
      available: !!unit,
      href: `/unit/${entry.id}`,
    };
  });
  const packTiles: RouteTile[] = activatedPackRoutes(installedPacks, lessonPlan, lane).map((route) => ({
    id: route.id,
    number: route.number,
    monogram: route.monogram,
    displayName: route.displayName,
    done: route.lessonIds.filter((id) => isContentExplored(explored, route.contentRef(id))).length,
    total: route.lessonIds.length,
    available: true,
    href: route.unitHref,
  }));
  const tiles = [...coreTiles, ...packTiles];

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Choose a route</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Route directory</Text>
        <Text style={[type.small, { color: colors.ink }]}>
          {tiles.length} artist routes. One passed-down track each. Start anywhere.
        </Text>
      </View>
      <RoadDivider />
      <View style={styles.grid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            disabled={!tile.available}
            accessibilityRole="button"
            accessibilityLabel={`Unit ${tile.number}, ${tile.displayName}${tile.available ? `, ${tile.done} of ${tile.total} explored` : ', coming soon'}`}
            onPress={() => router.push(tile.href)}
            style={({ pressed }) => [styles.tile, !tile.available && styles.tileDisabled, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <RouteBadge unitNumber={tile.number} compact />
            <View style={styles.routeBody}>
              <Monogram text={tile.monogram} size={54} dim={!tile.available} />
              <View style={{ flex: 1 }}>
                <Text style={[type.h2, { color: tile.available ? colors.ink : colors.muted }]}>{tile.displayName}</Text>
                <Text style={[type.small, { color: tile.available ? colors.ink : colors.muted, fontWeight: '700' }]}>
                  {tile.available ? `${tile.done}/${tile.total} explored` : 'Coming soon'}
                </Text>
              </View>
              <Text style={styles.arrow}>{tile.available ? '→' : '—'}</Text>
            </View>
          </Pressable>
        ))}
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
