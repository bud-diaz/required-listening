import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { allTracks, crateActivity } from '../content';
import type { Lane } from '../content/schemas';
import { CrateEntryDraft, type CrateEntry } from '../domain/crate';
import { useFamilyStore } from '../stores/family-store';
import { Body, Button, Chip, Kicker } from '../ui/primitives';
import { colors, space, TOUCH, type } from '../ui/theme';

type Props = {
  lane: Lane;
  initialTrackId?: string;
  onSaved: (entry: CrateEntry) => void;
};

/** The guide's Build Your Own Crate steps 1–3: pick a song, why, and when. */
export function CrateEntryForm({ lane, initialTrackId, onSaved }: Props) {
  const addToCrate = useFamilyStore((s) => s.addToCrate);
  const guideTracks = useMemo(() => allTracks(lane).filter(({ track }) => track.type !== 'album' && track.type !== 'mixtape'), [lane]);
  const initial = guideTracks.find((g) => g.track.id === initialTrackId);

  const [source, setSource] = useState<'guide' | 'own'>('guide');
  const [pickedId, setPickedId] = useState<string | undefined>(initial?.track.id);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [why, setWhy] = useState<string[]>([]);
  const [moment, setMoment] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const picked = guideTracks.find((g) => g.track.id === pickedId);

  const toggleWhy = (id: string) => setWhy((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const onSave = async () => {
    const draft = {
      title: source === 'guide' ? picked?.track.title ?? '' : title,
      artist: source === 'guide' ? picked?.track.artist ?? '' : artist,
      trackId: source === 'guide' ? picked?.track.id : undefined,
      unitId: source === 'guide' ? picked?.unit.id : undefined,
      why,
      moment,
      note: note.trim() || undefined,
    };
    const parsed = CrateEntryDraft.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Something is missing');
      return;
    }
    const res = await addToCrate(parsed.data);
    if (!res.ok) {
      setError('That song is already in your crate.');
      return;
    }
    setError(null);
    onSaved(res.entry);
  };

  return (
    <View style={{ gap: space.lg }}>
      <View style={{ gap: space.sm }}>
        <Kicker>Step 1 · Pick your song</Kicker>
        <View style={styles.wrap}>
          <Chip label="From this guide" selected={source === 'guide'} onPress={() => setSource('guide')} />
          <Chip label="My own find" selected={source === 'own'} onPress={() => setSource('own')} />
        </View>
        {source === 'guide' ? (
          <View style={{ gap: space.xs }}>
            {guideTracks.map(({ track }) => (
              <Pressable
                key={track.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: pickedId === track.id }}
                onPress={() => setPickedId(track.id)}
                style={[styles.option, pickedId === track.id && styles.optionOn]}
              >
                <Text style={[type.body, { fontWeight: '700', color: pickedId === track.id ? colors.paper : colors.ink }]}>
                  {track.title}
                </Text>
                <Text style={[type.small, { color: pickedId === track.id ? colors.goldSoft : colors.muted }]}>{track.artist}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ gap: space.sm }}>
            <Body style={{ color: colors.muted, fontSize: 14 }}>
              From your parents’ music, or something you found on your own. There are no wrong answers.
            </Body>
            <TextInput value={title} onChangeText={setTitle} placeholder="Song title" accessibilityLabel="Song title" style={styles.input} placeholderTextColor={colors.muted} />
            <TextInput value={artist} onChangeText={setArtist} placeholder="Who made it" accessibilityLabel="Artist" style={styles.input} placeholderTextColor={colors.muted} />
          </View>
        )}
      </View>

      <View style={{ gap: space.sm }}>
        <Kicker>Step 2 · Why this one?</Kicker>
        <Text style={[type.small, { color: colors.muted }]}>It’s okay to pick more than one.</Text>
        <View style={styles.wrap}>
          {crateActivity.whyOptions.map((o) => (
            <Chip key={o.id} label={o.label} selected={why.includes(o.id)} onPress={() => toggleWhy(o.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: space.sm }}>
        <Kicker>Step 3 · When would you play it?</Kicker>
        <View style={styles.wrap}>
          {crateActivity.momentOptions.map((o) => (
            <Chip key={o.id} label={o.label} selected={moment === o.id} onPress={() => setMoment(o.id)} />
          ))}
        </View>
      </View>

      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="What does it remind you of? (optional)"
        accessibilityLabel="Note"
        multiline
        maxLength={500}
        style={[styles.input, { minHeight: 72 }]}
        placeholderTextColor={colors.muted}
      />

      {error ? (
        <Text accessibilityRole="alert" style={[type.small, { color: colors.danger, fontWeight: '700' }]}>
          {error}
        </Text>
      ) : null}
      <Button label="Add to my crate" onPress={onSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  option: {
    minHeight: TOUCH,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.rule,
    backgroundColor: colors.paper,
    justifyContent: 'center',
  },
  optionOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  input: {
    minHeight: TOUCH,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 16,
    backgroundColor: colors.paper,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});
