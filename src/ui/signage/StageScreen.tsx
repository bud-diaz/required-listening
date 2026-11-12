import type { ReactNode, RefObject } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { geometry, space, stages, type Stage } from '../theme';

type Props = {
  stage: Stage;
  children: ReactNode;
  scroll?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  scrollRef?: RefObject<ScrollViewInstance | null>;
};

export function StageScreen({ stage, children, scroll = true, header, footer, scrollRef }: Props) {
  const palette = stages[stage];
  const content = <View style={styles.column}>{children}</View>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <StatusBar style={stage === 'listen' || stage === 'talk' || stage === 'crate' ? 'light' : 'dark'} />
      {header ? <View style={styles.header}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="never"
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.static}>{content}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: space.md, paddingTop: space.sm },
  scroll: { paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: space.xl },
  static: { flex: 1, paddingHorizontal: space.md, paddingVertical: space.md },
  column: { width: '100%', maxWidth: geometry.maxContent, alignSelf: 'center', gap: space.lg },
  footer: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
});
