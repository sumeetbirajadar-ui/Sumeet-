import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

/** A calendar-icon button that opens the native date/month picker so you can
 * jump straight to any past date instead of clicking prev/next repeatedly. */
export const DateJump: React.FC<{ value: string; onChange: (v: string) => void; type?: 'date' | 'month' }> = ({
  value, onChange, type = 'date',
}) => {
  const ref = useRef<HTMLInputElement>(null);

  const open = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof (el as any).showPicker === 'function') {
      try { (el as any).showPicker(); return; } catch { /* fall through */ }
    }
    el.focus();
    el.click();
  };

  return (
    <>
      <button onClick={open} title="Jump to a date" className="icon-chip hover:bg-gold hover:text-cream transition-colors">
        <CalendarDays className="w-4 h-4" />
      </button>
      <input
        ref={ref} type={type} value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="sr-only"
      />
    </>
  );
};
