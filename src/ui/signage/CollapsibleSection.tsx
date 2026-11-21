import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../theme';

export function CollapsibleSection({
  title,
  subtitle,
  isExpanded,
  onToggle,
  accessibilityLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: () => void;
  accessibilityLabel?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityHint={isExpanded ? 'Collapses this section' : 'Expands this section'}
        accessibilityState={{ expanded: isExpanded }}
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[type.h1, styles.heading]}>{title}</Text>
          {subtitle ? <Text style={[type.small, styles.subtitle]}>{subtitle}</Text> : null}
        </View>
        <Text aria-hidden style={styles.symbol}>{isExpanded ? '−' : '+'}</Text>
      </Pressable>
      {isExpanded ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  heading: { color: colors.ink, fontSize: 22 },
  subtitle: { color: colors.muted },
  symbol: { color: colors.ink, fontSize: 32, lineHeight: 32, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
