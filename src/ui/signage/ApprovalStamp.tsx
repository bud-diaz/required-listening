import { StyleSheet, Text, View } from 'react-native';
import { colors, geometry, space, type } from '../theme';

export function ApprovalStamp({ visible, label = 'Crate approved' }: { visible: boolean; label?: string; reducedMotion?: boolean }) {
  if (!visible) return null;
  return (
    <View style={styles.stamp} accessibilityRole="alert" accessibilityLabel="Added to your crate">
      <Text style={styles.label}>{label}</Text>
      <Text style={[type.small, styles.message]}>Added to your crate.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: { alignSelf: 'center', borderWidth: geometry.borderHeavy, borderColor: colors.red, borderRadius: geometry.radius, paddingHorizontal: space.lg, paddingVertical: space.md, backgroundColor: colors.paper, transform: [{ rotate: '-3deg' }] },
  label: { color: colors.red, fontSize: 24, lineHeight: 27, fontWeight: '900', textTransform: 'uppercase' },
  message: { color: colors.ink, fontWeight: '800', textAlign: 'center', marginTop: space.xs },
});
