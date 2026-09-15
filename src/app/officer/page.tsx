import { BarRows } from "@/components/BarChart";
import { Shell, Stamp } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OfficerQueue() {
  const user = await requireRole(["MOTA"]);
  if (!user) redirect("/");
  const db = loadDb();
  const apps = db.applications.filter((a) =>
    ["MOTA_SCRUTINY", "ELIGIBILITY", "SELECTION", "AUTHORISED_DECISION", "DEFICIENCY"].includes(a.status),
  );
  const ordered = [...apps].sort((a, b) => a.hitlLevel.localeCompare(b.hitlLevel) * -1);
  const appeals = apps.filter((a) => a.isAppeal).length;

  const hitl = { L0: 0, L1: 0, L2: 0, L3: 0 } as Record<string, number>;
  for (const a of db.applications) hitl[a.hitlLevel] += 1;
  const bySchemeMap = new Map<string, number>();
  for (const a of db.applications) bySchemeMap.set(a.schemeCode, (bySchemeMap.get(a.schemeCode) ?? 0) + 1);

  return (
    <Shell user={user}>
      <p className="meta">Review-priority queue</p>
      <h1 className="font-[family-name:var(--font-display)] mb-1 text-3xl">Which file needs a person?</h1>
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--muted)]">
        {apps.length} application{apps.length === 1 ? "" : "s"} waiting on you, ordered by review priority (L2 before
        L1 before L0). AI never awards — the queue surfaces attention, evidence, the applicable rule, and the next
        official act.{" "}
        {appeals > 0 ? <span className="font-semibold text-[color:var(--danger)]">{appeals} of these are appeals.</span> : null}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">Review priority load</h2>
          <BarRows rows={Object.entries(hitl).map(([label, value]) => ({ label, value }))} tone="danger" />
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-semibold">All applications, by scheme</h2>
          <BarRows rows={[...bySchemeMap.entries()].map(([label, value]) => ({ label, value }))} tone="accent" />
        </section>
      </div>

      <h2 className="mb-3 mt-8 font-[family-name:var(--font-display)] text-xl">Your queue</h2>
      {apps.length === 0 ? (
        <p className="card p-5 text-sm text-[color:var(--muted)]">Queue is clear.</p>
      ) : null}
      <div className="space-y-3">
        {ordered.map((app) => (
          <Link key={app.id} href={`/officer/${app.id}`} className="card card-hover block p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">
                {app.id} · {app.applicantName}
              </p>
              <div className="flex gap-2">
                {app.isAppeal ? <Stamp tone="danger">Appeal</Stamp> : null}
                <Stamp tone={app.hitlLevel === "L2" || app.hitlLevel === "L3" ? "danger" : app.hitlLevel === "L0" ? "ok" : "stamp"}>
                  {app.hitlLevel}
                </Stamp>
                <Stamp tone="rule">{app.eligibility?.outcome}</Stamp>
              </div>
            </div>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              {app.schemeCode} · {app.status.replaceAll("_", " ")}
            </p>
            <p className="mt-2 text-sm text-[color:var(--muted)]">{app.hitlReasons[0]}</p>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
