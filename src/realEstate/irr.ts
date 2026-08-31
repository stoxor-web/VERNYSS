export function irr(cashFlows: readonly number[], guess = 0.08): number | null {
  if (cashFlows.length < 2 || cashFlows.every((value) => value >= 0) || cashFlows.every((value) => value <= 0)) return null;
  let rate = guess;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    let npv = 0;
    let derivative = 0;
    for (let t = 0; t < cashFlows.length; t += 1) {
      const value = cashFlows[t] ?? 0;
      const factor = (1 + rate) ** t;
      npv += value / factor;
      if (t > 0) derivative -= t * value / ((1 + rate) ** (t + 1));
    }
    if (Math.abs(npv) < 1e-8) return rate;
    if (Math.abs(derivative) < 1e-12) return null;
    const next = rate - npv / derivative;
    if (!Number.isFinite(next) || next <= -0.9999 || next > 10) return null;
    if (Math.abs(next - rate) < 1e-10) return next;
    rate = next;
  }
  return null;
}
