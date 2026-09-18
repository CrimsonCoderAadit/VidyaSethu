import { BarRows } from "@/components/BarChart";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Reveal } from "@/components/motion/Reveal";
import { Shell, Stamp } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { friendlyDateTime, hitlLabel, humanizeEnum } from "@/lib/format";
import { SCHEMES } from "@/schemes/registry";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ApplicantHome() {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  const db = loadDb();
  const apps = db.applications.filter((a) => a.applicantId === user.id);
  const notes = db.notifications.filter((n) => n.userId === user.id);
  const awarded = apps.filter((a) => ["AWARDED", "AUTHORISED_DECISION"].includes(a.status)).length;
  const needsAction = apps.filter((a) => a.deficiencies.some((d) => d.status === "OPEN")).length;

  const stageRows = [...new Map(apps.map((a) => [a.status, apps.filter((x) => x.status === a.status).length])).entries()]
    .map(([label, value]) => ({ label: humanizeEnum(label).toLowerCase(), value }));

  return (
    <Shell user={user}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="meta">Applicant desk</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Your files</h1>
        </div>
        <Link href="/applicant/schemes" className="btn-primary px-4 py-2.5 text-sm font-semibold">
          File a new scheme
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Reveal index={0} className="card stat-tile p-4">
          <p className="meta">Applications on file</p>
          <p className="font-[family-name:var(--font-display)] text-3xl"><AnimatedNumber value={apps.length} /></p>
        </Reveal>
        <Reveal index={1} className="card card-accent-ok stat-tile p-4">
          <p className="meta">Awarded / decided</p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--ok)]"><AnimatedNumber value={awarded} /></p>
        </Reveal>
        <Reveal index={2} className="card card-accent-warn stat-tile p-4">
          <p className="meta">Need your action</p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--warn)]"><AnimatedNumber value={needsAction} /></p>
        </Reveal>
      </div>

      {stageRows.length > 1 ? (
        <Reveal index={3}>
          <section className="card mt-6 p-5">
            <h2 className="mb-4 font-semibold">Where your files stand</h2>
            <BarRows rows={stageRows} />
          </section>
        </Reveal>
      ) : null}

      {notes.length ? (
        <Reveal index={4}>
          <section className="card mt-6 p-4">
            <h2 className="font-semibold">Notices</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {notes.map((n) => (
                <li key={n.id}>
                  <span className="meta">{friendlyDateTime(n.at)}</span> · {n.title}: {n.body}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ) : null}

      <div className="mt-6 grid gap-4">
        {apps.map((app, i) => {
          const scheme = SCHEMES.find((s) => s.code === app.schemeCode);
          return (
            <Reveal key={app.id} index={5 + i}>
              <Link href={`/applicant/applications/${app.id}`} className="card card-hover block p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{app.id}</p>
                  <Stamp>{humanizeEnum(app.status)}</Stamp>
                </div>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{scheme?.shortName} · {app.academicYear} · {scheme ? humanizeEnum(scheme.selectionModel.type) : ""}</p>
                {app.eligibility ? (
                  <p className="mt-2 text-sm">
                    Eligibility: {humanizeEnum(app.eligibility.outcome)} · {hitlLabel(app.hitlLevel)}
                  </p>
                ) : null}
              </Link>
            </Reveal>
          );
        })}
      </div>
    </Shell>
  );
}
