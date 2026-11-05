import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { getLesson, getUnit } from '../../../content';
import { LessonFlow } from '../../../components/LessonFlow';
import { useFamilyStore } from '../../../stores/family-store';
import { Body, DraftBanner, Kicker, Screen } from '../../../ui/primitives';
import { colors, space, type } from '../../../ui/theme';

export default function LessonScreen() {
  const { unitId, lessonId } = useLocalSearchParams<{ unitId: string; lessonId: string }>();
  const lane = useFamilyStore((s) => s.settings?.lane ?? 'younger');

  const unit = getUnit(unitId, __DEV__);
  // getLesson applies the lane, so a hidden lesson can't be opened by link either.
  const lesson = unit ? getLesson(unit, lessonId, lane) : undefined;

  if (!unit || !lesson) {
    return (
      <Screen>
        <Body>This lesson isn't available on your listening lane.</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: `${unit.displayName} · ${lesson.number}` }} />
      {unit.review.status !== 'approved' ? <DraftBanner /> : null}
      <View style={{ gap: space.xs }}>
        <Kicker>Lesson {lesson.number}</Kicker>
        <Text style={[type.h1, { color: colors.ink }]}>{lesson.title}</Text>
      </View>
      <LessonFlow key={lesson.id} unit={unit} lesson={lesson} lane={lane} />
    </Screen>
  );
}
