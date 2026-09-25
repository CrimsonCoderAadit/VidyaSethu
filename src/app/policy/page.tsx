import { Shell, Stamp } from "@/components/Shell";
import { qaScheme } from "@/engine/policyQa";
import { requireRole } from "@/lib/auth";
import { humanizeEnum } from "@/lib/format";
import { loadDb } from "@/lib/db";
import { SCHEMES } from "@/schemes/registry";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PolicyStudio() {
  const user = await requireRole(["MOTA"]);
  if (!user) redirect("/");
  const policyStatus = (await loadDb()).policyStatus;
  return (
    <Shell user={user}>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Policy studio</h1>
      <p className="mb-6 mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
        Versioned configuration, not a new codebase per scheme. Draft → validate → test → approve → publish. Active
        policy is never silently edited.
      </p>
      <div className="space-y-4">
        {SCHEMES.map((s) => {
          const issues = qaScheme(s);
          const status = policyStatus[s.code] ?? s.status;
          return (
            <Link key={s.code} href={`/policy/${s.code}`} className="card card-hover block p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">{s.shortName}</h2>
                <Stamp tone={status === "PUBLISHED" ? "ok" : "stamp"}>{humanizeEnum(status)}</Stamp>
              </div>
              <p className="meta">
                {s.version} · effective sources: {s.officialSources.join("; ")}
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{issues.length} QA flags · {s.eligibilityRules.length} eligibility rules · {s.conflicts.length} stored conflicts</p>
            </Link>
          );
        })}
      </div>
    </Shell>
  );
}
