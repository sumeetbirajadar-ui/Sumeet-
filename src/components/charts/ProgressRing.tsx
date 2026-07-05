import React from 'react';

export const ProgressRing: React.FC<{
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: React.ReactNode;
  sublabel?: string;
}> = ({ percent, size = 120, stroke = 12, color = '#C9A227', trackColor = '#F1E4BC', label, sublabel }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative inline-flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-3 text-center">
        {label ?? <span className="text-2xl font-bold font-display text-navy">{clamped}%</span>}
        {sublabel && <span className="text-[9px] leading-tight uppercase tracking-wider text-navy-light/60 font-bold mt-0.5 break-words max-w-full">{sublabel}</span>}
      </div>
    </div>
  );
};
