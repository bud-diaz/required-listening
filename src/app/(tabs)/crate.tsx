import { Share, Text, View } from 'react-native';
import { router } from 'expo-router';
import { crateActivity } from '../../content';
import { MAX_CRATE_SIZE_HINT, crateShareText } from '../../domain/crate';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Button, Card, Kicker, Screen } from '../../ui/primitives';
import { RecordSign, RoadDivider, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

const whyLabels = Object.fromEntries(crateActivity.whyOptions.map((o) => [o.id, o.label]));
const momentLabels = Object.fromEntries(crateActivity.momentOptions.map((o) => [o.id, o.label]));

export default function Crate() {
  const crate = useFamilyStore((s) => s.crate);
  const nickname = useFamilyStore((s) => s.settings!.nickname);
  const remove = useFamilyStore((s) => s.removeFromCrate);

  const onShare = () =>
    Share.share({ message: crateShareText(nickname, crate, { why: whyLabels, moment: momentLabels }) });

  return (
    <Screen>
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Build your own crate</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{nickname}’s crate</Text>
        <Body style={{ color: colors.ink, fontSize: 15 }}>{crateActivity.intro}</Body>
      </View>
      <RoadDivider />

      {crate.length === 0 ? (
        <Card tone="gold">
          <Body>
            Your crate is empty. Pick {crateActivity.minSongs}–{crateActivity.maxSongs} songs you like right now.
          </Body>
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          {crate.map((e, i) => (
            <SignPanel key={e.id}>
              <Text style={[type.kicker, { color: colors.ink }]}>RECORD {String(i + 1).padStart(2, '0')}</Text>
              <RecordSign title={e.title} artist={e.artist} />
              <Text style={[type.small, { color: colors.ink }]}>
                Why: {e.why.map((w) => whyLabels[w] ?? w).join(', ')}
              </Text>
              <Text style={[type.small, { color: colors.ink }]}>When: {momentLabels[e.moment] ?? e.moment}</Text>
              {e.note ? <Text style={[type.small, { color: colors.ink, fontStyle: 'italic' }]}>“{e.note}”</Text> : null}
              <Text style={[type.small, { color: colors.muted }]}>Added {new Date(e.addedAt).toLocaleDateString()}</Text>
              <Button label="Remove" variant="ghost" onPress={() => remove(e.id)} />
            </SignPanel>
          ))}
        </View>
      )}

      <Button label="+ Add a song" onPress={() => router.push('/crate/add')} />
      {crate.length >= MAX_CRATE_SIZE_HINT ? (
        <Text style={[type.small, { color: colors.muted }]}>
          That’s a full crate. You can always swap songs. Crates change over time.
        </Text>
      ) : null}

      {crate.length > 0 ? (
        <View style={{ gap: space.sm }}>
          <Kicker>Share your crate</Kicker>
          {crateActivity.shareTips.map((t) => (
            <Text key={t} style={[type.small, { color: colors.ink }]}>— {t}</Text>
          ))}
          <Button label="Share privately" variant="secondary" onPress={onShare} accessibilityHint="Opens your phone's share sheet. Nothing is posted publicly." />
        </View>
      ) : null}

      <Card tone="ink">
        <Kicker>An open crate</Kicker>
        {crateActivity.closing.map((c) => (
          <Text key={c} style={[type.body, { color: colors.paper }]}>{c}</Text>
        ))}
      </Card>
    </Screen>
  );
}
