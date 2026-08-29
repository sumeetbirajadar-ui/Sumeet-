// Karnataka BDS government-quota seat cutoffs via KEA's NEET-UG (dental)
// counselling, 2025 admission cycle — Round 1 (final result) and Round 3
// (revised provisional, the most recent Round 3 figure KEA had published
// when this was built; no Round 2 data was available). Computed directly
// from KEA's official candidate-level seat allotment PDFs (Government-
// quota, status "Allotted" rows only) — the closing rank per college and
// category is the highest all-India rank actually allotted there.

export const BDS_ROUNDS = ['2025 R1', '2025 R3'];

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

// A handful of codes (D, XD, NCC, CAP, JK, SPO) sit outside the vertical/
// horizontal matrix — special reservation quotas as KEA publishes them.
// Confirm exact eligibility for these with KEA directly.
const SPECIAL_LABELS: Record<string, string> = {
  D: 'Defense / Ex-Servicemen Quota',
  XD: 'Ex-Servicemen (Dependents) Quota',
  NCC: 'NCC Quota',
  CAP: 'Special Quota (CAP)',
  JK: 'Special Quota (JK)',
  SPO: 'Sports Quota',
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
// karnataka.json) — every code that actually had a real government-quota
// allotment in Round 1 or Round 3, 2025.
export const BDS_ALL_CATEGORY_CODES = [
  'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH',
  '1G', '1H', '1K', '1R', '1RH',
  '2AG', '2AH', '2AK', '2AKH', '2AR', '2ARH',
  '2BG', '2BH', '2BK', '2BR', '2BRH',
  '3AG', '3AH', '3AK', '3AR', '3ARH',
  '3BG', '3BH', '3BK', '3BR', '3BRH',
  'SCG', 'SCH', 'SCK', 'SCKH', 'SCR', 'SCRH',
  'STG', 'STH', 'STK', 'STR', 'STRH',
  'D', 'XD', 'NCC', 'CAP', 'JK', 'SPO',
];

export const BDS_CATEGORY_OPTIONS: CategoryOption[] = BDS_ALL_CATEGORY_CODES.map((code) => ({
  value: code,
  label: decodeCategory(code),
}));
