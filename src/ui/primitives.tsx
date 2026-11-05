import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BodyBlock } from '../content/schemas';
import { colors, space, TOUCH, type } from './theme';

export function Screen({ children, edges = ['bottom'] }: { children: ReactNode; edges?: ('top' | 'bottom')[] }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Kicker({ children, color = colors.gold }: { children: ReactNode; color?: string }) {
  return <Text style={[type.kicker, { color }]}>{children}</Text>;
}

export function Rule() {
  return <View style={styles.rule} />;
}

export function Body({ children, style }: { children: ReactNode; style?: object }) {
  return <Text style={[type.body, { color: colors.ink }, style]}>{children}</Text>;
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, accessibilityHint, style }: ButtonProps) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, v.box, pressed && { opacity: 0.8 }, disabled && { opacity: 0.4 }, style]}
    >
      <Text style={[styles.buttonText, v.text]}>{label}</Text>
    </Pressable>
  );
}

const buttonVariants = {
  primary: { box: { backgroundColor: colors.ink }, text: { color: colors.paper } },
  secondary: { box: { backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink }, text: { color: colors.ink } },
  ghost: { box: { backgroundColor: 'transparent' }, text: { color: colors.goldDeep } },
  danger: { box: { backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.danger }, text: { color: colors.danger } },
};

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && { color: colors.paper }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, tone = 'paper' }: { children: ReactNode; tone?: 'paper' | 'gold' | 'ink' }) {
  const bg = tone === 'gold' ? colors.goldSoft : tone === 'ink' ? colors.ink : colors.paper;
  return <View style={[styles.card, { backgroundColor: bg }]}>{children}</View>;
}

export function DraftBanner() {
  return (
    <View style={styles.draft} accessibilityRole="alert">
      <Text style={[type.small, { color: colors.draft, fontWeight: '700' }]}>
        DRAFT · Awaiting editorial review. Shown in development builds only.
      </Text>
    </View>
  );
}

export function CaregiverNote({ text }: { text: string }) {
  return (
    <View style={styles.note}>
      <Kicker color={colors.goldDeep}>For grown-ups</Kicker>
      <Text style={[type.small, { color: colors.ink, marginTop: space.xs }]}>{text}</Text>
    </View>
  );
}

export function Blocks({ blocks }: { blocks: BodyBlock[] }) {
  return (
    <View style={{ gap: space.md }}>
      {blocks.map((b, i) => {
        if (b.type === 'text') return <Body key={i}>{b.text}</Body>;
        if (b.type === 'callout')
          return (
            <View key={i} style={styles.callout}>
              <Text style={[type.h2, { color: colors.ink }]}>{b.text}</Text>
            </View>
          );
        return (
          <View key={i} style={{ gap: space.xs }}>
            {b.label ? <Text style={[type.small, { fontWeight: '800', color: colors.muted }]}>{b.label}</Text> : null}
            {b.items.map((item, j) => (
              <View key={j} style={{ flexDirection: 'row', gap: space.sm }}>
                <Text style={[type.body, { color: colors.gold }]}>—</Text>
                <Body style={{ flex: 1 }}>{item}</Body>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: space.md, paddingVertical: space.lg },
  column: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: space.lg },
  rule: { height: 1, backgroundColor: colors.rule },
  button: {
    minHeight: TOUCH,
    paddingHorizontal: space.lg,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  chip: {
    minHeight: 40,
    paddingHorizontal: space.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.ink,
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  chipOn: { backgroundColor: colors.ink },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  card: { padding: space.md, borderRadius: 6, borderWidth: 1, borderColor: colors.rule, gap: space.sm },
  draft: { backgroundColor: colors.draftBg, padding: space.sm, borderRadius: 4 },
  note: { borderLeftWidth: 4, borderLeftColor: colors.gold, paddingLeft: space.md, paddingVertical: space.xs },
  callout: { borderLeftWidth: 4, borderLeftColor: colors.ink, paddingLeft: space.md },
});
