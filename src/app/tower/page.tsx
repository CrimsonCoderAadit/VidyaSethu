import { BarRows } from "@/components/BarChart";
import { FundRunway } from "@/components/FundRunway";
import { demoFundPlans, forecastFund } from "@/engine/forecast";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Reveal } from "@/components/motion/Reveal";
import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { humanizeEnum, humanizeSelectionModel } from "@/lib/format";
import { SCHEMES } from "@/schemes/registry";
import { redirect } from "next/navigation";

export default async function TowerPage() {
  const user = await requireRole(["MOTA", "AUDITOR", "FINANCE", "STATE", "INO"]);
  if (!user) redirect("/");
  const db = loadDb();
  const byScheme = SCHEMES.map((s) => {
    const apps = db.applications.filter((a) => a.schemeCode === s.code);
    const pendingIno = apps.filter((a) => a.status === "INSTITUTION_VERIFICATION").length;
    return { s, n: apps.length, pendingIno, eligible: apps.filter((a) => a.eligibility?.outcome === "ELIGIBLE").length };
  });
  const hitl = { L0: 0, L1: 0, L2: 0, L3: 0 };
  for (const a of db.applications) hitl[a.hitlLevel] += 1;

  const stageCounts = new Map<string, number>();
  for (const a of db.applications) stageCounts.set(a.status, (stageCounts.get(a.status) ?? 0) + 1);
  const stageRows = [...stageCounts.entries()]
    .map(([label, value]) => ({ label: humanizeEnum(label).toLowerCase(), value }))
    .sort((a, b) => b.value - a.value);

  const deficiencyRate = db.applications.length
    ? Math.round((db.applications.filter((a) => a.deficiencies.length > 0).length / db.applications.length) * 100)
    : 0;
  const reviewRequired = db.applications.filter((a) => a.hitlLevel === "L2" || a.hitlLevel === "L3").length;
  const appeals = db.applications.filter((a) => a.isAppeal).length;
  const liveEligible = Object.fromEntries(byScheme.map(({ s, eligible }) => [s.code, eligible]));
  const forecasts = demoFundPlans(liveEligible).map((p) => forecastFund(p));
  const allDocs = db.applications.flatMap((a) => a.documents);
  const docStats = [
    { label: "DigiLocker (no OCR)", value: allDocs.filter((d) => d.source === "DIGILOCKER").length },
    { label: "Auto-returned to applicant", value: allDocs.filter((d) => d.recovery && d.recovery.path !== "ASSISTED_ENTRY").length },
    { label: "Handwritten: field check", value: allDocs.filter((d) => d.recovery?.path === "ASSISTED_ENTRY").length },
    { label: "Read by OCR", value: allDocs.filter((d) => !d.recovery && d.source !== "DIGILOCKER").length },
  ];
  const schemeNames = Object.fromEntries(SCHEMES.map((s) => [s.code, s.shortName]));

  return (
    <Shell user={user}>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Operations control tower</h1>
      <p className="mb-6 mt-2 max-w-3xl text-sm text-[color:var(--muted)]">
        What is happening, where it is happening, and what needs action next. Scheme workflow, review-priority load,
        and the institution-verification bottleneck, in one view instead of a bare count of applications.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Reveal index={0} className="card stat-tile p-4">
          <p className="meta">Applications</p>
          <p className="font-[family-name:var(--font-display)] text-3xl"><AnimatedNumber value={db.applications.length} /></p>
        </Reveal>
        <Reveal index={1} className="card stat-tile p-4">
          <p className="meta">Require review</p>
          <p className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--danger)]"><AnimatedNumber value={reviewRequired} /></p>
        </Reveal>
        <Reveal index={2} className="card stat-tile p-4">
          <p className="meta">Deficiency rate</p>
          <p className="font-[family-name:var(--font-display)] text-3xl"><AnimatedNumber value={deficiencyRate} suffix="%" /></p>
        </Reveal>
        <Reveal index={3} className="card stat-tile p-4">
          <p className="meta">Open appeals</p>
          <p className="font-[family-name:var(--font-display)] text-3xl"><AnimatedNumber value={appeals} /></p>
        </Reveal>
      </div>

      <Reveal index={4}>
        <FundRunway forecasts={forecasts} names={schemeNames} />
      </Reveal>

      <Reveal index={4}>
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">Where documents come from, and what happens when OCR fails</h2>
          <p className="mb-4 mt-1 text-sm text-[color:var(--muted)]">
            Unreadable uploads never land in the MoTA queue. They go back to the applicant within seconds, with a retake tip or a
            one-tap DigiLocker fetch. Handwritten certificates get a field-level check instead of a full manual review.
          </p>
          <BarRows rows={docStats} tone="accent" />
        </section>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Reveal index={4}>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Review priority load</h2>
            <BarRows rows={Object.entries(hitl).map(([label, value]) => ({ label, value }))} tone="danger" />
          </section>
        </Reveal>
        <Reveal index={5}>
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Where applications currently sit</h2>
            <BarRows rows={stageRows} />
          </section>
        </Reveal>
      </div>

      <Reveal index={6}>
        <table className="card mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-xs uppercase tracking-wide text-[color:var(--muted)]">
              <th className="p-3">Scheme</th>
              <th>Files</th>
              <th>Eligible</th>
              <th>Institution pending</th>
              <th>Model</th>
            </tr>
          </thead>
          <tbody>
            {byScheme.map(({ s, n, pendingIno, eligible }) => (
              <tr key={s.code} className="border-t border-[color:var(--border)]">
                <td className="p-3 font-semibold">{s.shortName}</td>
                <td>{n}</td>
                <td>{eligible}</td>
                <td>{pendingIno}</td>
                <td className="meta">{humanizeSelectionModel(s.selectionModel.type)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>

      <Reveal index={7}>
        <section className="card mt-6 p-5">
          <h2 className="font-semibold">External monitors to retain</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-[color:var(--muted)]">
            <li>Annexure I: Pre-Matric and Post-Matric funds released, utilised, and beneficiaries through 2025-26</li>
            <li>Annexure II: Central Sector schemes, fund release and beneficiaries</li>
            <li>DBT Tribal live report (portal totals, not unique lifetime students without methodology)</li>
            <li>NFST, NOS, and NSP operational portals</li>
          </ul>
        </section>
      </Reveal>
    </Shell>
  );
}
