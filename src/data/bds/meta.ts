// Karnataka BDS seat cutoffs via KEA's NEET-UG counselling, 2025
// admission cycle — Round 1 (final) and Round 3 (revised provisional); no
// Round 2 document was available. Computed from KEA's official
// candidate-level seat allotment PDFs (closing rank = highest all-India
// rank actually allotted, per college/quota/category).
// Category codes are grouped by seat quota — Government uses the vertical/
// horizontal reservation matrix; Private/NRI/Management-Other use a
// different, much smaller code set (KEA doesn't subdivide those by
// reservation category the same way). See ayushCategoryLabels.ts for how
// codes are decoded into labels.

import { QuotaType, CategoryOption, buildCategoryOptions } from '../ayushCategoryLabels';
export { QUOTA_OPTIONS } from '../ayushCategoryLabels';
export type { QuotaType, CategoryOption };

export const BDS_ROUNDS = ['2025 R1', '2025 R3'];

// Exact set of category codes present in the source data per quota
// (verified against karnataka.json).
export const BDS_CATEGORY_CODES_BY_QUOTA: Record<QuotaType, string[]> = {
  GOVT: ['1G', '1H', '1K', '1R', '1RH', '2AG', '2AH', '2AK', '2AKH', '2AR', '2ARH', '2BG', '2BH', '2BK', '2BR', '2BRH', '3AG', '3AH', '3AK', '3AR', '3ARH', '3BG', '3BH', '3BK', '3BR', '3BRH', 'CAP', 'D', 'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH', 'JK', 'NCC', 'SCG', 'SCH', 'SCK', 'SCKH', 'SCR', 'SCRH', 'SPO', 'STG', 'STH', 'STK', 'STR', 'STRH', 'XD'],
  PRIV: ['GMP', 'GMPH', 'MA', 'ME', 'MEH', 'MK', 'MM', 'MMH', 'MU', 'OPN'],
  NRI: ['NRI'],
  OTHERS: ['OTH'],
};

export const BDS_CATEGORY_OPTIONS_BY_QUOTA: Record<QuotaType, CategoryOption[]> = {
  GOVT: buildCategoryOptions(BDS_CATEGORY_CODES_BY_QUOTA.GOVT),
  PRIV: buildCategoryOptions(BDS_CATEGORY_CODES_BY_QUOTA.PRIV),
  NRI: buildCategoryOptions(BDS_CATEGORY_CODES_BY_QUOTA.NRI),
  OTHERS: buildCategoryOptions(BDS_CATEGORY_CODES_BY_QUOTA.OTHERS),
};
