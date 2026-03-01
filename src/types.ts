import { LucideIcon } from 'lucide-react';

export interface Task {
  id: string;
  label: string;
  time?: string;
  completed: boolean;
  icon?: string;
  color?: string;
}

export interface DailyData {
  date: string;
  routine: {
    [key: string]: boolean;
  };
  todo: string[];
  expenses: { item: string; amount: string }[];
  reminders: string[];
  gratitude: string[];
  reflection: string[];
  sections: {
    xi_a: string[];
    xi_b: string[];
    kcet: string[];
    neet: string[];
  };
}

export interface WeeklyReview {
  weekStarting: string;
  wins: string[];
  challenges: string[];
  goalsNextWeek: string[];
  overallRating: number;
}

export interface AppState {
  daily: { [date: string]: DailyData };
  weekly: { [weekKey: string]: WeeklyReview };
}

export const INITIAL_ROUTINE_TASKS = [
  { id: 'college_work', label: 'Never done college work in home', icon: 'BookOpen', color: 'bg-amber-50 border-amber-200' },
  { id: 'wake_up', label: 'Wake up & Work', time: '4 AM', icon: 'Sun', color: 'bg-orange-50 border-orange-200' },
  { id: 'yoga', label: 'Yoga & Pranayam', time: '7-7:30 AM', icon: 'Wind', color: 'bg-emerald-50 border-emerald-200' },
  { id: 'boosters', label: 'Test boosters & Gut cleansers', icon: 'GlassWater', color: 'bg-blue-50 border-blue-200' },
  { id: 'work_session', label: 'Work', time: '4-7 AM', icon: 'Briefcase', color: 'bg-stone-50 border-stone-200' },
  { id: 'mcq', label: '100 MCQ solved', icon: 'CheckSquare', color: 'bg-yellow-50 border-yellow-200' },
];

export const EVENING_530_TASKS = [
  { id: 'bath_530', label: 'Take a bath', icon: 'Bath', color: 'bg-blue-50 border-blue-200' },
  { id: 'meditation', label: 'Meditation', time: '6-6:30 PM', icon: 'User', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'wife_530', label: 'Wife time / Other', time: '6:30-8:30 PM', icon: 'Heart', color: 'bg-rose-50 border-rose-200' },
  { id: 'study_530', label: 'Study / Content mgmt', time: '8:30-10 PM', icon: 'FileText', color: 'bg-slate-50 border-slate-200' },
];

export const EVENING_730_TASKS = [
  { id: 'bath_730', label: 'Take a bath', icon: 'Bath', color: 'bg-orange-50 border-orange-200' },
  { id: 'wife_730', label: 'Wife time / Other', time: '8-9 PM', icon: 'Heart', color: 'bg-rose-50 border-rose-200' },
  { id: 'study_730', label: 'Study / Content mgmt', time: '9-10 PM', icon: 'FileText', color: 'bg-slate-50 border-slate-200' },
];

export const WEEKLY_TASKS = [
  { id: 'hair_dye', label: 'Beard/Hair dye', days: '(Sun, Wed)', icon: 'UserCircle' },
  { id: 'face_care', label: 'Face/Personal Care', days: '(Sun, Thu, Mon)', icon: 'Smile' },
  { id: 'hair_oil', label: 'Hair oil/Massage', days: '(Sat, Tue)', icon: 'Droplets' },
  { id: 'calls', label: 'Calls', days: '(Sat, Sun)', icon: 'Phone' },
];
