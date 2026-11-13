import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { Link, router } from 'expo-router';
import { getUnit, units, visibleLessons } from '../../content';
import { Monogram } from '../../components/Monogram';
import { isUnitOverviewComplete } from '../../domain/progress';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Kicker } from '../../ui/primitives';
import { RoadDivider, RouteBadge, SignButton, SignPanel, StageScreen } from '../../ui/signage';
import { LANE_INFO } from '../../ui/lanes';
import { colors, space, type } from '../../ui/theme';

export default function Home() {
  const settings = useFamilyStore((s) => s.settings)!;
  const explored = useFamilyStore((s) => s.explored);
  const acknowledgements = useFamilyStore((s) => s.unitOverviewAcknowledgements);
  const crate = useFamilyStore((s) => s.crate);
  const reflections = useFamilyStore((s) => s.reflections);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const routeScrollRef = useRef<ScrollViewInstance>(null);
  const replayY = useRef(0);
  const [carouselWidth, setCarouselWidth] = useState(0);

  // Current unit: the first converted unit with a lesson still to explore.
  const available = units.map((u) => getUnit(u.id, __DEV__)).filter((u) => !!u);
  const current =
    available.find((u) => visibleLessons(u, settings.lane).some((l) => !explored.includes(l.id))) ?? available[0];
  const [startingRouteIndex] = useState(() => Math.max(0, available.findIndex((unit) => unit.id === current?.id)));
  const [activeRouteIndex, setActiveRouteIndex] = useState(startingRouteIndex);

  const showRoute = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, available.length - 1));
    routeScrollRef.current?.scrollTo({ x: safeIndex * carouselWidth, animated: true });
    setActiveRouteIndex(safeIndex);
  };

  const onRouteSwipeEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const width = event.nativeEvent.layoutMeasurement.width;
    if (!width) return;
    setActiveRouteIndex(Math.max(0, Math.min(Math.round(event.nativeEvent.contentOffset.x / width), available.length - 1)));
  };

  const recent = [...reflections].reverse().slice(0, 3);

  return (
    <StageScreen stage="briefing" scrollRef={scrollRef}>
      <View style={styles.hello}>
        <View style={styles.avatar}><Text style={{ fontSize: 24 }}>{settings.avatar}</Text></View>
        <View style={{ flex: 1 }}>
          <Kicker color={colors.ink}>{settings.nickname} · {LANE_INFO[settings.lane].label} lane</Kicker>
        </View>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Grown-up settings" style={styles.gear}>
            <Text style={styles.settingsLabel}>SETTINGS</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.brand}>
        <Text style={styles.brandTitle}>LISTENING{`\n`}REQUIRED</Text>
        <Text style={styles.brandSub}>YOUR MUSIC JOURNEY</Text>
      </View>
      <RoadDivider />

      {current ? (
        <View
          style={styles.routeCarousel}
          onLayout={(event) => setCarouselWidth(Math.round(event.nativeEvent.layout.width))}
        >
          {carouselWidth ? (
            <ScrollView
              ref={routeScrollRef}
              style={styles.routeScroller}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              contentOffset={{ x: startingRouteIndex * carouselWidth, y: 0 }}
              onMomentumScrollEnd={onRouteSwipeEnd}
              accessibilityLabel="Artist routes"
              accessibilityHint="Swipe left or right to browse artists"
            >
              {available.map((unit) => {
                const lessons = visibleLessons(unit, settings.lane);
                const done = lessons.filter((lesson) => explored.includes(lesson.id)).length;
                const next = lessons.find((lesson) => !explored.includes(lesson.id));
                const overviewComplete = isUnitOverviewComplete(acknowledgements, unit.id);
                return (
                  <View key={unit.id} style={[styles.routePage, { width: carouselWidth }]}>
                    <SignPanel>
                      <View style={[styles.routeHeading, carouselWidth < 350 && styles.routeHeadingCompact]}>
                        <RouteBadge unitNumber={unit.number} />
                        <View style={styles.routeTitle}>
                          <Text style={[type.h1, { color: colors.ink }, carouselWidth < 350 && styles.routeNameCompact]}>
                            {unit.displayName}
                          </Text>
                          <Text style={[type.small, { color: colors.ink, fontWeight: '800' }]}>
                            {done} of {lessons.length} lessons explored
                          </Text>
                        </View>
                        {carouselWidth >= 350 ? <Monogram text={unit.monogram} size={56} /> : null}
                      </View>
                      <View style={styles.progress} accessibilityLabel={`${done} of ${lessons.length} lessons explored`}>
                        {lessons.map((lesson) => (
                          <View
                            key={lesson.id}
                            style={[styles.segment, explored.includes(lesson.id) && styles.segmentDone]}
                          />
                        ))}
                      </View>
                      {next ? (
                        <SignButton
                          label={overviewComplete ? 'Continue your route →' : 'Start route briefing →'}
                          variant="ink"
                          onPress={() => overviewComplete
                            ? router.push(`/lesson/${unit.id}/${next.id}`)
                            : router.push(`/unit/${unit.id}`)}
                        />
                      ) : (
                        <SignButton label="Route explored ✓" variant="ink" disabled onPress={() => {}} />
                      )}
                      <SignButton label="Open unit" variant="outline" onPress={() => router.push(`/unit/${unit.id}`)} />
                    </SignPanel>
                  </View>
                );
              })}
            </ScrollView>
          ) : null}
          <View style={styles.routeControls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous artist route"
              disabled={activeRouteIndex === 0}
              onPress={() => showRoute(activeRouteIndex - 1)}
              style={({ pressed }) => [styles.routeArrow, activeRouteIndex === 0 && styles.routeArrowDisabled, pressed && styles.routeArrowPressed]}
            >
              <Text style={styles.routeArrowText}>←</Text>
            </Pressable>
            <Text style={styles.routePosition} accessibilityLiveRegion="polite">
              ROUTE {activeRouteIndex + 1} OF {available.length} · SWIPE ↔
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next artist route"
              disabled={activeRouteIndex === available.length - 1}
              onPress={() => showRoute(activeRouteIndex + 1)}
              style={({ pressed }) => [styles.routeArrow, activeRouteIndex === available.length - 1 && styles.routeArrowDisabled, pressed && styles.routeArrowPressed]}
            >
              <Text style={styles.routeArrowText}>→</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <SignPanel>
          <Body>Units are being reviewed. Check back soon.</Body>
        </SignPanel>
      )}

      <View style={styles.actions}>
        <SignButton label="Artist directory →" variant="paper" onPress={() => router.push('/units')} />
        <SignButton label={`My crate · ${crate.length} →`} variant="paper" onPress={() => router.push('/crate')} />
        <SignButton label="Family replay ↓" variant="paper" onPress={() => scrollRef.current?.scrollTo({ y: replayY.current, animated: true })} />
      </View>

      <View style={{ gap: space.sm }} onLayout={(event) => { replayY.current = event.nativeEvent.layout.y; }}>
        <Kicker color={colors.ink}>Family replay · private to this device</Kicker>
        {recent.length === 0 ? (
          <Text style={[type.small, { color: colors.ink }]}>
            Thoughts you save in a lesson show up here. Private to this device.
          </Text>
        ) : (
          recent.map((r) => {
            const unit = units.find((u) => u.id === r.unitId);
            const lesson = unit?.lessons.find((l) => l.id === r.lessonId);
            return (
              <SignPanel key={r.id}>
                <Text style={[type.small, { color: colors.muted }]}>
                  {unit?.displayName} · Lesson {lesson?.number}
                </Text>
                {r.feelings.length ? <Text style={[type.body, { fontWeight: '700' }]}>{r.feelings.join(' · ')}</Text> : null}
                {r.text ? <Body>“{r.text}”</Body> : null}
              </SignPanel>
            );
          })
        )}
      </View>
    </StageScreen>
  );
}

const styles = StyleSheet.create({
  hello: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  gear: { minWidth: 48, minHeight: 48, borderWidth: 2, borderColor: colors.ink, borderRadius: 6, paddingHorizontal: space.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper },
  settingsLabel: { color: colors.ink, fontSize: 10, fontWeight: '900' },
  brand: { alignItems: 'center', paddingVertical: space.sm },
  brandTitle: { color: colors.ink, fontSize: 46, lineHeight: 43, fontWeight: '900', letterSpacing: -2, textAlign: 'center' },
  brandSub: { color: colors.ink, fontSize: 14, fontWeight: '900', letterSpacing: 1.5, marginTop: space.sm },
  routeCarousel: { width: '100%', gap: space.sm },
  routeScroller: { height: 265 },
  routePage: { paddingHorizontal: 1 },
  routeHeading: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  routeHeadingCompact: { flexDirection: 'column', gap: space.xs, alignItems: 'stretch' },
  routeTitle: { flex: 1, minWidth: 0 },
  routeNameCompact: { fontSize: 22, lineHeight: 24 },
  routeControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  routeArrow: { width: 48, height: 48, borderWidth: 2, borderColor: colors.ink, borderRadius: 24, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  routeArrowDisabled: { opacity: 0.35 },
  routeArrowPressed: { backgroundColor: colors.yellowSoft },
  routeArrowText: { color: colors.ink, fontSize: 24, lineHeight: 28, fontWeight: '900' },
  routePosition: { flex: 1, color: colors.ink, fontSize: 11, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  progress: { flexDirection: 'row', gap: 3, height: 10 },
  segment: { flex: 1, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.paper },
  segmentDone: { backgroundColor: colors.yellow },
  actions: { gap: space.sm },
});
