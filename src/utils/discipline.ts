import { Habit, HabitLog, Target, GratitudeEntry, SleepLog, DisciplineScoreBreakdown } from '../types';
import { isDueOnWeekday } from './dates';

/** A habit only counts as "missed" on a given date if it actually existed
 * and was due that day — otherwise a brand-new habit with zero history
 * would read as "missed" every single day, wrongly triggering the
 * Atomic Habits "never miss twice" banner from day one. */
export function wasHabitMissedOn(habit: Habit, date: string, logsForDate: HabitLog[]): boolean {
  if (habit.createdAt.slice(0, 10) > date) return false;
  const due = habit.frequency === 'daily' || (habit.frequency === 'weekly' && isDueOnWeekday(habit.weekDays, date));
  if (!due) return false;
  const log = logsForDate.find((l) => l.habitId === habit.id);
  return log?.status !== 'done';
}

export interface DisciplineInputs {
  date: string;
  weekKey: string;
  habits: Habit[];
  habitLogsForDate: HabitLog[];
  weeklyTargets: Target[];
  todaysSpend: number;
  dailyBudget: number;
  gratitudeEntry?: GratitudeEntry;
  sleepLog?: SleepLog;
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((numerator / denominator) * 100)));
}

export function computeDisciplineScore(input: DisciplineInputs): DisciplineScoreBreakdown {
  const dueHabits = input.habits.filter((h) => h.active && !h.isNegative &&
    (h.frequency === 'daily' || (h.frequency === 'weekly' && isDueOnWeekday(h.weekDays, input.date))));
  const logsById = new Map(input.habitLogsForDate.map((l) => [l.habitId, l]));
  let earned = 0;
  let possible = 0;
  dueHabits.forEach((h) => {
    const weight = h.isKeystone ? 2 : 1;
    possible += weight;
    const log = logsById.get(h.id);
    if (log?.status === 'done') earned += weight;
  });
  const habitsScore = pct(earned, possible);

  const mcqHabit = input.habits.find((h) => h.unit === 'MCQs');
  const mcqLog = mcqHabit ? logsById.get(mcqHabit.id) : undefined;
  const studyScore = mcqHabit ? pct(mcqLog?.count ?? 0, mcqHabit.targetCount ?? 100) : 100;

  const targetsScore = input.weeklyTargets.length
    ? pct(
        input.weeklyTargets.reduce((s, t) => s + Math.min(t.achievedValue, t.targetValue), 0),
        input.weeklyTargets.reduce((s, t) => s + t.targetValue, 0),
      )
    : 100;

  const budgetScore = input.dailyBudget > 0
    ? (input.todaysSpend <= input.dailyBudget ? 100 : pct(input.dailyBudget, input.todaysSpend))
    : 100;

  const reflectionScore = input.gratitudeEntry && input.gratitudeEntry.items.some((i) => i.text.trim())
    ? 100 : 0;

  const groomingDue = input.habits.filter((h) => h.category === 'Weekly Maintenance' && isDueOnWeekday(h.weekDays, input.date));
  const groomingScore = groomingDue.length
    ? pct(groomingDue.filter((h) => logsById.get(h.id)?.status === 'done').length, groomingDue.length)
    : 100;

  const sleepHours = input.sleepLog?.hours;
  const sleepScore = sleepHours == null ? 60 : (sleepHours >= 6 && sleepHours <= 8 ? 100 : pct(Math.min(sleepHours, 8), 7));

  const total = Math.round(
    habitsScore * 0.35 +
    studyScore * 0.20 +
    targetsScore * 0.15 +
    budgetScore * 0.10 +
    reflectionScore * 0.10 +
    groomingScore * 0.05 +
    sleepScore * 0.05,
  );

  return {
    habits: habitsScore, study: studyScore, targets: targetsScore, budget: budgetScore,
    reflection: reflectionScore, grooming: groomingScore, sleep: sleepScore, total,
  };
}

export function computeStreak(habitId: string, allLogs: HabitLog[], todayISO: string): number {
  const logsByDate = new Map(allLogs.filter((l) => l.habitId === habitId).map((l) => [l.date, l]));
  let streak = 0;
  let cursor = todayISO;
  // If today isn't logged yet, start counting from yesterday so an
  // in-progress day doesn't zero out an existing streak.
  if (logsByDate.get(cursor)?.status !== 'done') {
    const d = new Date(cursor); d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split('T')[0];
  }
  while (logsByDate.get(cursor)?.status === 'done') {
    streak += 1;
    const d = new Date(cursor); d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split('T')[0];
  }
  return streak;
}
