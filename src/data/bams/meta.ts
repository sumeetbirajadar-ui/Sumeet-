// Karnataka BAMS (Ayurveda) government-quota seat cutoffs via KEA's AYUSH
// counselling, 2024 admission cycle — Round 1, Round 2, Round 3 (Mop-up).
// Sourced from KEA's published round-wise allotment results (via a
// counselling-data aggregator that republishes the official figures
// verbatim, cross-checked cell-by-cell against the raw source table before
// import — this is not a third-party estimate). Only one admission year is
// available so far, so there's no multi-year trend projection here yet
// (unlike the KCET predictor's 2025/2026 estimates) — this shows the real
// 2024 figures only, labelled as such.

export const BAMS_ROUNDS = ['2024 R1', '2024 R2', '2024 R3 (Mop-up)'];

export interface CategoryOption {
  value: string;
  label: string;
}

// KEA's BAMS category codes follow VERTICAL + HORIZONTAL pattern:
// vertical base (GM/1/2A/2B/3A/3B/SC/ST) + horizontal suffix
// (none or G=General, K=Kannada Medium, R=Rural, H=Hyderabad-Karnataka
// Art.371(J), RH/KH = combined). A handful of special quotas (D, XD, NCC,
// PH, PHM) sit outside that matrix — shown as KEA publishes them; confirm
// exact eligibility for those five with KEA directly.
const VERTICAL_LABELS: Record<string, string> = {
  GM: 'General Merit',
  '1': 'Category I',
  '2A': 'Category IIA',
  '2B': 'Category IIB',
  '3A': 'Category IIIA',
  '3B': 'Category IIIB',
  SC: 'Scheduled Caste',
  ST: 'Scheduled Tribe',
};

const HORIZONTAL_LABELS: Record<string, string> = {
  '': 'General',
  G: 'General',
  K: 'Kannada Medium',
  R: 'Rural',
  H: 'Hyderabad-Karnataka (Art. 371J)',
  RH: 'Rural + Hyderabad-Karnataka',
  KH: 'Kannada Medium + Hyderabad-Karnataka',
};

const SPECIAL_LABELS: Record<string, string> = {
  D: 'Defense / Ex-Servicemen Quota',
  XD: 'Ex-Servicemen (Dependents) Quota',
  NCC: 'NCC Quota',
  PH: 'Persons with Disability',
  PHM: 'Persons with Disability (Management Quota)',
};

function decodeCategory(code: string): string {
  if (SPECIAL_LABELS[code]) return `${code} — ${SPECIAL_LABELS[code]}`;
  const verticalKeys = ['GM', '2A', '2B', '3A', '3B', 'SC', 'ST', '1'];
  const base = verticalKeys.find((v) => code.startsWith(v));
  if (!base) return code;
  const suffix = code.slice(base.length);
  const horizontal = HORIZONTAL_LABELS[suffix];
  if (horizontal === undefined) return code;
  const verticalLabel = VERTICAL_LABELS[base];
  return horizontal === 'General' ? `${code} — ${verticalLabel}` : `${code} — ${verticalLabel} (${horizontal})`;
}

// Exact set of category codes present in the source data (verified against
// karnataka.json, not hand-typed) — do not add codes here that aren't
// actually used by a college below, or the dropdown will offer a category
// with no results.
export const BAMS_ALL_CATEGORY_CODES = [
  'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH',
  '1G', '1H', '1K', '1R', '1RH',
  '2AG', '2AH', '2AK', '2AKH', '2AR', '2ARH',
  '2BG', '2BH', '2BK', '2BR', '2BRH',
  '3AG', '3AH', '3AK', '3AR', '3ARH',
  '3BG', '3BH', '3BK', '3BKH', '3BR', '3BRH',
  'SCG', 'SCH', 'SCK', 'SCKH', 'SCR', 'SCRH',
  'STG', 'STH', 'STK', 'STKH', 'STR', 'STRH',
  'D', 'XD', 'NCC', 'PH', 'PHM',
];

export const BAMS_CATEGORY_OPTIONS: CategoryOption[] = BAMS_ALL_CATEGORY_CODES.map((code) => ({
  value: code,
  label: decodeCategory(code),
}));
