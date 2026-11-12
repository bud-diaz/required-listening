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
        <View style={styles.discLabel} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.h2, { color: colors.ink, fontSize: 16 }]}>{track.title}</Text>
        <Text style={[type.small, { color: colors.muted }]}>
          {TYPE_LABEL[track.type]} · {track.artist}
          {version ? ` · ${version}` : ''}
        </Text>
      </View>
      <View style={styles.open}><Text style={styles.openText}>OPEN{`\n`}MUSIC ↗</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: TOUCH + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.paper,
  },
  disc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discLabel: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.paper },
  open: { minHeight: 48, minWidth: 64, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.ink, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
  openText: { color: colors.ink, fontSize: 9, lineHeight: 11, fontWeight: '900', textAlign: 'center' },
});
