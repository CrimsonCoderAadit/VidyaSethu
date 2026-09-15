import { EligibilityPanel } from "@/components/EligibilityPanel";
import { Shell, Stamp } from "@/components/Shell";
import { StagePipeline } from "@/components/StagePipeline";
import { computeEntitlement } from "@/engine/eligibility";
import { confirmJoiningAction, raiseAppealAction, requestRenewalAction, resolveDeficiencyAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { schemeByCode } from "@/schemes/registry";
import { notFound, redirect } from "next/navigation";

const AWARD_STAGES = ["AWARDED", "JOINING_PENDING", "ACTIVE", "RENEWAL_DUE", "RENEWAL_REVIEW", "COMPLETED"];
const AWARD_LABELS: Record<string, string> = {
  AWARDED: "Sanctioned",
  JOINING_PENDING: "Joining pending",
  ACTIVE: "Active award",
  RENEWAL_DUE: "Renewal due",
  RENEWAL_REVIEW: "Renewal under review",
  COMPLETED: "Completed",
};

export default async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  const { id } = await params;
  const db = loadDb();
  const app = db.applications.find((a) => a.id === id && a.applicantId === user.id);
  if (!app) notFound();
  const scheme = schemeByCode(app.schemeCode);
  const entitlement = computeEntitlement(scheme, app.facts);
  const award = db.awards.find((a) => a.applicationId === app.id);

  return (
    <Shell user={user}>
      <p className="meta">{app.id}</p>
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{scheme.shortName}</h1>
        <Stamp>{app.status.replaceAll("_", " ")}</Stamp>
        <Stamp tone="rule">{app.hitlLevel}</Stamp>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-4 font-semibold">Application progress</h2>
        <StagePipeline stages={scheme.workflow} current={app.status} />
      </section>

      <div className="mt-6">{app.eligibility ? <EligibilityPanel result={app.eligibility} /> : null}</div>

      {entitlement ? (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">Entitlement preview</h2>
          <p className="mt-2 text-sm">{entitlement.label}{entitlement.amount ? ` · ₹${entitlement.amount.toLocaleString("en-IN")}` : ""}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-[color:var(--muted)]">
            {entitlement.breakdown.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {app.deficiencies.some((d) => d.status === "OPEN") ? (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold text-[color:var(--accent)]">Action required</h2>
          {app.deficiencies.filter((d) => d.status === "OPEN").map((d) => (
            <p key={d.id} className="mt-2 text-sm">{d.reason}</p>
          ))}
          <form action={resolveDeficiencyAction.bind(null, app.id)} className="mt-4">
            <button className="btn-primary px-4 py-2 text-sm font-semibold">Resubmit corrections</button>
          </form>
        </section>
      ) : null}

      {award ? (
        <section className="card mt-6 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Award & fellowship lifecycle</h2>
            <Stamp tone={award.status === "PAID" ? "ok" : "stamp"}>{award.status}</Stamp>
          </div>
          <StagePipeline stages={AWARD_STAGES} current={award.lifecycle} labels={AWARD_LABELS} />

          <ul className="mt-5 space-y-2 text-sm">
            {award.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span className={`stamp ${m.status === "DONE" ? "text-spine" : ""}`}>{m.status}</span>
                {m.label}
              </li>
            ))}
          </ul>

          <ul className="mt-4 list-disc pl-5 text-sm text-[color:var(--muted)]">
            {award.components.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>

          {award.lifecycle === "AWARDED" ? (
            <form action={confirmJoiningAction.bind(null, award.id)} className="mt-4">
              <button className="btn-primary px-4 py-2 text-sm font-semibold">Confirm joining / acceptance</button>
            </form>
          ) : null}

          {award.lifecycle === "ACTIVE" ? (
            <form action={requestRenewalAction.bind(null, award.id)} className="mt-4">
              <button className="btn-outline px-4 py-2 text-sm font-semibold">Request renewal / continuation</button>
            </form>
          ) : null}
        </section>
      ) : null}

      {app.status === "REJECTED" || app.authorisedDecision === "REJECTED" ? (
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">Appeal / reconsideration</h2>
          <form
            className="mt-3"
            action={async (fd) => {
              "use server";
              await raiseAppealAction(app.id, String(fd.get("reason") ?? ""));
            }}
          >
            <textarea name="reason" className="field-input" placeholder="What should be reconsidered, and on which evidence?" />
            <button className="btn-primary mt-3 px-4 py-2 text-sm font-semibold">File appeal</button>
          </form>
        </section>
      ) : null}

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Documents & evidence</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {app.documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] pt-2 first:border-0 first:pt-0">
              <span>{d.documentType} · {d.fileName}</span>
              <span className="meta">OCR {Math.round(d.ocrConfidence * 100)}% · trust {d.trust} · {d.quality}</span>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
