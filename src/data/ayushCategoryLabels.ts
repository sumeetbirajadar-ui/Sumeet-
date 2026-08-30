// Shared category-code decoding for Karnataka's AYUSH/medical/dental KEA
// counselling data (BAMS, BHMS, MBBS, BDS) — one place for the vertical +
// horizontal reservation code scheme instead of repeating it per course.

export type QuotaType = 'GOVT' | 'PRIV' | 'NRI' | 'OTHERS';

export const QUOTA_OPTIONS: { value: QuotaType; label: string }[] = [
  { value: 'GOVT', label: 'Government' },
  { value: 'PRIV', label: 'Private' },
  { value: 'NRI', label: 'NRI' },
  { value: 'OTHERS', label: 'Management / Other' },
];

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

// Codes outside the vertical/horizontal reservation matrix — special
// quotas and Private/NRI/Management-seat codes, shown as KEA publishes
// them. The minority-institution codes (MA/MC/ME/MEH/MK/MM/MMH/MU) are
// each specific to how an individual private college declared its own
// minority reservation — confirm the exact meaning for a given college
// with that college or KEA directly.
const SPECIAL_LABELS: Record<string, string> = {
  D: 'Defense / Ex-Servicemen Quota',
  XD: 'Ex-Servicemen (Dependents) Quota',
  NCC: 'NCC Quota',
  PH: 'Persons with Disability',
  PHM: 'Persons with Disability (Management Quota)',
  CAP: 'Special Quota (CAP)',
  JK: 'Special Quota (JK)',
  SPO: 'Sports Quota',
  GMP: 'General Merit (Private)',
  GMPH: 'General Merit (Private, Hyderabad-Karnataka)',
  OPN: 'Open (Private Quota)',
  NRI: 'NRI Quota',
  OTH: 'Management / Other Quota',
  MA: 'Minority Quota (institution-declared, code MA)',
  MC: 'Minority Quota (institution-declared, code MC)',
  ME: 'Minority Quota (institution-declared, code ME)',
  MEH: 'Minority Quota (institution-declared, code MEH)',
  MK: 'Minority Quota (institution-declared, code MK)',
  MM: 'Minority Quota (institution-declared, code MM)',
  MMH: 'Minority Quota (institution-declared, code MMH)',
  MU: 'Minority Quota (institution-declared, code MU)',
  'S-G': 'Institution-declared quota (code S-G)',
  RC1: 'Institution-declared reservation category (code RC1)',
  RC2: 'Institution-declared reservation category (code RC2)',
  RC3: 'Institution-declared reservation category (code RC3)',
  RC4: 'Institution-declared reservation category (code RC4)',
  RC5: 'Institution-declared reservation category (code RC5)',
  RC6: 'Institution-declared reservation category (code RC6)',
  RC7: 'Institution-declared reservation category (code RC7)',
  RC8: 'Institution-declared reservation category (code RC8)',
};

export function decodeCategory(code: string): string {
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

export function buildCategoryOptions(codes: string[]): CategoryOption[] {
  return codes.map((code) => ({ value: code, label: decodeCategory(code) }));
}
