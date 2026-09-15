import type { EligibilityResult } from "@/engine/types";
import { Stamp } from "./Stamp";

export function EligibilityPanel({ result }: { result: EligibilityResult }) {
  const tone = result.outcome === "ELIGIBLE" ? "ok" : result.outcome === "INELIGIBLE" ? "danger" : "stamp";
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Eligibility</h2>
        <Stamp tone={tone}>{result.outcome.replaceAll("_", " ")}</Stamp>
      </div>
      <p className="mb-4 text-sm text-[color:var(--muted)]">
        This is the scheme rule engine, not a universal score. Each line cites the approved document that authorised it.
      </p>
      <ul className="space-y-3">
        {result.traces.map((trace) => (
          <li key={trace.ruleId} className="border-t border-[color:var(--border)] pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {trace.ruleId} · {trace.description}
              </p>
              <span className={trace.passed ? "text-spine" : "text-danger"}>{trace.passed ? "PASS" : "FAIL"}</span>
            </div>
            <p className="text-sm">
              Actual: {trace.actual} · Expected: {trace.expected}
            </p>
            <p className="meta mt-1">
              {trace.citation.sourceDocument}
              {trace.citation.sourcePage ? ` p.${trace.citation.sourcePage}` : ""} · effective {trace.citation.effectiveFrom}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
