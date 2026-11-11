import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import type { Track } from '../content/schemas';
import { PROVIDER_LABELS, buildSearchUrl, isAllowedUrl, searchQueryFor, type Provider } from '../lib/links';
import { useFamilyStore } from '../stores/family-store';
import { colors, space, type } from '../ui/theme';
import { Button, Kicker } from '../ui/primitives';

/**
 * Outbound confirmation before leaving the app. It names the provider, says
 * it's a search (not a verified version), and repeats any caregiver note.
 */
export function ProviderSheet({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const providers = useFamilyStore((s) => s.settings?.providers ?? []);
  const [error, setError] = useState<string | null>(null);

  const open = async (p: Provider) => {
    if (!track) return;
    const url = buildSearchUrl(p, searchQueryFor(track));
    if (!isAllowedUrl(url, providers)) {
      setError('That music service isn’t turned on for this family.');
      return;
    }
    try {
      // Native hands off to the music app. On the web preview, keep the app open in its own tab.
      if (Platform.OS === 'web') window.open(url, '_blank', 'noopener');
      else await Linking.openURL(url);
      setError(null);
      onClose();
    } catch {
      setError(`Couldn’t open ${PROVIDER_LABELS[p]}. Check your connection and try again.`);
    }
  };

  return (
    <Modal visible={!!track} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet} accessibilityViewIsModal>
        {track ? (
          <>
            <Kicker>Leaving Listening Required</Kicker>
            <Text style={[type.h2, { color: colors.ink }]}>
              Search for “{track.title}” — {track.artist}
            </Text>
            <Text style={[type.small, { color: colors.muted }]}>
              This opens a search in your music app. Check the version before you press play
              {track.cleanVersionStatus === 'explicit' ? ': the main version has explicit content.' : '.'}
            </Text>
            {track.caregiverNote ? (
              <Text style={[type.small, { color: colors.ink }]}>Note: {track.caregiverNote}</Text>
            ) : null}
            {providers.length === 0 ? (
              <Text style={[type.small, { color: colors.danger }]}>No music services are turned on. A grown-up can add one in Settings.</Text>
            ) : (
              providers.map((p) => (
                <Button key={p} label={`Open ${PROVIDER_LABELS[p]}`} onPress={() => open(p)} />
              ))
            )}
            {error ? <Text style={[type.small, { color: colors.danger }]} accessibilityRole="alert">{error}</Text> : null}
            <Button label="Not now" variant="ghost" onPress={onClose} />
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: colors.paper,
    padding: space.lg,
    paddingBottom: space.xl,
    gap: space.md,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
});
