import React, { useMemo, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Wallet, TrendingUp, IndianRupee, Settings2 } from 'lucide-react';
import { Expense, IncomeEntry, CategoryBudget, EXPENSE_CATEGORIES, BudgetBucket } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { useSettings } from '../../hooks/useSettings';
import { uid, nowISO, todayISO } from '../../db';
import { datesInMonth, monthKeyFor, formatShort } from '../../utils/dates';
import { requiredFixedSIP, requiredStepUpSIP } from '../../utils/corpus';
import { PageHeader, Card, StatTile, EmptyState } from '../../components/ui/Layout';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select } from '../../components/ui/Field';
import { DonutChart } from '../../components/charts/DonutChart';
import { BarChart } from '../../components/charts/BarChart';
import { LineChart } from '../../components/charts/LineChart';
import { Heatmap } from '../../components/charts/Heatmap';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { SketchPiggyBank } from '../../components/sketches/Sketches';

function monthLabel(monthKey: string) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}
function shiftMonth(monthKey: string, delta: number) {
  const [y, m] = monthKey.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const BudgetView: React.FC = () => {
  const { items: expenses, save: saveExpense, remove: removeExpense } = useCollection<Expense>('expenses');
  const { items: incomes, save: saveIncome } = useCollection<IncomeEntry>('incomes');
  const { items: categoryBudgets, save: saveCategoryBudget } = useCollection<CategoryBudget>('categoryBudgets');
  const { settings, update: updateSettings } = useSettings();

  const [month, setMonth] = useState(monthKeyFor(todayISO()));
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const monthExpenses = expenses.filter((e) => e.date.slice(0, 7) === month);
  const monthIncome = incomes.filter((i) => i.date.slice(0, 7) === month).reduce((s, i) => s + i.amount, 0);
  const monthSpend = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const savingsRate = monthIncome > 0 ? Math.max(0, Math.round(((monthIncome - monthSpend) / monthIncome) * 100)) : 0;

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    monthExpenses.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount));
    return [...m.entries()].map(([label, value]) => ({ label, value }));
  }, [monthExpenses]);

  const budgetByCategory = new Map<string, CategoryBudget>(categoryBudgets.map((b) => [b.category, b]));
  const barData = byCategory.map((c) => ({ label: c.label, value: c.value, target: budgetByCategory.get(c.label)?.monthlyLimit }));

  const bucketTotals = useMemo(() => {
    const totals: Record<BudgetBucket, number> = { needs: 0, wants: 0, savings: 0 };
    monthExpenses.forEach((e) => {
      const bucket = budgetByCategory.get(e.category)?.bucket ?? 'needs';
      totals[bucket] += e.amount;
    });
    return totals;
  }, [monthExpenses, categoryBudgets]);

  const last6Months = useMemo(() => {
    const out: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const mk = shiftMonth(month, -i);
      const total = expenses.filter((e) => e.date.slice(0, 7) === mk).reduce((s, e) => s + e.amount, 0);
      out.push({ label: monthLabel(mk).split(' ')[0], value: total });
    }
    return out;
  }, [expenses, month]);

  const heatmapCells = useMemo(() => datesInMonth(month).map((d) => {
    const total = expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0);
    const max = Math.max(1, ...datesInMonth(month).map((dd) => expenses.filter((e) => e.date === dd).reduce((s, e) => s + e.amount, 0)));
    return { date: d, value: total / max };
  }), [expenses, month]);

  const b = settings.budget;
  const requiredFixed = requiredFixedSIP(b.corpusTarget, b.corpusYears, b.corpusAssumedReturn);
  const requiredStepUp = requiredStepUpSIP(b.corpusTarget, b.corpusYears, b.corpusAssumedReturn, b.corpusStepUpPct);
  const currentMonthlySavings = monthIncome - monthSpend;

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Money"
        title="Budget & Expenses"
        subtitle="Log in seconds. Let the 50/20/30 split and the corpus goal do the thinking."
        right={
          <div className="flex gap-2">
            <button onClick={() => setSettingsOpen(true)} className="icon-chip"><Settings2 className="w-4 h-4" /></button>
            <button onClick={() => setAddOpen(true)} className="btn-gold flex items-center gap-1.5 text-sm"><Plus className="w-4 h-4" />Expense</button>
          </div>
        }
      />

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => setMonth(shiftMonth(month, -1))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronLeft className="w-5 h-5" /></button>
        <p className="font-bold text-navy text-sm">{monthLabel(month)}</p>
        <button onClick={() => setMonth(shiftMonth(month, 1))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatTile label="Spent" value={`₹${monthSpend.toLocaleString('en-IN')}`} icon={<IndianRupee className="w-4 h-4" />} />
        <StatTile label="Income" value={`₹${monthIncome.toLocaleString('en-IN')}`} icon={<TrendingUp className="w-4 h-4" />} tone="navy" />
      </div>

      <Card className="flex items-center gap-6 mb-6">
        <ProgressRing percent={savingsRate} sublabel="Savings Rate" />
        <div className="flex-1 space-y-2 text-xs">
          {(['needs', 'wants', 'savings'] as BudgetBucket[]).map((bucket) => (
            <div key={bucket}>
              <div className="flex justify-between font-bold text-navy mb-0.5"><span className="capitalize">{bucket}</span><span>₹{bucketTotals[bucket].toLocaleString('en-IN')} / {b[`${bucket}Pct`]}%</span></div>
              <div className="h-1.5 bg-ivory-dark rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${monthIncome ? Math.min(100, (bucketTotals[bucket] / monthIncome) * 100) : 0}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Spend by Category</h3>
      <Card className="mb-6">
        {byCategory.length ? <DonutChart data={byCategory} /> : <EmptyState icon={<SketchPiggyBank size={64} />} title="No expenses logged this month" />}
      </Card>

      {barData.length > 0 && (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Budget vs Actual</h3>
          <Card className="mb-6"><BarChart data={barData} formatValue={(v) => `₹${(v / 1000).toFixed(1)}k`} /></Card>
        </>
      )}

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">6-Month Trend</h3>
      <Card className="mb-6"><LineChart data={last6Months} /></Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Spending Heatmap</h3>
      <Card className="mb-6"><Heatmap cells={heatmapCells} weeks={5} endDate={datesInMonth(month).slice(-1)[0]} /></Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">₹{(b.corpusTarget / 10000000).toFixed(1)} Crore Corpus Goal</h3>
      <Card className="mb-6 space-y-2 text-sm">
        <p className="text-navy-light/70">Over <b>{b.corpusYears} years</b> at an assumed <b>{b.corpusAssumedReturn}%</b> annual return (projection, not guaranteed):</p>
        <div className="flex justify-between"><span>Fixed monthly SIP needed</span><span className="font-bold text-navy">₹{Math.round(requiredFixed).toLocaleString('en-IN')}/mo</span></div>
        <div className="flex justify-between"><span>Starting SIP with {b.corpusStepUpPct}% annual step-up</span><span className="font-bold text-navy">₹{Math.round(requiredStepUp).toLocaleString('en-IN')}/mo</span></div>
        <div className="flex justify-between pt-2 border-t border-gold-soft"><span>Your savings this month</span><span className={`font-bold ${currentMonthlySavings >= requiredStepUp ? 'text-navy' : 'text-amber-flag'}`}>₹{Math.round(currentMonthlySavings).toLocaleString('en-IN')}/mo</span></div>
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Recent Expenses</h3>
      <Card className="!p-0 divide-y divide-gold-soft/60">
        {monthExpenses.slice().reverse().slice(0, 15).map((e) => (
          <div key={e.id} className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-bold text-navy">{e.category}</p>
              <p className="text-xs text-navy-light/50">{formatShort(e.date)}{e.note ? ` · ${e.note}` : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-navy">₹{e.amount.toLocaleString('en-IN')}</span>
              <button onClick={() => removeExpense(e.id)} className="text-navy-light/30 hover:text-amber-flag text-xs">✕</button>
            </div>
          </div>
        ))}
        {monthExpenses.length === 0 && <p className="p-4 text-sm text-navy-light/50 italic">Nothing logged yet.</p>}
      </Card>

      <AddExpenseModal open={addOpen} onClose={() => setAddOpen(false)} onSave={async (e) => { await saveExpense(e); setAddOpen(false); }} onSaveIncome={async (i) => { await saveIncome(i); setAddOpen(false); }} />
      <BudgetSettingsModal
        open={settingsOpen} onClose={() => setSettingsOpen(false)}
        categoryBudgets={categoryBudgets} onSaveCategory={saveCategoryBudget}
        budget={b} onUpdateBudget={(patch) => updateSettings({ budget: { ...b, ...patch } })}
      />
    </div>
  );
};

const AddExpenseModal: React.FC<{ open: boolean; onClose: () => void; onSave: (e: Expense) => void; onSaveIncome: (i: IncomeEntry) => void }> = ({
  open, onClose, onSave, onSaveIncome,
}) => {
  const [mode, setMode] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [source, setSource] = useState('Salary');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());

  return (
    <Modal open={open} onClose={onClose} title="Add Entry">
      <div className="flex gap-1 bg-ivory-dark rounded-full p-1 mb-4">
        {(['expense', 'income'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`flex-1 py-1.5 rounded-full text-xs font-bold capitalize ${mode === m ? 'bg-navy text-cream' : 'text-navy-light/60'}`}>{m}</button>
        ))}
      </div>
      <Field label="Amount (₹)"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></Field>
      <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      {mode === 'expense' ? (
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
      ) : (
        <Field label="Source">
          <Select value={source} onChange={(e) => setSource(e.target.value)}>
            {['Salary', 'Tuition', 'YouTube', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <button
        className="btn-gold w-full"
        onClick={() => {
          if (!amount) return;
          if (mode === 'expense') onSave({ id: uid(), date, amount: Number(amount), category, note, updatedAt: nowISO() });
          else onSaveIncome({ id: uid(), date, amount: Number(amount), source, updatedAt: nowISO() });
          setAmount(''); setNote('');
        }}
      >Save</button>
    </Modal>
  );
};

const BudgetSettingsModal: React.FC<{
  open: boolean; onClose: () => void;
  categoryBudgets: CategoryBudget[]; onSaveCategory: (c: CategoryBudget) => void;
  budget: import('../../types').BudgetSettings; onUpdateBudget: (p: Partial<import('../../types').BudgetSettings>) => void;
}> = ({ open, onClose, categoryBudgets, onSaveCategory, budget, onUpdateBudget }) => {
  const byCategory = new Map<string, CategoryBudget>(categoryBudgets.map((c) => [c.category, c]));
  return (
    <Modal open={open} onClose={onClose} title="Budget Settings" wide>
      <h3 className="font-bold text-sm text-navy mb-2">Split & Corpus Goal</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Field label="Needs %"><Input type="number" value={budget.needsPct} onChange={(e) => onUpdateBudget({ needsPct: Number(e.target.value) })} /></Field>
        <Field label="Wants %"><Input type="number" value={budget.wantsPct} onChange={(e) => onUpdateBudget({ wantsPct: Number(e.target.value) })} /></Field>
        <Field label="Savings %"><Input type="number" value={budget.savingsPct} onChange={(e) => onUpdateBudget({ savingsPct: Number(e.target.value) })} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Field label="Corpus Target (₹)"><Input type="number" value={budget.corpusTarget} onChange={(e) => onUpdateBudget({ corpusTarget: Number(e.target.value) })} /></Field>
        <Field label="Years"><Input type="number" value={budget.corpusYears} onChange={(e) => onUpdateBudget({ corpusYears: Number(e.target.value) })} /></Field>
        <Field label="Assumed Return %"><Input type="number" value={budget.corpusAssumedReturn} onChange={(e) => onUpdateBudget({ corpusAssumedReturn: Number(e.target.value) })} /></Field>
      </div>
      <h3 className="font-bold text-sm text-navy mb-2">Per-Category Monthly Limit & Bucket</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
        {EXPENSE_CATEGORIES.map((cat) => {
          const cb = byCategory.get(cat) ?? { id: cat, category: cat, bucket: 'needs' as BudgetBucket, monthlyLimit: 0 };
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className="text-xs font-medium text-navy flex-1 truncate">{cat}</span>
              <select value={cb.bucket} onChange={(e) => onSaveCategory({ ...cb, bucket: e.target.value as BudgetBucket })} className="input-field !w-24 text-xs !py-1">
                <option value="needs">Needs</option><option value="wants">Wants</option><option value="savings">Savings</option>
              </select>
              <input type="number" value={cb.monthlyLimit || ''} placeholder="0" onChange={(e) => onSaveCategory({ ...cb, monthlyLimit: Number(e.target.value) })} className="input-field !w-24 text-xs !py-1" />
            </div>
          );
        })}
      </div>
    </Modal>
  );
};
