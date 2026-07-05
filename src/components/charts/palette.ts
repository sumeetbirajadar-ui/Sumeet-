/** Muted, elegant series palette for multi-category charts. No reds —
 * "incomplete/over-budget" states use amber/navy per the design brief. */
export const CHART_PALETTE = [
  '#C9A227', // gold
  '#1E2A4A', // navy
  '#7C9473', // sage
  '#6B8CAE', // dusty blue
  '#B8863B', // amber
  '#8E7CC3', // muted mauve
  '#4A7A76', // deep teal
  '#A67C52', // warm taupe
];

export function colorFor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
