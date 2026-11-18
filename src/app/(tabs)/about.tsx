import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { catalog, frontMatter } from '../../content';
import { ABOUT_LINKS } from '../../lib/about-links';
import { Blocks, DraftBanner, Kicker, Screen } from '../../ui/primitives';
import { RoadDivider, SignPanel } from '../../ui/signage';
import { colors, geometry, space, TOUCH, type } from '../../ui/theme';

function BookIcon() {
  return (
    <View aria-hidden style={styles.bookIcon}>
      <View style={[styles.bookPage, styles.bookPageLeft]} />
      <View style={[styles.bookPage, styles.bookPageRight]} />
      <View style={styles.bookSpine} />
    </View>
  );
}

export default function About() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [linkError, setLinkError] = useState<string | null>(null);

  const openLink = async (url: string) => {
    try {
      if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
      else await Linking.openURL(url);
      setLinkError(null);
    } catch {
      setLinkError('Couldn\u2019t open that page. Check your connection and try again.');
    }
  };

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
      <SignPanel title="Get the guide">
        <View style={styles.guideLinksRow}>
          {ABOUT_LINKS.map((link, index) => (
            <Pressable
              key={link.id}
              accessibilityRole="link"
              accessibilityLabel={link.label}
              accessibilityHint="Opens this page outside Listening Required"
              onPress={() => void openLink(link.url)}
              style={({ pressed }) => [
                styles.guideLinkButton,
                index === 0 ? styles.guideLinkInk : styles.guideLinkPaper,
                pressed && styles.pressed,
              ]}
            >
              {index === 0 ? (
                <Image
                  accessible={false}
                  resizeMode="contain"
                  source={require('../../../assets/paperweight-brand-mark.png')}
                  style={styles.paperweightLogo}
                />
              ) : (
                <BookIcon />
              )}
            </Pressable>
          ))}
        </View>
        <View style={styles.placeholderRow}>
          {[1, 2, 3].map((slot) => (
            <Pressable
              key={slot}
              accessibilityRole="button"
              accessibilityLabel={`Future guide link ${slot}`}
              accessibilityState={{ disabled: true }}
              disabled
              style={styles.placeholderButton}
            >
              <Text aria-hidden style={styles.placeholderPlus}>+</Text>
            </Pressable>
          ))}
        </View>
        {linkError ? (
          <Text accessibilityRole="alert" style={[type.small, styles.linkError]}>
            {linkError}
          </Text>
        ) : null}
      </SignPanel>
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
  guideLinksRow: { flexDirection: 'row', gap: space.sm },
  guideLinkButton: {
    flex: 1,
    minHeight: 76,
    borderWidth: geometry.borderHeavy,
    borderRadius: geometry.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideLinkInk: { backgroundColor: colors.ink, borderColor: colors.ink },
  guideLinkPaper: { backgroundColor: colors.paper, borderColor: colors.ink },
  paperweightLogo: { width: 56, height: 56 },
  bookIcon: { width: 52, height: 40, flexDirection: 'row', position: 'relative', alignItems: 'flex-start' },
  bookPage: { width: 26, height: 36, backgroundColor: colors.yellow, borderColor: colors.ink, borderWidth: 3 },
  bookPageLeft: { borderTopLeftRadius: 7, borderBottomLeftRadius: 5, borderRightWidth: 1, transform: [{ rotate: '-4deg' }] },
  bookPageRight: { borderTopRightRadius: 7, borderBottomRightRadius: 5, borderLeftWidth: 1, transform: [{ rotate: '4deg' }] },
  bookSpine: { position: 'absolute', left: 24.5, top: 3, width: 3, height: 34, borderRadius: 2, backgroundColor: colors.ink },
  placeholderRow: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  placeholderButton: {
    flex: 1,
    minHeight: TOUCH,
    borderWidth: geometry.border,
    borderRadius: geometry.radius,
    borderColor: colors.ink,
    backgroundColor: colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderPlus: { color: colors.ink, fontSize: 30, lineHeight: 32, fontWeight: '700' },
  linkError: { color: colors.danger, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
