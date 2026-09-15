import { Shell, Stamp } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { SCHEMES } from "@/schemes/registry";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SchemesPage() {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  return (
    <Shell user={user}>
      <p className="meta">Scheme registry · published versions only</p>
      <h1 className="font-[family-name:var(--font-display)] mb-6 text-3xl">Choose a scheme, not a score</h1>
      <div className="grid gap-5">
        {SCHEMES.map((s) => (
          <article key={s.code} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl">{s.name}</h2>
                <p className="text-sm text-[color:var(--muted)]">{s.implementation}</p>
              </div>
              <Stamp tone="rule">{s.selectionModel.type}</Stamp>
            </div>
            <p className="mt-3 text-sm">{s.selectionCharacter}</p>
            <p className="meta mt-2">
              {s.version} · {s.academicYear} · {s.officialSources[0]}
            </p>
            <Link href={`/applicant/apply/${s.code}`} className="btn-primary mt-4 inline-block px-4 py-2 text-sm font-semibold">
              Open {s.shortName} form
            </Link>
          </article>
        ))}
      </div>
    </Shell>
  );
}
