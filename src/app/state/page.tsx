import { EligibilityPanel } from "@/components/EligibilityPanel";
import { Shell, Stamp } from "@/components/Shell";
import { computeEntitlement } from "@/engine/eligibility";
import { requestDeficiencyAction, stateRecommendAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { roleContact } from "@/lib/roles";
import { humanizeEnum } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";
import { redirect } from "next/navigation";

export default async function StatePage() {
  const user = await requireRole(["STATE"]);
  if (!user) redirect("/");
  const db = loadDb();
  const apps = db.applications.filter(
    (a) => a.stateCode === user.stateCode && ["PRE_MATRIC", "POST_MATRIC"].includes(a.schemeCode) && a.status === "STATE_VERIFICATION",
  );
  const motaEmail = roleContact(db.users, "MOTA");

  return (
    <Shell user={user}>
      <p className="meta">State / UT desk · {user.stateCode}</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">State / UT queue</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        {apps.length} Pre-Matric / Post-Matric application{apps.length === 1 ? "" : "s"} from your State/UT waiting on
        verification and recommendation for DBT.
      </p>
      {apps.length === 0 ? (
        <p className="card p-5 text-sm text-[color:var(--muted)]">Nothing pending for {user.stateCode}.</p>
      ) : null}
      <div className="space-y-6">
        {apps.map((app) => {
          const scheme = schemeByCode(app.schemeCode);
          const entitlement = computeEntitlement(scheme, app.facts);
          return (
            <article key={app.id} className="card p-5">
              <div className="mb-3 flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{app.applicantName}</h2>
                  <p className="meta">{app.id}</p>
                </div>
                <Stamp>{humanizeEnum(app.status)}</Stamp>
              </div>
              {app.eligibility ? <EligibilityPanel result={app.eligibility} /> : null}
              {entitlement ? <p className="mt-3 text-sm">{entitlement.label}: ₹{entitlement.amount.toLocaleString("en-IN")}</p> : null}

              <form
                className="mt-4"
                action={async () => {
                  "use server";
                  await stateRecommendAction(app.id, "State verification complete. Recommend for DBT.");
                }}
              >
                <button className="btn-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em]">Recommend for DBT</button>
              </form>
              {motaEmail ? (
                <p className="mt-2 text-xs text-[color:var(--muted)]">Forwards for the authorised decision ({motaEmail}).</p>
              ) : null}

              <form
                className="mt-3 flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-3"
                action={async (fd) => {
                  "use server";
                  await requestDeficiencyAction(app.id, String(fd.get("reason") ?? "State verification found an issue."));
                }}
              >
                <input name="reason" placeholder="What needs correction before this can be recommended?" className="field-input flex-1" required />
                <button className="btn-outline px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--accent)]">Request correction</button>
              </form>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Sends a correction request back to the applicant. Only MoTA records a final approve/reject decision.
              </p>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
