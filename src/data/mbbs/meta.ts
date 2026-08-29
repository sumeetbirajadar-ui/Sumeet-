// Karnataka MBBS government-quota seat cutoffs via KEA's NEET-UG (medical)
// counselling, 2025 admission cycle — Round 3 (the final, post-High-Court-
// order result) only; Round 1 and Round 2 official documents weren't
// available when this was built. Computed directly from KEA's official
// candidate-level seat allotment PDF (Government-quota, status "Allotted"
// rows only) — the closing rank per college and category is the highest
// all-India rank actually allotted there.

export const MBBS_ROUNDS = ['2025 R3 (Final)'];

export interface CategoryOption {
  value: string;
  label: string;
}

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

function decodeCategory(code: string): string {
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
// karnataka.json) — every code that actually had a real government-quota
// allotment in Round 3, 2025.
export const MBBS_ALL_CATEGORY_CODES = [
  'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH',
  '1G', '1H', '1R',
  '2AG', '2AH', '2AK', '2AR', '2ARH',
  '2BG', '2BH',
  '3AG', '3AH', '3AR',
  '3BG', '3BH', '3BR', '3BRH',
  'SCG', 'SCH', 'SCK', 'SCR', 'SCRH',
  'STG', 'STH', 'STR', 'STRH',
];

export const MBBS_CATEGORY_OPTIONS: CategoryOption[] = MBBS_ALL_CATEGORY_CODES.map((code) => ({
  value: code,
  label: decodeCategory(code),
}));
