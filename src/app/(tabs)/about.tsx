import { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { catalog, frontMatter } from '../../content';
import { ABOUT_LINKS } from '../../lib/about-links';
import { plannedUnitCount } from '../../domain/routes';
import { useFamilyStore } from '../../stores/family-store';
import { Blocks, DraftBanner, Kicker, Screen } from '../../ui/primitives';
import { CollapsibleSection, RoadDivider, SignButton, SignPanel } from '../../ui/signage';
import { colors, geometry, space, TOUCH, type } from '../../ui/theme';

function BookIcon() {
  return (
    <View aria-hidden style={styles.bookIcon}>
      <View style={styles.bookCover} />
      <View style={styles.bookPages} />
      <View style={styles.bookBookmark} />
    </View>
  );
}

export default function About() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [linkError, setLinkError] = useState<string | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const lessonPlan = useFamilyStore((s) => s.lessonPlan);
  const installedPacks = useFamilyStore((s) => s.installedPacks);
  const deleteAll = useFamilyStore((s) => s.deleteAll);
  const plannedUnits = plannedUnitCount(installedPacks, lessonPlan);

  const onWipe = async () => {
    await deleteAll();
    router.replace('/welcome');
  };

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
            <CollapsibleSection
              title={section.heading}
              isExpanded={isExpanded}
              accessibilityLabel={section.heading}
              onToggle={() => setExpanded((current) => ({ ...current, [section.id]: !isExpanded }))}
            >
              <Blocks blocks={section.blocks} />
            </CollapsibleSection>
          </SignPanel>
        );
      })}
      <SignPanel title="Get the guide">
        <View style={styles.quickActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Lesson Plan, ${plannedUnits} artist${plannedUnits === 1 ? '' : 's'} saved`}
            onPress={() => router.push('/plan')}
            style={({ pressed }) => [styles.quickActionButton, styles.lessonPlanButton, pressed && styles.pressed]}
          >
            <Text style={styles.lessonPlanCount}>{plannedUnits}</Text>
            <Text style={styles.lessonPlanLabel}>PLAN</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Browse lesson packs"
            accessibilityHint="Opens the lesson pack catalog"
            onPress={() => router.push('/packs')}
            style={({ pressed }) => [styles.quickActionButton, styles.quickActionInk, pressed && styles.pressed]}
          >
            <Text aria-hidden style={[styles.quickActionGlyph, styles.quickActionGlyphInk]}>+</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove downloaded packs and clear family data"
            accessibilityHint="Opens a confirmation before deleting local data"
            onPress={() => setConfirmingWipe(true)}
            style={({ pressed }) => [styles.quickActionButton, styles.quickActionDanger, pressed && styles.pressed]}
          >
            <Text aria-hidden style={[styles.quickActionGlyph, styles.quickActionGlyphDanger]}>−</Text>
          </Pressable>
        </View>
        {confirmingWipe ? (
          <SignPanel tone="warning" title="Delete family data">
            <Text style={[type.body, { color: colors.ink, fontWeight: '700' }]}>
              Remove every downloaded pack and clear everything saved on this device? This can’t be undone.
            </Text>
            <SignButton label="Yes, delete everything" variant="danger" onPress={() => void onWipe()} />
            <SignButton label="Cancel" variant="ghost" onPress={() => setConfirmingWipe(false)} />
          </SignPanel>
        ) : null}
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
  bookIcon: { width: 44, height: 42, position: 'relative', alignItems: 'center', justifyContent: 'flex-end' },
  bookCover: { width: 32, height: 36, backgroundColor: colors.yellow, borderColor: colors.ink, borderWidth: 3, borderRadius: 5 },
  bookPages: { position: 'absolute', left: 13, top: 3, bottom: 3, width: 3, borderRadius: 1, backgroundColor: colors.ink },
  bookBookmark: { position: 'absolute', top: -8, right: 9, width: 7, height: 16, backgroundColor: colors.ink },
  quickActionsRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.xs },
  quickActionButton: {
    flex: 1,
    minHeight: TOUCH,
    borderWidth: geometry.border,
    borderRadius: geometry.radius,
    borderColor: colors.ink,
    backgroundColor: colors.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionInk: { backgroundColor: colors.ink, borderColor: colors.ink },
  quickActionDanger: { backgroundColor: colors.paper, borderColor: colors.danger },
  quickActionGlyph: { color: colors.ink, fontSize: 30, lineHeight: 32, fontWeight: '700' },
  quickActionGlyphInk: { color: colors.paper },
  quickActionGlyphDanger: { color: colors.danger },
  lessonPlanButton: { backgroundColor: colors.ink, gap: 2 },
  lessonPlanCount: { color: colors.paper, fontSize: 20, lineHeight: 22, fontWeight: '900' },
  lessonPlanLabel: { color: colors.paper, fontSize: 10, lineHeight: 12, fontWeight: '900', letterSpacing: 1 },
  linkError: { color: colors.danger, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
