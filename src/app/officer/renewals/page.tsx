import { Shell, Stamp } from "@/components/Shell";
import { decideRenewalAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function RenewalsPage() {
  const user = await requireRole(["MOTA"]);
  if (!user) redirect("/");
  const db = loadDb();
  const pending = db.renewals.filter((r) => r.status === "PENDING");

  return (
    <Shell user={user}>
      <p className="meta">Renewal / continuation engine</p>
      <h1 className="font-[family-name:var(--font-display)] mb-1 text-3xl">Renewal requests</h1>
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--muted)]">
        {pending.length} request{pending.length === 1 ? "" : "s"} waiting on a decision. Renewal uses the current
        scheme version's rules, not the version the original award was made under.
      </p>
      {pending.length === 0 ? (
        <p className="card p-5 text-sm text-[color:var(--muted)]">No pending renewal requests.</p>
      ) : null}
      <div className="space-y-4">
        {pending.map((r) => {
          const award = db.awards.find((a) => a.id === r.awardId);
          return (
            <article key={r.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{r.applicationId}</p>
                {award ? <Stamp>{award.schemeCode}</Stamp> : null}
              </div>
              <p className="meta">Requested {r.requestedAt}</p>
              <form
                className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_auto_auto]"
                action={async (fd) => {
                  "use server";
                  await decideRenewalAction(r.id, String(fd.get("decision")) as "APPROVED" | "DEFICIENT" | "REVIEW", String(fd.get("note") ?? ""));
                }}
              >
                <input name="note" className="field-input" placeholder="Decision note" />
                <button name="decision" value="APPROVED" className="btn-primary px-4 py-2 text-xs font-semibold uppercase">Approve</button>
                <button name="decision" value="DEFICIENT" className="btn-outline px-4 py-2 text-xs font-semibold uppercase text-[color:var(--accent)]">Deficient</button>
                <button name="decision" value="REVIEW" className="btn-outline px-4 py-2 text-xs font-semibold uppercase">Review</button>
              </form>
            </article>
          );
        })}
      </div>
    </Shell>
  );
}
