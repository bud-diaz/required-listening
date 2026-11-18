import { useLocalSearchParams } from 'expo-router';
import { LessonFlow } from '../../../components/LessonFlow';
import { laneAllows } from '../../../content';
import { useFamilyStore } from '../../../stores/family-store';
import { Body, Screen } from '../../../ui/primitives';
import { SignPanel } from '../../../ui/signage';

export default function PackLessonScreen() {
  const { packId, lessonId } = useLocalSearchParams<{ packId: string; lessonId: string }>();
  const lane = useFamilyStore((state) => state.settings?.lane ?? 'younger');
  const pack = useFamilyStore((state) => state.installedPacks.find((item) => item.packId === packId)?.manifest);
  const lesson = pack?.lessons.find((item) => item.id === lessonId);

  if (!pack || !lesson || !laneAllows(lane, lesson.minLane)) {
    return (
      <Screen>
        <SignPanel title="Lesson unavailable">
          <Body>Download this pack first, or check the family listening lane.</Body>
        </SignPanel>
      </Screen>
    );
  }

  return <LessonFlow pack={pack} lesson={lesson} lane={lane} />;
}
