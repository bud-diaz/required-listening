import { StyleSheet, Text, View } from 'react-native';
import { colors, geometry, space } from '../theme';

const pad = (value: number | string) => String(value).padStart(2, '0');

export function RouteBadge({
  unitNumber,
  lessonNumber,
  compact = false,
}: {
  unitNumber: number | string;
  lessonNumber?: number | string;
  compact?: boolean;
}) {
  const label = `Route ${pad(unitNumber)}${lessonNumber === undefined ? '' : `, lesson ${pad(lessonNumber)}`}`;
  return (
    <View style={[styles.badge, compact && styles.compact]} accessibilityLabel={label}>
      <Text style={[styles.text, compact && styles.compactText]}>
        ROUTE {pad(unitNumber)}{lessonNumber === undefined ? '' : ` / LESSON ${pad(lessonNumber)}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paper,
    borderColor: colors.ink,
    borderWidth: geometry.border,
    borderRadius: geometry.radiusSmall,
    paddingHorizontal: space.sm,
    paddingVertical: 5,
  },
  compact: { paddingVertical: 3 },
  text: { color: colors.ink, fontSize: 12, lineHeight: 15, fontWeight: '900', letterSpacing: 0.4 },
  compactText: { fontSize: 10 },
});
