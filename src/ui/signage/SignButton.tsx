import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { colors, geometry, space, TOUCH } from '../theme';

type Variant = 'ink' | 'paper' | 'yellow' | 'outline' | 'danger' | 'ghost';

export function SignButton({
  label,
  onPress,
  variant = 'ink',
  disabled,
  loading,
  hint,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  hint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const visual = variants[variant];
  const shownLabel = loading ? 'Working…' : label;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shownLabel}
      accessibilityHint={hint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        visual.box,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, visual.text]}>{shownLabel}</Text>
    </Pressable>
  );
}

const variants = {
  ink: { box: { backgroundColor: colors.ink, borderColor: colors.ink }, text: { color: colors.paper } },
  paper: { box: { backgroundColor: colors.paper, borderColor: colors.ink }, text: { color: colors.ink } },
  yellow: { box: { backgroundColor: colors.yellow, borderColor: colors.ink }, text: { color: colors.ink } },
  outline: { box: { backgroundColor: 'transparent', borderColor: colors.ink }, text: { color: colors.ink } },
  danger: { box: { backgroundColor: colors.paper, borderColor: colors.danger }, text: { color: colors.danger } },
  ghost: { box: { backgroundColor: 'transparent', borderColor: 'transparent' }, text: { color: colors.ink } },
};

const styles = StyleSheet.create({
  button: {
    minHeight: TOUCH + 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderWidth: geometry.borderHeavy,
    borderRadius: geometry.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 15, lineHeight: 19, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.42 },
});
