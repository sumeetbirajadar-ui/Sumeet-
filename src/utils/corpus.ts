/** SIP math for the corpus goal tracker. All figures are clearly-labelled
 * projections (assumed-return based), never guarantees. */

export function requiredFixedSIP(target: number, years: number, annualReturnPct: number): number {
  const n = years * 12;
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return target / n;
  const factor = (Math.pow(1 + r, n) - 1) / r * (1 + r);
  return target / factor;
}

/** With an annual step-up SIP, computes the *starting* monthly SIP required
 * to hit `target` by `years`, stepping up by `stepUpPct` at each anniversary. */
export function requiredStepUpSIP(target: number, years: number, annualReturnPct: number, stepUpPct: number): number {
  const r = annualReturnPct / 100 / 12;
  const step = stepUpPct / 100;
  // Binary-search the starting SIP that grows the corpus to `target`.
  let lo = 0;
  let hi = target;
  for (let iter = 0; iter < 60; iter++) {
    const mid = (lo + hi) / 2;
    const fv = futureValueStepUp(mid, years, annualReturnPct, stepUpPct);
    if (fv > target) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
  function futureValueStepUp(startSip: number, yrs: number, ret: number, stepPct: number): number {
    let corpus = 0;
    let sip = startSip;
    for (let y = 0; y < yrs; y++) {
      for (let m = 0; m < 12; m++) {
        corpus = corpus * (1 + r) + sip;
      }
      sip *= 1 + stepPct / 100;
    }
    return corpus;
  }
}

export function projectedCorpusValue(monthlyContributionSoFar: number, monthsElapsed: number, annualReturnPct: number): number {
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return monthlyContributionSoFar * monthsElapsed;
  return monthlyContributionSoFar * ((Math.pow(1 + r, monthsElapsed) - 1) / r) * (1 + r);
}
