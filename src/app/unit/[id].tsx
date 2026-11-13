import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { getNextUnit, getUnit, passedDownFor, visibleLessons, visibleTracks } from '../../content';
import type { ContentFlag, Track } from '../../content/schemas';
import {
  UNIT_OVERVIEW_SECTIONS,
  type UnitOverviewSection,
} from '../../domain/crate';
import {
  firstIncompleteUnitOverviewSection,
  hasAcknowledgedUnitOverviewSection,
  isRouteComplete,
  isUnitOverviewComplete,
} from '../../domain/progress';
import { Monogram } from '../../components/Monogram';
import { ProviderSheet } from '../../components/ProviderSheet';
import { TrackRow } from '../../components/TrackRow';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Button, DraftBanner, Kicker, Rule, Screen } from '../../ui/primitives';
import { RoadDivider, RouteBadge, SignButton, SignPanel } from '../../ui/signage';
import { colors, geometry, space, TOUCH, type } from '../../ui/theme';

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

const SECTION_LABELS: Record<UnitOverviewSection, string> = {
  why: 'Why this artist matters',
  music: 'Passed down music',
  briefing: 'Unit briefing',
};

export default function UnitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lane = useFamilyStore((s) => s.settings?.lane ?? 'younger');
  const explored = useFamilyStore((s) => s.explored);
  const acknowledgements = useFamilyStore((s) => s.unitOverviewAcknowledgements);
  const acknowledgeUnitOverview = useFamilyStore((s) => s.acknowledgeUnitOverview);
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);
  const [savingSection, setSavingSection] = useState<UnitOverviewSection | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const unit = getUnit(id, __DEV__);
  const initialSection = unit
    ? firstIncompleteUnitOverviewSection(acknowledgements, unit.id)
    : 'why';
  const [viewingSection, setViewingSection] = useState<UnitOverviewSection | null>(initialSection ?? null);

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
  const overviewComplete = isUnitOverviewComplete(acknowledgements, unit.id);
  const routeComplete = isRouteComplete(unit, lane, explored);
  const nextUnit = getNextUnit(unit.id, __DEV__);

  const acknowledge = async (section: UnitOverviewSection) => {
    if (hasAcknowledgedUnitOverviewSection(acknowledgements, unit.id, section)) return;
    setSavingSection(section);
    setSaveError(null);
    try {
      await acknowledgeUnitOverview(unit.id, section);
    } catch {
      setSaveError('Couldn’t save this checkoff. Try again.');
    } finally {
      setSavingSection(null);
    }
  };

  const showNextSection = (section: UnitOverviewSection) => {
    const index = UNIT_OVERVIEW_SECTIONS.indexOf(section);
    const next = UNIT_OVERVIEW_SECTIONS[index + 1];
    setViewingSection(next ?? null);
  };

  const overviewContent = viewingSection === 'why' ? (
    <>
      <View style={styles.hero}>
        <RouteBadge unitNumber={unit.number} />
        <Monogram text={unit.monogram} size={112} />
        <Text style={[type.display, { color: colors.ink, textAlign: 'center' }]}>{unit.displayName}</Text>
        <Text style={[type.small, { color: colors.ink, fontWeight: '700' }]}>
          {lessons.length} checkpoints · about {unit.estimatedMinutesPerLesson} min each
        </Text>
      </View>
      <RoadDivider />
      <SignPanel title={`Why ${unit.displayName} still matters`}>
        <Body>{unit.whyItMatters}</Body>
      </SignPanel>
    </>
  ) : viewingSection === 'music' ? (
    <>
      <OverviewHeading unitNumber={unit.number} step={2} title="Passed down music" />
      {passed ? (
        <SignPanel tone="ink" title="Passed down track">
          <Text style={[type.h1, { color: colors.paper }]}>“{passed.track.title}”</Text>
          {passed.isSubstitute ? (
            <Text style={[type.small, { color: colors.goldSoft }]}>
              On the Younger Listener lane we start with this version. The guide’s pick is “
              {unit.tracks.find((track) => track.id === unit.passedDown.trackId)?.title}”.
            </Text>
          ) : null}
          <Text style={[type.body, { color: colors.paper }]}>{unit.passedDown.blurb}</Text>
          <Button label="Review music search ↗" variant="secondary" onPress={() => setSheetTrack(passed.track)} />
        </SignPanel>
      ) : null}
      {younger.length ? (
        <View style={{ gap: space.xs }}>
          <Rule />
          <Kicker>Younger Listener picks</Kicker>
          <Text style={[type.small, { color: colors.muted }]}>{unit.youngerListener.note}</Text>
          {younger.map((track) => (
            <TrackRow key={track.id} track={track} onListen={setSheetTrack} />
          ))}
        </View>
      ) : null}
    </>
  ) : viewingSection === 'briefing' ? (
    <>
      <OverviewHeading unitNumber={unit.number} step={3} title="Unit briefing" />
      <View style={styles.flags} accessibilityLabel="Content labels">
        {unit.contentFlags.map((flag) => (
          <Text key={flag} style={styles.flag}>{FLAG_LABELS[flag]}</Text>
        ))}
      </View>
      <SignPanel title={`${unit.displayName} =`}>
        {unit.overview.summary.map((summary) => (
          <Text key={summary} style={[type.h2, { color: colors.ink, fontWeight: '700' }]}>{summary}</Text>
        ))}
        <Body>{unit.overview.closing}</Body>
      </SignPanel>
      <SignPanel tone="yellow" title="Your kid gon’ learn">
        {unit.learnOutcomes.map((outcome) => (
          <Body key={outcome}>— {outcome}</Body>
        ))}
      </SignPanel>
    </>
  ) : null;

  const sectionAcknowledged = viewingSection
    ? hasAcknowledgedUnitOverviewSection(acknowledgements, unit.id, viewingSection)
    : false;

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

      {viewingSection ? (
        <>
          <View style={styles.stepProgress} accessibilityLabel={`Unit overview step ${UNIT_OVERVIEW_SECTIONS.indexOf(viewingSection) + 1} of 3`}>
            {UNIT_OVERVIEW_SECTIONS.map((section, index) => (
              <View
                key={section}
                style={[
                  styles.stepSegment,
                  hasAcknowledgedUnitOverviewSection(acknowledgements, unit.id, section) && styles.stepSegmentDone,
                  section === viewingSection && styles.stepSegmentCurrent,
                ]}
              >
                <Text style={styles.stepSegmentText}>{index + 1}</Text>
              </View>
            ))}
          </View>
          {overviewContent}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Acknowledge ${SECTION_LABELS[viewingSection]}`}
            accessibilityState={{ checked: sectionAcknowledged, disabled: sectionAcknowledged || savingSection === viewingSection }}
            disabled={sectionAcknowledged || savingSection === viewingSection}
            onPress={() => void acknowledge(viewingSection)}
            style={({ pressed }) => [
              styles.acknowledgement,
              sectionAcknowledged && styles.acknowledgementDone,
              pressed && { transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={[styles.checkbox, sectionAcknowledged && styles.checkboxDone]}>
              <Text style={styles.checkboxText}>{sectionAcknowledged ? '✓' : ''}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[type.h2, { color: colors.ink }]}>
                {savingSection === viewingSection ? 'Saving…' : sectionAcknowledged ? 'Viewed and acknowledged' : 'I viewed this section'}
              </Text>
              <Text style={[type.small, { color: colors.muted }]}>Required before Route Checkpoints unlock.</Text>
            </View>
          </Pressable>
          {saveError ? <Text accessibilityRole="alert" style={[type.small, { color: colors.danger, fontWeight: '800' }]}>{saveError}</Text> : null}
          <View style={styles.overviewNav}>
            <SignButton
              label={overviewComplete ? '← Checkpoints' : '← Back'}
              variant="paper"
              onPress={() => {
                if (overviewComplete) setViewingSection(null);
                else {
                  const index = UNIT_OVERVIEW_SECTIONS.indexOf(viewingSection);
                  if (index > 0) setViewingSection(UNIT_OVERVIEW_SECTIONS[index - 1]);
                  else router.back();
                }
              }}
              style={styles.overviewNavButton}
            />
            <SignButton
              label={viewingSection === 'briefing' ? 'Unlock checkpoints →' : 'Continue →'}
              variant="ink"
              disabled={!sectionAcknowledged}
              onPress={() => showNextSection(viewingSection)}
              style={styles.overviewNavButton}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.compactHero}>
            <RouteBadge unitNumber={unit.number} />
            <View style={styles.compactHeroTitle}>
              <Text style={[type.h1, { color: colors.ink }]}>{unit.displayName}</Text>
              <Text style={[type.small, { color: colors.ink, fontWeight: '800' }]}>Unit briefing complete ✓</Text>
            </View>
            <Monogram text={unit.monogram} size={52} />
          </View>
          <RoadDivider />
          <SignPanel tone="yellow" title="Briefing viewed · 3 of 3">
            <Body>Review any section whenever you want. Your Route Checkpoints stay unlocked.</Body>
            {UNIT_OVERVIEW_SECTIONS.map((section, index) => (
              <SignButton
                key={section}
                label={`Review ${index + 1}: ${SECTION_LABELS[section]}`}
                variant="outline"
                onPress={() => setViewingSection(section)}
              />
            ))}
          </SignPanel>

          <View style={{ gap: space.xs }}>
            <Kicker color={colors.ink}>Route checkpoints</Kicker>
            {lessons.map((lesson) => {
              const isDone = explored.includes(lesson.id);
              return (
                <Pressable
                  key={lesson.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Lesson ${lesson.number}: ${lesson.title}${isDone ? ', explored' : ''}`}
                  onPress={() => router.push(`/lesson/${unit.id}/${lesson.id}`)}
                  style={({ pressed }) => [styles.lesson, pressed && { backgroundColor: colors.goldSoft }]}
                >
                  <View style={[styles.num, isDone && { backgroundColor: colors.yellow }]}>
                    <Text style={styles.numText}>{isDone ? '✓' : String(lesson.number).padStart(2, '0')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.kicker, { color: colors.muted, fontSize: 10 }]}>CHECKPOINT {String(lesson.number).padStart(2, '0')}</Text>
                    <Text style={[type.body, { fontWeight: '700', color: colors.ink }]}>{lesson.title}</Text>
                    {lesson.requiresCaregiverContext ? (
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

          {routeComplete ? (
            <SignPanel tone="yellow" title="Route explored ✓">
              <Body>The Final Project is optional. You can do it now, skip ahead, or come back later.</Body>
              <SignButton
                label="Start optional Final Project →"
                variant="ink"
                onPress={() => router.push(`/project/${unit.id}`)}
              />
              <SignButton
                label={nextUnit ? `Next Route: ${nextUnit.displayName} →` : 'Return to Route Directory →'}
                variant="outline"
                onPress={() => nextUnit ? router.push(`/unit/${nextUnit.id}`) : router.push('/units')}
              />
            </SignPanel>
          ) : null}
        </>
      )}

      <ProviderSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </Screen>
  );
}

function OverviewHeading({ unitNumber, step, title }: { unitNumber: number; step: number; title: string }) {
  return (
    <View style={styles.overviewHeading}>
      <RouteBadge unitNumber={unitNumber} />
      <View style={{ flex: 1 }}>
        <Kicker color={colors.muted}>Unit overview · {step} of 3</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.sm },
  compactHero: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  compactHeroTitle: { flex: 1, minWidth: 0 },
  overviewHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  stepProgress: { flexDirection: 'row', gap: space.sm },
  stepSegment: { flex: 1, minHeight: 36, borderWidth: 2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  stepSegmentDone: { backgroundColor: colors.yellowSoft },
  stepSegmentCurrent: { borderWidth: 4 },
  stepSegmentText: { color: colors.ink, fontWeight: '900' },
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
  acknowledgement: { minHeight: TOUCH + 20, flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderWidth: geometry.borderHeavy, borderColor: colors.ink, borderRadius: geometry.radius, backgroundColor: colors.paper },
  acknowledgementDone: { backgroundColor: colors.yellowSoft },
  checkbox: { width: 32, height: 32, borderWidth: 3, borderColor: colors.ink, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.yellow },
  checkboxText: { color: colors.ink, fontSize: 20, lineHeight: 24, fontWeight: '900' },
  overviewNav: { flexDirection: 'row', gap: space.sm },
  overviewNavButton: { flex: 1 },
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
