import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Track } from '../content/schemas';
import { colors, space, TOUCH, type } from '../ui/theme';

const TYPE_LABEL: Record<Track['type'], string> = {
  song: 'Song',
  album: 'Album',
  mixtape: 'Mixtape',
  instrumental: 'Instrumental',
  video: 'Video',
};

function versionLabel(t: Track): string | null {
  switch (t.cleanVersionStatus) {
    case 'instrumental':
      return 'No vocals';
    case 'verified-clean':
      return 'Clean version checked';
    case 'explicit':
      return 'Explicit';
    default:
      return t.youngerListener ? 'Clean version not yet checked' : null;
  }
}

export function TrackRow({ track, onListen }: { track: Track; onListen: (t: Track) => void }) {
  const version = versionLabel(track);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Listen to ${track.title} by ${track.artist}`}
      accessibilityHint="Opens a search in your music app"
      onPress={() => onListen(track)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.goldSoft }]}
    >
      <View style={styles.disc}>
        <Text style={styles.discText}>▶</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.h2, { color: colors.ink, fontSize: 16 }]}>{track.title}</Text>
        <Text style={[type.small, { color: colors.muted }]}>
          {TYPE_LABEL[track.type]} · {track.artist}
          {version ? ` · ${version}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: 6,
  },
  disc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discText: { color: colors.gold, fontSize: 14, marginLeft: 2 },
});
