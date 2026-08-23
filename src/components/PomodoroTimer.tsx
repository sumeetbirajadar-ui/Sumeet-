import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, BookOpen } from 'lucide-react';

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

function format(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function PomodoroTimer({ storageKey }: { storageKey: string }) {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState(WORK_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(() => {
    return parseInt(localStorage.getItem(storageKey) || '0', 10) || 0;
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          const nextMode = mode === 'work' ? 'break' : 'work';
          if (mode === 'work') {
            const next = sessions + 1;
            setSessions(next);
            localStorage.setItem(storageKey, String(next));
          }
          setMode(nextMode);
          return (nextMode === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode]);

  function reset() {
    setRunning(false);
    setMode('work');
    setSecondsLeft(WORK_MINUTES * 60);
  }

  const total = (mode === 'work' ? WORK_MINUTES : BREAK_MINUTES) * 60;
  const progress = 1 - secondsLeft / total;

  return (
    <div className="bg-white border-2 border-ink-200 rounded-3xl p-6 flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ink-500">
        {mode === 'work' ? <BookOpen className="w-4 h-4 text-gold-500" /> : <Coffee className="w-4 h-4 text-sage-500" />}
        {mode === 'work' ? 'Focus Session' : 'Break'}
      </div>

      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-ink-100)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={mode === 'work' ? 'var(--color-gold-400)' : 'var(--color-sage-400)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold text-ink-900 font-display">{format(secondsLeft)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-6 py-2.5 rounded-full flex items-center gap-2 shadow"
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset} className="p-2.5 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-600">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-ink-400">
        <strong className="text-ink-600">{sessions}</strong> focus session{sessions === 1 ? '' : 's'} completed
      </p>
    </div>
  );
}
