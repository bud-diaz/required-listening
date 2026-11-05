import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { Lane, Lesson, Track, Unit } from '../content/schemas';
import { visibleTracks } from '../content';
import { FEELINGS } from '../domain/crate';
import { useFamilyStore } from '../stores/family-store';
import { Blocks, Body, Button, Card, CaregiverNote, Chip, Kicker } from '../ui/primitives';
import { colors, space, type } from '../ui/theme';
import { ProviderSheet } from './ProviderSheet';
import { TrackRow } from './TrackRow';

const STEPS = ['Read', 'Listen', 'Notice', 'Talk', 'Crate'] as const;

/** One lesson as Read → Listen → Notice → Talk → Add to Crate. */
export function LessonFlow({ unit, lesson, lane }: { unit: Unit; lesson: Lesson; lane: Lane }) {
  const [step, setStep] = useState(0);
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  const saveReflection = useFamilyStore((s) => s.saveReflection);
  const explored = useFamilyStore((s) => s.explored.includes(lesson.id));
  const setExplored = useFamilyStore((s) => s.setExplored);

  const tracks = visibleTracks(unit, lesson.listen, lane);
  const hiddenCount = lesson.listen.length - tracks.length;
  const isLast = step === STEPS.length - 1;

  const toggleFeeling = (f: string) =>
    setFeelings((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));

  const onSave = async () => {
    await saveReflection({ unitId: unit.id, lessonId: lesson.id, feelings, text: text.trim() || undefined });
    setSaved(true);
  };

  return (
    <View style={{ gap: space.lg }}>
      <View style={styles.stepper} accessibilityRole="tablist">
        {STEPS.map((s, i) => (
          <Text
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: i === step }}
            onPress={() => setStep(i)}
            style={[styles.step, i === step && styles.stepOn, i < step && { color: colors.ink }]}
          >
            {s}
          </Text>
        ))}
      </View>

      {step === 0 && (
        <View style={{ gap: space.lg }}>
          {lesson.caregiverNote ? <CaregiverNote text={lesson.caregiverNote} /> : null}
          <Blocks blocks={lesson.body} />
          {lesson.activity ? (
            <Card tone="gold">
              <Kicker color={colors.goldDeep}>Activity</Kicker>
              <Body>{lesson.activity.text}</Body>
            </Card>
          ) : null}
        </View>
      )}

      {step === 1 && (
        <View style={{ gap: space.sm }}>
          <Kicker>Listen</Kicker>
          {tracks.length === 0 ? (
            <Body>
              {lesson.listen.length === 0
                ? 'No track for this one. Talk about it, or replay the passed-down track.'
                : 'The tracks for this lesson are hidden on your listening lane.'}
            </Body>
          ) : (
            tracks.map((t) => <TrackRow key={t.id} track={t} onListen={setSheetTrack} />)
          )}
          {hiddenCount > 0 && tracks.length > 0 ? (
            <Text style={[type.small, { color: colors.muted }]}>
              {hiddenCount} more {hiddenCount === 1 ? 'pick is' : 'picks are'} hidden on your listening lane.
            </Text>
          ) : null}
        </View>
      )}

      {step === 2 && (
        <Card tone="gold">
          <Kicker color={colors.goldDeep}>Notice</Kicker>
          <Text style={[type.h2, { color: colors.ink, lineHeight: 26 }]}>{lesson.notice.text}</Text>
        </Card>
      )}

      {step === 3 && (
        <View style={{ gap: space.md }}>
          <Card tone="ink">
            <Kicker>Talk</Kicker>
            <Text style={[type.h2, { color: colors.paper, lineHeight: 26 }]}>{lesson.talk.text}</Text>
          </Card>
          <Kicker color={colors.muted}>How did it make you feel?</Kicker>
          <View style={styles.wrap}>
            {FEELINGS.map((f) => (
              <Chip key={f} label={f} selected={feelings.includes(f)} onPress={() => toggleFeeling(f)} />
            ))}
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Say it or type it (optional)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            accessibilityLabel="Your thoughts"
            style={styles.input}
          />
          {saved ? (
            <Text style={[type.small, { color: colors.goldDeep, fontWeight: '700' }]} accessibilityRole="alert">
              Saved on this device. Only your family can see it.
            </Text>
          ) : (
            <Button
              label="Save thought"
              variant="secondary"
              disabled={feelings.length === 0 && !text.trim()}
              onPress={onSave}
            />
          )}
        </View>
      )}

      {step === 4 && (
        <View style={{ gap: space.md }}>
          <Kicker>Add to your crate</Kicker>
          <Body>Did a song stick? Put it in your crate and say why.</Body>
          {tracks
            .filter((t) => t.type === 'song' || t.type === 'instrumental')
            .map((t) => (
              <Button
                key={t.id}
                variant="secondary"
                label={`+ ${t.title}`}
                onPress={() =>
                  router.push({ pathname: '/crate/add', params: { trackId: t.id, unitId: unit.id } })
                }
              />
            ))}
          <Button
            variant="ghost"
            label="Add a different song"
            onPress={() => router.push({ pathname: '/crate/add', params: { unitId: unit.id } })}
          />
          <Button
            label={explored ? 'Explored ✓ (tap to undo)' : 'Mark lesson explored'}
            variant={explored ? 'secondary' : 'primary'}
            accessibilityHint="Progress is something you mark yourselves. The app can't tell what you played."
            onPress={() => setExplored(lesson.id, !explored)}
          />
        </View>
      )}

      <View style={styles.nav}>
        <Button label="Back" variant="ghost" disabled={step === 0} onPress={() => setStep((s) => s - 1)} />
        {!isLast ? <Button label={`Next: ${STEPS[step + 1]}`} onPress={() => setStep((s) => s + 1)} /> : null}
      </View>

      <ProviderSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.rule },
  step: {
    ...type.kicker,
    fontSize: 11,
    color: colors.muted,
    paddingVertical: space.sm,
    paddingHorizontal: 2,
    minHeight: 40,
  },
  stepOn: { color: colors.gold, borderBottomWidth: 3, borderColor: colors.gold },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: {
    minHeight: 88,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    padding: space.md,
    fontSize: 16,
    backgroundColor: colors.paper,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
