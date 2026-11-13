import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { catalog, frontMatter } from '../content';
import { useFamilyStore } from '../stores/family-store';
import { Blocks, Button, DraftBanner, Kicker, Screen } from '../ui/primitives';
import { RoadDivider, SignPanel } from '../ui/signage';
import { colors, space, type } from '../ui/theme';

const GATE_SECTION_IDS = ['intro', 'note', 'not-archiving-careers'] as const;

const gateSections = GATE_SECTION_IDS.map((id) => {
  const section = frontMatter.sections.find((candidate) => candidate.id === id);
  if (!section) throw new Error(`Missing required Field Manual section: ${id}`);
  return section;
});

/** One-time front-matter gate shown immediately after caregiver onboarding. */
export default function FieldManualGate() {
  const settings = useFamilyStore((state) => state.settings)!;
  const saveSettings = useFamilyStore((state) => state.saveSettings);
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const section = gateSections[page];
  const isLastPage = page === gateSections.length - 1;

  if (!settings) return null;

  const continueForward = async () => {
    if (!isLastPage) {
      setPage((current) => current + 1);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await saveSettings({ ...settings, fieldManualCompletedAt: new Date().toISOString() });
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your progress.');
      setSaving(false);
    }
  };

  return (
    <Screen key={section.id} edges={['top', 'bottom']}>
      {frontMatter.review.status !== 'approved' ? <DraftBanner /> : null}
      <View style={{ gap: space.xs, paddingTop: space.sm }}>
        <Kicker color={colors.ink}>Field manual · required reading</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{catalog.title}</Text>
        <Text style={[type.kicker, { color: colors.muted }]}>Page {page + 1} of {gateSections.length}</Text>
      </View>
      <RoadDivider />

      <SignPanel>
        <Text style={[type.h1, { color: colors.ink }]}>{section.heading}</Text>
        <Blocks blocks={section.blocks} />
      </SignPanel>

      {error ? (
        <Text accessibilityRole="alert" style={[type.small, { color: colors.danger, fontWeight: '700' }]}>
          {error}
        </Text>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Button
          label={isLastPage ? 'Enter Listening Required' : 'Continue'}
          disabled={saving}
          onPress={() => void continueForward()}
        />
        {page > 0 ? (
          <Button label="Previous page" variant="secondary" disabled={saving} onPress={() => setPage((current) => current - 1)} />
        ) : null}
      </View>
    </Screen>
  );
}
