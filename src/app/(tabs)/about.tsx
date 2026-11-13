import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { catalog, frontMatter } from '../../content';
import { Blocks, DraftBanner, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignPanel } from '../../ui/signage';
import { colors, space, type } from '../../ui/theme';

export default function About() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
      {frontMatter.sections.map((section) => {
        const isExpanded = !!expanded[section.id];
        return (
          <SignPanel key={section.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={section.heading}
              accessibilityHint={isExpanded ? 'Collapses this Field Manual section' : 'Expands this Field Manual section'}
              accessibilityState={{ expanded: isExpanded }}
              onPress={() => setExpanded((current) => ({ ...current, [section.id]: !isExpanded }))}
              style={({ pressed }) => [styles.accordionHeader, pressed && styles.pressed]}
            >
              <Text style={[type.h1, styles.heading]}>{section.heading}</Text>
              <Text aria-hidden style={styles.symbol}>{isExpanded ? '−' : '+'}</Text>
            </Pressable>
            {isExpanded ? <Blocks blocks={section.blocks} /> : null}
          </SignPanel>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  accordionHeader: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  heading: { flex: 1, color: colors.ink, fontSize: 22 },
  symbol: { color: colors.ink, fontSize: 32, lineHeight: 32, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
