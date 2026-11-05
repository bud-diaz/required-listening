import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { getUnit, units, visibleLessons } from '../../content';
import { Monogram } from '../../components/Monogram';
import { useFamilyStore } from '../../stores/family-store';
import { Body, Button, Card, Kicker, Screen } from '../../ui/primitives';
import { LANE_INFO } from '../../ui/lanes';
import { colors, space, type } from '../../ui/theme';

export default function Home() {
  const settings = useFamilyStore((s) => s.settings)!;
  const explored = useFamilyStore((s) => s.explored);
  const crate = useFamilyStore((s) => s.crate);
  const reflections = useFamilyStore((s) => s.reflections);

  // Current unit: the first converted unit with a lesson still to explore.
  const available = units.map((u) => getUnit(u.id, __DEV__)).filter((u) => !!u);
  const current =
    available.find((u) => visibleLessons(u, settings.lane).some((l) => !explored.includes(l.id))) ?? available[0];
  const lessons = current ? visibleLessons(current, settings.lane) : [];
  const done = lessons.filter((l) => explored.includes(l.id)).length;
  const next = lessons.find((l) => !explored.includes(l.id));

  const recent = [...reflections].reverse().slice(0, 3);

  return (
    <Screen>
      <View style={styles.hello}>
        <Text style={{ fontSize: 32 }}>{settings.avatar}</Text>
        <View style={{ flex: 1 }}>
          <Kicker color={colors.muted}>{LANE_INFO[settings.lane].label} lane</Kicker>
          <Text style={[type.h1, { color: colors.ink }]}>Hey, {settings.nickname}</Text>
        </View>
        <Link href="/settings" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Grown-up settings" style={styles.gear}>
            <Text style={{ fontSize: 20 }}>⚙︎</Text>
          </Pressable>
        </Link>
      </View>

      {current ? (
        <Card tone="ink">
          <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Monogram text={current.monogram} size={64} />
            <View style={{ flex: 1 }}>
              <Kicker>Unit {current.number}</Kicker>
              <Text style={[type.h1, { color: colors.paper }]}>{current.displayName}</Text>
              <Text style={[type.small, { color: colors.goldSoft }]}>
                {done} of {lessons.length} lessons explored
              </Text>
            </View>
          </View>
          {next ? (
            <Button
              label={`Lesson ${next.number}: Start`}
              variant="secondary"
              onPress={() => router.push(`/lesson/${current.id}/${next.id}`)}
            />
          ) : null}
          <Button label="Open unit" variant="ghost" onPress={() => router.push(`/unit/${current.id}`)} />
        </Card>
      ) : (
        <Card>
          <Body>Units are being reviewed. Check back soon.</Body>
        </Card>
      )}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Button label="All artists" variant="secondary" onPress={() => router.push('/units')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label={`My crate (${crate.length})`} variant="secondary" onPress={() => router.push('/crate')} />
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Kicker>Family replay</Kicker>
        {recent.length === 0 ? (
          <Text style={[type.small, { color: colors.muted }]}>
            Thoughts you save in a lesson show up here. Private to this device.
          </Text>
        ) : (
          recent.map((r) => {
            const unit = units.find((u) => u.id === r.unitId);
            const lesson = unit?.lessons.find((l) => l.id === r.lessonId);
            return (
              <Card key={r.id}>
                <Text style={[type.small, { color: colors.muted }]}>
                  {unit?.displayName} · Lesson {lesson?.number}
                </Text>
                {r.feelings.length ? <Text style={[type.body, { fontWeight: '700' }]}>{r.feelings.join(' · ')}</Text> : null}
                {r.text ? <Body>“{r.text}”</Body> : null}
              </Card>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hello: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  gear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', gap: space.sm },
});
