import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, geometry, space, type } from '../theme';

type Tone = 'paper' | 'ink' | 'yellow' | 'warning';

export function SignPanel({ children, title, tone = 'paper' }: { children: ReactNode; title?: string; tone?: Tone }) {
  const visual = tones[tone];
  return (
    <View style={[styles.panel, visual.box]}>
      {title ? <Text style={[type.kicker, visual.text]}>{title}</Text> : null}
      {children}
    </View>
  );
}

const tones = {
  paper: { box: { backgroundColor: colors.paper, borderColor: colors.ink }, text: { color: colors.ink } },
  ink: { box: { backgroundColor: colors.ink, borderColor: colors.ink }, text: { color: colors.yellow } },
  yellow: { box: { backgroundColor: colors.yellowSoft, borderColor: colors.ink }, text: { color: colors.ink } },
  warning: { box: { backgroundColor: colors.paper, borderColor: colors.danger }, text: { color: colors.danger } },
};

const styles = StyleSheet.create({
  panel: { padding: space.md, borderWidth: geometry.border, borderRadius: geometry.radius, gap: space.sm },
});
