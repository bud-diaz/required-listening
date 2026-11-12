export const LESSON_STEPS = ['briefing', 'listen', 'notice', 'talk', 'crate'] as const;
export type LessonStep = (typeof LESSON_STEPS)[number];
export const PLACARD_STEPS = ['listen', 'notice', 'talk', 'crate'] as const;
export const stageToIndex: Record<LessonStep, number> = {
  briefing: 0,
  listen: 1,
  notice: 2,
  talk: 3,
  crate: 4,
};

export const stepLabels: Record<LessonStep, string> = {
  briefing: 'Briefing',
  listen: 'Listen',
  notice: 'Notice',
  talk: 'Talk',
  crate: 'Crate',
};
