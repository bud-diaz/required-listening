import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { Link, router } from 'expo-router';
import { getUnit, units, visibleLessons } from '../../content';
import { Monogram } from '../../components/Monogram';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Kicker } from '../../ui/primitives';
import { RoadDivider, RouteBadge, SignButton, SignPanel, StageScreen } from '../../ui/signage';
import { LANE_INFO } from '../../ui/lanes';
import { colors, space, type } from '../../ui/theme';

export default function Home() {
  const settings = useFamilyStore((s) => s.settings)!;
  const explored = useFamilyStore((s) => s.explored);
  const crate = useFamilyStore((s) => s.crate);
  const reflections = useFamilyStore((s) => s.reflections);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const replayY = useRef(0);

  // Current unit: the first converted unit with a lesson still to explore.
  const available = units.map((u) => getUnit(u.id, __DEV__)).filter((u) => !!u);
  const current =
    available.find((u) => visibleLessons(u, settings.lane).some((l) => !explored.includes(l.id))) ?? available[0];
  const lessons = current ? visibleLessons(current, settings.lane) : [];
  const done = lessons.filter((l) => explored.includes(l.id)).length;
  const next = lessons.find((l) => !explored.includes(l.id));

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
        <SignPanel>
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <RouteBadge unitNumber={current.number} />
            <View style={{ flex: 1 }}>
              <Text style={[type.h1, { color: colors.ink }]}>{current.displayName}</Text>
              <Text style={[type.small, { color: colors.ink, fontWeight: '800' }]}>
                {done} of {lessons.length} lessons explored
              </Text>
            </View>
            <Monogram text={current.monogram} size={56} />
          </View>
          <View style={styles.progress} accessibilityLabel={`${done} of ${lessons.length} lessons explored`}>
            {lessons.map((lesson) => <View key={lesson.id} style={[styles.segment, explored.includes(lesson.id) && styles.segmentDone]} />)}
          </View>
          {next ? (
            <SignButton
              label="Continue your route →"
              variant="ink"
              onPress={() => router.push(`/lesson/${current.id}/${next.id}`)}
            />
          ) : null}
          <SignButton label="Open unit" variant="outline" onPress={() => router.push(`/unit/${current.id}`)} />
        </SignPanel>
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
  progress: { flexDirection: 'row', gap: 3, height: 10 },
  segment: { flex: 1, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.paper },
  segmentDone: { backgroundColor: colors.yellow },
  actions: { gap: space.sm },
});
