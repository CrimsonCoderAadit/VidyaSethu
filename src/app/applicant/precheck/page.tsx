import { PrecheckForm } from "@/components/PrecheckForm";
import { Shell } from "@/components/Shell";
import { requireRole } from "@/lib/auth";
import { SCHEMES } from "@/schemes/registry";
import { redirect } from "next/navigation";

export default async function PrecheckPage() {
  const user = await requireRole(["APPLICANT"]);
  if (!user) redirect("/");
  return (
    <Shell user={user}>
      <p className="meta">Eligibility pre-check · published scheme versions only</p>
      <h1 className="font-[family-name:var(--font-display)] mb-2 text-3xl">Ask the rules before you file</h1>
      <p className="mb-6 max-w-2xl text-sm text-[color:var(--muted)]">
        Each scheme uses its own eligibility layer. A pass here still needs documents, institution/state verification
        where the workflow requires it, and an authorised human decision.
      </p>
      <PrecheckForm schemes={SCHEMES} />
    </Shell>
  );
}
