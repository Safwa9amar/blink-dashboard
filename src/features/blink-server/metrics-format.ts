// Shared metric-formatting helpers for the Blink Server → Health / Traffic views.

// Round a set of counts to integer percentages that sum to exactly 100 (largest
// remainder method), so a status donut legend never reads 99% or 101%.
export function largestRemainder(counts: number[], total: number): number[] {
  if (total <= 0) return counts.map(() => 0);
  const exact = counts.map((c) => (c / total) * 100);
  const out = exact.map(Math.floor);
  let remainder = 100 - out.reduce((a, b) => a + b, 0);
  const byFrac = exact
    .map((e, i) => ({ i, frac: e - Math.floor(e) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; remainder > 0 && k < byFrac.length; k++, remainder--) out[byFrac[k].i]++;
  return out;
}
