/** Offline batch download for Institution Nodal Officers: everything needed to verify without a network. */
import { requireRole } from "@/lib/auth";
import { loadDb } from "@/lib/db";
import { humanizeEnum } from "@/lib/format";
import { schemeByCode } from "@/schemes/registry";

export const dynamic = "force-dynamic";

const SHOWN_FACTS = ["fullName", "gender", "domicileState", "course", "courseGroup", "classLevel", "researchDiscipline", "phdProgramme", "institutionName", "mastersPercentage"];

export async function GET() {
  const user = await requireRole(["INO"]);
  if (!user) return Response.json({ error: "forbidden" }, { status: 403 });
  const db = (await loadDb());
  const apps = db.applications
    .filter((a) => a.status === "INSTITUTION_VERIFICATION")
    .map((a) => ({
      id: a.id,
      version: a.updatedAt,
      scheme: schemeByCode(a.schemeCode).shortName,
      applicantName: a.applicantName,
      institutionName: a.institutionName ?? "",
      facts: a.facts
        .filter((f) => SHOWN_FACTS.includes(f.field) && f.value !== null && f.value !== "")
        .map((f) => ({ label: humanizeEnum(f.field.replace(/([A-Z])/g, "_$1")), value: String(f.value) })),
      documents: a.documents.map((d) => `${humanizeEnum(d.documentType)}${d.source === "DIGILOCKER" ? " (DigiLocker)" : ""}`),
    }));
  return Response.json(
    { batchId: `B-${Date.now().toString(36).toUpperCase()}`, downloadedAt: new Date().toISOString(), officer: user.name, apps },
    { headers: { "Cache-Control": "no-store" } },
  );
}
