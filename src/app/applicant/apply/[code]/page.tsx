import { DynamicForm } from "@/components/DynamicForm";
import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { DIGILOCKER_ISSUABLE, fetchIssued } from "@/lib/digilocker";
import { humanizeSelectionModel } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { schemeByCode } from "@/schemes/registry";
import { redirect } from "next/navigation";

export default async function ApplyPage({ params }: { params: Promise<{ code: string }> }) {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  const { code } = await params;
  const scheme = schemeByCode(code);
  const lang = await getLang();
  const issued = fetchIssued(scheme.requiredDocuments.map((d) => d.id).filter((id) => DIGILOCKER_ISSUABLE.has(id)), { name: user.name, stateCode: user.stateCode });
  return (
    <Shell user={user}>
      <p className="meta">
        {scheme.version} · selection: {humanizeSelectionModel(scheme.selectionModel.type)} · {scheme.selectionModel.citation.sourceDocument}
      </p>
      <h1 className="font-[family-name:var(--font-display)] mb-2 text-3xl">{t(lang, scheme.name)}</h1>
      <p className="mb-8 max-w-3xl text-sm text-[color:var(--muted)]">{t(lang, scheme.selectionCharacter)}</p>
      {scheme.conflicts.length ? (
        <aside className="card card-accent-warn mb-6 p-4">
          <p className="font-semibold">Stored policy conflicts</p>
          {scheme.conflicts.map((c) => (
            <p key={c.id} className="mt-2 text-sm text-[color:var(--muted)]">
              {c.topic}: older material says {c.olderMaterial}. Current source says {c.currentSource}. {c.resolution}
            </p>
          ))}
        </aside>
      ) : null}
      <DynamicForm scheme={scheme} lang={lang} issued={issued} />
    </Shell>
  );
}
