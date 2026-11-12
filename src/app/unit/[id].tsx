import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getUnit, passedDownFor, visibleLessons, visibleTracks } from '../../content';
import type { ContentFlag, Track } from '../../content/schemas';
import { Monogram } from '../../components/Monogram';
import { ProviderSheet } from '../../components/ProviderSheet';
import { TrackRow } from '../../components/TrackRow';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Button, Card, CaregiverNote, DraftBanner, Kicker, Rule, Screen } from '../../ui/primitives';
import { RoadDivider, RouteBadge, SignPanel } from '../../ui/signage';
import { colors, space, TOUCH, type } from '../../ui/theme';

const FLAG_LABELS: Record<ContentFlag, string> = {
  'explicit-language': 'Explicit language',
  violence: 'Violence',
  weapons: 'Weapons',
  substances: 'Substances',
  'sexual-content': 'Sexual content',
  trauma: 'Trauma',
  'artist-conduct': 'Artist conduct',
  'mature-themes': 'Mature themes',
};

export default function UnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lane = useFamilyStore((s) => s.settings?.lane ?? 'younger');
  const explored = useFamilyStore((s) => s.explored);
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);

  const unit = getUnit(id, __DEV__);
  if (!unit) {
    return (
      <Screen>
        <Body>This unit isn’t available yet.</Body>
      </Screen>
    );
  }

  const passed = passedDownFor(unit, lane);
  const younger = visibleTracks(unit, unit.youngerListener.trackIds, lane);
  const lessons = visibleLessons(unit, lane);
  const hidden = unit.lessons.length - lessons.length;

  return (
    <Screen>
      <Stack.Screen options={{ title: unit.displayName }} />
      {unit.review.status !== 'approved' ? (
        <DraftBanner
          message={unit.lessonReview.status === 'approved'
            ? 'DRAFT · Lesson content approved. Track versions still need review.'
            : undefined}
        />
      ) : null}

      <View style={styles.hero}>
        <RouteBadge unitNumber={unit.number} />
        <Monogram text={unit.monogram} size={112} />
        <Text style={[type.display, { color: colors.ink, textAlign: 'center' }]}>{unit.displayName}</Text>
        <Text style={[type.small, { color: colors.ink, fontWeight: '700' }]}>
          {lessons.length} lessons · about {unit.estimatedMinutesPerLesson} min each
        </Text>
      </View>
      <RoadDivider />

      {passed ? (
        <SignPanel tone="ink" title="Passed down track">
          <Text style={[type.h1, { color: colors.paper }]}>“{passed.track.title}”</Text>
          {passed.isSubstitute ? (
            <Text style={[type.small, { color: colors.goldSoft }]}>
              On the Younger Listener lane we start with this version. The guide’s pick is “
              {unit.tracks.find((t) => t.id === unit.passedDown.trackId)?.title}”.
            </Text>
          ) : null}
          <Text style={[type.body, { color: colors.paper }]}>{unit.passedDown.blurb}</Text>
          <Button label="Open music search ↗" variant="secondary" onPress={() => setSheetTrack(passed.track)} />
        </SignPanel>
      ) : null}

      <View style={{ gap: space.sm }}>
        <SignPanel title={`Why ${unit.displayName} still matters`}>
          <Body>{unit.whyItMatters}</Body>
        </SignPanel>
      </View>

      <View style={styles.flags} accessibilityLabel="Content labels">
        {unit.contentFlags.map((f) => (
          <Text key={f} style={styles.flag}>{FLAG_LABELS[f]}</Text>
        ))}
      </View>

      {younger.length ? (
        <View style={{ gap: space.xs }}>
          <Rule />
          <Kicker>Younger Listener picks</Kicker>
          <Text style={[type.small, { color: colors.muted }]}>{unit.youngerListener.note}</Text>
          {younger.map((t) => (
            <TrackRow key={t.id} track={t} onListen={setSheetTrack} />
          ))}
        </View>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Rule />
        <Kicker>{unit.displayName} =</Kicker>
        {unit.overview.summary.map((s) => (
          <Text key={s} style={[type.h2, { color: colors.ink, fontWeight: '700' }]}>{s}</Text>
        ))}
        <Kicker color={colors.muted}>Your kid gon’ learn</Kicker>
        {unit.learnOutcomes.map((o) => (
          <Body key={o}>— {o}</Body>
        ))}
      </View>

      <View style={{ gap: space.xs }}>
        <Rule />
        <Kicker color={colors.ink}>Route checkpoints</Kicker>
        {lessons.map((l) => {
          const isDone = explored.includes(l.id);
          return (
            <Pressable
              key={l.id}
              accessibilityRole="button"
              accessibilityLabel={`Lesson ${l.number}: ${l.title}${isDone ? ', explored' : ''}`}
              onPress={() => router.push(`/lesson/${unit.id}/${l.id}`)}
              style={({ pressed }) => [styles.lesson, pressed && { backgroundColor: colors.goldSoft }]}
            >
              <View style={[styles.num, isDone && { backgroundColor: colors.yellow }]}>
                <Text style={styles.numText}>{isDone ? '✓' : String(l.number).padStart(2, '0')}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[type.kicker, { color: colors.muted, fontSize: 10 }]}>CHECKPOINT {String(l.number).padStart(2, '0')}</Text>
                <Text style={[type.body, { fontWeight: '700', color: colors.ink }]}>{l.title}</Text>
                {l.requiresCaregiverContext ? (
                  <Text style={[type.small, { color: colors.goldDeep }]}>Grown-up context</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
        {hidden > 0 ? (
          <Text style={[type.small, { color: colors.muted }]}>
            {hidden} {hidden === 1 ? 'lesson is' : 'lessons are'} hidden on your listening lane. A grown-up can change
            the lane in settings.
          </Text>
        ) : null}
      </View>

      <Card tone="gold">
        <Kicker color={colors.goldDeep}>Final project · optional</Kicker>
        <Body>{unit.finalProject.prompt}</Body>
        <CaregiverNote text="No grades. Do it out loud, on paper, or not at all. A guided project workspace comes in a later version." />
      </Card>

      <ProviderSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.sm },
  flags: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  flag: {
    ...type.small,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: TOUCH + 8, padding: space.sm, borderRadius: 8, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, marginBottom: space.sm },
  num: {
    width: 44,
    height: 44,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { color: colors.ink, fontWeight: '900' },
});
