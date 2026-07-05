import React, { useMemo, useState } from 'react';
import { Plus, Flame, IndianRupee, Target as TargetIcon, Bell, ChevronRight, AlertTriangle } from 'lucide-react';
import { Habit, HabitLog, Target, Expense, Investment, GratitudeEntry, SleepLog } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { addDays, formatFriendly, isDueOnWeekday, weekKeyFor } from '../../utils/dates';
import { computeStreak, computeDisciplineScore, wasHabitMissedOn } from '../../utils/discipline';
import { quoteOfTheDay } from '../../utils/quotes';
import { HabitIcon } from '../../utils/icons';
import { PageHeader, Card, Pill, StatTile } from '../../components/ui/Layout';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/Field';
import { EXPENSE_CATEGORIES } from '../../types';
import { SketchSun, GoldDivider } from '../../components/sketches/Sketches';

export const HomeDashboard: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { items: habits } = useCollection<Habit>('habits');
  const { items: logs, save: saveLog } = useCollection<HabitLog>('habitLogs');
  const { items: targets } = useCollection<Target>('targets');
  const { items: expenses, save: saveExpense } = useCollection<Expense>('expenses');
  const { items: investments } = useCollection<Investment>('investments');
  const { items: gratitudeEntries } = useCollection<GratitudeEntry>('gratitude');
  const { items: sleepLogs } = useCollection<SleepLog>('sleepLogs');

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const today = todayISO();
  const weekKey = weekKeyFor(today);
  const quote = quoteOfTheDay(today);

  const logsToday = useMemo(() => logs.filter((l) => l.date === today), [logs, today]);
  const logByHabit = useMemo(() => new Map(logsToday.map((l) => [l.habitId, l])), [logsToday]);

  const dueTodayHabits = habits.filter((h) => h.active && !h.isNegative
    && (h.frequency === 'daily' || (h.frequency === 'weekly' && isDueOnWeekday(h.weekDays, today))));

  const weeklyTargets = targets.filter((t) => t.period === 'weekly' && t.periodKey === weekKey);
  const todaysSpend = expenses.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);
  const todaysGratitude = gratitudeEntries.find((g) => g.date === today);
  const todaysSleep = sleepLogs.find((s) => s.date === today);
  const monthlySpend = expenses.filter((e) => e.date.slice(0, 7) === today.slice(0, 7)).reduce((s, e) => s + e.amount, 0);
  const dailyBudget = Math.max(1, monthlySpend) / new Date().getDate() || 1500;

  const score = computeDisciplineScore({
    date: today, weekKey, habits, habitLogsForDate: logsToday, weeklyTargets,
    todaysSpend, dailyBudget, gratitudeEntry: todaysGratitude, sleepLog: todaysSleep,
  });

  const topStreaks = habits
    .filter((h) => h.active && h.frequency === 'daily')
    .map((h) => ({ habit: h, streak: computeStreak(h.id, logs, today) }))
    .filter((s) => s.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5);

  const upcomingDue = investments
    .filter((i) => i.dueDay)
    .map((i) => {
      const day = Math.max(1, Math.min(28, i.dueDay!));
      const now = new Date();
      let due = new Date(now.getFullYear(), now.getMonth(), day);
      if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, day);
      const daysAway = Math.round((due.getTime() - now.getTime()) / 86400000);
      return { investment: i, daysAway };
    })
    .filter((d) => d.daysAway <= 10)
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, 4);

  const yesterdayISO = addDays(today, -1);
  const neverMissTwice = dueTodayHabits.filter((h) => {
    const doneToday = logByHabit.get(h.id)?.status === 'done';
    return !doneToday && h.frequency === 'daily' && wasHabitMissedOn(h, yesterdayISO, logs.filter((l) => l.date === yesterdayISO));
  });

  const toggleHabit = async (h: Habit) => {
    const existing = logByHabit.get(h.id);
    if (existing?.status === 'done') await saveLog({ ...existing, status: 'missed', updatedAt: nowISO() });
    else await saveLog({ id: existing?.id ?? uid(), habitId: h.id, date: today, status: 'done', updatedAt: nowISO() });
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm text-navy-light/60 font-medium">{formatFriendly(today)}</p>
          <h1 className="text-2xl font-bold font-display text-navy">Namaste, Sumeet.</h1>
        </div>
        <SketchSun size={44} />
      </div>
      <p className="italic text-sm text-navy-light/70 mb-6">"{quote.text}" <span className="not-italic text-navy-light/40">— {quote.source}</span></p>

      <Card className="flex items-center gap-6 mb-6 !bg-navy !border-navy text-cream">
        <ProgressRing percent={score.total} color="#D4AF37" trackColor="rgba(255,255,255,0.15)" size={104}
          label={<span className="text-2xl font-bold font-display text-cream">{score.total}</span>} sublabel="Discipline Score" />
        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {[
            ['Habits', score.habits], ['Study', score.study], ['Targets', score.targets],
            ['Budget', score.budget], ['Reflection', score.reflection], ['Sleep', score.sleep],
          ].map(([label, val]) => (
            <div key={label as string} className="flex justify-between gap-2 text-cream/80">
              <span>{label}</span><span className="font-bold text-gold-light">{val}%</span>
            </div>
          ))}
        </div>
      </Card>

      {neverMissTwice.length > 0 && (
        <div className="amber-flag rounded-2xl px-4 py-3 mb-6 flex items-center gap-2 text-sm font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" /> Don't miss twice: {neverMissTwice.map((h) => h.name).join(', ')}
        </div>
      )}

      <SectionRow title="Today's Habits" onSeeAll={() => onNavigate('habits')}>
        <Card className="!p-0 divide-y divide-gold-soft/60">
          {dueTodayHabits.slice(0, 6).map((h) => {
            const done = logByHabit.get(h.id)?.status === 'done';
            return (
              <button key={h.id} onClick={() => toggleHabit(h)} className="w-full flex items-center gap-3 p-3 text-left">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center border-2 shrink-0 ${done ? 'bg-navy border-navy text-cream' : 'border-gold-soft text-gold'}`}>
                  <HabitIcon name={h.icon} className="w-3.5 h-3.5" />
                </span>
                <span className={`text-sm font-medium text-navy flex-1 ${done ? 'line-through decoration-gold/50 text-navy-light/50' : ''}`}>{h.name}</span>
                {h.isKeystone && <Pill tone="gold" className="!text-[9px] !py-0.5 !px-1.5">Keystone</Pill>}
              </button>
            );
          })}
          {dueTodayHabits.length === 0 && <p className="p-4 text-sm text-navy-light/50 italic">No habits due today.</p>}
        </Card>
      </SectionRow>

      <SectionRow title="Today's Targets" onSeeAll={() => onNavigate('targets')}>
        <Card>
          {weeklyTargets.length ? weeklyTargets.slice(0, 3).map((t) => (
            <div key={t.id} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs font-bold text-navy mb-1"><span>{t.objective}</span><span>{t.achievedValue}/{t.targetValue} {t.unit}</span></div>
              <div className="h-2 bg-ivory-dark rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${Math.min(100, (t.achievedValue / t.targetValue) * 100)}%` }} /></div>
            </div>
          )) : <p className="text-sm text-navy-light/50 italic flex items-center gap-2"><TargetIcon className="w-4 h-4" /> No targets set for this week yet.</p>}
        </Card>
      </SectionRow>

      <SectionRow title="Today's Spend" right={
        <button onClick={() => setQuickAddOpen(true)} className="icon-chip hover:bg-gold hover:text-cream transition-colors"><Plus className="w-4 h-4" /></button>
      }>
        <Card className="flex items-center gap-3">
          <div className="icon-chip"><IndianRupee className="w-5 h-5" /></div>
          <div>
            <p className="text-xl font-bold font-display text-navy">₹{todaysSpend.toLocaleString('en-IN')}</p>
            <p className="text-xs text-navy-light/50">spent today · ₹{dailyBudget.toFixed(0)} daily average budget</p>
          </div>
        </Card>
      </SectionRow>

      {topStreaks.length > 0 && (
        <SectionRow title="Active Streaks">
          <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1">
            {topStreaks.map(({ habit, streak }) => (
              <div key={habit.id} className="card p-3 flex flex-col items-center min-w-[84px] shrink-0">
                <HabitIcon name={habit.icon} className="w-4 h-4 text-gold mb-1" />
                <span className="flex items-center gap-1 font-bold text-navy text-sm"><Flame className="w-3.5 h-3.5 text-amber-flag" />{streak}</span>
                <span className="text-[10px] text-navy-light/50 text-center truncate max-w-[76px]">{habit.name}</span>
              </div>
            ))}
          </div>
        </SectionRow>
      )}

      {upcomingDue.length > 0 && (
        <SectionRow title="Due Soon" onSeeAll={() => onNavigate('investments')}>
          <Card className="!p-0 divide-y divide-gold-soft/60">
            {upcomingDue.map(({ investment, daysAway }) => (
              <div key={investment.id} className="flex items-center gap-3 p-3">
                <div className="icon-chip"><Bell className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy truncate">{investment.name}</p>
                  <p className="text-xs text-navy-light/50">₹{investment.amount.toLocaleString('en-IN')} · {investment.type}</p>
                </div>
                <Pill tone={daysAway <= 1 ? 'amber' : 'ghost'}>{daysAway <= 0 ? 'Today' : `${daysAway}d`}</Pill>
              </div>
            ))}
          </Card>
        </SectionRow>
      )}

      <GoldDivider className="my-8" />
      <p className="text-center text-xs text-navy-light/40 mb-2">Evening review (gratitude, reflection, energy) lives in the Gratitude tab.</p>
      <button onClick={() => onNavigate('gratitude')} className="btn-outline w-full flex items-center justify-center gap-2">
        Open Evening Review <ChevronRight className="w-4 h-4" />
      </button>

      <QuickAddExpenseModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} onSave={async (e) => { await saveExpense(e); setQuickAddOpen(false); }} />
    </div>
  );
};

const SectionRow: React.FC<{ title: string; onSeeAll?: () => void; right?: React.ReactNode; children: React.ReactNode }> = ({ title, onSeeAll, right, children }) => (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60">{title}</h3>
      {right ?? (onSeeAll && <button onClick={onSeeAll} className="text-[11px] font-bold text-gold uppercase tracking-wide">See all</button>)}
    </div>
    {children}
  </div>
);

const QuickAddExpenseModal: React.FC<{ open: boolean; onClose: () => void; onSave: (e: Expense) => void }> = ({ open, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Quick Add Expense">
      <Field label="Amount (₹)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" autoFocus /></Field>
      <Field label="Category">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button
        className="btn-gold w-full"
        onClick={() => {
          if (!amount) return;
          onSave({ id: uid(), date: todayISO(), amount: Number(amount), category, note, updatedAt: nowISO() });
          setAmount(''); setNote('');
        }}
      >Add Expense</button>
    </Modal>
  );
};
