import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { friendlyDateTime, humanizeEnum } from "@/lib/format";
import { redirect } from "next/navigation";

export default async function AuditorPage() {
  const user = await requireRole(["AUDITOR"]);
  if (!user) redirect("/");
  const db = (await loadDb());
  const actorsCount = new Set(db.audit.map((e) => e.actorId)).size;
  const decisions = db.audit.filter((e) => e.action === "DECISION").length;

  return (
    <Shell user={user}>
      <p className="meta">Read-only</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Audit trail</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        This desk exists so that every official act, a decision, a correction, a policy change, an account created,
        is traceable to a named actor, a timestamp, and a scheme version, without needing to trust any single desk&apos;s
        word for what happened. Nothing here can be edited or deleted.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <div className="card p-4">
          <p className="meta">Logged events</p>
          <p className="font-[family-name:var(--font-display)] text-3xl">{db.audit.length}</p>
        </div>
        <div className="card p-4">
          <p className="meta">Distinct actors</p>
          <p className="font-[family-name:var(--font-display)] text-3xl">{actorsCount}</p>
        </div>
        <div className="card p-4">
          <p className="meta">Authorised decisions</p>
          <p className="font-[family-name:var(--font-display)] text-3xl">{decisions}</p>
        </div>
        <div className="card p-4">
          <p className="meta">AI corrections logged</p>
          <p className="font-[family-name:var(--font-display)] text-3xl">{db.aiFeedback.length}</p>
        </div>
      </div>

      {db.aiFeedback.length ? (
        <section className="card mb-6 p-5">
          <h2 className="mb-3 font-semibold">AI correction feedback</h2>
          <p className="mb-3 text-sm text-[color:var(--muted)]">
            Every officer correction to an AI-extracted field, with model version. This builds a curated dataset, not a live
            retraining feed.
          </p>
          <ul className="space-y-3 text-sm">
            {db.aiFeedback.map((f) => (
              <li key={f.id} className="border-t border-[color:var(--border)] pt-3">
                <p className="font-semibold">{f.applicationId} · {f.field}</p>
                <p className="text-[color:var(--muted)]">
                  &ldquo;{f.predictedValue}&rdquo; → &ldquo;{f.correctedValue}&rdquo; by {f.officerName} ({f.modelVersion})
                </p>
                <p className="meta">{friendlyDateTime(f.at)} · {f.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {db.renewals.length ? (
        <section className="card mb-6 p-5">
          <h2 className="mb-3 font-semibold">Renewal decisions</h2>
          <ul className="space-y-2 text-sm">
            {db.renewals.map((r) => (
              <li key={r.id} className="border-t border-[color:var(--border)] pt-2 first:border-0 first:pt-0">
                {r.applicationId} · {humanizeEnum(r.status)} {r.note ? `: ${r.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ol className="space-y-3">
        {db.audit.map((e) => (
          <li key={e.id} className="card p-4 text-sm">
            <p className="meta">{friendlyDateTime(e.at)}</p>
            <p>
              <span className="font-semibold">{e.actorName}</span> · {humanizeEnum(e.action)}
              {e.applicationId ? ` · ${e.applicationId}` : ""}
            </p>
            <p className="text-[color:var(--muted)]">{e.detail}</p>
          </li>
        ))}
      </ol>
    </Shell>
  );
}
