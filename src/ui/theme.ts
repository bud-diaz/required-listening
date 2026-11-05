/** Editorial palette carried over from the PDF: black, white, caramel-gold. */
export const colors = {
  ink: '#111111',
  paper: '#FFFFFF',
  cream: '#FAF6EF',
  gold: '#B9853F',
  goldDeep: '#8A5F25',
  goldSoft: '#F3E6D2',
  muted: '#5E5A55',
  rule: '#E3DCD1',
  danger: '#A12A1F',
  draft: '#7A4F00',
  draftBg: '#FFF4D6',
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const type = {
  kicker: { fontSize: 12, fontWeight: '800' as const, letterSpacing: 1.6, textTransform: 'uppercase' as const },
  display: { fontSize: 34, fontWeight: '900' as const, letterSpacing: -0.5, textTransform: 'uppercase' as const },
  h1: { fontSize: 26, fontWeight: '900' as const, textTransform: 'uppercase' as const },
  h2: { fontSize: 18, fontWeight: '800' as const },
  body: { fontSize: 16, lineHeight: 24 },
  small: { fontSize: 13, lineHeight: 18 },
};

/** Minimum touch target (iOS HIG / Material). */
export const TOUCH = 48;
