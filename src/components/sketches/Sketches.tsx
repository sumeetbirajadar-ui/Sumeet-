import React from 'react';

/** Hand-sketch style line-art illustrations used for empty states and
 * section flourishes — kept as inline SVG (no binary assets) so the whole
 * app stays lightweight and fully offline. Single stroke, rounded caps,
 * gold/navy only, matching the ivory-cream-gold-navy design system. */

const base = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const SketchSun: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <circle cx="32" cy="32" r="12" stroke="#C9A227" strokeWidth="2" {...base} />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * Math.PI) / 4;
      const x1 = 32 + Math.cos(a) * 20, y1 = 32 + Math.sin(a) * 20;
      const x2 = 32 + Math.cos(a) * 27, y2 = 32 + Math.sin(a) * 27;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A227" strokeWidth="2" strokeLinecap="round" />;
    })}
  </svg>
);

export const SketchLotus: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <path d="M32 46 C20 40 14 30 16 20 C24 24 30 32 32 42 C34 32 40 24 48 20 C50 30 44 40 32 46Z" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <path d="M32 46 C26 38 24 28 28 18 C31 26 32 34 32 42 C32 34 33 26 36 18 C40 28 38 38 32 46Z" stroke="#C9A227" strokeWidth="1.6" {...base} />
    <path d="M10 48 Q32 58 54 48" stroke="#1E2A4A" strokeWidth="2" {...base} />
  </svg>
);

export const SketchBooks: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <rect x="10" y="38" width="44" height="8" rx="1.5" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <rect x="14" y="28" width="36" height="8" rx="1.5" stroke="#C9A227" strokeWidth="2" {...base} />
    <rect x="18" y="18" width="28" height="8" rx="1.5" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <line x1="26" y1="14" x2="38" y2="8" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SketchPiggyBank: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <ellipse cx="30" cy="36" rx="22" ry="14" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <circle cx="46" cy="30" r="3" fill="#1E2A4A" />
    <path d="M50 34 L58 32 L54 40Z" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <line x1="20" y1="48" x2="20" y2="54" stroke="#1E2A4A" strokeWidth="2" strokeLinecap="round" />
    <line x1="38" y1="48" x2="38" y2="54" stroke="#1E2A4A" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 22 Q28 14 36 20" stroke="#C9A227" strokeWidth="2" {...base} />
    <line x1="20" y1="30" x2="12" y2="26" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SketchMountainFlag: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <path d="M6 50 L24 22 L34 36 L42 26 L58 50Z" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <line x1="24" y1="22" x2="24" y2="8" stroke="#C9A227" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 8 L36 13 L24 17Z" stroke="#C9A227" strokeWidth="2" {...base} />
  </svg>
);

export const SketchCompass: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <circle cx="32" cy="32" r="22" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <path d="M32 18 L38 32 L32 46 L26 32Z" stroke="#C9A227" strokeWidth="2" {...base} />
    <circle cx="32" cy="32" r="2" fill="#1E2A4A" />
  </svg>
);

export const SketchOwl: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <path d="M20 30 Q32 10 44 30 L44 42 Q44 52 32 52 Q20 52 20 42Z" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <circle cx="26" cy="32" r="5" stroke="#C9A227" strokeWidth="2" {...base} />
    <circle cx="38" cy="32" r="5" stroke="#C9A227" strokeWidth="2" {...base} />
    <circle cx="26" cy="32" r="1.4" fill="#1E2A4A" />
    <circle cx="38" cy="32" r="1.4" fill="#1E2A4A" />
    <path d="M30 38 L32 42 L34 38" stroke="#1E2A4A" strokeWidth="2" {...base} />
    <path d="M14 26 L20 30 M50 26 L44 30" stroke="#1E2A4A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SketchSprout: React.FC<{ size?: number; className?: string }> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={className}>
    <path d="M32 54 L32 30" stroke="#1E2A4A" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 34 C22 34 18 24 18 18 C28 18 32 26 32 34Z" stroke="#7C9473" strokeWidth="2" {...base} />
    <path d="M32 30 C42 30 46 20 46 14 C36 14 32 22 32 30Z" stroke="#C9A227" strokeWidth="2" {...base} />
    <path d="M22 54 Q32 58 42 54" stroke="#1E2A4A" strokeWidth="2" {...base} />
  </svg>
);

export const SketchFlame: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path d="M12 2 C8 8 6 11 6 14.5 A6 6 0 0 0 18 14.5 C18 11 16 9 15 7 C15 10 13 10 13 8 C13 6 12 4 12 2Z" fill="#C9A227" />
  </svg>
);

export const GoldDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center gap-3 ${className ?? ''}`}>
    <div className="h-px flex-1 bg-gold-soft" />
    <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10Z" fill="#C9A227" /></svg>
    <div className="h-px flex-1 bg-gold-soft" />
  </div>
);
