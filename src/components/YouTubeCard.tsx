import React from 'react';
import { Play, ExternalLink, FileText } from 'lucide-react';
import { getYouTubeVideoId, youtubeThumbnail } from '../lib/youtube';

/**
 * Renders a link as a rich video-preview card (thumbnail + play button) when
 * it's a recognisable YouTube URL, or a plain elegant link card otherwise
 * (Drive notes, Meet/Zoom links, etc).
 */
const YouTubeCard: React.FC<{
  url: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  badge?: React.ReactNode;
}> = ({ url, title, subtitle, onClick, badge }) => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="flex items-center gap-3 p-3 rounded-2xl border border-ink-200 bg-white hover:border-gold-300 hover:shadow-md transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-900 text-sm truncate">{title}</p>
          {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
        </div>
        {badge}
        <ExternalLink className="w-4 h-4 text-ink-300 shrink-0" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="group flex items-center gap-3 p-2 rounded-2xl border border-ink-200 bg-white hover:border-gold-300 hover:shadow-md transition-all"
    >
      <div className="relative w-28 h-16 rounded-xl overflow-hidden shrink-0 bg-ink-100">
        <img src={youtubeThumbnail(videoId)} alt="" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/20 group-hover:bg-ink-900/35 transition-colors">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
            <Play className="w-4 h-4 text-gold-600 fill-gold-600 ml-0.5" />
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink-900 text-sm truncate">{title}</p>
        <p className="text-xs text-ink-400 flex items-center gap-1">
          {subtitle || 'Watch on YouTube'} <ExternalLink className="w-3 h-3" />
        </p>
      </div>
      {badge}
    </a>
  );
};

export default YouTubeCard;
