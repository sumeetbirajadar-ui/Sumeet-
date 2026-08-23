// Extracts a YouTube video id from any common URL shape so we can render a
// real thumbnail + title card instead of a bare link. Returns null for
// non-YouTube URLs (Drive, Zoom, Meet, etc.) so callers can fall back to a
// plain link card.

export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      return u.pathname.slice(1).split('/')[0] || null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const liveMatch = u.pathname.match(/^\/(live|embed|shorts)\/([^/]+)/);
      if (liveMatch) return liveMatch[2];
    }
    return null;
  } catch {
    return null;
  }
}

export function youtubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
