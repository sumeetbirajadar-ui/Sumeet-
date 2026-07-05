import React from 'react';

export interface LinePoint { label: string; value: number; }

export const LineChart: React.FC<{ data: LinePoint[]; height?: number; color?: string; fill?: boolean }> = ({
  data, height = 120, color = '#C9A227', fill = true,
}) => {
  const width = Math.max(240, data.length * 42);
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d.value - min) / range) * height;
    return { x, y };
  });
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? 0},${height} L0,${height} Z`;
  const gradId = React.useId();

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <svg width={width} height={height + 24} viewBox={`0 0 ${width} ${height + 24}`} className="min-w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
        <path d={linePath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
        {data.map((d, i) => (
          <text key={i} x={points[i].x} y={height + 16} fontSize="9" textAnchor="middle" fill="#3A4A6B" opacity={0.6}>
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
