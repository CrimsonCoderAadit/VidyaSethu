import { Reveal } from "@/components/motion/Reveal";
import { Shell, Stamp } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { humanizeSelectionModel } from "@/lib/format";
import { getT } from "@/lib/lang";
import { SCHEMES } from "@/schemes/registry";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SchemesPage() {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  const { t, lang } = await getT();
  return (
    <Shell user={user}>
      <p className="meta">{t("Scheme registry · published versions only")}</p>
      <h1 className="font-[family-name:var(--font-display)] mb-6 text-3xl">{t("Choose a scheme, not a score")}</h1>
      <div className="grid gap-5">
        {SCHEMES.map((s, i) => (
          <Reveal key={s.code} index={i}>
          <article className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl">{t(s.name)}</h2>
                <p className="text-sm text-[color:var(--muted)]">{t(s.implementation)}</p>
              </div>
              <Stamp tone="rule">{humanizeSelectionModel(s.selectionModel.type)}</Stamp>
            </div>
            <p className="mt-3 text-sm">{t(s.selectionCharacter)}</p>
            <p className="meta mt-2">
              {s.version} · {s.academicYear} · {s.officialSources[0]}
            </p>
            <Link href={`/applicant/apply/${s.code}`} className="btn-primary mt-4 inline-block px-4 py-2 text-sm font-semibold">
              {lang === "en" ? `Open ${s.shortName} form` : `${s.shortName} · ${t("Open form")}`}
            </Link>
          </article>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}
