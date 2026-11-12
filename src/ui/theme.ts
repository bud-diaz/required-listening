/** Sound Traffic System palette. Compatibility aliases keep older surfaces stable. */
export const colors = {
  ink: '#171717',
  paper: '#FAFAF5',
  cream: '#FFD43B',
  yellow: '#FFD43B',
  yellowSoft: '#FFF1B2',
  blue: '#285DA8',
  orange: '#F59E38',
  green: '#26734D',
  red: '#C73E38',
  asphalt: '#666761',
  gold: '#8A6500',
  goldDeep: '#6B4B00',
  goldSoft: '#FFF1B2',
  muted: '#666761',
  rule: '#C9C6B8',
  danger: '#A4211C',
  draft: '#7A4F00',
  draftBg: '#FFF4D6',
};

export const stages = {
  briefing: { background: colors.yellow, foreground: colors.ink, contrast: colors.ink },
  listen: { background: colors.blue, foreground: colors.paper, contrast: colors.paper },
  notice: { background: colors.orange, foreground: colors.ink, contrast: colors.ink },
  talk: { background: colors.green, foreground: colors.paper, contrast: colors.paper },
  crate: { background: colors.red, foreground: colors.paper, contrast: colors.paper },
} as const;

export type Stage = keyof typeof stages;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const type = {
  kicker: { fontSize: 12, fontWeight: '800' as const, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  display: { fontSize: 40, lineHeight: 40, fontWeight: '900' as const, letterSpacing: -1, textTransform: 'uppercase' as const },
  h1: { fontSize: 28, lineHeight: 30, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  h2: { fontSize: 18, fontWeight: '800' as const },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 18 },
};

export const geometry = {
  border: 2,
  borderHeavy: 3,
  radius: 8,
  radiusSmall: 4,
  maxContent: 640,
};

/** Minimum touch target (iOS HIG / Material). */
export const TOUCH = 48;
