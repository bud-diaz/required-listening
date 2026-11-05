/**
 * Outbound music-service links (docs/APP_PLAN.md §1 V1 boundaries).
 *
 * v1 never plays audio. It opens a *search* on a provider the caregiver allowed,
 * so the app makes no claim that a specific version is the clean one.
 */

export const PROVIDERS = ['spotify', 'apple-music', 'youtube-music'] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  spotify: 'Spotify',
  'apple-music': 'Apple Music',
  'youtube-music': 'YouTube Music',
};

/** Hosts the app is allowed to open. Anything else is refused. */
export const ALLOWED_HOSTS: Record<Provider, string> = {
  spotify: 'open.spotify.com',
  'apple-music': 'music.apple.com',
  'youtube-music': 'music.youtube.com',
};

export function buildSearchUrl(provider: Provider, query: string): string {
  const q = encodeURIComponent(query.trim());
  switch (provider) {
    case 'spotify':
      return `https://open.spotify.com/search/${q}`;
    case 'apple-music':
      return `https://music.apple.com/us/search?term=${q}`;
    case 'youtube-music':
      return `https://music.youtube.com/search?q=${q}`;
  }
}

/** True only for https URLs on an allowed host for one of `enabled` providers. */
export function isAllowedUrl(url: string, enabled: readonly Provider[] = PROVIDERS): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return enabled.some((p) => ALLOWED_HOSTS[p] === parsed.hostname);
}

export function searchQueryFor(track: { title: string; artist: string; searchQuery?: string }): string {
  return track.searchQuery ?? `${track.title} ${track.artist}`;
}
