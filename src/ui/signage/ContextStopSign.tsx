import { StyleSheet, Text, View } from 'react-native';
import { colors, space, type } from '../theme';

export function ContextStopSign({ message }: { message: string }) {
  return (
    <View style={styles.row} accessibilityRole="alert">
      <View style={styles.stop}><Text style={styles.stopText}>NOTE</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={[type.kicker, { color: colors.ink }]}>For grown-ups</Text>
        <Text style={[type.small, { color: colors.ink }]}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: colors.paper, borderWidth: 2, borderColor: colors.ink, borderRadius: 8, padding: space.md },
  stop: { width: 58, height: 58, backgroundColor: colors.red, borderWidth: 3, borderColor: colors.paper, outlineWidth: 2, outlineColor: colors.ink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  stopText: { color: colors.paper, fontSize: 10, fontWeight: '900', transform: [{ rotate: '-45deg' }] },
});
