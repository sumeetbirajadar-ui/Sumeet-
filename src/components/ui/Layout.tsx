import React from 'react';

export const PageHeader: React.FC<{ eyebrow?: string; title: string; subtitle?: string; right?: React.ReactNode; icon?: React.ReactNode }> = ({
  eyebrow, title, subtitle, right, icon,
}) => (
  <header className="flex items-start justify-between gap-4 mb-6">
    <div>
      {eyebrow && <span className="section-eyebrow mb-2">{eyebrow}</span>}
      <h1 className="text-2xl font-bold font-display text-navy flex items-center gap-3 mt-1">
        {icon}{title}
      </h1>
      {subtitle && <p className="text-sm text-navy-light/70 mt-1 max-w-lg">{subtitle}</p>}
    </div>
    {right}
  </header>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`card p-5 ${className ?? ''}`}>{children}</div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; hint?: string; action?: React.ReactNode }> = ({
  icon, title, hint, action,
}) => (
  <div className="flex flex-col items-center text-center py-10 px-4">
    <div className="mb-3 opacity-80">{icon}</div>
    <p className="font-bold text-navy">{title}</p>
    {hint && <p className="text-xs text-navy-light/60 mt-1 max-w-xs">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const StatTile: React.FC<{ label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode; tone?: 'gold' | 'navy' }> = ({
  label, value, hint, icon, tone = 'gold',
}) => (
  <div className="card p-4 flex items-start gap-3">
    {icon && <div className={`icon-chip ${tone === 'navy' ? 'bg-navy-pale text-navy' : ''}`}>{icon}</div>}
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wider font-bold text-navy-light/60">{label}</p>
      <p className="text-xl font-bold font-display text-navy truncate">{value}</p>
      {hint && <p className="text-xs text-navy-light/50 mt-0.5">{hint}</p>}
    </div>
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; tone?: 'gold' | 'navy' | 'amber' | 'ghost'; className?: string }> = ({
  children, tone = 'gold', className,
}) => {
  const tones: Record<string, string> = {
    gold: 'bg-gold text-cream',
    navy: 'bg-navy text-cream',
    amber: 'amber-flag',
    ghost: 'bg-ivory-dark text-navy border border-gold-soft',
  };
  return <span className={`pill ${tones[tone]} ${className ?? ''}`}>{children}</span>;
};
