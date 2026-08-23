// Goals / Dream Board — longer-horizon aspirations (college, rank, personal)
// kept visible as a simple board, separate from the week-to-week targets.
// Per-student, localStorage-backed.

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e6)}`;
}

export type GoalCategory = 'admission' | 'rank' | 'personal' | 'other';

export const GOAL_CATEGORIES: Array<{ value: GoalCategory; label: string }> = [
  { value: 'admission', label: 'College / Admission' },
  { value: 'rank', label: 'Rank / Score' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  targetDate: string;
  description: string;
  achieved: boolean;
  createdAt: string;
}

function key(studentId: string) {
  return `goals_v1_${studentId}`;
}

export function listGoals(studentId: string): Goal[] {
  try {
    const raw = localStorage.getItem(key(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(studentId: string, goals: Goal[]) {
  localStorage.setItem(key(studentId), JSON.stringify(goals));
}

export function createGoal(studentId: string, data: Omit<Goal, 'id' | 'achieved' | 'createdAt'>): Goal {
  const goal: Goal = { ...data, id: uid('goal'), achieved: false, createdAt: new Date().toISOString() };
  save(studentId, [...listGoals(studentId), goal]);
  return goal;
}

export function toggleAchieved(studentId: string, id: string) {
  save(studentId, listGoals(studentId).map((g) => (g.id === id ? { ...g, achieved: !g.achieved } : g)));
}

export function deleteGoal(studentId: string, id: string) {
  save(studentId, listGoals(studentId).filter((g) => g.id !== id));
}
