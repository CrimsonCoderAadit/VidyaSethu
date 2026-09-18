import { BarRows } from "@/components/BarChart";
import { Shell, Stamp } from "@/components/Shell";
import { computeEntitlement } from "@/engine/eligibility";
import { financeMarkFailedAction, financeMarkPaidAction, verifyMilestoneAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { humanizeEnum } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";
import { redirect } from "next/navigation";

export default async function FinancePage() {
  const user = await requireRole(["FINANCE"]);
  if (!user) redirect("/");
  const db = loadDb();
  const awards = db.awards;
  const pending = awards.filter((a) => a.status !== "PAID").length;

  const withAmount = awards.map((a) => {
    const app = db.applications.find((x) => x.id === a.applicationId);
    const scheme = schemeByCode(a.schemeCode);
    const entitlement = app ? computeEntitlement(scheme, app.facts) : null;
    return { award: a, amount: entitlement?.amount ?? 0 };
  });
  const totalValue = withAmount.reduce((sum, x) => sum + x.amount, 0);
  const paidValue = withAmount.filter((x) => x.award.status === "PAID").reduce((sum, x) => sum + x.amount, 0);
  const pendingValue = totalValue - paidValue;

  const byScheme = new Map<string, number>();
  for (const a of awards) byScheme.set(a.schemeCode, (byScheme.get(a.schemeCode) ?? 0) + 1);

  return (
    <Shell user={user}>
      <p className="meta">Payment boundary</p>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Sanctions & payments</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        {pending} of {awards.length} sanctioned awards are awaiting a PFMS/DBT/Mission acknowledgement. This desk
        tracks status; it does not replace those payment systems. Amounts below are estimates from each scheme's
        entitlement formula, not confirmed disbursement figures.
      </p>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-4">
          <p className="meta">Sanctioned awards</p>
          <p className="font-[family-name:var(--font-display)] text-3xl">{awards.length}</p>
        </div>
        <div className="card p-4">
          <p className="meta">Estimated value</p>
          <p className="font-[family-name:var(--font-display)] text-3xl">₹{totalValue.toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-4">
          <p className="meta">Acknowledged / paid</p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--ok)]">₹{paidValue.toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-4">
          <p className="meta">Pending acknowledgement</p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--accent)]">₹{pendingValue.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {byScheme.size ? (
        <section className="card mt-6 p-5">
          <h2 className="mb-4 font-semibold">Awards by scheme</h2>
          <BarRows rows={[...byScheme.entries()].map(([label, value]) => ({ label, value }))} tone="accent" />
        </section>
      ) : null}

      {awards.length === 0 ? (
        <p className="card mt-6 p-5 text-sm text-[color:var(--muted)]">No sanctioned awards yet. An authorised MoTA decision creates a sanction record.</p>
      ) : null}
      <div className="mt-6 space-y-3">
        {awards.map((a) => (
          <article key={a.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{a.applicationId}</p>
                <p className="meta">{a.schemeCode} · {humanizeEnum(a.lifecycle).toLowerCase()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Stamp tone={a.status === "PAID" ? "ok" : a.status === "FAILED" ? "danger" : "stamp"}>{humanizeEnum(a.status)}</Stamp>
                {a.status !== "PAID" && a.status !== "FAILED" ? (
                  <>
                    <form action={financeMarkPaidAction.bind(null, a.id)}>
                      <button className="text-sm text-[color:var(--primary)] hover:underline">Mark acknowledged</button>
                    </form>
                    <form
                      action={async (fd) => {
                        "use server";
                        await financeMarkFailedAction(a.id, String(fd.get("reason") ?? ""));
                      }}
                      className="flex items-center gap-1"
                    >
                      <input name="reason" placeholder="Failure reason" className="field-input w-40 py-1 text-xs" />
                      <button className="text-sm text-[color:var(--danger)] hover:underline">Mark failed</button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
            <ul className="mt-3 space-y-1.5 border-t border-[color:var(--border)] pt-3 text-sm">
              {a.milestones.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className={`stamp ${m.status === "DONE" ? "text-spine" : ""}`}>{humanizeEnum(m.status)}</span>
                    {m.label}
                  </span>
                  {m.status === "PENDING" && m.id !== "m-join" ? (
                    <form action={verifyMilestoneAction.bind(null, a.id, m.id)}>
                      <button className="text-xs text-[color:var(--primary)] hover:underline">Verify</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Shell>
  );
}
