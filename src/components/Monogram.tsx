import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../ui/theme';

/** Record-label style monogram, used instead of artist photos (no image rights needed). */
export function Monogram({ text, size = 72, dim = false }: { text: string; size?: number; dim?: boolean }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.disc,
        { width: size, height: size, borderRadius: size / 2, opacity: dim ? 0.45 : 1 },
      ]}
    >
      <View style={[styles.label, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]}>
        <Text style={[styles.text, { fontSize: size * 0.18 }]}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  label: { backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  text: { color: colors.ink, fontWeight: '900' },
});
