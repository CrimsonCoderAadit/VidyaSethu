import { Shell, Stamp } from "@/components/Shell";
import { committeeScoreAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { humanizeEnum, optionLabel } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";
import { redirect } from "next/navigation";

function fact(app: { facts: { field: string; value: unknown }[] }, field: string) {
  return app.facts.find((f) => f.field === field)?.value;
}

export default async function CommitteePage() {
  const user = await requireRole(["COMMITTEE"]);
  if (!user) redirect("/");
  const db = (await loadDb());
  const nos = schemeByCode("NOS");
  const apps = db.applications.filter(
    (a) => a.schemeCode === "NOS" && a.eligibility?.outcome === "ELIGIBLE" && a.committeeScore === undefined,
  );
  const scored = db.applications.filter((a) => a.schemeCode === "NOS" && a.committeeScore !== undefined);
  const motaEmail = db.users.find((u) => u.role === "MOTA")?.email;

  return (
    <Shell user={user}>
      <p className="meta">Selection committee</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">NOS dossiers</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        {apps.length} eligible dossier{apps.length === 1 ? "" : "s"} ready for interview assessment. Twenty fresh
        awards: 17 ST + 3 PVTG, with a 30% female earmark.
      </p>
      {apps.length === 0 ? (
        <p className="card p-5 text-sm text-[color:var(--muted)]">No eligible dossiers waiting on assessment right now.</p>
      ) : null}
      <div className="space-y-5">
        {apps.map((app) => (
          <article key={app.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{app.applicantName}</h2>
                <p className="meta">{app.id}</p>
              </div>
              <Stamp tone="rule">{optionLabel(nos, "fieldOfStudy", fact(app, "fieldOfStudy"))}</Stamp>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[color:var(--border)] pt-4 text-sm md:grid-cols-3">
              <div>
                <dt className="meta">Programme</dt>
                <dd>{optionLabel(nos, "programmeLevel", fact(app, "programmeLevel"))}</dd>
              </div>
              <div>
                <dt className="meta">Institution</dt>
                <dd>{String(fact(app, "foreignInstitution") ?? "—")}</dd>
              </div>
              <div>
                <dt className="meta">QS rank</dt>
                <dd>{String(fact(app, "qsWorldRank") ?? "—")}</dd>
              </div>
              <div>
                <dt className="meta">Qualifying marks</dt>
                <dd>{String(fact(app, "qualifyingMarks") ?? "—")}%</dd>
              </div>
              <div>
                <dt className="meta">Family income</dt>
                <dd>₹{Number(fact(app, "familyIncome") ?? 0).toLocaleString("en-IN")}</dd>
              </div>
              <div>
                <dt className="meta">Admission status</dt>
                <dd>{optionLabel(nos, "admissionStatus", fact(app, "admissionStatus"))}</dd>
              </div>
              <div>
                <dt className="meta">Age on 1 July</dt>
                <dd>{String(fact(app, "ageOn1July") ?? "—")}</dd>
              </div>
              <div>
                <dt className="meta">PVTG</dt>
                <dd>{fact(app, "pvtg") ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="meta">Previous NOS award</dt>
                <dd>{fact(app, "previousNos") ? "Yes" : "No"}</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm">
              <span className="meta">Proposal: </span>
              {String(fact(app, "proposal") ?? "")}
            </p>

            <form
              className="mt-4 flex flex-wrap gap-2"
              action={async (fd) => {
                "use server";
                await committeeScoreAction(app.id, Number(fd.get("score")), String(fd.get("note") ?? ""));
              }}
            >
              <input name="score" type="number" min={0} max={100} placeholder="Score" className="field-input w-28" required />
              <input name="note" placeholder="Interview assessment" className="field-input flex-1" required />
              <button className="btn-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]">Record assessment</button>
            </form>
            {motaEmail ? (
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Recording this forwards the dossier to the MoTA Verification Officer ({motaEmail}) for the authorised decision.
              </p>
            ) : null}
          </article>
        ))}
      </div>

      {scored.length ? (
        <section className="card mt-8 p-5">
          <h2 className="mb-3 font-semibold">Already assessed</h2>
          <ul className="space-y-2 text-sm">
            {scored.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 border-t border-[color:var(--border)] pt-2 first:border-0 first:pt-0">
                <span>{a.applicantName} · {a.id}</span>
                <span className="meta">Score {a.committeeScore} · forwarded to MoTA</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Shell>
  );
}
