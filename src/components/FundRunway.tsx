import type { FundForecast } from "@/engine/forecast";

const RISK_STYLE: Record<FundForecast["risk"], { label: string; color: string; bg: string }> = {
  HIGH: { label: "Shortfall", color: "var(--danger)", bg: "var(--danger-bg)" },
  // Darker amber than --warn: small text on the wash must clear 4.5:1 contrast.
  WATCH: { label: "Watch", color: "#8a5200", bg: "var(--warn-bg)" },
  OK: { label: "On track", color: "var(--ok)", bg: "var(--ok-bg)" },
};

const crore = (n: number) => `₹${n >= 100 ? Math.round(n).toLocaleString("en-IN") : n.toFixed(1)} cr`;

/** Cumulative spend: solid = actual to date, dashed = projection, horizontal rule = budget. */
function RunwayChart({ f }: { f: FundForecast }) {
  const W = 320;
  const H = 110;
  const all = [...f.actual, ...f.projected];
  const max = Math.max(f.budgetCrore * 1.08, ...all);
  const x = (i: number) => (i / Math.max(1, all.length - 1)) * W;
  const y = (v: number) => H - (v / max) * H;
  const path = (pts: number[], offset: number) => pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i + offset).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const style = RISK_STYLE[f.risk];
  const exhaustIdx = f.weeksOfRunway === null ? null : f.actual.length - 1 + f.weeksOfRunway;
  return (
    <svg viewBox={`0 0 ${W} ${H + 4}`} className="h-auto w-full" role="img" aria-label={`Cumulative spend against a budget of ${crore(f.budgetCrore)}`}>
      <line x1="0" x2={W} y1={y(f.budgetCrore)} y2={y(f.budgetCrore)} stroke="var(--ink)" strokeOpacity="0.35" strokeDasharray="2 3" />
      <text x={W} y={y(f.budgetCrore) + 11} textAnchor="end" fontSize="9" fill="var(--muted)">budget {crore(f.budgetCrore)}</text>
      <path d={path([f.actual[f.actual.length - 1], ...f.projected], f.actual.length - 1)} fill="none" stroke={style.color} strokeWidth="2" strokeDasharray="5 4" />
      <path d={path(f.actual, 0)} fill="none" stroke="var(--indigo)" strokeWidth="2.5" />
      <circle cx={x(f.actual.length - 1)} cy={y(f.actual[f.actual.length - 1])} r="3.5" fill="var(--indigo)" />
      {exhaustIdx !== null ? <circle cx={x(exhaustIdx)} cy={y(f.budgetCrore)} r="4" fill={style.color} /> : null}
    </svg>
  );
}

export function FundRunway({ forecasts, names }: { forecasts: FundForecast[]; names: Record<string, string> }) {
  return (
    <section className="card mt-6 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Predictive fund runway, 2026-27</h2>
        <p className="meta">Projection to 31 Mar 2027 · seasonal intake model</p>
      </div>
      <p className="mt-1 max-w-3xl text-sm text-[color:var(--muted)]">
        When each scheme&apos;s budget runs out at the current inflow of eligible applications. Last year&apos;s weekly
        intake curve, scaled by this year&apos;s growth so far, drives the projection. The goal is to seek a top-up at the
        Revised Estimates stage before the money runs out, not after DBT payments bounce.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {forecasts.map((f) => {
          const style = RISK_STYLE[f.risk];
          return (
            <article key={f.schemeCode} className="rounded-md border border-[color:var(--line)] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{names[f.schemeCode] ?? f.schemeCode}</h3>
                <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ color: style.color, background: style.bg }}>
                  {style.label}
                </span>
              </div>
              <RunwayChart f={f} />
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <dt className="text-[color:var(--muted)]">Committed</dt>
                <dd className="text-right font-semibold">{crore(f.committedCrore)} ({Math.round(f.utilisation * 100)}%)</dd>
                <dt className="text-[color:var(--muted)]">Year-end projection</dt>
                <dd className="text-right font-semibold">{crore(f.projectedYearEndCrore)}</dd>
                <dt className="text-[color:var(--muted)]">Runs out</dt>
                <dd className="text-right font-semibold" style={{ color: f.exhaustionDate ? style.color : undefined }}>
                  {f.exhaustionDate
                    ? new Date(f.exhaustionDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Lasts the year"}
                </dd>
                <dt className="text-[color:var(--muted)]">Intake vs last year</dt>
                <dd className="text-right font-semibold">{f.growth >= 1 ? "+" : ""}{Math.round((f.growth - 1) * 100)}%</dd>
              </dl>
              <p className="mt-2 text-xs leading-relaxed">{f.action}</p>
            </article>
          );
        })}
      </div>
      <p className="meta mt-3">Budgets, award costs and prior-year intake are illustrative demo figures. Live: PFMS releases plus this portal&apos;s weekly eligible counts.</p>
    </section>
  );
}
