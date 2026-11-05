import { router, useLocalSearchParams } from 'expo-router';
import { CrateEntryForm } from '../../components/CrateEntryForm';
import { useFamilyStore } from '../../stores/family-store';
import { Screen } from '../../ui/primitives';

export default function AddToCrate() {
  const { trackId } = useLocalSearchParams<{ trackId?: string; unitId?: string }>();
  const lane = useFamilyStore((s) => s.settings?.lane ?? 'younger');

  return (
    <Screen>
      <CrateEntryForm
        lane={lane}
        initialTrackId={trackId}
        onSaved={() => (router.canGoBack() ? router.back() : router.replace('/crate'))}
      />
    </Screen>
  );
}
