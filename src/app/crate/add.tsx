import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { CrateEntryForm } from '../../components/CrateEntryForm';
import { useFamilyStore } from '../../stores/family-store';
import { ApprovalStamp, SignHeading, SignPanel, StageScreen } from '../../ui/signage';
import { colors } from '../../ui/theme';
import { Text } from 'react-native';

export default function AddToCrate() {
  const { trackId } = useLocalSearchParams<{ trackId?: string; unitId?: string }>();
  const lane = useFamilyStore((s) => s.settings?.lane ?? 'younger');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => (router.canGoBack() ? router.back() : router.replace('/crate')), 550);
    return () => clearTimeout(timeout);
  }, [saved]);

  return (
    <StageScreen stage="crate">
      <SignHeading stage="crate" title="Add to crate." subtitle="Keep what matters. Add it to your family's collection." icon={<Text style={{ color: colors.paper, fontSize: 30, fontWeight: '900' }}>●</Text>} />
      {saved ? (
        <ApprovalStamp visible />
      ) : (
        <SignPanel>
          <CrateEntryForm lane={lane} initialTrackId={trackId} onSaved={() => setSaved(true)} />
        </SignPanel>
      )}
    </StageScreen>
  );
}
