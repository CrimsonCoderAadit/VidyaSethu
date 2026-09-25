import { Shell, Stamp } from "@/components/Shell";
import { qaScheme } from "@/engine/policyQa";
import { advancePolicyStatusAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { humanizeSelectionModel, humanizeEnum } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";
import { redirect } from "next/navigation";

const LIFECYCLE = ["DRAFT", "VALIDATED", "TESTED", "APPROVED", "PUBLISHED"];

export default async function PolicyDetail({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireRole(["MOTA", "AUDITOR"]);
  if (!user) redirect("/");
  const { code } = await params;
  const scheme = schemeByCode(code);
  const issues = qaScheme(scheme);
  const db = (await loadDb());
  const status = db.policyStatus[code] ?? scheme.status;
  const nextStatus = LIFECYCLE[Math.min(LIFECYCLE.indexOf(status) + 1, LIFECYCLE.length - 1)];
  const atEnd = status === "PUBLISHED";

  return (
    <Shell user={user}>
      <p className="meta">
        rule_version {scheme.version} · academic year {scheme.academicYear}
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">{scheme.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <Stamp tone="rule">{humanizeSelectionModel(scheme.selectionModel.type)}</Stamp>
        <Stamp tone={status === "PUBLISHED" ? "ok" : "stamp"}>{humanizeEnum(status)}</Stamp>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-3 font-semibold">Publish lifecycle</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {LIFECYCLE.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className={i <= LIFECYCLE.indexOf(status) ? "font-semibold text-[color:var(--ink)]" : "text-[color:var(--muted)]"}>
                {s}
              </span>
              {i < LIFECYCLE.length - 1 ? <span className="text-[color:var(--muted)]">→</span> : null}
            </span>
          ))}
        </div>
        {user.role === "MOTA" && !atEnd ? (
          <form action={advancePolicyStatusAction.bind(null, code)} className="mt-4">
            <button className="btn-primary px-4 py-2 text-sm font-semibold">Advance to {nextStatus}</button>
          </form>
        ) : null}
        {atEnd ? <p className="mt-3 text-sm text-[color:var(--muted)]">Published. No silent edits: a new version is required to change active policy.</p> : null}
      </section>

      <section className="card mt-4 p-5">
        <h2 className="font-semibold">Policy QA</h2>
        {issues.length === 0 ? <p className="mt-2 text-sm text-[color:var(--muted)]">No blocking errors.</p> : null}
        {issues.map((i) => (
          <p key={i.message} className="mt-2 text-sm">
            <span className="font-semibold">{i.severity}</span> · {i.message}
          </p>
        ))}
      </section>

      {scheme.conflicts.map((c) => (
        <section key={c.id} className="card mt-4 p-5">
          <h2 className="font-semibold">Conflict {c.id}: {c.topic}</h2>
          <p className="mt-2 text-sm">Older: {c.olderMaterial}</p>
          <p className="text-sm">Current: {c.currentSource}</p>
          <p className="text-sm">Resolution: {c.resolution}</p>
          <p className="meta mt-2">
            {c.citation.sourceDocument} · {c.citation.effectiveFrom}
            {c.citation.supersedes ? ` · supersedes ${c.citation.supersedes}` : ""}
          </p>
        </section>
      ))}

      <section className="card mt-4 p-5">
        <h2 className="font-semibold">Eligibility rules</h2>
        <ul className="mt-3 space-y-3">
          {scheme.eligibilityRules.map((r) => (
            <li key={r.id}>
              <p className="font-semibold text-sm">{r.id} · {r.description}</p>
              <p className="meta">
                {r.citation.sourceDocument} p.{r.citation.sourcePage} · {r.citation.effectiveFrom} · fail → {r.failOutcome}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
