import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Bell, BellOff, Trash2, ShieldCheck } from 'lucide-react';
import { Investment, InvestmentType, InvestmentFrequency } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { useSettings } from '../../hooks/useSettings';
import { uid, nowISO } from '../../db';
import { rescheduleAllNotifications } from '../../utils/notifications';
import { projectedCorpusValue } from '../../utils/corpus';
import { PageHeader, Card, StatTile, EmptyState, Pill } from '../../components/ui/Layout';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select, TextArea } from '../../components/ui/Field';
import { DonutChart } from '../../components/charts/DonutChart';
import { ProgressRing } from '../../components/charts/ProgressRing';
import { SketchMountainFlag } from '../../components/sketches/Sketches';

const TYPES: InvestmentType[] = ['Health Insurance', 'Term Insurance', 'Emergency Fund', 'Gold Scheme', 'SIP', 'FD', 'PPF', 'NPS', 'LIC', 'Other'];
const FREQS: InvestmentFrequency[] = ['monthly', 'quarterly', 'annual', 'one-time'];

function blank(): Investment {
  return {
    id: uid(), name: '', type: 'SIP', provider: '', amount: 0, frequency: 'monthly',
    currentValue: 0, notifyEnabled: true, updatedAt: nowISO(),
  };
}

export const InvestmentsView: React.FC = () => {
  const { items: investments, save, remove } = useCollection<Investment>('investments');
  const { settings } = useSettings();
  const [editing, setEditing] = useState<Investment | null>(null);

  useEffect(() => {
    if (investments.length) rescheduleAllNotifications(investments, settings.notifyDueDates);
  }, [investments, settings.notifyDueDates]);

  const netWorth = investments.reduce((s, i) => s + (i.currentValue || 0), 0);
  const byType = useMemo(() => {
    const m = new Map<string, number>();
    investments.forEach((i) => m.set(i.type, (m.get(i.type) ?? 0) + (i.currentValue || 0)));
    return [...m.entries()].map(([label, value]) => ({ label, value }));
  }, [investments]);

  const monthlyContribution = investments
    .filter((i) => i.frequency === 'monthly')
    .reduce((s, i) => s + i.amount, 0);
  const projected = projectedCorpusValue(monthlyContribution, settings.budget.corpusYears * 12, settings.budget.corpusAssumedReturn);
  const corpusPct = Math.min(100, Math.round((netWorth / settings.budget.corpusTarget) * 100));

  const dueSoon = investments
    .filter((i) => i.dueDay)
    .map((i) => {
      const day = Math.max(1, Math.min(28, i.dueDay!));
      const now = new Date();
      let due = new Date(now.getFullYear(), now.getMonth(), day);
      if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, day);
      return { i, daysAway: Math.round((due.getTime() - now.getTime()) / 86400000) };
    })
    .sort((a, b) => a.daysAway - b.daysAway);

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader
        eyebrow="Wealth"
        title="Investments & Insurance"
        subtitle="Health, term, gold, SIPs, FDs, PPF, NPS, LIC — with due-date reminders."
        right={<button onClick={() => setEditing(blank())} className="btn-gold flex items-center gap-1.5 text-sm"><Plus className="w-4 h-4" />Add</button>}
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatTile label="Net Worth" value={`₹${netWorth.toLocaleString('en-IN')}`} icon={<ShieldCheck className="w-4 h-4" />} />
        <StatTile label="Monthly Contribution" value={`₹${monthlyContribution.toLocaleString('en-IN')}`} tone="navy" />
      </div>

      <Card className="flex items-center gap-6 mb-6">
        <ProgressRing percent={corpusPct} sublabel={`of ₹${(settings.budget.corpusTarget / 10000000).toFixed(1)}Cr`} />
        <div className="text-xs text-navy-light/70 flex-1">
          <p>At ₹{monthlyContribution.toLocaleString('en-IN')}/month and {settings.budget.corpusAssumedReturn}% assumed annual return, projected value in {settings.budget.corpusYears} years:</p>
          <p className="font-bold text-navy text-lg mt-1">₹{Math.round(projected).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-navy-light/40 mt-1">Projection only — not a guarantee. Adjust assumptions in Budget settings.</p>
        </div>
      </Card>

      {dueSoon.length > 0 && (
        <>
          <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Due Soon</h3>
          <Card className="!p-0 divide-y divide-gold-soft/60 mb-6">
            {dueSoon.map(({ i, daysAway }) => (
              <div key={i.id} className="flex items-center gap-3 p-3">
                <div className="icon-chip"><Bell className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-navy truncate">{i.name}</p><p className="text-xs text-navy-light/50">₹{i.amount.toLocaleString('en-IN')} · {i.frequency}</p></div>
                <Pill tone={daysAway <= 1 ? 'amber' : 'ghost'}>{daysAway <= 0 ? 'Today' : `${daysAway}d`}</Pill>
              </div>
            ))}
          </Card>
        </>
      )}

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Asset Allocation</h3>
      <Card className="mb-6">
        {byType.length ? <DonutChart data={byType} /> : <EmptyState icon={<SketchMountainFlag size={64} />} title="No instruments yet" />}
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">All Instruments</h3>
      <Card className="!p-0 divide-y divide-gold-soft/60">
        {investments.map((i) => (
          <div key={i.id} className="p-4 cursor-pointer" onClick={() => setEditing(i)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-navy">{i.name}</p>
                <p className="text-xs text-navy-light/50">{i.type} · {i.provider} · ₹{i.amount.toLocaleString('en-IN')}/{i.frequency}</p>
              </div>
              <div className="flex items-center gap-2">
                {i.notifyEnabled ? <Bell className="w-4 h-4 text-gold" /> : <BellOff className="w-4 h-4 text-navy-light/30" />}
                <span className="font-bold text-navy text-sm">₹{i.currentValue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        ))}
        {investments.length === 0 && <p className="p-4 text-sm text-navy-light/50 italic">No instruments added yet.</p>}
      </Card>

      <InvestmentEditorModal investment={editing} onClose={() => setEditing(null)} onSave={async (i) => { await save(i); setEditing(null); }} onDelete={async (id) => { await remove(id); setEditing(null); }} />
    </div>
  );
};

const InvestmentEditorModal: React.FC<{ investment: Investment | null; onClose: () => void; onSave: (i: Investment) => void; onDelete: (id: string) => void }> = ({
  investment, onClose, onSave, onDelete,
}) => {
  const [form, setForm] = useState<Investment | null>(investment);
  useEffect(() => setForm(investment), [investment]);
  if (!form) return null;
  const set = <K extends keyof Investment>(k: K, v: Investment[K]) => setForm({ ...form, [k]: v });

  return (
    <Modal open={!!investment} onClose={onClose} title={investment?.name ? 'Edit Instrument' : 'New Instrument'}>
      <Field label="Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. LIC Jeevan Anand" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type"><Select value={form.type} onChange={(e) => set('type', e.target.value as InvestmentType)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
        <Field label="Provider"><Input value={form.provider} onChange={(e) => set('provider', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount (₹)"><Input type="number" value={form.amount} onChange={(e) => set('amount', Number(e.target.value))} /></Field>
        <Field label="Frequency"><Select value={form.frequency} onChange={(e) => set('frequency', e.target.value as InvestmentFrequency)}>{FREQS.map((f) => <option key={f} value={f}>{f}</option>)}</Select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due day of month" hint="For monthly/quarterly reminders"><Input type="number" min={1} max={28} value={form.dueDay ?? ''} onChange={(e) => set('dueDay', Number(e.target.value))} /></Field>
        <Field label="Current value (₹)"><Input type="number" value={form.currentValue} onChange={(e) => set('currentValue', Number(e.target.value))} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date"><Input type="date" value={form.startDate ?? ''} onChange={(e) => set('startDate', e.target.value)} /></Field>
        <Field label="Maturity date"><Input type="date" value={form.maturityDate ?? ''} onChange={(e) => set('maturityDate', e.target.value)} /></Field>
      </div>
      <Field label="Sum assured / target value (₹)"><Input type="number" value={form.sumAssuredOrTarget ?? ''} onChange={(e) => set('sumAssuredOrTarget', Number(e.target.value))} /></Field>
      <Field label="Nominee"><Input value={form.nominee ?? ''} onChange={(e) => set('nominee', e.target.value)} /></Field>
      <Field label="Notes"><TextArea rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
      <label className="flex items-center gap-2 text-sm font-bold text-navy mb-4">
        <input type="checkbox" checked={form.notifyEnabled} onChange={(e) => set('notifyEnabled', e.target.checked)} /> Remind me before due date
      </label>
      <div className="flex gap-3">
        <button onClick={() => onSave(form)} className="btn-gold flex-1">Save</button>
        {investment?.name && <button onClick={() => onDelete(form.id)} className="btn-outline"><Trash2 className="w-4 h-4" /></button>}
      </div>
    </Modal>
  );
};
