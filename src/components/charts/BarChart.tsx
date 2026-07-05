import React from 'react';

export interface BarDatum { label: string; value: number; target?: number; }

/** Simple vertical bar chart. Bars that exceed `target` render in amber
 * (never red) per the design brief. */
export const BarChart: React.FC<{ data: BarDatum[]; height?: number; color?: string; formatValue?: (v: number) => string }> = ({
  data, height = 160, color = '#1E2A4A', formatValue = (v) => String(Math.round(v)),
}) => {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.target ?? 0)));
  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <div className="flex items-end gap-4 min-w-fit px-1" style={{ height: height + 40 }}>
        {data.map((d, i) => {
          const barH = (d.value / max) * height;
          const overTarget = d.target != null && d.value > d.target;
          const targetH = d.target != null ? (d.target / max) * height : null;
          return (
            <div key={i} className="flex flex-col items-center justify-end gap-2" style={{ height: height + 40, minWidth: 34 }}>
              <div className="relative flex items-end" style={{ height }}>
                {targetH != null && (
                  <div className="absolute w-full border-t-2 border-dashed border-navy/30" style={{ bottom: targetH }} />
                )}
                <div
                  className="w-6 rounded-t-lg transition-all"
                  style={{ height: Math.max(3, barH), background: overTarget ? '#B8863B' : color }}
                  title={formatValue(d.value)}
                />
              </div>
              <span className="text-[10px] font-bold text-navy-light/70 whitespace-nowrap">{formatValue(d.value)}</span>
              <span className="text-[10px] text-navy-light/50 text-center leading-tight max-w-[48px] truncate">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
