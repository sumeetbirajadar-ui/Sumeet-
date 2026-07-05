import React, { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { Habit, HabitLog, InventoryItem, GroomingTaskLog } from '../../types';
import { useCollection } from '../../hooks/useCollection';
import { uid, nowISO, todayISO } from '../../db';
import { addDays, WEEKDAY_LABELS } from '../../utils/dates';
import { computeStreak } from '../../utils/discipline';
import { PageHeader, Card, Pill, EmptyState } from '../../components/ui/Layout';
import { Field, Input } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';

const SKINCARE_TASK_ID = 'skincare-am';

export const GroomingView: React.FC = () => {
  const { items: habits } = useCollection<Habit>('habits');
  const { items: logs } = useCollection<HabitLog>('habitLogs');
  const { items: inventory, save: saveInventory, remove: removeInventory } = useCollection<InventoryItem>('inventoryItems');
  const { items: groomingLogs, save: saveGroomingLog } = useCollection<GroomingTaskLog>('groomingLogs');
  const [addOpen, setAddOpen] = useState(false);

  const weeklyHabits = habits.filter((h) => h.category === 'Weekly Maintenance');
  const today = todayISO();
  const skincareToday = groomingLogs.find((g) => g.date === today && g.taskId === SKINCARE_TASK_ID);
  const skincareStreak = (() => {
    let s = 0; let cursor = today;
    while (groomingLogs.find((g) => g.date === cursor && g.taskId === SKINCARE_TASK_ID && g.done)) { s++; cursor = addDays(cursor, -1); }
    return s;
  })();

  const toggleSkincare = () => {
    saveGroomingLog({ id: skincareToday?.id ?? uid(), date: today, taskId: SKINCARE_TASK_ID, done: !skincareToday?.done });
  };

  const daysUntilRestock = (item: InventoryItem) => {
    if (!item.lastRestocked) return null;
    const dueDate = addDays(item.lastRestocked, item.restockEveryDays);
    return Math.round((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-28">
      <PageHeader eyebrow='"Sharpen the Saw"' title="Grooming & Personal Care" subtitle="Simple daily base, weekly maintenance, and restock reminders." />

      <Card className="mb-6 flex items-center gap-4">
        <button onClick={toggleSkincare} className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all ${skincareToday?.done ? 'bg-navy border-navy text-cream' : 'border-gold-soft text-gold'}`}>
          <Sparkles className="w-6 h-6" />
        </button>
        <div>
          <p className="font-bold text-navy text-sm">Daily Skincare (cleanse · moisturize · SPF)</p>
          <p className="text-xs text-navy-light/50">{skincareStreak > 0 ? `${skincareStreak}-day streak` : 'Tap to log today'} · under 5 minutes</p>
        </div>
      </Card>

      <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60 mb-2">Weekly Maintenance Calendar</h3>
      <Card className="mb-6">
        <div className="grid grid-cols-7 gap-1 mb-3">
          {WEEKDAY_LABELS.map((d) => <div key={d} className="text-center text-[10px] font-bold text-navy-light/40">{d}</div>)}
        </div>
        {weeklyHabits.map((h) => (
          <div key={h.id} className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-navy w-32 truncate shrink-0">{h.name}</span>
            <div className="grid grid-cols-7 gap-1 flex-1">
              {WEEKDAY_LABELS.map((_, i) => (
                <div key={i} className={`h-4 rounded ${h.weekDays?.includes(i) ? 'bg-gold' : 'bg-ivory-dark'}`} />
              ))}
            </div>
          </div>
        ))}
        {weeklyHabits.length === 0 && <p className="text-xs text-navy-light/50 italic">Add weekly maintenance habits in the Habits tab (beard dye, hair oil, face care, calls).</p>}
      </Card>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-navy-light/60">Supplies & Restock Reminders</h3>
        <button onClick={() => setAddOpen(true)} className="text-[11px] font-bold text-gold uppercase flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Add</button>
      </div>
      <Card className="!p-0 divide-y divide-gold-soft/60">
        {inventory.map((item) => {
          const daysLeft = daysUntilRestock(item);
          return (
            <div key={item.id} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy">{item.name}</p>
                <p className="text-xs text-navy-light/50">Every {item.restockEveryDays} days{item.lastRestocked ? ` · last: ${item.lastRestocked}` : ''}</p>
              </div>
              {daysLeft != null && <Pill tone={daysLeft <= 3 ? 'amber' : 'ghost'}>{daysLeft <= 0 ? 'Restock now' : `${daysLeft}d left`}</Pill>}
              <button onClick={() => saveInventory({ ...item, lastRestocked: today })} className="text-[11px] font-bold text-gold uppercase">Restocked</button>
              <button onClick={() => removeInventory(item.id)} className="text-navy-light/30 hover:text-amber-flag"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          );
        })}
        {inventory.length === 0 && <p className="p-4 text-sm text-navy-light/50 italic">No supplies tracked yet.</p>}
      </Card>

      <AddInventoryModal open={addOpen} onClose={() => setAddOpen(false)} onSave={async (i) => { await saveInventory(i); setAddOpen(false); }} />
    </div>
  );
};

const AddInventoryModal: React.FC<{ open: boolean; onClose: () => void; onSave: (i: InventoryItem) => void }> = ({ open, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [days, setDays] = useState(30);
  return (
    <Modal open={open} onClose={onClose} title="Add Supply">
      <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Razor blades, Haircut appointment" /></Field>
      <Field label="Restock every (days)" hint="Haircut/beard trim: 28-42 days is typical."><Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field>
      <button onClick={() => { if (!name.trim()) return; onSave({ id: uid(), name, category: 'Grooming', restockEveryDays: days }); setName(''); }} className="btn-gold w-full">Add</button>
    </Modal>
  );
};
