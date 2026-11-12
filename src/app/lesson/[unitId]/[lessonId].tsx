import { useLocalSearchParams } from 'expo-router';
import { getLesson, getUnit } from '../../../content';
import { LessonFlow } from '../../../components/LessonFlow';
import { useFamilyStore } from '../../../stores/family-store';
import { Body, Screen } from '../../../ui/primitives';

export default function LessonScreen() {
  const { unitId, lessonId } = useLocalSearchParams<{ unitId: string; lessonId: string }>();
  const lane = useFamilyStore((s) => s.settings?.lane ?? 'younger');

  const unit = getUnit(unitId, __DEV__);
  // getLesson applies the lane, so a hidden lesson can't be opened by link either.
  const lesson = unit ? getLesson(unit, lessonId, lane) : undefined;

  if (!unit || !lesson) {
    return (
      <Screen>
        <Body>This lesson isn’t available on your listening lane.</Body>
      </Screen>
    );
  }

  return (
    <LessonFlow key={lesson.id} unit={unit} lesson={lesson} lane={lane} />
  );
}
