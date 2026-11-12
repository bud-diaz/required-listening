import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { space, stages, type Stage } from '../theme';

export function SignHeading({
  stage,
  title,
  subtitle,
  icon,
}: {
  stage: Stage;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  const color = stages[stage].foreground;
  return (
    <View style={styles.wrap}>
      {icon ? <View style={[styles.icon, { borderColor: color }]}>{icon}</View> : null}
      <Text style={[styles.title, { color }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.xs },
  icon: { minWidth: 64, minHeight: 64, borderWidth: 3, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 42, lineHeight: 43, fontWeight: '900', letterSpacing: -1.2, textTransform: 'uppercase', textAlign: 'center' },
  subtitle: { maxWidth: 420, fontSize: 14, lineHeight: 19, fontWeight: '700', textAlign: 'center' },
});
