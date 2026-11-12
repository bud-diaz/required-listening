import { describe, expect, it } from 'vitest';
import { Unit } from '../src/content/schemas';
import {
  RAW_UNITS,
  allTracks,
  catalog,
  crateActivity,
  frontMatter,
  getLesson,
  getNextLesson,
  isPublishable,
  laneAllows,
  passedDownFor,
  units,
  visibleLessons,
} from '../src/content';
import { PROVIDERS, buildSearchUrl, isAllowedUrl, searchQueryFor } from '../src/lib/links';
import { Settings } from '../src/domain/crate';

describe('content contract', () => {
  it('parses every content file', () => {
    expect(catalog.units).toHaveLength(10);
    expect(frontMatter.sections.length).toBeGreaterThan(0);
    expect(crateActivity.whyOptions.length).toBeGreaterThan(0);
    expect(units.length).toBe(RAW_UNITS.length);
    expect(units).toHaveLength(10);
    expect(units.flatMap((unit) => unit.lessons)).toHaveLength(100);
  });

  it('shows no byline until authorship is confirmed', () => {
    expect(catalog.byline).toBeNull();
  });

  it('marks exactly the converted units as available', () => {
    const converted = new Set(units.map((u) => u.id));
    for (const entry of catalog.units) expect(entry.available).toBe(converted.has(entry.id));
  });

  it('keeps unit, lesson, and track IDs unique across the full guide', () => {
    expect(new Set(units.map((unit) => unit.id)).size).toBe(10);
    const lessonIds = units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id));
    const trackIds = units.flatMap((unit) => unit.tracks.map((track) => track.id));
    expect(new Set(lessonIds).size).toBe(lessonIds.length);
    expect(new Set(trackIds).size).toBe(trackIds.length);
  });

  for (const unit of units) {
    describe(unit.displayName, () => {
      const trackIds = new Set(unit.tracks.map((t) => t.id));

      it('matches its catalog entry', () => {
        const entry = catalog.units.find((u) => u.id === unit.id);
        expect(entry?.number).toBe(unit.number);
        expect(entry?.displayName).toBe(unit.displayName);
      });

      it('has 10 lessons numbered 1–10 with unique IDs', () => {
        expect(unit.lessons.map((l) => l.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(new Set(unit.lessons.map((l) => l.id)).size).toBe(10);
      });

      it('offers at least one checkpoint on every listening lane', () => {
        expect(visibleLessons(unit, 'younger').length).toBeGreaterThan(0);
        expect(visibleLessons(unit, 'guided').length).toBeGreaterThan(0);
        expect(visibleLessons(unit, 'full')).toHaveLength(10);
      });

      it('has unique track IDs', () => {
        expect(trackIds.size).toBe(unit.tracks.length);
      });

      it('references only tracks that exist', () => {
        const refs = [
          unit.passedDown.trackId,
          ...unit.youngerListener.trackIds,
          ...unit.lessons.flatMap((l) => l.listen),
          ...unit.finalProject.earlyOptions,
          ...unit.finalProject.laterOptions,
        ];
        for (const ref of refs) expect(trackIds, `missing track ${ref}`).toContain(ref);
      });

      it('keeps Younger Listener picks in the younger lane', () => {
        for (const id of unit.youngerListener.trackIds) {
          const t = unit.tracks.find((x) => x.id === id)!;
          expect(t.youngerListener, id).toBe(true);
          expect(t.minLane, id).toBe('younger');
        }
      });

      it('never puts flagged tracks in the younger lane', () => {
        for (const t of unit.tracks.filter((x) => x.minLane === 'younger')) {
          expect(t.contentFlags, t.id).toEqual([]);
          expect(t.cleanVersionStatus, t.id).not.toBe('explicit');
        }
      });

      it('gives every caregiver-context lesson a caregiver note', () => {
        for (const l of unit.lessons.filter((x) => x.requiresCaregiverContext)) {
          expect(l.caregiverNote?.trim(), l.id).toBeTruthy();
        }
      });

      it('records author approval for every lesson and app-adapted prompt', () => {
        expect(unit.lessonReview).toEqual({
          status: 'approved',
          reviewedAt: unit.number === 1 ? '2026-11-07' : '2026-11-12',
          reviewedBy: 'bud-diaz',
        });
        const awaitingReview = unit.lessons.flatMap((lesson) =>
          [lesson.notice, lesson.talk, lesson.activity].filter((prompt) => prompt?.source === 'adapted')
        );
        expect(awaitingReview).toEqual([]);
      });

      it('flags exactly every unverified track for caregiver preview', () => {
        for (const t of unit.tracks) {
          expect(t.requiresCaregiverPreview, t.id).toBe(t.cleanVersionStatus === 'unverified');
        }
      });

      it('ships approved lessons while preserving every caregiver-preview warning', () => {
        if (unit.review.status !== 'approved') return;
        expect(unit.lessonReview.status).toBe('approved');
        for (const track of unit.tracks.filter((t) => t.cleanVersionStatus === 'unverified')) {
          expect(track.requiresCaregiverPreview, track.id).toBe(true);
        }
        const adapted = unit.lessons.flatMap((l) => [l.notice, l.talk, l.activity].filter((p) => p?.source === 'adapted'));
        expect(adapted).toEqual([]);
      });

      it('builds only allowed provider links for every track', () => {
        for (const t of unit.tracks) {
          for (const p of PROVIDERS) expect(isAllowedUrl(buildSearchUrl(p, searchQueryFor(t)))).toBe(true);
        }
      });
    });
  }
});

describe('schema guards', () => {
  it('rejects an approved unit with no reviewer', () => {
    const bad = { ...(RAW_UNITS[0] as object), review: { status: 'approved', reviewedAt: null, reviewedBy: null } };
    expect(Unit.safeParse(bad).success).toBe(false);
  });

  it('rejects non-kebab IDs', () => {
    const bad = { ...(RAW_UNITS[0] as object), id: 'Chief Keef' };
    expect(Unit.safeParse(bad).success).toBe(false);
  });
});

describe('review gate', () => {
  it('blocks drafts in production and shows them in development', () => {
    const draft = { status: 'draft' as const, reviewedAt: null, reviewedBy: null };
    expect(isPublishable(draft, false)).toBe(false);
    expect(isPublishable(draft, true)).toBe(true);
    expect(isPublishable({ status: 'approved', reviewedAt: '2026-11-05', reviewedBy: 'Author' }, false)).toBe(true);
  });

  it('publishes every author-approved unit and its tracks in production', () => {
    const expected = new Set(units.map((unit) => unit.id));
    expect(units.every((unit) => isPublishable(unit.review, false))).toBe(true);
    expect(new Set(allTracks('full', false).map(({ unit }) => unit.id))).toEqual(expected);
    expect(new Set(allTracks('full', true).map(({ unit }) => unit.id))).toEqual(expected);
  });
});

describe('listening lanes', () => {
  const ck = units.find((u) => u.id === 'chief-keef')!;

  it('orders lanes from younger to full', () => {
    expect(laneAllows('younger', 'guided')).toBe(false);
    expect(laneAllows('guided', 'guided')).toBe(true);
    expect(laneAllows('full', 'younger')).toBe(true);
  });

  it('shows younger listeners only lessons marked for them', () => {
    expect(visibleLessons(ck, 'younger').every((l) => l.minLane === 'younger')).toBe(true);
    expect(visibleLessons(ck, 'full')).toHaveLength(10);
  });

  it('blocks hidden lessons by deep link too', () => {
    expect(getLesson(ck, 'ck-01-chicago', 'younger')).toBeUndefined();
    expect(getLesson(ck, 'ck-01-chicago', 'guided')?.number).toBe(1);
    expect(getLesson(ck, 'ck-08-independence', 'guided')).toBeUndefined();
  });

  it('finds the next visible lesson and skips restricted checkpoints', () => {
    expect(getNextLesson(ck, 'ck-07-production', 'guided')?.id).toBe('ck-09-influence-tree');
    expect(getNextLesson(ck, 'ck-07-production', 'younger')).toBeUndefined();
    expect(getNextLesson(ck, 'ck-10-legacy', 'full')).toBeUndefined();
  });

  it('substitutes a Younger Listener pick for an explicit passed-down track', () => {
    expect(passedDownFor(ck, 'guided')).toMatchObject({ isSubstitute: false, track: { id: 'love-sosa' } });
    expect(passedDownFor(ck, 'younger')).toMatchObject({ isSubstitute: true, track: { id: 'love-sosa-instrumental' } });
  });
});

describe('provider links', () => {
  it('refuses other hosts, http, and garbage', () => {
    expect(isAllowedUrl('https://evil.example.com/search/x')).toBe(false);
    expect(isAllowedUrl('http://open.spotify.com/search/x')).toBe(false);
    expect(isAllowedUrl('not a url')).toBe(false);
    expect(isAllowedUrl('https://open.spotify.com.evil.com/x')).toBe(false);
  });

  it('refuses providers the caregiver did not enable', () => {
    const url = buildSearchUrl('spotify', 'Love Sosa Chief Keef');
    expect(isAllowedUrl(url, ['spotify'])).toBe(true);
    expect(isAllowedUrl(url, ['apple-music'])).toBe(false);
  });

  it('keeps YouTube and YouTube Music as separate allow-listed providers', () => {
    const youtube = buildSearchUrl('youtube', 'Love Sosa Chief Keef');
    expect(youtube).toBe('https://www.youtube.com/results?search_query=Love%20Sosa%20Chief%20Keef');
    expect(isAllowedUrl(youtube, ['youtube'])).toBe(true);
    expect(isAllowedUrl(youtube, ['youtube-music'])).toBe(false);
    expect(isAllowedUrl('https://music.youtube.com/search?q=Love%20Sosa', ['youtube'])).toBe(false);
    expect(isAllowedUrl('https://youtube.com/results?search_query=Love%20Sosa', ['youtube'])).toBe(false);
    expect(isAllowedUrl('https://www.youtube.com.evil.example/results', ['youtube'])).toBe(false);
    expect(isAllowedUrl('http://www.youtube.com/results', ['youtube'])).toBe(false);
  });

  it('accepts regular YouTube as an optional family setting', () => {
    expect(Settings.safeParse({
      nickname: 'Listener',
      avatar: '🎧',
      lane: 'guided',
      providers: ['spotify', 'youtube'],
      onboardedAt: '2026-11-12T00:00:00.000Z',
    }).success).toBe(true);
  });

  it('encodes queries', () => {
    expect(buildSearchUrl('apple-music', "Hate Bein' Sober & more")).toBe(
      "https://music.apple.com/us/search?term=Hate%20Bein'%20Sober%20%26%20more"
    );
  });
});
