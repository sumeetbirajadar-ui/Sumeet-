// Admin-entered "official" KCET cutoffs for years the source dataset doesn't
// cover (2025, 2026...). Kept separate from the bundled dataset so the app's
// own predictions are never silently overwritten — an override is only ever
// something an admin typed in on purpose, and it's always labelled as such
// (vs. a computed "Estimated" figure) in the predictor UI. Firestore-backed
// as a single config document, since the whole store is always read/written
// together and every student's predictor needs to see the same overrides.

import { subscribeDoc, setDocument } from './firebase';

const CONFIG_COLLECTION = 'admin_config';
const OVERRIDES_DOC_ID = 'kcet_overrides';

export type CourseType = 'engg' | 'agri' | 'prof';

export interface OverrideEntry {
  year: number;
  cutoff: number;
  note?: string;
  updatedAt: string;
}

// courseType -> collegeCode -> branch -> category -> year -> entry
export type OverrideStore = Record<
  CourseType,
  Record<string, Record<string, Record<string, Record<number, OverrideEntry>>>>
>;

function emptyStore(): OverrideStore {
  return { engg: {}, agri: {}, prof: {} };
}

export function subscribeOverrideStore(onData: (store: OverrideStore) => void): () => void {
  return subscribeDoc<OverrideStore>(CONFIG_COLLECTION, OVERRIDES_DOC_ID, (data) => onData({ ...emptyStore(), ...(data || {}) }));
}

export async function setOverride(
  store: OverrideStore,
  courseType: CourseType,
  collegeCode: string,
  branch: string,
  category: string,
  year: number,
  cutoff: number,
  note?: string
): Promise<void> {
  const next: OverrideStore = structuredClone(store);
  next[courseType][collegeCode] ??= {};
  next[courseType][collegeCode][branch] ??= {};
  next[courseType][collegeCode][branch][category] ??= {};
  next[courseType][collegeCode][branch][category][year] = { year, cutoff, note, updatedAt: new Date().toISOString() };
  await setDocument(CONFIG_COLLECTION, OVERRIDES_DOC_ID, next);
}

export async function removeOverride(
  store: OverrideStore,
  courseType: CourseType,
  collegeCode: string,
  branch: string,
  category: string,
  year: number
): Promise<void> {
  const next: OverrideStore = structuredClone(store);
  delete next[courseType]?.[collegeCode]?.[branch]?.[category]?.[year];
  await setDocument(CONFIG_COLLECTION, OVERRIDES_DOC_ID, next);
}

export function getOverrideFrom(
  store: OverrideStore,
  courseType: CourseType,
  collegeCode: string,
  branch: string,
  category: string,
  year: number
): OverrideEntry | undefined {
  return store[courseType]?.[collegeCode]?.[branch]?.[category]?.[year];
}

export function listOverridesFrom(
  store: OverrideStore,
  courseType: CourseType
): Array<{ collegeCode: string; branch: string; category: string; entry: OverrideEntry }> {
  const out: Array<{ collegeCode: string; branch: string; category: string; entry: OverrideEntry }> = [];
  const forCourse = store[courseType] || {};
  for (const collegeCode of Object.keys(forCourse)) {
    for (const branch of Object.keys(forCourse[collegeCode])) {
      for (const category of Object.keys(forCourse[collegeCode][branch])) {
        for (const entry of Object.values(forCourse[collegeCode][branch][category])) {
          out.push({ collegeCode, branch, category, entry });
        }
      }
    }
  }
  return out.sort((a, b) => b.entry.updatedAt.localeCompare(a.entry.updatedAt));
}
