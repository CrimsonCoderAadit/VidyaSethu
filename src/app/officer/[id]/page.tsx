import { EligibilityPanel } from "@/components/EligibilityPanel";
import { Shell, Stamp } from "@/components/Shell";
import { StagePipeline } from "@/components/StagePipeline";
import { consistencyChecks } from "@/engine/intelligence";
import {
  confirmFactAction,
  correctFactAction,
  officerDecisionAction,
  requestDeficiencyAction,
  selectiveReverifyAction,
} from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { friendlyDateTime, hitlLabel, humanizeEnum, humanizeField, humanizeSelectionModel } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";
import { notFound, redirect } from "next/navigation";

export default async function OfficerCase({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["MOTA", "AUDITOR"]);
  if (!user) redirect("/");
  const { id } = await params;
  const db = loadDb();
  const app = db.applications.find((a) => a.id === id);
  if (!app) notFound();
  const scheme = schemeByCode(app.schemeCode);
  const findings = consistencyChecks(app.facts, app.documents);
  const applicant = db.users.find((u) => u.id === app.applicantId);

  return (
    <Shell user={user}>
      <p className="meta">
        Evidence copilot · scheme {scheme.shortName} {scheme.version} · model {humanizeSelectionModel(scheme.selectionModel.type)}
      </p>
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">{app.applicantName}</h1>
        <Stamp>{app.id}</Stamp>
        <Stamp tone="rule">{hitlLabel(app.hitlLevel)}</Stamp>
        {app.isAppeal ? <Stamp tone="danger">Appeal</Stamp> : null}
      </div>
      {app.isAppeal && app.appealReason ? (
        <p className="mb-2 text-sm text-[color:var(--danger)]">Appeal reason: {app.appealReason}</p>
      ) : null}
      <ul className="mb-4 text-sm text-[color:var(--muted)]">
        {app.hitlReasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>

      <section className="card mb-6 p-5">
        <h2 className="mb-4 font-semibold">Workflow position</h2>
        <StagePipeline stages={scheme.workflow} current={app.status} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {app.eligibility ? <EligibilityPanel result={app.eligibility} /> : null}
        <section className="card p-5">
          <h2 className="font-semibold">Cross-document findings</h2>
          {findings.length === 0 ? <p className="mt-3 text-sm text-[color:var(--muted)]">No unresolved conflicts in extracted evidence.</p> : null}
          {findings.map((f, i) => (
            <p key={`${f.id}-${i}`} className="mt-3 text-sm">
              <span className="font-semibold">{f.severity}</span> · {f.message}
            </p>
          ))}
          <h3 className="mt-6 text-sm font-semibold">Evidence</h3>
          <ul className="mt-2 space-y-3 text-sm">
            {app.documents.map((d) => (
              <li key={d.id} className="border-t border-[color:var(--border)] pt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{humanizeEnum(d.documentType)}</span>
                  <span className="flex gap-1.5">
                    <span className="stamp">OCR {Math.round(d.ocrConfidence * 100)}%</span>
                    <span className={`stamp ${d.trust <= "C" ? "text-spine" : d.trust === "D" ? "text-rule" : "text-danger"}`}>trust {d.trust}</span>
                  </span>
                </div>
                <table className="mt-2 w-full text-left text-xs">
                  <tbody>
                    {Object.entries(d.extracted).map(([k, v]) => (
                      <tr key={k} className="border-t border-[color:var(--border)]">
                        <td className="py-1 pr-3 text-[color:var(--muted)]">{humanizeField(k)}</td>
                        <td className="py-1">{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Facts (confirm / correct)</h2>
        <p className="mb-3 mt-1 text-sm text-[color:var(--muted)]">
          Changing a fact re-runs only this scheme&apos;s eligibility rules. It does not invent a merit score.
        </p>
        <ul className="space-y-3">
          {app.facts.map((fact) => (
            <li key={fact.field} className="border-t border-[color:var(--border)] pt-3 text-sm">
              <p className="font-semibold">
                {humanizeField(fact.field)}: {String(fact.value)} · {humanizeEnum(fact.source)} · {fact.verified ? "verified" : "unverified"}
              </p>
              {user.role !== "AUDITOR" ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await confirmFactAction(app.id, fact.field);
                    }}
                  >
                    <button className="text-[color:var(--primary)] hover:underline">Confirm</button>
                  </form>
                  <form
                    className="flex gap-2"
                    action={async (fd) => {
                      "use server";
                      await correctFactAction(app.id, fact.field, String(fd.get("value") ?? ""));
                    }}
                  >
                    <input name="value" defaultValue={String(fact.value ?? "")} className="field-input py-1" />
                    <button className="text-[color:var(--primary)] hover:underline">Correct</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {user.role !== "AUDITOR" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <form
            className="card p-5"
            action={async (fd) => {
              "use server";
              await officerDecisionAction(app.id, "APPROVED", String(fd.get("note") ?? "Authorised"));
            }}
          >
            <h2 className="font-semibold">Authorised decision</h2>
            <textarea name="note" className="field-input mt-3" placeholder="Officer note (mandatory for the audit trail)" />
            <button className="btn-primary mt-3 px-4 py-2 text-sm font-semibold">Approve</button>
            {applicant ? <p className="mt-2 text-xs text-[color:var(--muted)]">Notifies the applicant ({applicant.email}) and creates a sanction record.</p> : null}
          </form>
          <form
            className="card p-5"
            action={async (fd) => {
              "use server";
              await officerDecisionAction(app.id, "REJECTED", String(fd.get("note") ?? "Rejected"));
            }}
          >
            <h2 className="font-semibold">Reject</h2>
            <textarea name="note" className="field-input mt-3" placeholder="Cite the failed rule" />
            <button className="btn-danger mt-3 px-4 py-2 text-sm font-semibold">Reject</button>
            {applicant ? <p className="mt-2 text-xs text-[color:var(--muted)]">Notifies the applicant ({applicant.email}); they may file an appeal.</p> : null}
          </form>
          <form
            className="card p-5"
            action={async (fd) => {
              "use server";
              await officerDecisionAction(app.id, "DEFERRED", String(fd.get("note") ?? "Escalated for senior review"));
            }}
          >
            <h2 className="font-semibold">Defer to senior review</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              For adverse decisions, integrity signals, or policy exceptions (escalated review) leaves the file in the
              queue and logs why it needs a second look, without approving or rejecting it.
            </p>
            <textarea name="note" className="field-input mt-3" placeholder="Why does this need senior review?" />
            <button className="btn-outline mt-3 px-4 py-2 text-sm font-semibold">Defer / escalate</button>
          </form>
          <form
            className="card p-5"
            action={async (fd) => {
              "use server";
              await requestDeficiencyAction(app.id, String(fd.get("reason") ?? "Correction required"));
            }}
          >
            <h2 className="font-semibold">Raise deficiency</h2>
            <textarea name="reason" className="field-input mt-3" placeholder="What is missing or inconsistent, and which rule?" />
            <button className="btn-outline mt-3 px-4 py-2 text-sm font-semibold text-[color:var(--accent)]">Issue deficiency</button>
            {applicant ? <p className="mt-2 text-xs text-[color:var(--muted)]">Sends a correction request to the applicant ({applicant.email}).</p> : null}
          </form>
          <form
            className="card p-5"
            action={async (fd) => {
              "use server";
              await selectiveReverifyAction(app.id, String(fd.get("fields") ?? "fullName"));
            }}
          >
            <h2 className="font-semibold">Selective re-verification</h2>
            <p className="mt-2 text-sm text-[color:var(--muted)]">Re-check only the named fields. Do not re-open the whole file.</p>
            <input name="fields" defaultValue="fullName,familyIncome" className="field-input mt-3" />
            <button className="btn-outline mt-3 px-4 py-2 text-sm font-semibold">Re-verify named fields</button>
          </form>
        </div>
      ) : null}

      <section className="card mt-6 p-5">
        <h2 className="font-semibold">Workflow</h2>
        <ol className="mt-3 space-y-2 text-sm">
          {app.timeline.map((e, i) => (
            <li key={`${e.at}-${i}`}>
              <span className="meta">{friendlyDateTime(e.at)}</span> · {humanizeEnum(e.stage)} · {e.actor}: {e.note}
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
