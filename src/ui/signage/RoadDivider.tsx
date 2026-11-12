import { StyleSheet, View } from 'react-native';
import { colors, space } from '../theme';

export function RoadDivider({ variant = 'stripe' }: { variant?: 'stripe' | 'solid' }) {
  if (variant === 'solid') return <View style={styles.solid} />;
  return (
    <View style={styles.stripes} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: 9 }, (_, index) => (
        <View key={index} style={styles.stripe} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  solid: { height: 3, backgroundColor: colors.ink, marginVertical: space.xs },
  stripes: { height: 10, flexDirection: 'row', gap: 5, overflow: 'hidden', marginVertical: space.xs },
  stripe: { width: 24, height: 16, backgroundColor: colors.ink, transform: [{ skewX: '-28deg' }] },
});
