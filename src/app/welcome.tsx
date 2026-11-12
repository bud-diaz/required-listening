import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { catalog } from '../content';
import type { Lane } from '../content/schemas';
import { AVATARS, Settings } from '../domain/crate';
import { PROVIDERS, PROVIDER_LABELS, type Provider } from '../lib/links';
import { useFamilyStore } from '../stores/family-store';
import { Body, Button, Card, Chip, Kicker, Screen } from '../ui/primitives';
import { RoadDivider, SignPanel } from '../ui/signage';
import { LANE_INFO } from '../ui/lanes';
import { colors, space, TOUCH, type } from '../ui/theme';

/** Caregiver onboarding. Collects only a nickname and an emoji avatar for the kid. */
export default function Welcome() {
  const saveSettings = useFamilyStore((s) => s.saveSettings);
  const existing = useFamilyStore((s) => s.settings);
  const [nickname, setNickname] = useState(existing?.nickname ?? '');
  const [avatar, setAvatar] = useState<string>(existing?.avatar ?? AVATARS[0]);
  const [lane, setLane] = useState<Lane>(existing?.lane ?? 'guided');
  const [providers, setProviders] = useState<Provider[]>(existing?.providers ?? ['spotify', 'apple-music']);
  const [ack, setAck] = useState(!!existing);
  const [error, setError] = useState<string | null>(null);

  const toggleProvider = (p: Provider) =>
    setProviders((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const onStart = async () => {
    const parsed = Settings.safeParse({ nickname, avatar, lane, providers, onboardedAt: new Date().toISOString() });
    if (!parsed.success) {
      setError(!nickname.trim() ? 'Add a nickname for your listener.' : 'Turn on at least one music service.');
      return;
    }
    await saveSettings(parsed.data);
    router.replace('/');
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: space.sm, paddingTop: space.lg }}>
        <Kicker color={colors.ink}>The Sound Traffic System</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>Listening Required</Text>
        <Text style={[type.kicker, { color: colors.ink }]}>{catalog.subtitle}</Text>
        <Body>Pass down the songs, then let them build their own crate.</Body>
      </View>
      <RoadDivider />

      <View style={{ gap: space.sm }}>
        <Kicker color={colors.muted}>For grown-ups · 1 minute setup</Kicker>
        <Text style={[type.h2, { color: colors.ink }]}>Who’s listening?</Text>
        <Text style={[type.small, { color: colors.muted }]}>
          A nickname only. No real names, birthdays or emails. Everything stays on this device.
        </Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="Nickname"
          maxLength={24}
          accessibilityLabel="Listener nickname"
          style={styles.input}
          placeholderTextColor={colors.muted}
        />
        <View style={styles.wrap}>
          {AVATARS.map((a) => (
            <Chip key={a} label={a} selected={avatar === a} onPress={() => setAvatar(a)} />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={[type.h2, { color: colors.ink }]}>Pick a listening lane</Text>
        {(Object.keys(LANE_INFO) as Lane[]).map((l) => (
          <Card key={l} tone={lane === l ? 'gold' : 'paper'}>
            <Chip label={LANE_INFO[l].label} selected={lane === l} onPress={() => setLane(l)} />
            <Text style={[type.small, { color: colors.ink }]}>{LANE_INFO[l].description}</Text>
          </Card>
        ))}
      </View>

      <View style={{ gap: space.sm }}>
        <Text style={[type.h2, { color: colors.ink }]}>Where do you listen?</Text>
        <Text style={[type.small, { color: colors.muted }]}>
          The app doesn’t play music. It opens a search in the services you allow here.
        </Text>
        <View style={styles.wrap}>
          {PROVIDERS.map((p) => (
            <Chip key={p} label={PROVIDER_LABELS[p]} selected={providers.includes(p)} onPress={() => toggleProvider(p)} />
          ))}
        </View>
      </View>

      <SignPanel tone="yellow" title="Content note">
        <Text style={[type.small, { color: colors.ink }]}>
          This guide assumes adult discretion and encourages context over censorship. Some artists and songs deal with
          violence, trauma, substances and adult behavior. Labels and lanes help you choose, but no label promises a
          record is right for every kid. Preview first when you’re not sure.
        </Text>
        <Chip label={ack ? 'Got it ✓' : 'Got it'} selected={ack} onPress={() => setAck(!ack)} />
      </SignPanel>

      {error ? (
        <Text accessibilityRole="alert" style={[type.small, { color: colors.danger, fontWeight: '700' }]}>
          {error}
        </Text>
      ) : null}
      <Button label={existing ? 'Save' : 'Start listening'} disabled={!ack} onPress={onStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  input: {
    minHeight: TOUCH,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: space.md,
    fontSize: 16,
    backgroundColor: colors.paper,
    color: colors.ink,
  },
});
