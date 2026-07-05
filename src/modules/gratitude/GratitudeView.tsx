import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Search, Flame } from 'lucide-react';
import { GratitudeEntry } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { addDays, formatFriendly, formatShort } from '../../utils/dates';
import { PageHeader, Card, EmptyState } from '../../components/ui/Layout';
import { SketchLotus, GoldDivider } from '../../components/sketches/Sketches';

function blankEntry(date: string): GratitudeEntry {
  return { id: uid(), date, items: [{ text: '', why: '' }, { text: '', why: '' }, { text: '', why: '' }], updatedAt: nowISO() };
}

export const GratitudeView: React.FC = () => {
  const { items: entries, save } = useCollection<GratitudeEntry>('gratitude');
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');

  const entry = entries.find((e) => e.date === date) ?? blankEntry(date);

  const streak = useMemo(() => {
    let s = 0;
    let cursor = todayISO();
    while (entries.find((e) => e.date === cursor && e.items.some((i) => i.text.trim()))) {
      s += 1;
      cursor = addDays(cursor, -1);
    }
    return s;
  }, [entries]);

  const update = (patch: Partial<GratitudeEntry>) => save({ ...entry, ...patch, updatedAt: nowISO() });

  const past = entries
    .filter((e) => e.date !== date && e.items.some((i) => i.text.trim()))
    .filter((e) => !search || e.items.some((i) => i.text.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20);

  return (
    <div className="max-w-2xl mx-auto pb-28">
      <PageHeader eyebrow="Evening Review" title="Gratitude & Reflection" subtitle="3 good things, and why. Depth over breadth." />

      <div className="flex items-center justify-center gap-4 mb-2">
        <button onClick={() => setDate(addDays(date, -1))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronLeft className="w-5 h-5" /></button>
        <p className="font-bold text-navy text-sm">{formatFriendly(date)}</p>
        <button onClick={() => setDate(addDays(date, 1))} className="p-2 rounded-full hover:bg-gold-pale text-navy-light"><ChevronRight className="w-5 h-5" /></button>
      </div>
      {streak > 0 && <p className="text-center text-xs font-bold text-amber-flag flex items-center justify-center gap-1 mb-6"><Flame className="w-3.5 h-3.5" />{streak}-day gratitude streak</p>}

      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <SketchLotus size={40} />
          <div>
            <p className="font-bold text-navy text-sm">Morning Intention</p>
          </div>
        </div>
        <textarea value={entry.morningIntention ?? ''} onChange={(e) => update({ morningIntention: e.target.value })} placeholder="What kind of day do I want to have?" className="input-field resize-none" rows={2} />
      </Card>

      <Card className="mb-6">
        <p className="font-bold text-navy text-sm mb-3">3 Good Things — and why</p>
        <div className="space-y-4">
          {entry.items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gold font-bold pt-2">{i + 1}</span>
              <div className="flex-1 space-y-1.5">
                <input
                  value={item.text}
                  onChange={(e) => { const items = [...entry.items]; items[i] = { ...items[i], text: e.target.value }; update({ items }); }}
                  placeholder="I'm grateful for…"
                  className="planner-input text-sm"
                />
                <input
                  value={item.why}
                  onChange={(e) => { const items = [...entry.items]; items[i] = { ...items[i], why: e.target.value }; update({ items }); }}
                  placeholder="…because"
                  className="planner-input text-xs italic text-navy-light/70"
                />
              </div>
              <button onClick={() => update({ items: entry.items.filter((_, j) => j !== i) })} className="text-navy-light/30 hover:text-amber-flag pt-2"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <button onClick={() => update({ items: [...entry.items, { text: '', why: '' }] })} className="mt-3 text-xs font-bold text-gold uppercase tracking-wide flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add another</button>
      </Card>

      <Card className="mb-6">
        <p className="font-bold text-navy text-sm mb-3">Evening Reflection (Accountability Mirror)</p>
        <textarea value={entry.eveningReflection ?? ''} onChange={(e) => update({ eveningReflection: e.target.value })} placeholder="Honestly — how did today go? What would I do differently?" className="input-field resize-none mb-4" rows={2} />
        <div className="flex items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">Energy today</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => update({ energyLevel: n })} className={`w-7 h-7 rounded-full text-xs font-bold ${entry.energyLevel === n ? 'bg-gold text-cream' : 'bg-ivory-dark text-navy-light/50'}`}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-navy-light/60 mb-1.5 block">Bedtime</span>
            <input type="time" value={entry.bedtime ?? ''} onChange={(e) => update({ bedtime: e.target.value })} className="input-field !py-1.5" />
          </div>
        </div>
      </Card>

      <GoldDivider className="my-8" />

      <div className="flex items-center gap-2 mb-3">
        <Search className="w-4 h-4 text-navy-light/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search past entries…" className="planner-input text-sm" />
      </div>
      <div className="space-y-3">
        {past.map((e) => (
          <Card key={e.id} className="!p-3">
            <p className="text-[11px] font-bold text-navy-light/50 mb-1">{formatShort(e.date)}</p>
            {e.items.filter((i) => i.text.trim()).map((i, idx) => (
              <p key={idx} className="text-sm text-navy italic">"{i.text}" {i.why && <span className="text-navy-light/50 not-italic">— {i.why}</span>}</p>
            ))}
          </Card>
        ))}
        {past.length === 0 && <EmptyState icon={<SketchLotus size={56} />} title="No past entries yet" />}
      </div>
    </div>
  );
};
