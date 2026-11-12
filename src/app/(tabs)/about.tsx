import { Text, View } from 'react-native';
import { catalog, frontMatter } from '../../content';
import { Blocks, DraftBanner, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

export default function About() {
  return (
    <Screen>
      {frontMatter.review.status !== 'approved' ? <DraftBanner /> : null}
      <View style={{ gap: space.xs }}>
        <Kicker color={colors.ink}>Field manual · {catalog.subtitle}</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{catalog.title}</Text>
        {/* Byline intentionally omitted until confirmed (docs/APP_PLAN.md §2). */}
        {catalog.byline ? <Text style={[type.kicker, { color: colors.muted }]}>{catalog.byline}</Text> : null}
      </View>
      <RoadDivider />
      {frontMatter.sections.map((s) => (
        <SignPanel key={s.id}>
          <Text style={[type.h1, { color: colors.ink, fontSize: 22 }]}>{s.heading}</Text>
          <Blocks blocks={s.blocks} />
        </SignPanel>
      ))}
    </Screen>
  );
}
