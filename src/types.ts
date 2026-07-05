/**
 * Core data model for Sumeet's Tracker 2.0.
 * Every record has a string `id` (uuid) so the storage layer can treat
 * all tables generically, and an `updatedAt` ISO timestamp for sync/export.
 */

export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string;

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

export type HabitFrequency = 'daily' | 'weekly' | 'weekdays';

export interface Habit {
  id: string;
  name: string;
  category: string;
  cue: string; // trigger / anchor
  reward: string;
  identityStatement: string; // "I am a ___"
  twoMinuteVersion: string;
  stackAfter?: string; // habit id this is stacked after
  frequency: HabitFrequency;
  weekDays?: number[]; // 0=Sun..6=Sat, for 'weekly'
  isKeystone: boolean;
  isNegative: boolean; // e.g. "never do X" commitments
  targetCount?: number; // for numeric habits like MCQs
  unit?: string; // 'MCQs', 'hours', etc
  timeLabel?: string; // display e.g. "4:00-7:00 AM"
  icon: string;
  active: boolean;
  createdAt: ISODateTime;
  archivedAt?: ISODateTime;
}

export type HabitStatus = 'done' | 'missed' | 'skipped';

export interface HabitLog {
  id: string;
  habitId: string;
  date: ISODate;
  status: HabitStatus;
  count?: number; // for numeric habits
  variant?: '530' | '730'; // evening variant chosen that day
  note?: string;
  updatedAt: ISODateTime;
}

export interface MissReason {
  id: string;
  date: ISODate;
  habitId?: string;
  reason: string;
}

// ---------------------------------------------------------------------------
// Budget & Expenses
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORIES = [
  'Groceries', 'Fuel/Transport', 'Utilities', 'EMIs/Loans', 'Family/Dependents',
  'Festivals & Gifts', 'Education/Books', 'Health/Medical', 'Household Help',
  'Dining/Eating Out', 'Personal Care/Grooming', 'Insurance Premiums',
  'Investments/Savings', 'Miscellaneous',
] as const;

export type BudgetBucket = 'needs' | 'wants' | 'savings';

export interface CategoryBudget {
  id: string; // == category name
  category: string;
  bucket: BudgetBucket;
  monthlyLimit: number;
}

export interface Expense {
  id: string;
  date: ISODate;
  amount: number;
  category: string;
  note?: string;
  updatedAt: ISODateTime;
}

export interface IncomeEntry {
  id: string;
  date: ISODate;
  amount: number;
  source: string; // Salary, Tuition, YouTube, Other
  updatedAt: ISODateTime;
}

export interface BudgetSettings {
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
  corpusTarget: number;
  corpusYears: number;
  corpusAssumedReturn: number; // annual %, e.g. 12
  corpusStepUpPct: number; // annual SIP step-up %, e.g. 10
}

// ---------------------------------------------------------------------------
// Syllabus
// ---------------------------------------------------------------------------

export type ExamTrack = 'NEET' | 'KCET' | 'JEE_MAIN' | 'JEE_ADVANCED' | 'CENGAGE';

export interface SyllabusChapter {
  id: string;
  track: ExamTrack;
  volume?: string; // for Cengage: which of the 6 volumes
  order: number;
  title: string;
  completionPct: number;
  targetDate?: ISODate;
  mcqCount: number;
  r1Done?: ISODate;
  r2Done?: ISODate;
  r3Done?: ISODate;
  confidence: number; // 1-5
  notes?: string;
}

// ---------------------------------------------------------------------------
// NEW: Chapter Planning ("teaching prep notebook" per chapter/topic)
// ---------------------------------------------------------------------------

export interface PlanExtraItem {
  id: string;
  title: string;
  detail: string;
  kind: 'analogy' | 'demo' | 'application' | 'mnemonic' | 'misconception' | 'other';
}

export interface ScientistStory {
  id: string;
  scientist: string;
  story: string;
  relevance: string; // why it fits this topic
}

export interface ChapterPlan {
  id: string;
  chapterId: string; // FK -> SyllabusChapter.id
  coreConcept: string; // what the chapter is fundamentally about
  learningObjectives: string[]; // ordered teaching sequence / lesson outline
  extras: PlanExtraItem[]; // analogies, demos, applications, mnemonics, misconceptions
  scientistStories: ScientistStory[];
  miscNotes: string[];
  status: 'not_started' | 'drafted' | 'ready' | 'delivered';
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Investments & Insurance
// ---------------------------------------------------------------------------

export type InvestmentType =
  | 'Health Insurance' | 'Term Insurance' | 'Emergency Fund' | 'Gold Scheme'
  | 'SIP' | 'FD' | 'PPF' | 'NPS' | 'LIC' | 'Other';

export type InvestmentFrequency = 'monthly' | 'quarterly' | 'annual' | 'one-time';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  provider: string;
  amount: number; // premium / contribution
  frequency: InvestmentFrequency;
  dueDay?: number; // day-of-month for recurring
  startDate?: ISODate;
  maturityDate?: ISODate;
  sumAssuredOrTarget?: number;
  currentValue: number;
  nominee?: string;
  notes?: string;
  notifyEnabled: boolean;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Targets (Weekly / Monthly, OKR-style)
// ---------------------------------------------------------------------------

export type TargetPeriod = 'weekly' | 'monthly';

export interface Target {
  id: string;
  period: TargetPeriod;
  periodKey: string; // week-start ISODate or 'YYYY-MM'
  objective: string;
  metric: string;
  targetValue: number;
  achievedValue: number;
  unit: string;
  rolledOverFrom?: string;
  updatedAt: ISODateTime;
}

export interface WeeklyReviewEntry {
  id: string;
  weekKey: ISODate;
  wins: string[];
  challenges: string[];
  changesToMake: string[];
  gratitude: string[];
  topThreeNextWeek: string[];
  rating: number; // 1-10
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Gratitude
// ---------------------------------------------------------------------------

export interface GratitudeEntry {
  id: string;
  date: ISODate;
  items: { text: string; why: string }[];
  morningIntention?: string;
  eveningReflection?: string;
  energyLevel?: number; // 1-5
  bedtime?: string; // HH:MM
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Bucket List
// ---------------------------------------------------------------------------

export type BucketCategory = 'Travel' | 'Career' | 'Financial' | 'Spiritual' | 'Family' | 'Learning' | 'Health' | 'Experiences';
export type BucketStatus = 'not_started' | 'in_progress' | 'achieved';

export interface BucketMilestone {
  id: string;
  text: string;
  done: boolean;
}

export interface BucketItem {
  id: string;
  title: string;
  category: BucketCategory;
  targetDate?: ISODate;
  status: BucketStatus;
  whyItMatters?: string;
  milestones: BucketMilestone[];
  achievedAt?: ISODate;
  updatedAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// YouTube (Science Monk Academy)
// ---------------------------------------------------------------------------

export type VideoStage = 'Idea' | 'Script' | 'Record' | 'Edit' | 'Thumbnail' | 'Upload' | 'Published';

export interface VideoIdea {
  id: string;
  title: string;
  topic: string;
  exam: string;
  notes?: string;
  stage: VideoStage;
  plannedDate?: ISODate;
  publishedDate?: ISODate;
  updatedAt: ISODateTime;
}

export interface ChannelMetricEntry {
  id: string;
  date: ISODate;
  subscribers: number;
  views: number;
  watchTimeHours: number;
  avgViewDurationMin: number;
  ctr: number;
  updatedAt: ISODateTime;
}

export interface LaunchChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Grooming
// ---------------------------------------------------------------------------

export interface GroomingTaskLog {
  id: string;
  date: ISODate;
  taskId: string; // 'skincare' | 'haircare' | 'hair_dye' | 'hair_oil' | 'face_care' | 'haircut'
  done: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  lastRestocked?: ISODate;
  restockEveryDays: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Sleep / Sadhana / Wins-Mistakes (light v2 extras, folded into evening review)
// ---------------------------------------------------------------------------

export interface SleepLog {
  id: string;
  date: ISODate;
  bedtime?: string;
  wakeTime?: string;
  hours?: number;
  updatedAt: ISODateTime;
}

export interface SadhanaLog {
  id: string;
  date: ISODate;
  meditationMin?: number;
  pranayamDone?: boolean;
  gitaReadingDone?: boolean;
  japaCount?: number;
  updatedAt: ISODateTime;
}

export interface WinMistakeEntry {
  id: string;
  date: ISODate;
  type: 'win' | 'mistake';
  text: string;
  lesson?: string;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface AppSettings {
  id: 'app-settings';
  passcodeHash?: string;
  onboarded: boolean;
  budget: BudgetSettings;
  notifyEveningReview: boolean;
  notifyDueDates: boolean;
  lastBackupAt?: ISODateTime;
  quoteIndex?: number;
}

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = {
  needsPct: 60,
  wantsPct: 20,
  savingsPct: 20,
  corpusTarget: 50000000, // 5 crore
  corpusYears: 10,
  corpusAssumedReturn: 12,
  corpusStepUpPct: 10,
};

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app-settings',
  onboarded: false,
  budget: DEFAULT_BUDGET_SETTINGS,
  notifyEveningReview: true,
  notifyDueDates: true,
};

// ---------------------------------------------------------------------------
// Discipline Score
// ---------------------------------------------------------------------------

export interface DisciplineScoreBreakdown {
  habits: number;
  study: number;
  targets: number;
  budget: number;
  reflection: number;
  grooming: number;
  sleep: number;
  total: number;
}
