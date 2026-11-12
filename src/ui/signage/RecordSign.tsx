import { StyleSheet, Text, View } from 'react-native';
import { colors, geometry, space, type } from '../theme';

export function RecordSign({ title, artist, metadata }: { title: string; artist: string; metadata?: string }) {
  return (
    <View style={styles.sign}>
      <View style={styles.record} accessibilityElementsHidden>
        <View style={styles.label} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.h2, { color: colors.ink }]}>{title}</Text>
        <Text style={[type.small, { color: colors.muted, fontWeight: '700' }]}>{artist}</Text>
        {metadata ? <Text style={[type.small, { color: colors.ink }]}>{metadata}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sign: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.paper, borderWidth: geometry.border, borderColor: colors.ink, borderRadius: geometry.radius, padding: space.sm },
  record: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  label: { width: 17, height: 17, borderRadius: 9, backgroundColor: colors.red, borderWidth: 3, borderColor: colors.paper },
});
