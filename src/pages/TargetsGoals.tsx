import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Flag, Sparkle, Info } from 'lucide-react';
import {
  TargetPeriod,
  Target,
  listTargets,
  createTarget,
  updateTargetProgress,
  deleteTarget,
  activeTargets,
  targetPct,
} from '../lib/targets';
import { GoalCategory, GOAL_CATEGORIES, Goal, listGoals, createGoal, toggleAchieved, deleteGoal } from '../lib/goals';
import { EstimatorExam, ESTIMATOR_MAX_MARKS, RANK_ESTIMATE_DISCLAIMER, estimateRankBand } from '../lib/rankEstimator';
import { getOrCreateStudentId } from '../lib/studentIdentity';

function useForceUpdate() {
  const [, setTick] = useState(0);
  return () => setTick((t) => t + 1);
}

const TargetCard: React.FC<{ target: Target; onBump: (delta: number) => void; onDelete: () => void }> = ({ target, onBump, onDelete }) => {
  const pct = targetPct(target);
  const done = pct >= 100;
  return (
    <div className="bg-white border-2 border-ink-100 rounded-3xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-ink-900 text-sm truncate">{target.title}</p>
          <p className="text-xs text-ink-400">
            {target.metric} &middot; {target.currentValue}/{target.targetValue}
          </p>
        </div>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="h-2 bg-ink-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${done ? 'bg-sage-500' : 'bg-gold-400'}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onBump(-1)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold">
          −
        </button>
        <button onClick={() => onBump(1)} className="w-8 h-8 rounded-full bg-ink-100 text-ink-600 font-bold">
          +
        </button>
        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${done ? 'bg-sage-500 text-white' : 'bg-gold-50 text-gold-700'}`}>{pct}%</span>
      </div>
    </div>
  );
};

function TargetsPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [period, setPeriod] = useState<TargetPeriod>('weekly');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState('');
  const [targetValue, setTargetValue] = useState<number | ''>('');

  const targets = activeTargets(studentId, period);
  const completedCount = targets.filter((t) => targetPct(t) >= 100).length;

  function resetForm() {
    setTitle('');
    setMetric('');
    setTargetValue('');
    setShowForm(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !metric.trim() || targetValue === '') return;
    createTarget(studentId, { period, title: title.trim(), metric: metric.trim(), targetValue: Number(targetValue) });
    resetForm();
    forceUpdate();
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 justify-center">
        {(['weekly', 'monthly'] as TargetPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${period === p ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-ink-900">{targets.length}</p>
          <p className="text-xs text-ink-500 mt-0.5">Active this {period === 'weekly' ? 'week' : 'month'}</p>
        </div>
        <div className="bg-white border-2 border-ink-100 rounded-3xl p-4 text-center">
          <p className="text-2xl font-bold font-display text-sage-600">{completedCount}</p>
          <p className="text-xs text-ink-500 mt-0.5">Completed</p>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-3xl py-4 text-ink-500 font-semibold hover:border-gold-300"
        >
          <Plus className="w-4 h-4" /> Set a {period === 'weekly' ? 'Weekly' : 'Monthly'} Target
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-ink-100 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-ink-800">New {period === 'weekly' ? 'Weekly' : 'Monthly'} Target</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Solve 500 MCQs)" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="Unit (e.g. questions, hours)" className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
            <input
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Target value"
              className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl">
              Save Target
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-2xl text-ink-500 hover:bg-ink-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {targets.map((t) => (
          <TargetCard
            key={t.id}
            target={t}
            onBump={(delta) => {
              updateTargetProgress(studentId, t.id, t.currentValue + delta);
              forceUpdate();
            }}
            onDelete={() => {
              deleteTarget(studentId, t.id);
              forceUpdate();
            }}
          />
        ))}
        {targets.length === 0 && <p className="text-center text-sm text-ink-400 py-6">No targets set for this {period === 'weekly' ? 'week' : 'month'} yet.</p>}
      </div>
    </div>
  );
}

const GoalCard: React.FC<{ goal: Goal; onToggle: () => void; onDelete: () => void }> = ({ goal, onToggle, onDelete }) => {
  const catLabel = GOAL_CATEGORIES.find((c) => c.value === goal.category)?.label || goal.category;
  return (
    <div className={`bg-white border-2 rounded-3xl p-4 ${goal.achieved ? 'border-sage-300' : 'border-ink-100'}`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onToggle} className="flex items-start gap-3 flex-1 text-left">
          {goal.achieved ? <CheckCircle2 className="w-5 h-5 text-sage-500 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-ink-300 shrink-0 mt-0.5" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-gold-50 text-gold-700 px-2 py-0.5 rounded-full">{catLabel}</span>
              {goal.targetDate && <span className="text-xs text-ink-400">by {goal.targetDate}</span>}
            </div>
            <p className={`font-semibold text-sm ${goal.achieved ? 'text-ink-400 line-through' : 'text-ink-900'}`}>{goal.title}</p>
            {goal.description && <p className="text-xs text-ink-500 mt-1">{goal.description}</p>}
          </div>
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

function GoalsPanel() {
  const forceUpdate = useForceUpdate();
  const studentId = getOrCreateStudentId();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('admission');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [showEstimator, setShowEstimator] = useState(false);
  const [estimatorExam, setEstimatorExam] = useState<EstimatorExam>('NEET');
  const [estimatorMarks, setEstimatorMarks] = useState<number | ''>('');

  const goals = listGoals(studentId);

  function resetForm() {
    setTitle('');
    setTargetDate('');
    setDescription('');
    setShowForm(false);
    setShowEstimator(false);
    setEstimatorMarks('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createGoal(studentId, { title: title.trim(), category, targetDate, description: description.trim() });
    resetForm();
    forceUpdate();
  }

  return (
    <div className="space-y-6">
      <div className="bg-ink-900 text-white rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle className="w-4 h-4 text-gold-300" />
          <h2 className="font-bold text-sm uppercase tracking-wider text-gold-300">Dream Board</h2>
        </div>
        <p className="text-ink-200 text-sm">The bigger picture, always in view — the college, the rank, the person you're becoming.</p>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 rounded-3xl py-4 text-ink-500 font-semibold hover:border-gold-300"
        >
          <Plus className="w-4 h-4" /> Add a Goal
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-ink-100 rounded-3xl p-5 space-y-3">
          <h3 className="font-bold text-ink-800">New Goal</h3>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. Govt Medical College seat)" className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm bg-white">
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this matters to you" rows={2} className="w-full border-2 border-ink-200 rounded-2xl px-3 py-2 text-sm" />

          {category === 'rank' && (
            <div className="border-t border-ink-100 pt-3">
              {!showEstimator ? (
                <button type="button" onClick={() => setShowEstimator(true)} className="text-xs font-bold text-sage-600 underline">
                  Not sure what rank to target? Try the estimator
                </button>
              ) : (
                <div className="bg-ink-50 rounded-2xl p-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={estimatorExam} onChange={(e) => setEstimatorExam(e.target.value as EstimatorExam)} className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm bg-white">
                      <option value="NEET">NEET</option>
                      <option value="JEE Main">JEE Main</option>
                      <option value="KCET">KCET</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={ESTIMATOR_MAX_MARKS[estimatorExam]}
                      value={estimatorMarks}
                      onChange={(e) => setEstimatorMarks(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={`Marks out of ${ESTIMATOR_MAX_MARKS[estimatorExam]}`}
                      className="border-2 border-ink-200 rounded-2xl px-3 py-1.5 text-sm"
                    />
                  </div>
                  {estimatorMarks !== '' && (
                    <p className="text-sm font-semibold text-ink-800">Indicative band: {estimateRankBand(estimatorExam, Number(estimatorMarks))}</p>
                  )}
                  <p className="text-xs text-ink-400 flex items-start gap-1">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {RANK_ESTIMATE_DISCLAIMER}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold px-5 py-2 rounded-2xl">
              Save Goal
            </button>
            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-2xl text-ink-500 hover:bg-ink-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onToggle={() => {
              toggleAchieved(studentId, g.id);
              forceUpdate();
            }}
            onDelete={() => {
              deleteGoal(studentId, g.id);
              forceUpdate();
            }}
          />
        ))}
        {goals.length === 0 && <p className="col-span-2 text-center text-sm text-ink-400 py-6">Your dream board is empty — add your first goal.</p>}
      </div>
    </div>
  );
}

export default function TargetsGoals() {
  const [tab, setTab] = useState<'targets' | 'goals'>('targets');
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2 flex items-center justify-center gap-2">
          <Flag className="w-7 h-7 text-gold-500" /> Targets &amp; Goals
        </h1>
        <p className="text-ink-500 text-sm">Small weekly wins, and the bigger dream they're building toward.</p>
      </header>
      <div className="flex gap-2 mb-6 justify-center">
        <button onClick={() => setTab('targets')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${tab === 'targets' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          Targets
        </button>
        <button onClick={() => setTab('goals')} className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${tab === 'goals' ? 'bg-ink-800 text-white' : 'bg-ink-100 text-ink-500'}`}>
          Dream Board
        </button>
      </div>
      {tab === 'targets' ? <TargetsPanel /> : <GoalsPanel />}
    </div>
  );
}
