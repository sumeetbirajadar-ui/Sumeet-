import React from 'react';
import { colorFor } from './palette';

export interface DonutDatum { label: string; value: number; color?: string; }

export const DonutChart: React.FC<{ data: DonutDatum[]; size?: number; thickness?: number; showLegend?: boolean }> = ({
  data, size = 160, thickness = 26, showLegend = true,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  if (!total || data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center text-navy-light/40 text-xs italic" style={{ width: size, height: size }}>
        No data yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        {data.map((d, i) => {
          if (d.value <= 0) return null;
          const frac = d.value / total;
          const dash = frac * c;
          const dashArray = `${dash} ${c - dash}`;
          const dashOffset = -acc * c;
          acc += frac;
          return (
            <circle
              key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color ?? colorFor(i)} strokeWidth={thickness}
              strokeDasharray={dashArray} strokeDashoffset={dashOffset}
            />
          );
        })}
      </svg>
      {showLegend && (
        <ul className="space-y-1.5 text-xs">
          {data.filter((d) => d.value > 0).map((d, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color ?? colorFor(i) }} />
              <span className="text-navy-light/80 font-medium">{d.label}</span>
              <span className="text-navy font-bold ml-auto">{Math.round((d.value / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
