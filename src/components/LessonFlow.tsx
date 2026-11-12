import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import type { Lane, Lesson, Track, Unit } from '../content/schemas';
import { getNextLesson, visibleTracks } from '../content';
import { FEELINGS } from '../domain/crate';
import { useFamilyStore } from '../stores/family-store';
import { Blocks, Body, Button, Chip, DraftBanner, Kicker } from '../ui/primitives';
import {
  ContextStopSign,
  LessonPlacard,
  RecordSign,
  RoadDivider,
  RouteBadge,
  SignButton,
  SignHeading,
  SignPanel,
  StageScreen,
  type PlacardStage,
} from '../ui/signage';
import { colors, geometry, space, stages, type, type Stage } from '../ui/theme';
import { ProviderSheet } from './ProviderSheet';
import { TrackRow } from './TrackRow';
import { LESSON_STEPS, stageToIndex, stepLabels, type LessonStep } from './lesson/lesson-stages';

const subtitles: Record<LessonStep, string> = {
  briefing: 'Get the context. Know what you’re hearing.',
  listen: 'Find the rhythm. Follow the sound.',
  notice: 'Catch the details. What do you hear?',
  talk: 'Share your take. There’s no wrong answer.',
  crate: 'Keep what matters. Add it to your family’s collection.',
};

const symbols: Record<LessonStep, string> = {
  briefing: '▤',
  listen: '◉',
  notice: '◇',
  talk: '□',
  crate: '●',
};

const stepStage = (step: LessonStep): Stage => (step === 'briefing' ? 'briefing' : step);

/** One lesson as Briefing → Listen → Notice → Talk → Add to Crate. */
export function LessonFlow({ unit, lesson, lane }: { unit: Unit; lesson: Lesson; lane: Lane }) {
  const [step, setStep] = useState<LessonStep>('briefing');
  const [visited, setVisited] = useState<PlacardStage[]>([]);
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [noticed, setNoticed] = useState(false);

  const saveReflection = useFamilyStore((s) => s.saveReflection);
  const explored = useFamilyStore((s) => s.explored.includes(lesson.id));
  const setExplored = useFamilyStore((s) => s.setExplored);

  const tracks = visibleTracks(unit, lesson.listen, lane);
  const eligibleTracks = tracks.filter((track) => track.type === 'song' || track.type === 'instrumental');
  const hiddenCount = lesson.listen.length - tracks.length;
  const nextLesson = getNextLesson(unit, lesson.id, lane);
  const index = stageToIndex[step];
  const stage = stepStage(step);

  const selectStep = (next: LessonStep) => {
    setStep(next);
    if (next !== 'briefing') setVisited((current) => (current.includes(next) ? current : [...current, next]));
  };

  const toggleFeeling = (feeling: string) =>
    setFeelings((current) => current.includes(feeling) ? current.filter((item) => item !== feeling) : [...current, feeling]);

  const onSave = async () => {
    await saveReflection({ unitId: unit.id, lessonId: lesson.id, feelings, text: text.trim() || undefined });
    setSaved(true);
  };

  const nav = (
    <View style={styles.nav}>
      <SignButton
        label="← Back"
        variant="paper"
        disabled={index === 0}
        onPress={() => selectStep(LESSON_STEPS[index - 1])}
        style={styles.navButton}
      />
      {index < LESSON_STEPS.length - 1 ? (
        <SignButton
          label={`Next: ${stepLabels[LESSON_STEPS[index + 1]]} →`}
          variant={stage === 'listen' || stage === 'talk' || stage === 'crate' ? 'yellow' : 'ink'}
          onPress={() => selectStep(LESSON_STEPS[index + 1])}
          style={styles.navButton}
        />
      ) : null}
    </View>
  );

  return (
    <StageScreen
      stage={stage}
      header={
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to unit" onPress={() => router.back()} style={styles.back}>
            <Text style={[styles.backText, { color: stages[stage].foreground }]}>←</Text>
          </Pressable>
          <RouteBadge unitNumber={unit.number} lessonNumber={lesson.number} compact />
          {step === 'briefing' ? <View style={styles.positionSpacer} /> : <Text style={styles.position}>{index} OF 4</Text>}
        </View>
      }
    >
      {unit.review.status !== 'approved' ? (
        <DraftBanner
          message={unit.lessonReview.status === 'approved'
            ? 'DRAFT · Lesson content approved. Track versions still need review.'
            : undefined}
        />
      ) : null}

      <StageTabs step={step} onSelect={selectStep} />

      {step === 'briefing' ? (
        <>
          <SignHeading stage="briefing" title="Briefing" subtitle={subtitles.briefing} icon={<Text style={styles.headingSymbol}>{symbols.briefing}</Text>} />
          <RoadDivider />
          <LessonPlacard visitedStages={visited} onSelectStage={selectStep} />
          <SignPanel title={`Lesson ${String(lesson.number).padStart(2, '0')}`}>
            <Text style={[type.h1, { color: colors.ink }]}>{lesson.title}</Text>
            <Blocks blocks={lesson.body} />
          </SignPanel>
          {lesson.caregiverNote ? <ContextStopSign message={lesson.caregiverNote} /> : null}
          {lesson.activity ? (
            <SignPanel tone="yellow" title="Activity">
              <Body>{lesson.activity.text}</Body>
            </SignPanel>
          ) : null}
          {nav}
        </>
      ) : null}

      {step === 'listen' ? (
        <>
          <SignHeading stage="listen" title="Listen." subtitle={subtitles.listen} icon={<Text style={[styles.headingSymbol, { color: colors.paper }]}>{symbols.listen}</Text>} />
          <View style={{ gap: space.sm }}>
            {tracks.length === 0 ? (
              <SignPanel>
                <Body>{lesson.listen.length === 0 ? 'No track for this one. Talk about it, or replay the passed-down track.' : 'The tracks for this lesson are hidden on your listening lane.'}</Body>
              </SignPanel>
            ) : tracks.map((track) => <TrackRow key={track.id} track={track} onListen={setSheetTrack} />)}
            {hiddenCount > 0 && tracks.length > 0 ? (
              <Text style={[type.small, { color: colors.paper, fontWeight: '700' }]}>{hiddenCount} more {hiddenCount === 1 ? 'pick is' : 'picks are'} hidden on your listening lane.</Text>
            ) : null}
          </View>
          <SignPanel title="Music opens elsewhere">
            <Body>The app opens an allowlisted search in a music service. Check the version before you press play.</Body>
          </SignPanel>
          {nav}
        </>
      ) : null}

      {step === 'notice' ? (
        <>
          <SignHeading stage="notice" title="Notice." subtitle={subtitles.notice} icon={<Text style={styles.headingSymbol}>{symbols.notice}</Text>} />
          <SignPanel title="Listen for this">
            <Text style={[type.h2, styles.prompt]}>{lesson.notice.text}</Text>
          </SignPanel>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel="I noticed something"
            accessibilityState={{ checked: noticed }}
            onPress={() => setNoticed((value) => !value)}
            style={({ pressed }) => [styles.noticeToggle, noticed && styles.noticeToggleOn, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <Text style={styles.noticeToggleText}>{noticed ? '✓ I NOTICED SOMETHING' : 'I NOTICED SOMETHING'}</Text>
            <Text style={[type.small, { color: colors.ink, textAlign: 'center' }]}>A quick memory cue for this visit. Nothing is scored or saved.</Text>
          </Pressable>
          {nav}
        </>
      ) : null}

      {step === 'talk' ? (
        <>
          <SignHeading stage="talk" title="Talk." subtitle={subtitles.talk} icon={<Text style={[styles.headingSymbol, { color: colors.paper }]}>{symbols.talk}</Text>} />
          <SignPanel title="Talk it through">
            <Text style={[type.h2, styles.prompt]}>{lesson.talk.text}</Text>
          </SignPanel>
          <View style={{ gap: space.sm }}>
            <Kicker color={colors.paper}>How did it make you feel?</Kicker>
            <View style={styles.wrap}>
              {FEELINGS.map((feeling) => <Chip key={feeling} label={feeling} selected={feelings.includes(feeling)} onPress={() => toggleFeeling(feeling)} />)}
            </View>
          </View>
          <TextInput
            value={text}
            onChangeText={(value) => { setText(value); setSaved(false); }}
            placeholder="Say it or type it (optional)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            accessibilityLabel="Your thoughts"
            style={styles.input}
          />
          {saved ? (
            <SignPanel><Text style={[type.small, { color: colors.ink, fontWeight: '800' }]} accessibilityRole="alert">Saved on this device. Only your family can see it.</Text></SignPanel>
          ) : (
            <SignButton label="Save thought" variant="yellow" disabled={feelings.length === 0 && !text.trim()} onPress={onSave} />
          )}
          {nav}
        </>
      ) : null}

      {step === 'crate' ? (
        <>
          <SignHeading stage="crate" title="Add to crate." subtitle={subtitles.crate} icon={<Text style={[styles.headingSymbol, { color: colors.paper }]}>{symbols.crate}</Text>} />
          <View style={{ gap: space.sm }}>
            {eligibleTracks.map((track) => (
              <View key={track.id} style={{ gap: space.sm }}>
                <RecordSign title={track.title} artist={track.artist} metadata={track.type === 'instrumental' ? 'Instrumental · no vocals' : 'Song'} />
                <SignButton label={`Add ${track.title} →`} variant="paper" onPress={() => router.push({ pathname: '/crate/add', params: { trackId: track.id, unitId: unit.id } })} />
              </View>
            ))}
            {eligibleTracks.length === 0 ? <SignPanel><Body>No eligible song is listed for this lesson. You can still add a different song.</Body></SignPanel> : null}
          </View>
          <SignButton label="Add a different song" variant="yellow" onPress={() => router.push({ pathname: '/crate/add', params: { unitId: unit.id } })} />
          <SignPanel title="Your progress">
            <Body>Explored is something your family marks. It is separate from opening music or adding a song.</Body>
            <Button
              label={explored ? 'Explored ✓ (tap to undo)' : 'Mark lesson explored'}
              variant={explored ? 'secondary' : 'primary'}
              accessibilityHint="Progress is something you mark yourselves. The app can't tell what you played."
              onPress={() => setExplored(lesson.id, !explored)}
            />
          </SignPanel>
          {explored && nextLesson ? (
            <SignButton
              label="Proceed to next lesson →"
              variant="yellow"
              hint={`Opens lesson ${nextLesson.number}: ${nextLesson.title}`}
              onPress={() => router.replace({
                pathname: '/lesson/[unitId]/[lessonId]',
                params: { unitId: unit.id, lessonId: nextLesson.id },
              })}
            />
          ) : null}
          {nav}
        </>
      ) : null}

      <ProviderSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </StageScreen>
  );
}

function StageTabs({ step, onSelect }: { step: LessonStep; onSelect: (step: LessonStep) => void }) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {LESSON_STEPS.map((item) => {
        const selected = item === step;
        const backgroundColor = stepStage(item) === 'briefing' ? colors.yellow : stages[stepStage(item)].background;
        const foreground = stages[stepStage(item)].foreground;
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityLabel={`${stepLabels[item]}${item === 'briefing' ? ', reading step' : `, stage ${stageToIndex[item]} of 4`}`}
            accessibilityState={{ selected }}
            onPress={() => onSelect(item)}
            style={({ pressed }) => [styles.tab, { backgroundColor }, selected && styles.tabSelected, pressed && { opacity: 0.78 }]}
          >
            <Text style={[styles.tabText, { color: foreground }]} numberOfLines={1}>{stepLabels[item]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', maxWidth: 640, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 34, lineHeight: 38, fontWeight: '700' },
  position: { color: colors.ink, backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink, borderRadius: 4, paddingHorizontal: space.sm, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  positionSpacer: { width: 48 },
  headingSymbol: { color: colors.ink, fontSize: 30, lineHeight: 34, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderWidth: 2, borderColor: colors.ink, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.paper },
  tab: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: colors.ink, paddingHorizontal: 2 },
  tabSelected: { borderWidth: 4, borderColor: colors.paper },
  tabText: { fontSize: 9, lineHeight: 11, fontWeight: '900', textTransform: 'uppercase' },
  nav: { flexDirection: 'row', gap: space.sm, alignItems: 'stretch' },
  navButton: { flex: 1 },
  prompt: { color: colors.ink, lineHeight: 27 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: { minHeight: 112, borderWidth: geometry.borderHeavy, borderColor: colors.ink, borderRadius: geometry.radius, padding: space.md, fontSize: 16, backgroundColor: colors.paper, color: colors.ink, textAlignVertical: 'top' },
  noticeToggle: { minHeight: 132, backgroundColor: colors.paper, borderWidth: 3, borderColor: colors.ink, borderRadius: 12, padding: space.lg, gap: space.sm, alignItems: 'center', justifyContent: 'center' },
  noticeToggleOn: { backgroundColor: colors.yellow, borderWidth: 5 },
  noticeToggleText: { color: colors.ink, fontSize: 19, lineHeight: 23, fontWeight: '900', textAlign: 'center' },
});
