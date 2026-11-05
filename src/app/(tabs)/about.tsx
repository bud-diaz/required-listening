import { Text, View } from 'react-native';
import { catalog, frontMatter } from '../../content';
import { Blocks, DraftBanner, Kicker, Rule, Screen } from '../../ui/primitives';
import { colors, space, type } from '../../ui/theme';

export default function About() {
  return (
    <Screen>
      {frontMatter.review.status !== 'approved' ? <DraftBanner /> : null}
      <View style={{ gap: space.xs }}>
        <Kicker>{catalog.subtitle}</Kicker>
        <Text style={[type.display, { color: colors.ink }]}>{catalog.title}</Text>
        {/* Byline intentionally omitted until confirmed (docs/APP_PLAN.md §2). */}
        {catalog.byline ? <Text style={[type.kicker, { color: colors.muted }]}>{catalog.byline}</Text> : null}
      </View>
      {frontMatter.sections.map((s) => (
        <View key={s.id} style={{ gap: space.md }}>
          <Rule />
          <Text style={[type.h1, { color: colors.ink, fontSize: 22 }]}>{s.heading}</Text>
          <Blocks blocks={s.blocks} />
        </View>
      ))}
    </Screen>
  );
}
