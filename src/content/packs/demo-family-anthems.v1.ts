import { LessonPack } from '../../domain/lesson-packs';

/**
 * Development-only fixture for exercising pack installation and Lesson Plans.
 * It is intentionally draft content and is blocked from production catalogs.
 */
export const demoFamilyAnthemsPack = LessonPack.parse({
  schemaVersion: 1,
  packId: 'demo-family-anthems',
  version: 1,
  title: 'Family Anthems (Demo)',
  theme: 'Passing family songs and their stories forward',
  summary: 'A short, draft pack for practicing how a family chooses, compares, and passes down favorite songs.',
  educationalConnections: ['Compare music across generations.', 'Connect songs to family memory.'],
  centralLesson: 'Passing music down means passing context, not only a link.',
  publisher: 'Required Listening',
  publishedAt: '2026-11-18T00:00:00.000Z',
  minAppVersion: '0.1.0',
  downloadBytes: 12288,
  contentFlags: [],
  estimatedMinutesPerLesson: 10,
  tracks: [],
  lessons: [
    {
      id: 'pick-a-family-anthem',
      number: 1,
      title: 'Pick a family anthem',
      body: [
        { type: 'text', text: 'Choose a song that changes the feeling in the room when your family hears it.' },
        { type: 'callout', text: 'There is no correct pick. The story attached to the song is the lesson.' },
      ],
      listen: [],
      notice: { text: 'Notice the first sound or lyric that makes everyone react.', source: 'adapted' },
      talk: { text: 'When did this song become part of our family story?', source: 'adapted' },
      activity: { text: 'Add the anthem to your crate and write down the moment when it belongs.', source: 'adapted' },
      minLane: 'younger',
      requiresCaregiverContext: false,
      contentFlags: [],
    },
    {
      id: 'compare-two-generations',
      number: 2,
      title: 'Compare two generations',
      body: [
        { type: 'text', text: 'Each person chooses a song from a different era, then the family listens for a shared idea.' },
        { type: 'list', label: 'Listen for', items: ['a similar rhythm', 'a repeated theme', 'the same feeling in a new sound'] },
      ],
      listen: [],
      notice: { text: 'Name one thing the two songs do differently and one thing they share.', source: 'adapted' },
      talk: { text: 'What might each song tell us about the time when it was made?', source: 'adapted' },
      activity: { text: 'Let the younger listener choose which song plays first next time.', source: 'adapted' },
      minLane: 'younger',
      requiresCaregiverContext: false,
      contentFlags: [],
    },
    {
      id: 'pass-one-forward',
      number: 3,
      title: 'Pass one forward',
      body: [
        { type: 'text', text: 'Choose one song you want someone else in the family to remember years from now.' },
        { type: 'callout', text: 'Passing music down means passing context, not only a link.' },
      ],
      listen: [],
      notice: { text: 'Listen for the part you would use to introduce this song to somebody new.', source: 'adapted' },
      talk: { text: 'What should the next listener know before they press play?', source: 'adapted' },
      activity: { text: 'Record a one-sentence dedication in your reflection.', source: 'adapted' },
      minLane: 'younger',
      requiresCaregiverContext: false,
      contentFlags: [],
    },
  ],
  sections: [
    {
      unitId: 'family-anthems-demo',
      number: 1,
      monogram: 'FA',
      title: 'Family Anthems',
      summary: 'Choose, compare, and pass forward songs that belong to your family story.',
      lessonIds: ['pick-a-family-anthem', 'compare-two-generations', 'pass-one-forward'],
    },
  ],
  review: { status: 'draft', reviewedAt: null, reviewedBy: null },
  developmentOnly: true,
});
