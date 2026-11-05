import type { Lane } from '../content/schemas';

export const LANE_INFO: Record<Lane, { label: string; description: string }> = {
  younger: {
    label: 'Younger Listener',
    description:
      'Caregiver-led. Instrumentals and picks the guide suggests for little ones, plus beat-focused lessons. Heavier lessons stay hidden.',
  },
  guided: {
    label: 'Guided',
    description:
      'Most lessons, with notes for grown-ups on the tougher topics. The heaviest tracks and lessons stay hidden.',
  },
  full: {
    label: 'Full Guide',
    description: 'Everything in the guide, with content labels. Best for older kids listening with you.',
  },
};
