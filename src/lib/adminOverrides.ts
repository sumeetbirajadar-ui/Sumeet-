// Admin-entered "official" KCET cutoffs for years the source dataset doesn't
// cover (2025, 2026...). Kept separate from the bundled dataset so the app's
// own predictions are never silently overwritten — an override is only ever
// something an admin typed in on purpose, and it's always labelled as such
// (vs. a computed "Estimated" figure) in the predictor UI.

const STORAGE_KEY = 'kcet_admin_overrides_v1';

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

export function loadOverrides(): OverrideStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return { ...emptyStore(), ...parsed };
  } catch {
    return emptyStore();
  }
}

export function saveOverrides(store: OverrideStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function setOverride(
  courseType: CourseType,
  collegeCode: string,
  branch: string,
  category: string,
  year: number,
  cutoff: number,
  note?: string
) {
  const store = loadOverrides();
  store[courseType][collegeCode] ??= {};
  store[courseType][collegeCode][branch] ??= {};
  store[courseType][collegeCode][branch][category] ??= {};
  store[courseType][collegeCode][branch][category][year] = {
    year,
    cutoff,
    note,
    updatedAt: new Date().toISOString(),
  };
  saveOverrides(store);
  return store;
}

export function removeOverride(
  courseType: CourseType,
  collegeCode: string,
  branch: string,
  category: string,
  year: number
) {
  const store = loadOverrides();
  delete store[courseType]?.[collegeCode]?.[branch]?.[category]?.[year];
  saveOverrides(store);
  return store;
}

export function getOverride(
  courseType: CourseType,
  collegeCode: string,
  branch: string,
  category: string,
  year: number
): OverrideEntry | undefined {
  const store = loadOverrides();
  return store[courseType]?.[collegeCode]?.[branch]?.[category]?.[year];
}

export function listOverrides(courseType: CourseType): Array<{
  collegeCode: string;
  branch: string;
  category: string;
  entry: OverrideEntry;
}> {
  const store = loadOverrides();
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
