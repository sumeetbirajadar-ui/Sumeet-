import React from 'react';
import { addDays, toISODate } from '../../utils/dates';

export interface HeatmapCell { date: string; value: number; } // value 0..1

/** GitHub-style calendar heatmap, hand-rolled as a coloured CSS/SVG grid — no
 * charting library needed, works fully offline. */
export const Heatmap: React.FC<{ cells: HeatmapCell[]; weeks?: number; endDate?: string; color?: string }> = ({
  cells, weeks = 18, endDate = toISODate(new Date()), color = '#C9A227',
}) => {
  const byDate = new Map<string, number>(cells.map((c) => [c.date, c.value]));
  const totalDays = weeks * 7;
  const start = addDays(endDate, -(totalDays - 1));
  const startWeekday = new Date(start).getDay();

  const days: { date: string; value: number }[] = [];
  for (let i = -startWeekday; i < totalDays; i++) {
    const date = addDays(start, i);
    days.push({ date, value: byDate.get(date) ?? -1 });
  }
  const columns: { date: string; value: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) columns.push(days.slice(i, i + 7));

  const cellColor = (v: number) => {
    if (v < 0) return 'transparent';
    if (v === 0) return '#F1E4BC';
    const alpha = 0.25 + v * 0.75;
    return hexToRgba(color, alpha);
  };

  return (
    <div className="flex gap-[3px] overflow-x-auto scrollbar-thin py-1">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {col.map((d, ri) => (
            <div
              key={ri}
              title={d.value >= 0 ? `${d.date}: ${Math.round(d.value * 100)}%` : ''}
              className="w-3 h-3 rounded-[3px]"
              style={{ background: cellColor(d.value) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
