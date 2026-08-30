/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  Moon, 
  Calendar, 
  CheckCircle2, 
  Layout, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  Trash2,
  Heart,
  DollarSign,
  Bell,
  BookOpen,
  Wind,
  GlassWater,
  Briefcase,
  CheckSquare,
  Bath,
  User,
  FileText,
  UserCircle,
  Smile,
  Droplets,
  Phone,
  TrendingUp,
  Target,
  Trophy,
  Star,
  BarChart3
} from 'lucide-react';
import {
  DailyData,
  WeeklyReview,
  AppState,
  INITIAL_ROUTINE_TASKS,
  EVENING_530_TASKS,
  EVENING_730_TASKS,
  WEEKLY_TASKS
} from './types';
// Route-level code splitting: these pages (especially Predictor, which pulls
// in every course's cutoff dataset — well over a megabyte of JSON) used to
// be bundled into the app's single startup chunk, so a student opening the
// login screen or the syllabus tracker paid the download+parse cost of data
// they may never look at. Lazy-loading means each page's own chunk is only
// fetched when its tab is actually opened.
const Predictor = lazy(() => import('./pages/Predictor'));
const CareerGuidance = lazy(() => import('./pages/CareerGuidance'));
const Admin = lazy(() => import('./pages/Admin'));
import StudentHome from './pages/StudentHome';
const StudentLMS = lazy(() => import('./pages/StudentLMS'));
import {
  GraduationCap as NavPredictorIcon,
  Compass as NavCareerIcon,
  ShieldCheck as NavAdminIcon,
  Home as NavHomeIcon,
  Video as NavLmsIcon,
  ClipboardCheck as NavCounsellingIcon,
} from 'lucide-react';
const Counselling = lazy(() => import('./pages/Counselling'));
const SyllabusTracker = lazy(() => import('./pages/SyllabusTracker'));
const HabitsFocus = lazy(() => import('./pages/HabitsFocus'));
const Performance = lazy(() => import('./pages/Performance'));
const TargetsGoals = lazy(() => import('./pages/TargetsGoals'));
const WellbeingCare = lazy(() => import('./pages/WellbeingCare'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsBackup = lazy(() => import('./pages/SettingsBackup'));
import PomodoroTimer from './components/PomodoroTimer';
import { latestActivityAt, subscribeClasses, subscribeContent, LiveClass, ContentItem } from './lib/lms';
import { getLmsLastSeen, markLmsSeen, getOrCreateStudentId, setStudentUid } from './lib/studentIdentity';
import { logoutStudent, registerStudent, loginStudent, sendStudentPasswordReset, isAllowedAdmin } from './lib/studentAuth';
import { pushStudentDataToCloud, pullStudentDataFromCloud, migrateLocalDataToUid } from './lib/cloudSync';

type Role = 'admin' | 'student';
type View = 'home' | 'routine' | 'planner' | 'weekly' | 'predictor' | 'career' | 'admin' | 'lms' | 'counselling' | 'tracker' | 'habitsFocus' | 'performance' | 'targetsGoals' | 'wellbeingCare' | 'reports' | 'settingsBackup';

const iconMap: Record<string, React.ReactNode> = {
  Sun: <Sun className="w-5 h-5" />,
  Moon: <Moon className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  Wind: <Wind className="w-5 h-5" />,
  GlassWater: <GlassWater className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  CheckSquare: <CheckSquare className="w-5 h-5" />,
  Bath: <Bath className="w-5 h-5" />,
  User: <User className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  UserCircle: <UserCircle className="w-5 h-5" />,
  Smile: <Smile className="w-5 h-5" />,
  Droplets: <Droplets className="w-5 h-5" />,
  Phone: <Phone className="w-5 h-5" />,
};

// The same deployment serves three ways depending on ?mode= in the URL, so
// wrapping this site in two separate Android WebView shells later gives two
// genuinely separate apps without needing two separate web deployments:
// ?mode=admin -> admin-only login, no student option at all
// ?mode=student -> student-only login, no admin option at all
// (no param) -> today's combined login with both options, for this trial
export type AppMode = 'admin' | 'student' | 'combined';

function getAppMode(): AppMode {
  const param = new URLSearchParams(window.location.search).get('mode');
  return param === 'admin' || param === 'student' ? param : 'combined';
}

// A faint, fixed, click-through logo behind every screen (login included).
// Kept deliberately subtle (low opacity, no interaction) so it never competes
// with real content — it's a mark of origin, not a design element.
const Watermark: React.FC = () => (
  <div
    aria-hidden="true"
    className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none select-none"
  >
    <img
      src="/branding/science-monk-logo.png"
      alt=""
      className="w-[55vmin] h-[55vmin] object-contain opacity-[0.04] grayscale"
    />
  </div>
);

const PageLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-2 border-ink-200 border-t-gold-400 rounded-full animate-spin" />
  </div>
);

export default function App() {
  const [appMode] = useState<AppMode>(() => getAppMode());
  // A locked mode (?mode=admin / ?mode=student) never honours a stale session
  // for the other role — e.g. someone who once logged into the combined
  // trial link as admin must still get the student-only login on ?mode=student.
  const storedRole = localStorage.getItem('app_role') as Role | null;
  const roleMatchesMode = appMode === 'combined' || storedRole === appMode;
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return roleMatchesMode && localStorage.getItem('is_authenticated') === 'true';
  });
  const [role, setRole] = useState<Role>(() => {
    if (appMode !== 'combined') return appMode;
    return storedRole || 'student';
  });
  const [view, setView] = useState<View>(() => {
    const initialRole = appMode !== 'combined' ? appMode : storedRole || 'student';
    return initialRole === 'admin' ? 'routine' : 'home';
  });
  const [arrivalPath, setArrivalPath] = useState<'530' | '730'>('530');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);

  // Each student (and the admin) gets their own routine/planner/review data —
  // this used to be a single shared record when the app only served Sumeet.
  const identityKey = role === 'admin' ? 'admin' : getOrCreateStudentId();
  const stateStorageKey = `daily_tracker_app_state_${identityKey}`;

  const loadState = (key: string): AppState => {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    return { daily: {}, weekly: {} };
  };

  const [state, setState] = useState<AppState>(() => loadState(stateStorageKey));

  useEffect(() => {
    setState(loadState(stateStorageKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateStorageKey]);

  const [lmsClasses, setLmsClasses] = useState<LiveClass[]>([]);
  const [lmsContent, setLmsContent] = useState<ContentItem[]>([]);
  useEffect(() => subscribeClasses(setLmsClasses), []);
  useEffect(() => subscribeContent(setLmsContent), []);

  const handleLogin = (nextRole: Role) => {
    setIsAuthenticated(true);
    setRole(nextRole);
    setView(nextRole === 'admin' ? 'routine' : 'home');
    localStorage.setItem('is_authenticated', 'true');
    localStorage.setItem('app_role', nextRole);
  };

  const handleLogout = () => {
    if (role === 'student') {
      // The save that matters: push whatever's currently in localStorage to
      // the cloud before the session ends, so logging back in (anywhere)
      // picks up exactly this. No ticking timer — see the effect below.
      pushStudentDataToCloud(getOrCreateStudentId());
      logoutStudent();
    }
    setIsAuthenticated(false);
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('app_role');
  };

  // No periodic autosave — saving is event-driven, not timer-driven. A
  // save fires on logout (above) and whenever the student leaves the app
  // (locks the phone, switches app, closes the tab) via visibilitychange,
  // which covers the realistic "forgot to tap Logout" case too, without
  // ever writing to Firestore on a fixed interval.
  useEffect(() => {
    if (!isAuthenticated || role !== 'student') return;
    const uid = getOrCreateStudentId();
    const onHide = () => {
      if (document.visibilityState === 'hidden') pushStudentDataToCloud(uid);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [isAuthenticated, role]);

  const getDayData = (date: string): DailyData => {
    return state.daily[date] || {
      date,
      routine: {},
      todo: Array(10).fill(''),
      expenses: Array(5).fill({ item: '', amount: '' }),
      reminders: Array(5).fill(''),
      gratitude: Array(3).fill(''),
      reflection: Array(2).fill(''),
      sections: {
        xi_a: Array(4).fill(''),
        xi_b: Array(4).fill(''),
        kcet: Array(4).fill(''),
        neet: Array(4).fill(''),
      }
    };
  };

  const currentData = getDayData(currentDate);

  useEffect(() => {
    localStorage.setItem(stateStorageKey, JSON.stringify(state));
  }, [state, stateStorageKey]);

  useEffect(() => {
    if (role === 'student' && view === 'lms') markLmsSeen();
  }, [role, view]);

  const updateDailyData = (date: string, newData: DailyData) => {
    setState(prev => ({
      ...prev,
      daily: { ...prev.daily, [date]: newData }
    }));
  };

  const toggleRoutine = (id: string) => {
    const newData = { ...currentData };
    newData.routine = { ...newData.routine, [id]: !newData.routine[id] };
    updateDailyData(currentDate, newData);
  };

  const updateField = (section: keyof DailyData, index: number, value: any) => {
    const newData = { ...currentData };
    if (Array.isArray(newData[section])) {
      (newData[section] as any)[index] = value;
    }
    updateDailyData(currentDate, newData);
  };

  const updateSectionField = (section: keyof DailyData['sections'], index: number, value: string) => {
    const newData = { ...currentData };
    newData.sections = {
      ...newData.sections,
      [section]: newData.sections[section].map((item, i) => i === index ? value : item)
    };
    updateDailyData(currentDate, newData);
  };

  const getWeekKey = (date: string) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const currentWeekKey = getWeekKey(currentDate);

  const getWeeklyReview = (weekKey: string): WeeklyReview => {
    return state.weekly[weekKey] || {
      weekStarting: weekKey,
      wins: Array(3).fill(''),
      challenges: Array(3).fill(''),
      goalsNextWeek: Array(3).fill(''),
      overallRating: 0
    };
  };

  const currentWeeklyReview = getWeeklyReview(currentWeekKey);

  const updateWeeklyReview = (weekKey: string, newData: WeeklyReview) => {
    setState(prev => ({
      ...prev,
      weekly: { ...prev.weekly, [weekKey]: newData }
    }));
  };

  const getWeeklyStats = () => {
    const weekDates = [];
    const start = new Date(currentWeekKey);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    const allRoutineTasks = [
      ...INITIAL_ROUTINE_TASKS,
      ...EVENING_530_TASKS,
      ...EVENING_730_TASKS,
      ...WEEKLY_TASKS
    ];

    const stats = allRoutineTasks.map(task => {
      let completedCount = 0;
      weekDates.forEach(date => {
        if (state.daily[date]?.routine[task.id]) completedCount++;
      });
      return {
        label: task.label,
        count: completedCount,
        percentage: Math.round((completedCount / 7) * 100)
      };
    });

    let totalExpenses = 0;
    weekDates.forEach(date => {
      const dayData = state.daily[date];
      if (dayData) {
        dayData.expenses.forEach(exp => {
          totalExpenses += parseFloat(exp.amount) || 0;
        });
      }
    });

    const gratitudeHighlights = weekDates
      .map(date => state.daily[date]?.gratitude.filter(g => g.trim() !== ''))
      .flat()
      .filter(Boolean) as string[];

    return { stats, totalExpenses, gratitudeHighlights };
  };

  const { stats, totalExpenses, gratitudeHighlights } = getWeeklyStats();

  if (!isAuthenticated) {
    return <Login mode={appMode} onLogin={handleLogin} />;
  }

  const adminOnlyViews: View[] = ['admin', 'routine', 'planner', 'weekly'];
  const studentOnlyViews: View[] = ['predictor', 'career'];
  const effectiveView: View =
    role === 'student' && adminOnlyViews.includes(view)
      ? 'home'
      : role === 'admin' && studentOnlyViews.includes(view)
        ? 'routine'
        : view;
  const hasLmsUpdates = role === 'student' && latestActivityAt(lmsClasses, lmsContent) > getLmsLastSeen();

  const RoutineView = () => (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">My Daily Journey & Routine - 2026</h1>
        <div className="flex justify-center items-center gap-4 text-ink-500">
          <button onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() - 1);
            setCurrentDate(d.toISOString().split('T')[0]);
          }} className="p-1 hover:bg-ink-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{new Date(currentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button onClick={() => {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + 1);
            setCurrentDate(d.toISOString().split('T')[0]);
          }} className="p-1 hover:bg-ink-200 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-col items-center space-y-6">
        {/* Morning Kickstart */}
        <div className="flex flex-col items-center w-full">
          <div className="bg-gold-100 text-gold-900 px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider mb-6 shadow-sm border border-gold-200">
            Morning Kickstart (3:40 AM)
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {INITIAL_ROUTINE_TASKS.slice(0, 3).map(task => (
              <RoutineNode key={task.id} task={task} completed={!!currentData.routine[task.id]} onToggle={() => toggleRoutine(task.id)} />
            ))}
          </div>
          
          <div className="h-8 w-0.5 bg-ink-300 my-2"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {INITIAL_ROUTINE_TASKS.slice(3).map(task => (
              <RoutineNode key={task.id} task={task} completed={!!currentData.routine[task.id]} onToggle={() => toggleRoutine(task.id)} />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center py-4">
          <div className="bg-ink-800 text-white px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg">
            Work Day
          </div>
          <div className="h-12 w-0.5 bg-ink-300"></div>
          
          <div className="relative w-full max-w-md flex justify-between items-start">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-12 flex justify-center">
              <svg className="w-full h-full" viewBox="0 0 200 50" fill="none">
                <path d="M100 0 C100 25 20 25 20 50" stroke="#cbd5e1" strokeWidth="2" />
                <path d="M100 0 C100 25 180 25 180 50" stroke="#cbd5e1" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Evening Arrival */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
          {/* 5:30 PM Path */}
          <div className={`flex flex-col items-center space-y-4 transition-opacity duration-300 ${arrivalPath === '730' ? 'opacity-40' : 'opacity-100'}`}>
            <button 
              onClick={() => setArrivalPath('530')}
              className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider border-2 transition-all ${arrivalPath === '530' ? 'bg-sage-100 border-sage-300 text-sage-900' : 'bg-white border-ink-200 text-ink-400'}`}
            >
              Came Home at 5:30 PM
            </button>
            <div className="flex flex-col items-center space-y-4 w-full">
              {EVENING_530_TASKS.map(task => (
                <RoutineNode key={task.id} task={task} completed={!!currentData.routine[task.id]} onToggle={() => toggleRoutine(task.id)} />
              ))}
            </div>
          </div>

          {/* 7:30 PM Path */}
          <div className={`flex flex-col items-center space-y-4 transition-opacity duration-300 ${arrivalPath === '530' ? 'opacity-40' : 'opacity-100'}`}>
            <button 
              onClick={() => setArrivalPath('730')}
              className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider border-2 transition-all ${arrivalPath === '730' ? 'bg-orange-100 border-orange-300 text-orange-900' : 'bg-white border-ink-200 text-ink-400'}`}
            >
              Came Home at 7:30 PM
            </button>
            <div className="flex flex-col items-center space-y-4 w-full">
              {EVENING_730_TASKS.map(task => (
                <RoutineNode key={task.id} task={task} completed={!!currentData.routine[task.id]} onToggle={() => toggleRoutine(task.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* Daily Reflection */}
        <div className="w-full mt-12 pt-8 border-t border-ink-200">
          <div className="bg-ink-100 text-ink-600 px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest mb-6 inline-block">
            Daily Reflection
          </div>
          <div className="bg-white p-6 rounded-3xl border-2 border-ink-200 shadow-sm">
            <p className="text-sm font-bold text-ink-700 mb-4 italic">If tasks not done (Reason):</p>
            <div className="space-y-4">
              {currentData.reflection.map((reason, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-ink-400 font-bold">{i + 1})</span>
                  <input 
                    type="text" 
                    value={reason}
                    onChange={(e) => updateField('reflection', i, e.target.value)}
                    className="flex-1 border-b border-ink-200 focus:border-ink-400 outline-none py-1 transition-colors bg-transparent"
                    placeholder="Type reason here..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weekly Maintenance */}
        <div className="w-full mt-12 bg-ink-100 p-8 rounded-[40px] border-2 border-ink-200">
          <div className="text-center mb-8">
            <div className="bg-white px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest inline-block border border-ink-200 shadow-sm">
              Weekly Maintenance Station
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {WEEKLY_TASKS.map(task => (
              <div key={task.id} className="flex items-center justify-between bg-white p-4 rounded-3xl border border-ink-200 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-ink-50 rounded-2xl text-ink-600">
                    {iconMap[task.icon || '']}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-ink-800">{task.label}</p>
                    <p className="text-xs text-ink-400 font-medium">{task.days}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleRoutine(task.id)}
                  className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center ${currentData.routine[task.id] ? 'bg-ink-800 border-ink-800 text-white' : 'bg-white border-ink-300'}`}
                >
                  {currentData.routine[task.id] && <CheckCircle2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const PlannerView = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden border border-ink-200 min-h-[1000px] flex flex-col relative">
        {/* Decorative Paper Clips and Plants */}
        <div className="absolute top-4 right-8 opacity-20 rotate-12">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </div>

        <div className="p-12 flex-1">
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-4">
              <span className="text-ink-500 font-medium">Date:</span>
              <input 
                type="text" 
                value={currentData.date}
                onChange={(e) => updateDailyData(currentDate, { ...currentData, date: e.target.value })}
                className="border-b-2 border-ink-200 focus:border-ink-400 outline-none px-2 py-1 font-medium text-ink-700 bg-transparent"
              />
            </div>
            <div className="text-right italic text-ink-400 text-sm">
              "Gratitude turns what we have into enough."
            </div>
          </div>

          <div className="mb-12 flex justify-center">
            <PomodoroTimer storageKey={`pomodoro_sessions_${identityKey}`} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* To Do List */}
            <div className="space-y-4">
              <div className="bg-sage-100 text-sage-900 px-4 py-2 rounded-lg font-bold text-center text-sm uppercase tracking-wider">
                To do list
              </div>
              <div className="space-y-2">
                {currentData.todo.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-ink-300">•</span>
                    <input 
                      type="text" 
                      value={item}
                      onChange={(e) => updateField('todo', i, e.target.value)}
                      className="planner-input text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-4">
              <div className="bg-sage-100 text-sage-900 px-4 py-2 rounded-lg font-bold text-center text-sm uppercase tracking-wider">
                Expenses
              </div>
              <div className="space-y-2">
                {currentData.expenses.map((exp, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={exp.item}
                      onChange={(e) => updateField('expenses', i, { ...exp, item: e.target.value })}
                      className="planner-input text-sm flex-1"
                      placeholder="Item"
                    />
                    <input 
                      type="text" 
                      value={exp.amount}
                      onChange={(e) => updateField('expenses', i, { ...exp, amount: e.target.value })}
                      className="planner-input text-sm w-16 text-right"
                      placeholder="0.00"
                    />
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center border-t border-ink-200">
                  <span className="font-bold text-ink-500 text-sm">Total:</span>
                  <span className="font-bold text-ink-800 text-sm">
                    {currentData.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reminders */}
            <div className="space-y-4">
              <div className="bg-sage-100 text-sage-900 px-4 py-2 rounded-lg font-bold text-center text-sm uppercase tracking-wider">
                Reminders
              </div>
              <div className="space-y-2">
                {currentData.reminders.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={item}
                      onChange={(e) => updateField('reminders', i, e.target.value)}
                      className="planner-input text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Gratitude */}
          <div className="mb-12 space-y-4">
            <div className="bg-sage-100 text-sage-900 px-4 py-2 rounded-lg font-bold text-center text-sm uppercase tracking-wider w-full">
              Daily Gratitude
            </div>
            <div className="space-y-4">
              {currentData.gratitude.map((item, i) => (
                <input 
                  key={i}
                  type="text" 
                  value={item}
                  onChange={(e) => updateField('gratitude', i, e.target.value)}
                  className="planner-input text-base italic"
                  placeholder={`I am grateful for...`}
                />
              ))}
            </div>
          </div>

          {/* Academic Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AcademicSection title="XI - A" items={currentData.sections.xi_a} onUpdate={(i, v) => updateSectionField('xi_a', i, v)} />
            <AcademicSection title="KCET" items={currentData.sections.kcet} onUpdate={(i, v) => updateSectionField('kcet', i, v)} />
            <AcademicSection title="XI - B" items={currentData.sections.xi_b} onUpdate={(i, v) => updateSectionField('xi_b', i, v)} />
            <AcademicSection title="NEET" items={currentData.sections.neet} onUpdate={(i, v) => updateSectionField('neet', i, v)} />
          </div>
        </div>
      </div>
    </div>
  );

  const WeeklyReviewView = () => (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Weekly Review & Reflection</h1>
        <div className="flex justify-center items-center gap-4 text-ink-500">
          <button onClick={() => {
            const d = new Date(currentWeekKey);
            d.setDate(d.getDate() - 7);
            setCurrentDate(d.toISOString().split('T')[0]);
          }} className="p-1 hover:bg-ink-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Week of {new Date(currentWeekKey).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
          </div>
          <button onClick={() => {
            const d = new Date(currentWeekKey);
            d.setDate(d.getDate() + 7);
            setCurrentDate(d.toISOString().split('T')[0]);
          }} className="p-1 hover:bg-ink-200 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Highlights */}
        <div className="lg:col-span-1 space-y-8">
          {/* Routine Consistency */}
          <div className="bg-white p-6 rounded-3xl border-2 border-ink-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-ink-700">Routine Consistency</h2>
            </div>
            <div className="space-y-4">
              {stats.filter(s => s.count > 0).slice(0, 5).map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-ink-600">
                    <span>{stat.label}</span>
                    <span>{stat.percentage}%</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      className="h-full bg-gold-400"
                    />
                  </div>
                </div>
              ))}
              {stats.filter(s => s.count > 0).length === 0 && (
                <p className="text-xs text-ink-400 italic">No routine data for this week yet.</p>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-emerald-900">Weekly Spending</h2>
            </div>
            <p className="text-3xl font-bold text-emerald-900">${totalExpenses.toFixed(2)}</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">Total expenses recorded this week</p>
          </div>

          {/* Gratitude Highlights */}
          <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-500" />
              <h2 className="font-bold text-sm uppercase tracking-wider text-rose-900">Gratitude Highlights</h2>
            </div>
            <div className="space-y-3">
              {gratitudeHighlights.slice(0, 3).map((g, i) => (
                <p key={i} className="text-sm italic text-rose-800 leading-relaxed">"{g}"</p>
              ))}
              {gratitudeHighlights.length === 0 && (
                <p className="text-xs text-rose-400 italic">No gratitude entries yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Review Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border-2 border-ink-200 shadow-xl relative overflow-hidden">
            {/* Decorative Icon */}
            <div className="absolute -top-4 -right-4 opacity-5">
              <Trophy className="w-32 h-32" />
            </div>

            <div className="space-y-8">
              {/* Wins Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gold-100 rounded-2xl text-gold-600">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-ink-800">Biggest Wins</h3>
                </div>
                <div className="space-y-3">
                  {currentWeeklyReview.wins.map((win, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-gold-400 font-bold">#</span>
                      <input 
                        type="text" 
                        value={win}
                        onChange={(e) => {
                          const newWins = [...currentWeeklyReview.wins];
                          newWins[i] = e.target.value;
                          updateWeeklyReview(currentWeekKey, { ...currentWeeklyReview, wins: newWins });
                        }}
                        className="flex-1 border-b border-ink-100 focus:border-gold-200 outline-none py-2 transition-colors bg-transparent text-ink-700"
                        placeholder="What went well?"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Challenges Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-ink-100 rounded-2xl text-ink-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-ink-800">Challenges & Lessons</h3>
                </div>
                <div className="space-y-3">
                  {currentWeeklyReview.challenges.map((challenge, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-ink-300 font-bold">!</span>
                      <input 
                        type="text" 
                        value={challenge}
                        onChange={(e) => {
                          const newChallenges = [...currentWeeklyReview.challenges];
                          newChallenges[i] = e.target.value;
                          updateWeeklyReview(currentWeekKey, { ...currentWeeklyReview, challenges: newChallenges });
                        }}
                        className="flex-1 border-b border-ink-100 focus:border-ink-300 outline-none py-2 transition-colors bg-transparent text-ink-700"
                        placeholder="What was difficult?"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Goals Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-sage-100 rounded-2xl text-sage-600">
                    <Target className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-ink-800">Goals for Next Week</h3>
                </div>
                <div className="space-y-3">
                  {currentWeeklyReview.goalsNextWeek.map((goal, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-sage-400"></div>
                      <input 
                        type="text" 
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...currentWeeklyReview.goalsNextWeek];
                          newGoals[i] = e.target.value;
                          updateWeeklyReview(currentWeekKey, { ...currentWeeklyReview, goalsNextWeek: newGoals });
                        }}
                        className="flex-1 border-b border-ink-100 focus:border-sage-200 outline-none py-2 transition-colors bg-transparent text-ink-700"
                        placeholder="What's next?"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Weekly Rating */}
              <section className="pt-8 border-t border-ink-100">
                <div className="flex flex-col items-center gap-4">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-ink-400">Overall Week Rating</h3>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => updateWeeklyReview(currentWeekKey, { ...currentWeeklyReview, overallRating: star })}
                        className={`p-2 transition-all ${currentWeeklyReview.overallRating >= star ? 'text-gold-400 scale-110' : 'text-ink-200 hover:text-ink-300'}`}
                      >
                        <Star className={`w-8 h-8 ${currentWeeklyReview.overallRating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-dvh flex flex-col bg-ink-50 relative">
      <Watermark />
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={<PageLoadingFallback />}>
              {effectiveView === 'home' && <StudentHome onNavigate={(v) => setView(v)} />}
              {effectiveView === 'routine' && <RoutineView />}
              {effectiveView === 'planner' && <PlannerView />}
              {effectiveView === 'weekly' && <WeeklyReviewView />}
              {effectiveView === 'predictor' && <Predictor />}
              {effectiveView === 'career' && <CareerGuidance />}
              {effectiveView === 'admin' && <Admin />}
              {effectiveView === 'lms' && <StudentLMS />}
              {effectiveView === 'counselling' && <Counselling />}
              {effectiveView === 'tracker' && <SyllabusTracker />}
              {effectiveView === 'habitsFocus' && <HabitsFocus />}
              {effectiveView === 'performance' && <Performance />}
              {effectiveView === 'targetsGoals' && <TargetsGoals />}
              {effectiveView === 'wellbeingCare' && <WellbeingCare />}
              {effectiveView === 'reports' && <ReportsPage />}
              {effectiveView === 'settingsBackup' && <SettingsBackup />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Bar */}
      <div className="shrink-0 flex justify-center pt-2 pb-6 px-4 bg-ink-50">
      <div className="bg-ink-900/90 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-50 max-w-full overflow-x-auto">
        {role === 'student' && (
          <>
            <button
              onClick={() => setView('home')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'home' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <NavHomeIcon className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Home</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
            <button
              onClick={() => setView('lms')}
              className={`relative flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'lms' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <span className="relative">
                <NavLmsIcon className="w-5 h-5" />
                {hasLmsUpdates && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />}
              </span>
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Learn</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
            <button
              onClick={() => setView('counselling')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'counselling' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <NavCounsellingIcon className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Counselling</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
          </>
        )}
        {role === 'admin' && (
          <>
            <button
              onClick={() => setView('routine')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'routine' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <Layout className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">My Day</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
            <button
              onClick={() => setView('planner')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'planner' ? 'text-sage-400' : 'text-ink-400 hover:text-white'}`}
            >
              <Calendar className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Planner</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
            <button
              onClick={() => setView('weekly')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'weekly' ? 'text-emerald-400' : 'text-ink-400 hover:text-white'}`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Review</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
            <button
              onClick={() => setView('admin')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'admin' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <NavAdminIcon className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Admin</span>
            </button>
          </>
        )}
        {role === 'student' && (
          <>
            <button
              onClick={() => setView('predictor')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'predictor' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <NavPredictorIcon className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Predictor</span>
            </button>
            <div className="w-px h-6 bg-ink-700 shrink-0"></div>
            <button
              onClick={() => setView('career')}
              className={`flex items-center gap-2 transition-colors shrink-0 ${effectiveView === 'career' ? 'text-gold-400' : 'text-ink-400 hover:text-white'}`}
            >
              <NavCareerIcon className="w-5 h-5" />
              <span className="hidden md:inline font-bold text-sm uppercase tracking-wider">Career</span>
            </button>
          </>
        )}
        <div className="w-px h-6 bg-ink-700 shrink-0"></div>
        <button
          onClick={handleLogout}
          className="text-ink-400 hover:text-rose-400 transition-colors p-2 shrink-0"
          title="Logout"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      </div>
    </div>
  );
}

const Login: React.FC<{ mode: AppMode; onLogin: (role: 'admin' | 'student') => void }> = ({ mode: lockedMode, onLogin }) => {
  const [mode, setMode] = useState<'admin' | 'student'>(lockedMode === 'admin' ? 'admin' : 'student');
  const showToggle = lockedMode === 'combined';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentAuthMode, setStudentAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentAuth = async () => {
    if (studentAuthMode === 'register') {
      if (studentName.trim().length === 0) return setError('Please enter your name');
      if (!email.trim()) return setError('Please enter your email');
      if (password.length < 6) return setError('Password should be at least 6 characters');
      if (password !== confirmPassword) return setError('Passwords do not match');

      setIsLoading(true);
      const oldLocalId = getOrCreateStudentId();
      const result = await registerStudent(studentName, email, password);
      if (!result.success || !result.uid) {
        setError(result.error || 'Could not create account');
        setIsLoading(false);
        return;
      }
      migrateLocalDataToUid(oldLocalId, result.uid);
      setStudentUid(result.uid);
      localStorage.setItem('student_name', studentName.trim());
      await pushStudentDataToCloud(result.uid);
      onLogin('student');
      return;
    }

    if (!email.trim() || !password) return setError('Please enter your email and password');
    setIsLoading(true);
    const result = await loginStudent(email, password);
    if (!result.success || !result.uid) {
      setError(result.error || 'Could not log in');
      setIsLoading(false);
      return;
    }
    setStudentUid(result.uid);
    await pullStudentDataFromCloud(result.uid);
    onLogin('student');
  };

  const handleForgotPassword = async () => {
    setError('');
    setInfo('');
    if (!email.trim()) {
      setError('Enter your email above first, then tap "Forgot password?"');
      return;
    }
    const result = await sendStudentPasswordReset(email);
    if (result.success) setInfo('Password reset link sent — check your email.');
    else setError(result.error || 'Could not send reset email');
  };

  const handleAdminAuth = async () => {
    if (!username.trim() || !password) return setError('Please enter your email and password');
    setIsLoading(true);
    const result = await loginStudent(username, password); // same Firebase email/password sign-in as students
    if (!result.success || !result.uid) {
      setError(result.error || 'Could not log in');
      setIsLoading(false);
      return;
    }
    const allowed = await isAllowedAdmin(result.uid);
    if (!allowed) {
      await logoutStudent();
      setError('This account is signed in, but is not authorized as an admin.');
      setIsLoading(false);
      return;
    }
    onLogin('admin');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (mode === 'student') {
      handleStudentAuth();
    } else {
      handleAdminAuth();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-950 relative overflow-hidden">
      <Watermark />
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-full h-full bg-gold-500/20 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-sage-500/20 blur-[120px] rounded-full"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-2xl">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-4 mb-6"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg bg-white shrink-0">
                <img src="/branding/science-monk-logo.png" alt="Science Monk Academy" className="w-full h-full object-cover" />
              </div>
              <img
                src="/branding/founder-photo.png"
                alt="Sumeet Birajadar, Founder"
                className="w-20 h-24 rounded-2xl object-cover object-top shadow-lg shrink-0"
              />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tight font-display mb-2">Welcome</h1>
            <p className="text-ink-400 text-sm">
              {mode === 'student' ? 'Sign in to your KCET prep hub' : 'Sign in to your daily journey'}
            </p>
          </div>

          {showToggle && (
            <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-3xl">
              <button
                type="button"
                onClick={() => { setMode('student'); setError(''); }}
                className={`flex-1 py-2 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all ${mode === 'student' ? 'bg-gold-400 text-ink-900' : 'text-ink-400'}`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => { setMode('admin'); setError(''); }}
                className={`flex-1 py-2 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all ${mode === 'admin' ? 'bg-gold-400 text-ink-900' : 'text-ink-400'}`}
              >
                Admin
              </button>
            </div>
          )}
          {!showToggle && (
            <div className="mb-8 text-center">
              <span className="inline-flex items-center gap-1.5 bg-white/5 text-ink-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                {mode === 'admin' ? 'Admin App' : 'Student App'}
              </span>
            </div>
          )}

          {mode === 'student' && (
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-3xl">
              <button
                type="button"
                onClick={() => { setStudentAuthMode('login'); setError(''); setInfo(''); }}
                className={`flex-1 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${studentAuthMode === 'login' ? 'bg-white/15 text-white' : 'text-ink-400'}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setStudentAuthMode('register'); setError(''); setInfo(''); }}
                className={`flex-1 py-1.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${studentAuthMode === 'register' ? 'bg-white/15 text-white' : 'text-ink-400'}`}
              >
                Create Account
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'student' ? (
              <>
                {studentAuthMode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Your Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-white outline-none focus:border-gold-400/50 focus:bg-white/10 transition-all"
                        placeholder="Enter your name"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-white outline-none focus:border-gold-400/50 focus:bg-white/10 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-white outline-none focus:border-gold-400/50 focus:bg-white/10 transition-all"
                      placeholder={studentAuthMode === 'register' ? 'At least 6 characters' : 'Enter password'}
                      required
                    />
                  </div>
                  {studentAuthMode === 'login' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-gold-400/80 hover:text-gold-300 font-semibold ml-1"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {studentAuthMode === 'register' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-white outline-none focus:border-gold-400/50 focus:bg-white/10 transition-all"
                        placeholder="Re-enter password"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Admin Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                    <input
                      type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-white outline-none focus:border-gold-400/50 focus:bg-white/10 transition-all"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-400 uppercase tracking-widest ml-1">Password</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-4 pl-12 pr-4 text-white outline-none focus:border-gold-400/50 focus:bg-white/10 transition-all"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-rose-400 text-xs font-bold text-center bg-rose-400/10 py-2 rounded-lg border border-rose-400/20"
              >
                {error}
              </motion.p>
            )}

            {info && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sage-400 text-xs font-bold text-center bg-sage-400/10 py-2 rounded-lg border border-sage-400/20"
              >
                {info}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gold-400 hover:bg-gold-300 text-ink-900 font-bold py-4 rounded-3xl shadow-lg shadow-gold-400/20 transition-all active:scale-95 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-ink-900/30 border-t-ink-900 rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'student' ? (studentAuthMode === 'register' ? 'Create Account' : 'Log In') : 'Sign In'}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-ink-500 text-xs">
              {mode === 'admin' ? (
                'Restricted to authorized admin accounts only'
              ) : studentAuthMode === 'register' ? (
                'Free to join — your progress stays saved to this account'
              ) : (
                "New here? Tap \"Create Account\" above"
              )}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-4">
            <img src="/branding/founder-photo.png" alt="Sumeet Birajadar, Founder" className="w-16 h-20 rounded-2xl object-cover object-top shrink-0" />
            <p className="text-ink-500 text-xs leading-tight text-left">
              <span className="text-ink-300 font-semibold">Sumeet Birajadar</span>
              <br />
              Founder, <span className="text-ink-300 font-semibold">Science Monk</span> Academy
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const RoutineNode: React.FC<{ task: any, completed: boolean, onToggle: () => void }> = ({ task, completed, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      className={`flow-node group ${task.color} ${completed ? 'opacity-60 scale-95' : 'hover:scale-105 hover:shadow-md'}`}
    >
      <div className="flex items-center justify-between w-full mb-2">
        <div className="p-1.5 bg-white rounded-lg shadow-sm">
          {iconMap[task.icon || '']}
        </div>
        <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${completed ? 'bg-ink-800 border-ink-800 text-white' : 'bg-white border-ink-300'}`}>
          {completed && <CheckCircle2 className="w-3 h-3" />}
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-bold text-ink-800 leading-tight mb-1">{task.label}</p>
        {task.time && <p className="text-[10px] font-bold text-ink-500 uppercase tracking-tighter">{task.time}</p>}
      </div>
    </div>
  );
};

const AcademicSection: React.FC<{ title: string, items: string[], onUpdate: (i: number, v: string) => void }> = ({ title, items, onUpdate }) => {
  return (
    <div className="space-y-4 border border-ink-200 rounded-3xl overflow-hidden">
      <div className="bg-sage-100 text-sage-900 px-4 py-2 font-bold text-center text-sm uppercase tracking-wider">
        {title}
      </div>
      <div className="p-4 space-y-2">
        {items.map((item, i) => (
          <input 
            key={i}
            type="text" 
            value={item}
            onChange={(e) => onUpdate(i, e.target.value)}
            className="planner-input text-sm"
          />
        ))}
      </div>
    </div>
  );
};
