/** Generic storage contract so every module talks to data the same way,
 *  regardless of whether the runtime adapter is IndexedDB (browser/dev preview)
 *  or SQLite (native Android via @capacitor-community/sqlite). */
export interface DataStore {
  getAll<T>(table: string): Promise<T[]>;
  getById<T>(table: string, id: string): Promise<T | undefined>;
  put<T extends { id: string }>(table: string, item: T): Promise<void>;
  bulkPut<T extends { id: string }>(table: string, items: T[]): Promise<void>;
  remove(table: string, id: string): Promise<void>;
  exportAll(): Promise<Record<string, any[]>>;
  importAll(data: Record<string, any[]>): Promise<void>;
}

export const TABLES = [
  'habits', 'habitLogs', 'missReasons',
  'expenses', 'incomes', 'categoryBudgets',
  'syllabusChapters', 'chapterPlans',
  'investments',
  'targets', 'weeklyReviews',
  'gratitude',
  'bucketItems',
  'videoIdeas', 'channelMetrics', 'launchChecklist',
  'groomingLogs', 'inventoryItems',
  'sleepLogs', 'sadhanaLogs', 'winMistakes',
  'settings',
] as const;

export type TableName = typeof TABLES[number];

export function uid(): string {
  return (crypto as any).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
