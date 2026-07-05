import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, CheckCircle2, Timer } from 'lucide-react';
import { Habit, HabitLog } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { playCompletionBeep } from '../../utils/sound';
import { scheduleFocusSessionNotification, cancelFocusSessionNotification } from '../../utils/notifications';
import { PageHeader, Card, Pill } from '../../components/ui/Layout';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { Select } from '../../components/ui/Field';

const PRESETS = [25, 50, 90];
const STORAGE_KEY = 'pomodoro_timer_v1';

interface StoredTimer { endAt: number; durationMin: number; label: string }

function loadStored(): StoredTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveStored(t: StoredTimer | null) {
  if (t) localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  else localStorage.removeItem(STORAGE_KEY);
}

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const PomodoroView: React.FC = () => {
  const { items: habits } = useCollection<Habit>('habits');
  const { items: logs, save: saveLog } = useCollection<HabitLog>('habitLogs');

  const [customMin, setCustomMin] = useState(25);
  const [timer, setTimer] = useState<StoredTimer | null>(() => loadStored());
  const [remainingSec, setRemainingSec] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loggedTo, setLoggedTo] = useState<string | null>(null);
  const beepedRef = useRef(false);

  const hourHabits = habits.filter((h) => h.active && h.unit === 'hours');
  const [targetHabitId, setTargetHabitId] = useState<string>('');
  useEffect(() => {
    if (!targetHabitId && hourHabits.length) setTargetHabitId(hourHabits[0].id);
  }, [hourHabits, targetHabitId]);

  useEffect(() => {
    const tick = () => {
      if (!timer) return;
      const remaining = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
      setRemainingSec(remaining);
      if (remaining <= 0 && !beepedRef.current) {
        beepedRef.current = true;
        playCompletionBeep();
        setCompleted(true);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timer]);

  const start = (minutes: number) => {
    const label = hourHabits.find((h) => h.id === targetHabitId)?.name ?? 'Deep Work';
    const t: StoredTimer = { endAt: Date.now() + minutes * 60000, durationMin: minutes, label };
    saveStored(t);
    setTimer(t);
    setCompleted(false);
    setLoggedTo(null);
    beepedRef.current = false;
    scheduleFocusSessionNotification(minutes, label);
  };

  const cancel = () => {
    saveStored(null);
    setTimer(null);
    setCompleted(false);
    beepedRef.current = false;
    cancelFocusSessionNotification();
  };

  const logSession = async () => {
    if (!timer || !targetHabitId) return;
    const habit = hourHabits.find((h) => h.id === targetHabitId);
    if (!habit) return;
    const today = todayISO();
    const existing = logs.find((l) => l.habitId === habit.id && l.date === today);
    const newCount = Math.round(((existing?.count ?? 0) + timer.durationMin / 60) * 100) / 100;
    const status = newCount >= (habit.targetCount ?? 1) ? 'done' : 'missed';
    await saveLog({ id: existing?.id ?? uid(), habitId: habit.id, date: today, status, count: newCount, updatedAt: nowISO() });
    setLoggedTo(habit.name);
    saveStored(null);
    setTimer(null);
  };

  const totalSec = (timer?.durationMin ?? customMin) * 60;
  const percent = timer ? Math.round(((totalSec - remainingSec) / totalSec) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <PageHeader
        eyebrow="Deep Work"
        title="Focus Timer"
        subtitle="Pick a duration, focus, and it beeps when time's up — even if you switch apps."
      />

      <Card className="flex flex-col items-center gap-6 py-8">
        {timer && !completed ? (
          <>
            <ProgressRing percent={percent} size={200} stroke={16}
              label={<span className="text-4xl font-bold font-display text-navy">{formatMMSS(remainingSec)}</span>}
              sublabel={timer.label} />
            <button onClick={cancel} className="btn-outline flex items-center gap-2"><Square className="w-4 h-4" />Stop Session</button>
          </>
        ) : completed && timer ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-16 h-16 text-gold" />
              <p className="font-bold text-navy font-display text-xl">Session complete!</p>
              <p className="text-sm text-navy-light/60">{timer.durationMin} focused minutes.</p>
            </div>
            {loggedTo ? (
              <Pill tone="gold">Logged to {loggedTo}</Pill>
            ) : hourHabits.length ? (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Select value={targetHabitId} onChange={(e) => setTargetHabitId(e.target.value)} className="flex-1 text-sm">
                  {hourHabits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
                <button onClick={logSession} className="btn-gold text-sm shrink-0">Log</button>
              </div>
            ) : null}
            <button onClick={cancel} className="text-xs font-bold text-navy-light/50 uppercase tracking-wide">Dismiss</button>
          </>
        ) : (
          <>
            <ProgressRing percent={0} size={200} stroke={16}
              label={<span className="text-4xl font-bold font-display text-navy">{customMin}:00</span>}
              sublabel="Ready to focus" />
            <div className="flex gap-2">
              {PRESETS.map((p) => (
                <button key={p} onClick={() => setCustomMin(p)} className={`px-4 py-2 rounded-full text-sm font-bold ${customMin === p ? 'bg-navy text-cream' : 'bg-ivory-dark text-navy-light/60'}`}>{p} min</button>
              ))}
              <input type="number" min={1} max={180} value={customMin} onChange={(e) => setCustomMin(Number(e.target.value))} className="input-field !w-16 text-center text-sm" />
            </div>
            {hourHabits.length > 0 && (
              <div className="flex items-center gap-2 w-full max-w-xs">
                <Timer className="w-4 h-4 text-navy-light/40 shrink-0" />
                <Select value={targetHabitId} onChange={(e) => setTargetHabitId(e.target.value)} className="flex-1 text-sm">
                  {hourHabits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </Select>
              </div>
            )}
            <button onClick={() => start(customMin)} className="btn-gold flex items-center gap-2 px-8"><Play className="w-4 h-4" />Start Focus Session</button>
          </>
        )}
      </Card>

      <p className="text-xs text-navy-light/40 text-center mt-4 px-4">
        The beep plays while this screen is open. If you switch apps or lock your phone, a
        notification will still alert you when time's up (Android).
      </p>
    </div>
  );
};
