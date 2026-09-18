import { Shell, Stamp } from "@/components/Shell";
import { runSelectionAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { friendlyDateTime, humanizeSelectionModel } from "@/lib/format";
import { SCHEMES } from "@/schemes/registry";
import { redirect } from "next/navigation";

export default async function SelectionPage() {
  const user = await requireRole(["MOTA"]);
  if (!user) redirect("/");
  const runs = loadDb().selectionRuns;

  return (
    <Shell user={user}>
      <p className="meta">Merit / committee / entitlement runs</p>
      <h1 className="font-[family-name:var(--font-display)] mb-1 text-3xl">Scheme-specific selection</h1>
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--muted)]">
        Pre-Matric, Post-Matric and Top Class produce an entitlement pool. NFST fills 750 preference buckets on
        Master&apos;s marks. NOS waits for committee scores. There is no combined leaderboard.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {SCHEMES.map((s) => (
          <form key={s.code} action={runSelectionAction.bind(null, s.code)} className="card p-4">
            <p className="font-semibold">{s.shortName}</p>
            <p className="meta">{humanizeSelectionModel(s.selectionModel.type)}</p>
            <button className="btn-outline mt-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em]">Run {s.shortName} selection</button>
          </form>
        ))}
      </div>
      <div className="mt-8 space-y-6">
        {runs.map((run) => (
          <section key={run.id} className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-[family-name:var(--font-display)] text-xl">{run.schemeId}</h2>
              <Stamp tone="rule">{humanizeSelectionModel(run.model)}</Stamp>
            </div>
            <p className="meta">{friendlyDateTime(run.createdAt)}</p>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
                  <th className="py-2">Applicant</th>
                  <th>Merit</th>
                  <th>Bucket</th>
                  <th>Selected</th>
                </tr>
              </thead>
              <tbody>
                {run.candidates.map((c) => (
                  <tr key={c.applicationId} className="border-t border-[color:var(--border)]">
                    <td className="py-2">{c.applicantName}</td>
                    <td>{c.meritScore ?? "—"}</td>
                    <td>{c.bucket}</td>
                    <td>{c.selected ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </Shell>
  );
}
