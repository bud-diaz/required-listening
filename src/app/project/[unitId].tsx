import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import { getNextUnit, getUnit, visibleTracks } from '../../content';
import type { Track } from '../../content/schemas';
import { isRouteComplete, isUnitOverviewComplete } from '../../domain/progress';
import { ProviderSheet } from '../../components/ProviderSheet';
import { TrackRow } from '../../components/TrackRow';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Chip, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, RouteBadge, SignButton, SignPanel } from '../../ui/signage';
import { colors, geometry, space, type } from '../../ui/theme';

export default function FinalProjectScreen() {
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const lane = useFamilyStore((state) => state.settings?.lane ?? 'younger');
  const explored = useFamilyStore((state) => state.explored);
  const acknowledgements = useFamilyStore((state) => state.unitOverviewAcknowledgements);
  const existing = useFamilyStore((state) => state.projectResponses.find((item) => item.unitId === unitId));
  const saveFinalProjectResponse = useFamilyStore((state) => state.saveFinalProjectResponse);
  const [text, setText] = useState(existing?.text ?? '');
  const [earlyTrackIds, setEarlyTrackIds] = useState<string[]>(existing?.earlyTrackIds ?? []);
  const [laterTrackIds, setLaterTrackIds] = useState<string[]>(existing?.laterTrackIds ?? []);
  const [sheetTrack, setSheetTrack] = useState<Track | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(existing?.updatedAt);
  const [saveError, setSaveError] = useState<string | null>(null);

  const unit = getUnit(unitId, __DEV__);
  if (!unit) {
    return (
      <Screen>
        <Body>This Final Project isn’t available.</Body>
      </Screen>
    );
  }

  if (!isUnitOverviewComplete(acknowledgements, unit.id) || !isRouteComplete(unit, lane, explored)) {
    return <Redirect href={`/unit/${unit.id}`} />;
  }

  const earlyTracks = visibleTracks(unit, unit.finalProject.earlyOptions, lane);
  const laterTracks = visibleTracks(unit, unit.finalProject.laterOptions, lane);
  const hiddenTrackCount = unit.finalProject.earlyOptions.length + unit.finalProject.laterOptions.length
    - earlyTracks.length - laterTracks.length;
  const nextUnit = getNextUnit(unit.id, __DEV__);

  const toggleTrack = (trackId: string, group: 'early' | 'later') => {
    const selected = group === 'early' ? earlyTrackIds : laterTrackIds;
    const setSelected = group === 'early' ? setEarlyTrackIds : setLaterTrackIds;
    setSelected(selected.includes(trackId) ? selected.filter((id) => id !== trackId) : [...selected, trackId]);
    setSavedAt(undefined);
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const response = await saveFinalProjectResponse({
        unitId: unit.id,
        text,
        earlyTrackIds: earlyTrackIds.filter((id) => unit.finalProject.earlyOptions.includes(id)),
        laterTrackIds: laterTrackIds.filter((id) => unit.finalProject.laterOptions.includes(id)),
      });
      setSavedAt(response.updatedAt);
    } catch {
      setSaveError('Couldn’t save this response. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `${unit.displayName} Final Project` }} />
      <View style={styles.heading}>
        <RouteBadge unitNumber={unit.number} />
        <View style={{ flex: 1 }}>
          <Kicker color={colors.muted}>Optional · private to this device</Kicker>
          <Text style={[type.display, { color: colors.ink }]}>Final Project</Text>
        </View>
      </View>
      <RoadDivider />

      <SignPanel tone="yellow" title="Your mission">
        <Body>{unit.finalProject.prompt}</Body>
        <Text style={[type.small, { color: colors.muted }]}>No grades. Talk it out first, then save as much or as little as you want.</Text>
      </SignPanel>

      <ProjectTracks
        label="Early track picks · optional"
        tracks={earlyTracks}
        selectedIds={earlyTrackIds}
        onToggle={(trackId) => toggleTrack(trackId, 'early')}
        onListen={setSheetTrack}
      />
      <ProjectTracks
        label="Later track picks · optional"
        tracks={laterTracks}
        selectedIds={laterTrackIds}
        onToggle={(trackId) => toggleTrack(trackId, 'later')}
        onListen={setSheetTrack}
      />
      {hiddenTrackCount > 0 ? (
        <Text style={[type.small, { color: colors.muted }]}>
          {hiddenTrackCount} project {hiddenTrackCount === 1 ? 'track is' : 'tracks are'} hidden on your listening lane.
        </Text>
      ) : null}

      <View style={{ gap: space.sm }}>
        <Kicker color={colors.ink}>Your family’s response</Kicker>
        <TextInput
          value={text}
          onChangeText={(value) => { setText(value); setSavedAt(undefined); }}
          placeholder="Compare the music, name the influence, and share what your family noticed…"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={3000}
          accessibilityLabel="Final Project response"
          style={styles.input}
        />
        <Text style={[type.small, { color: colors.muted, textAlign: 'right' }]}>{text.length}/3000</Text>
        <SignButton
          label={saving ? 'Saving…' : savedAt ? 'Saved on this device ✓' : 'Save private response'}
          variant="ink"
          disabled={saving || !text.trim()}
          onPress={() => void save()}
        />
        {saveError ? <Text accessibilityRole="alert" style={[type.small, { color: colors.danger, fontWeight: '800' }]}>{saveError}</Text> : null}
      </View>

      <SignPanel title="Keep moving">
        <Body>The project stays editable. Continuing does not erase it or mark it as graded.</Body>
        <SignButton
          label={nextUnit ? `Next Route: ${nextUnit.displayName} →` : 'Return to Route Directory →'}
          variant="yellow"
          onPress={() => nextUnit ? router.push(`/unit/${nextUnit.id}`) : router.push('/units')}
        />
        <SignButton label={`Back to ${unit.displayName} checkpoints`} variant="outline" onPress={() => router.push(`/unit/${unit.id}`)} />
      </SignPanel>

      <ProviderSheet track={sheetTrack} onClose={() => setSheetTrack(null)} />
    </Screen>
  );
}

function ProjectTracks({
  label,
  tracks,
  selectedIds,
  onToggle,
  onListen,
}: {
  label: string;
  tracks: Track[];
  selectedIds: string[];
  onToggle: (trackId: string) => void;
  onListen: (track: Track) => void;
}) {
  if (tracks.length === 0) return null;
  return (
    <View style={{ gap: space.sm }}>
      <Kicker color={colors.ink}>{label}</Kicker>
      {tracks.map((track) => (
        <View key={track.id} style={{ gap: space.xs }}>
          <TrackRow track={track} onListen={onListen} />
          <Chip
            label={selectedIds.includes(track.id) ? `Using “${track.title}”` : `Use “${track.title}” in project`}
            selected={selectedIds.includes(track.id)}
            onPress={() => onToggle(track.id)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  input: {
    minHeight: 180,
    borderWidth: geometry.borderHeavy,
    borderColor: colors.ink,
    borderRadius: geometry.radius,
    padding: space.md,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: colors.paper,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});
