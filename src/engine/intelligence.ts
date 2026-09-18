import type { DocumentRecord, Fact, HitlLevel } from "./types";
import { humanizeEnum } from "@/lib/format";

export type ConsistencyFinding = {
  id: string;
  severity: "INFO" | "WARN" | "HIGH";
  message: string;
  fields: string[];
};

export function consistencyChecks(facts: Fact[], documents: DocumentRecord[]): ConsistencyFinding[] {
  const findings: ConsistencyFinding[] = [];
  const name = String(facts.find((f) => f.field === "fullName")?.value ?? "");
  for (const doc of documents) {
    const extractedName = doc.extracted.fullName;
    if (extractedName && name && String(extractedName).toLowerCase() !== name.toLowerCase()) {
      findings.push({
        id: "NAME_MISMATCH",
        severity: "HIGH",
        message: `${humanizeEnum(doc.documentType)} extracts the name “${extractedName}”, but the application says “${name}”.`,
        fields: ["fullName"],
      });
    }
  }

  const incomeFact = facts.find((f) => f.field === "familyIncome");
  const incomeDoc = documents.find((d) => d.documentType === "INCOME_CERTIFICATE");
  if (incomeFact && incomeDoc?.extracted.familyIncome != null) {
    const a = Number(incomeFact.value);
    const b = Number(incomeDoc.extracted.familyIncome);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > 1) {
      findings.push({
        id: "INCOME_MISMATCH",
        severity: "HIGH",
        message: `Declared income ${a} does not match certificate extraction ${b}.`,
        fields: ["familyIncome"],
      });
    }
  }

  const stDoc = documents.find((d) => d.documentType === "ST_CERTIFICATE");
  if (stDoc && stDoc.extracted.stStatus === false) {
    findings.push({
      id: "ST_DOCUMENT_NEGATIVE",
      severity: "HIGH",
      message: "ST certificate classification did not confirm Scheduled Tribe status.",
      fields: ["stStatus"],
    });
  }

  return findings;
}

export function routeHitl(args: {
  ocrFloor: number;
  findings: ConsistencyFinding[];
  missingEvidence: boolean;
  institutionPending: boolean;
  policyException: boolean;
}): { level: HitlLevel; reasons: string[] } {
  const reasons: string[] = [];
  if (args.policyException || args.findings.some((f) => f.severity === "HIGH")) {
    reasons.push(...args.findings.filter((f) => f.severity === "HIGH").map((f) => f.message));
    if (args.policyException) reasons.push("A policy exception or interpretation is required.");
    return { level: "L2", reasons };
  }
  if (args.institutionPending) {
    reasons.push("Institution nodal verification is still pending. This is a known NFST bottleneck.");
    return { level: "L2", reasons };
  }
  if (args.missingEvidence) {
    reasons.push("Required evidence is missing or unreadable.");
    return { level: "L2", reasons };
  }
  if (args.ocrFloor < 0.8) {
    reasons.push(`Lowest OCR confidence is ${Math.round(args.ocrFloor * 100)}%. Confirm extracted facts against the page.`);
    return { level: "L1", reasons };
  }
  if (args.findings.some((f) => f.severity === "WARN")) {
    reasons.push(...args.findings.map((f) => f.message));
    return { level: "L1", reasons };
  }
  return { level: "L0", reasons: ["Evidence verified, deterministic rules pass, no unresolved conflict. Prepared for authorised officer decision."] };
}
