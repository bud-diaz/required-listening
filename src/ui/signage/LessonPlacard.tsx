import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, geometry, space, TOUCH } from '../theme';

export type PlacardStage = 'listen' | 'notice' | 'talk' | 'crate';

const stageInfo: Record<PlacardStage, { label: string; short: string; color: string }> = {
  listen: { label: 'Listen, stage 1 of 4', short: 'LISTEN', color: colors.blue },
  notice: { label: 'Notice, stage 2 of 4', short: 'NOTICE', color: colors.orange },
  talk: { label: 'Talk, stage 3 of 4', short: 'TALK', color: colors.green },
  crate: { label: 'Crate, stage 4 of 4', short: 'CRATE', color: colors.red },
};

export function LessonPlacard({
  activeStage,
  visitedStages = [],
  onSelectStage,
  disabledStages = [],
  size = 256,
  compact = false,
}: {
  activeStage?: PlacardStage;
  visitedStages?: PlacardStage[];
  onSelectStage?: (stage: PlacardStage) => void;
  disabledStages?: PlacardStage[];
  size?: number;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <View
        style={[styles.strip, { borderColor: activeStage === 'notice' ? colors.ink : colors.paper }]}
        accessible
        accessibilityLabel={`${activeStage ?? 'No stage'} selected in the lesson placard`}
      >
        {(Object.keys(stageInfo) as PlacardStage[]).map((stage) => {
          const info = stageInfo[stage];
          const selected = stage === activeStage;
          return (
            <View key={stage} style={[styles.stripItem, { backgroundColor: info.color }, selected && styles.stripOn, selected && { borderColor: stage === 'notice' ? colors.ink : colors.paper }]}>
              <Text style={[styles.stripText, stage === 'notice' && { color: colors.ink }]}>{info.short}</Text>
              {selected ? <Text style={[styles.selectedMark, stage === 'notice' && { color: colors.ink }]}>●</Text> : null}
            </View>
          );
        })}
      </View>
    );
  }

  const stages: PlacardStage[] = ['listen', 'talk', 'notice', 'crate'];
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <View style={[styles.diamond, { width: size * 0.76, height: size * 0.76 }]}>
        {stages.map((stage) => {
          const info = stageInfo[stage];
          const selected = stage === activeStage;
          const disabled = disabledStages.includes(stage);
          const visited = visitedStages.includes(stage);
          return (
            <Pressable
              key={stage}
              accessibilityRole="tab"
              accessibilityLabel={info.label}
              accessibilityState={{ selected, disabled }}
              disabled={disabled || !onSelectStage}
              onPress={() => onSelectStage?.(stage)}
              style={({ pressed }) => [
                styles.quadrant,
                { backgroundColor: info.color },
                selected && styles.quadrantOn,
                pressed && { opacity: 0.82 },
                disabled && { opacity: 0.4 },
              ]}
            >
              <View style={styles.unrotate}>
                <Text style={[styles.symbol, stage === 'notice' && { color: colors.ink }]}>
                  {stage === 'listen' ? '◉' : stage === 'notice' ? '◇' : stage === 'talk' ? '□' : '●'}
                </Text>
                <Text style={[styles.label, stage === 'notice' && { color: colors.ink }]}>{info.short}</Text>
                {selected || visited ? (
                  <Text style={[styles.mark, stage === 'notice' && { color: colors.ink }]}>{selected ? '●' : '○'}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  diamond: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
    borderWidth: geometry.borderHeavy,
    borderColor: colors.ink,
    borderRadius: geometry.radius,
    backgroundColor: colors.ink,
  },
  quadrant: {
    width: '50%',
    height: '50%',
    minWidth: TOUCH,
    minHeight: TOUCH,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quadrantOn: { borderWidth: 5 },
  unrotate: { transform: [{ rotate: '-45deg' }], alignItems: 'center', gap: 1 },
  symbol: { color: colors.paper, fontSize: 21, lineHeight: 23, fontWeight: '900' },
  label: { color: colors.paper, fontSize: 11, lineHeight: 14, fontWeight: '900' },
  mark: { position: 'absolute', top: -12, right: -18, color: colors.paper, fontSize: 10 },
  strip: { flexDirection: 'row', borderWidth: 2, borderColor: colors.ink, borderRadius: 5, overflow: 'hidden' },
  stripItem: { flex: 1, minHeight: 34, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderColor: colors.ink },
  stripOn: { borderWidth: 3, borderColor: colors.paper },
  stripText: { color: colors.paper, fontSize: 9, fontWeight: '900' },
  selectedMark: { position: 'absolute', right: space.xs, top: 2, color: colors.paper, fontSize: 7 },
});
