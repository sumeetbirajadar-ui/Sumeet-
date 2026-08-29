// Karnataka MBBS seat cutoffs via KEA's NEET-UG counselling, 2025
// admission cycle — Round 3 (final, post-High-Court-order) only; Round 1
// and Round 2 official documents weren't available. Computed from KEA's
// official candidate-level seat allotment PDF (closing rank = highest
// all-India rank actually allotted, per college/quota/category).
// Category codes are grouped by seat quota — Government uses the vertical/
// horizontal reservation matrix; Private/NRI/Management-Other use a
// different, much smaller code set (KEA doesn't subdivide those by
// reservation category the same way). See ayushCategoryLabels.ts for how
// codes are decoded into labels.

import { QuotaType, CategoryOption, buildCategoryOptions } from '../ayushCategoryLabels';
export { QUOTA_OPTIONS } from '../ayushCategoryLabels';
export type { QuotaType, CategoryOption };

export const MBBS_ROUNDS = ['2025 R3 (Final)'];

// Exact set of category codes present in the source data per quota
// (verified against karnataka.json).
export const MBBS_CATEGORY_CODES_BY_QUOTA: Record<QuotaType, string[]> = {
  GOVT: ['1G', '1H', '1R', '2AG', '2AH', '2AK', '2AR', '2ARH', '2BG', '2BH', '3AG', '3AH', '3AR', '3BG', '3BH', '3BR', '3BRH', 'GM', 'GMH', 'GMK', 'GMKH', 'GMR', 'GMRH', 'SCG', 'SCH', 'SCK', 'SCR', 'SCRH', 'STG', 'STH', 'STR', 'STRH'],
  PRIV: ['GMP', 'GMPH', 'MA', 'MC', 'ME', 'MM', 'MMH', 'MU', 'OPN'],
  NRI: ['NRI'],
  OTHERS: ['OTH'],
};

export const MBBS_CATEGORY_OPTIONS_BY_QUOTA: Record<QuotaType, CategoryOption[]> = {
  GOVT: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.GOVT),
  PRIV: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.PRIV),
  NRI: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.NRI),
  OTHERS: buildCategoryOptions(MBBS_CATEGORY_CODES_BY_QUOTA.OTHERS),
};
