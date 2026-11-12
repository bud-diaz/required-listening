import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { Lane } from '../content/schemas';
import { PROVIDERS, PROVIDER_LABELS, type Provider } from '../lib/links';
import { useFamilyStore } from '../stores/family-store';
import { Button, Card, Chip, Kicker, Rule, Screen } from '../ui/primitives';
import { RoadDivider, SignPanel } from '../ui/signage';
import { LANE_INFO } from '../ui/lanes';
import { colors, space, type } from '../ui/theme';

/**
 * Caregiver settings: lane, providers, export, delete.
 * A caregiver PIN for this screen is planned for Phase 2.
 */
export default function SettingsScreen() {
  const settings = useFamilyStore((s) => s.settings)!;
  const saveSettings = useFamilyStore((s) => s.saveSettings);
  const exportAll = useFamilyStore((s) => s.exportAll);
  const deleteAll = useFamilyStore((s) => s.deleteAll);
  const [confirming, setConfirming] = useState(false);

  if (!settings) return null;

  const setLane = (lane: Lane) => saveSettings({ ...settings, lane });
  const toggleProvider = (p: Provider) => {
    const next = settings.providers.includes(p) ? settings.providers.filter((x) => x !== p) : [...settings.providers, p];
    if (next.length) void saveSettings({ ...settings, providers: next });
  };

  const onExport = async () => {
    const data = await exportAll();
    await Share.share({ message: JSON.stringify(data, null, 2) });
  };

  const onDelete = async () => {
    await deleteAll();
    router.replace('/welcome');
  };

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Caregiver controls</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Settings</Text>
      </View>
      <RoadDivider />
      <View style={{ gap: space.sm }}>
        <Kicker>Listening lane</Kicker>
        {(Object.keys(LANE_INFO) as Lane[]).map((l) => (
          <Card key={l} tone={settings.lane === l ? 'gold' : 'paper'}>
            <Chip label={LANE_INFO[l].label} selected={settings.lane === l} onPress={() => setLane(l)} />
            <Text style={[type.small, { color: colors.ink }]}>{LANE_INFO[l].description}</Text>
          </Card>
        ))}
      </View>

      <View style={{ gap: space.sm }}>
        <Kicker>Music services</Kicker>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {PROVIDERS.map((p) => (
            <Chip key={p} label={PROVIDER_LABELS[p]} selected={settings.providers.includes(p)} onPress={() => toggleProvider(p)} />
          ))}
        </View>
        <Text style={[type.small, { color: colors.muted }]}>Keep at least one turned on.</Text>
      </View>

      <Button label="Edit nickname & avatar" variant="secondary" onPress={() => router.push('/welcome')} />

      <Rule />
      <View style={{ gap: space.sm }}>
        <Kicker>Your family’s data</Kicker>
        <Text style={[type.small, { color: colors.ink }]}>
          Everything is stored only on this device: settings, crate, saved thoughts and progress. Nothing is uploaded.
        </Text>
        <Button label="Export a copy" variant="secondary" onPress={onExport} />
        {confirming ? (
          <SignPanel tone="warning" title="Delete family data">
            <Text style={[type.body, { color: colors.ink, fontWeight: '700' }]}>
              Delete everything on this device? This can’t be undone.
            </Text>
            <Button label="Yes, delete everything" variant="danger" onPress={onDelete} />
            <Button label="Cancel" variant="ghost" onPress={() => setConfirming(false)} />
          </SignPanel>
        ) : (
          <Button label="Delete all family data" variant="danger" onPress={() => setConfirming(true)} />
        )}
      </View>
    </Screen>
  );
}
