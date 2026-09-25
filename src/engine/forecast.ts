/**
 * Predictive fund analytics: when will each scheme's budget run out?
 *
 * Inputs per scheme: sanctioned budget for the academic year, average cost of one
 * award, and the weekly count of eligible applications so far this year.
 * Model: seasonal-profile scaling. Scholarship intake is strongly seasonal (admission
 * season hump, then a long taper), so a plain trend line badly overshoots. We take last
 * year's weekly profile and scale it by this year's growth so far
 * (Σ this year ÷ Σ same weeks last year), with a small Holt-smoothed correction for the
 * most recent weeks. Expected spend each week = projected eligible inflow × historical
 * sanction rate × average award cost.
 * The week where cumulative projected spend crosses the budget is the exhaustion week.
 *
 * Historical weekly inflow here is a deterministic seeded series shaped like a
 * real academic-year intake (admission-season hump, then taper). In production it
 * comes from the applications table grouped by ISO week, plus prior-year PFMS data.
 */

export type FundPlan = {
  schemeCode: string;
  /** Sanctioned budget estimate for the year, in ₹ crore (illustrative figures). */
  budgetCrore: number;
  /** Average annual cost of one award in ₹. */
  avgAwardRupees: number;
  /** Share of eligible applications that end up sanctioned (prior-year ratio). */
  sanctionRate: number;
  /** Weekly eligible applications so far this academic year, oldest first. */
  weeklyEligible: number[];
  /** Same weeks of the previous academic year (the seasonal profile). */
  priorYearWeekly: number[];
};

export type FundForecast = {
  schemeCode: string;
  budgetCrore: number;
  committedCrore: number;
  projectedYearEndCrore: number;
  /** Utilisation of budget already committed, 0..1. */
  utilisation: number;
  /** ISO date the budget is projected to be exhausted, or null if it lasts the year. */
  exhaustionDate: string | null;
  weeksOfRunway: number | null;
  /** Positive = projected shortfall at year end, negative = projected surplus (₹ crore). */
  gapCrore: number;
  risk: "HIGH" | "WATCH" | "OK";
  action: string;
  /** Cumulative spend series for the chart, ₹ crore: actual weeks then projected weeks. */
  actual: number[];
  projected: number[];
  /** This year's intake ÷ last year's, same weeks. */
  growth: number;
};

const ACADEMIC_YEAR_START = "2026-07-01";
const FINANCIAL_YEAR_END = "2027-03-31";
const WEEK_MS = 7 * 24 * 3600 * 1000;

/** Holt's linear smoothing; returns `horizon` forecasts (never negative). */
export function holtForecast(series: number[], horizon: number, alpha = 0.5, beta = 0.3): number[] {
  if (series.length === 0) return Array(horizon).fill(0);
  let level = series[0];
  let trend = series.length > 1 ? series[1] - series[0] : 0;
  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }
  // Intake always tapers after admission season; damp the trend so a hump isn't extrapolated forever.
  const out: number[] = [];
  let damp = 1;
  let cumTrend = 0;
  for (let h = 1; h <= horizon; h++) {
    damp *= 0.85;
    cumTrend += trend * damp;
    out.push(Math.max(0, level + cumTrend));
  }
  return out;
}

/** Deterministic pseudo-random so the demo is stable across reloads. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** Admission-season shaped weekly intake: rises to a peak around week `peakWeek`, then tapers. */
export function syntheticIntake(weeks: number, peak: number, peakWeek: number, seed: number): number[] {
  const rnd = seeded(seed);
  return Array.from({ length: weeks }, (_, w) => {
    const shape = Math.exp(-((w - peakWeek) ** 2) / (2 * 4 ** 2));
    return Math.round(peak * (0.25 + 0.75 * shape) * (0.9 + rnd() * 0.2));
  });
}

export function forecastFund(plan: FundPlan, today = new Date()): FundForecast {
  const start = new Date(ACADEMIC_YEAR_START).getTime();
  const end = new Date(FINANCIAL_YEAR_END).getTime();
  const elapsedWeeks = Math.max(1, Math.round((today.getTime() - start) / WEEK_MS));
  const history = plan.weeklyEligible.slice(0, elapsedWeeks);
  const remainingWeeks = Math.max(0, Math.ceil((end - today.getTime()) / WEEK_MS));

  const crorePerApp = (plan.avgAwardRupees * plan.sanctionRate) / 1e7;
  const actual: number[] = [];
  let cum = 0;
  for (const n of history) {
    cum += n * crorePerApp;
    actual.push(cum);
  }
  const committed = cum;

  const prior = plan.priorYearWeekly;
  const priorSoFar = prior.slice(0, history.length).reduce((a, b) => a + b, 0);
  const growth = priorSoFar > 0 ? history.reduce((a, b) => a + b, 0) / priorSoFar : 1;
  // Blend: 80% seasonal profile × growth, 20% short-term smoothed signal (recent weeks).
  const shortTerm = holtForecast(history.slice(-6), remainingWeeks);
  const future = Array.from({ length: remainingWeeks }, (_, i) => {
    const seasonal = (prior[history.length + i] ?? prior[prior.length - 1] ?? 0) * growth;
    const recent = Math.min(shortTerm[i], seasonal * 1.5);
    return 0.8 * seasonal + 0.2 * recent;
  });
  const projected: number[] = [];
  let exhaustionWeek: number | null = committed >= plan.budgetCrore ? 0 : null;
  for (let i = 0; i < future.length; i++) {
    cum += future[i] * crorePerApp;
    projected.push(cum);
    if (exhaustionWeek === null && cum >= plan.budgetCrore) exhaustionWeek = i + 1;
  }

  const exhaustionDate =
    exhaustionWeek === null ? null : new Date(today.getTime() + exhaustionWeek * WEEK_MS).toISOString().slice(0, 10);
  const gap = cum - plan.budgetCrore;
  // Risk is about the size of the year-end gap, not just whether it runs out: running dry
  // in the last week of March is a watch item; a 15% hole is a Revised Estimates problem now.
  const gapShare = gap / plan.budgetCrore;
  const risk: FundForecast["risk"] = gapShare > 0.05 ? "HIGH" : gapShare > -0.05 ? "WATCH" : "OK";

  const action =
    risk === "HIGH"
      ? `Projected shortfall ₹${gap.toFixed(1)} cr. Seek additional allocation at the Revised Estimates stage now, or re-phase the next State/UT release.`
      : risk === "WATCH"
        ? `Tight: budget is projected to run out just before or near year end. Re-check after the next two weekly intakes.`
        : `On track. Projected surplus ₹${Math.abs(gap).toFixed(1)} cr can be surrendered or re-appropriated to a scheme at risk.`;

  return {
    schemeCode: plan.schemeCode,
    budgetCrore: plan.budgetCrore,
    committedCrore: committed,
    projectedYearEndCrore: cum,
    utilisation: committed / plan.budgetCrore,
    exhaustionDate,
    weeksOfRunway: exhaustionWeek,
    gapCrore: gap,
    risk,
    action,
    actual,
    projected,
    growth,
  };
}

/** Illustrative 2026-27 plans. Budgets and costs are demo figures, not official allocations. */
export function demoFundPlans(liveEligibleBySchemeCode: Record<string, number> = {}): FundPlan[] {
  const weeks = 40;
  const elapsed = Math.max(1, Math.round((Date.now() - new Date(ACADEMIC_YEAR_START).getTime()) / WEEK_MS));
  const plan = (
    schemeCode: string,
    budgetCrore: number,
    avgAwardRupees: number,
    sanctionRate: number,
    priorPeak: number,
    growth: number,
    seed: number,
  ): FundPlan => {
    const priorYearWeekly = syntheticIntake(weeks, priorPeak, 9, seed);
    const current = syntheticIntake(weeks, priorPeak * growth, 9, seed + 1).slice(0, elapsed);
    // Fold this portal's own live eligible applications into the latest week.
    current[current.length - 1] += liveEligibleBySchemeCode[schemeCode] ?? 0;
    return { schemeCode, budgetCrore, avgAwardRupees, sanctionRate, weeklyEligible: current, priorYearWeekly };
  };
  return [
    plan("PRE_MATRIC", 440, 5_200, 0.93, 45_800, 1.02, 11),
    plan("POST_MATRIC", 2_400, 36_000, 0.9, 43_400, 1.14, 23),
    plan("TOP_CLASS", 38, 2_10_000, 0.85, 87, 1.05, 37),
    plan("NFST", 160, 5_40_000, 0.7, 227, 1.09, 41),
    plan("NOS", 7, 36_00_000, 0.35, 3.4, 0.95, 53),
  ];
}
