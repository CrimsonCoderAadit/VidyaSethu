import type { DocumentRecord } from "./types";

const TEMPLATES: Record<string, DocumentRecord["extracted"]> = {
  ST_CERTIFICATE: { fullName: "Meena Xaxa", stStatus: true, domicileState: "JH" },
  INCOME_CERTIFICATE: { familyIncome: 180000, fullName: "Meena Xaxa" },
  MARKSHEET: { mastersPercentage: 82.4, fullName: "Meena Xaxa" },
  AADHAAR: { aadhaarLinked: true, fullName: "Meena Xaxa" },
  PVTG_CERTIFICATE: { pvtg: true },
  DISABILITY_CERTIFICATE: { divyangjan: true },
  ADMISSION_LETTER: { admitted: true, institutionName: "IIT Delhi" },
  BANK: { bankAccount: true },
  RESEARCH_PROPOSAL: { proposalPresent: true },
};

const TRUSTED_TYPES = new Set(["ST_CERTIFICATE", "AADHAAR", "BANK"]);

/** Evidence trust starts from the document type; a human confirmation upgrades it later. */
function trustFor(documentType: string, ocrConfidence: number): DocumentRecord["trust"] {
  if (TRUSTED_TYPES.has(documentType)) return "C";
  if (ocrConfidence >= 0.85) return "D";
  return "E";
}

export function ingestDocument(args: {
  applicationId: string;
  documentType: string;
  fileName: string;
  qualityOverride?: DocumentRecord["quality"];
  extractedOverride?: DocumentRecord["extracted"];
  ocrConfidence?: number;
}): DocumentRecord {
  const extracted = args.extractedOverride ?? TEMPLATES[args.documentType] ?? { received: true };
  const ocrConfidence = args.ocrConfidence ?? 0.91;
  return {
    id: `doc-${Math.random().toString(36).slice(2, 10)}`,
    applicationId: args.applicationId,
    documentType: args.documentType,
    fileName: args.fileName,
    quality: args.qualityOverride ?? "PASS",
    classification: args.documentType,
    classificationConfidence: 0.93,
    extracted,
    ocrConfidence,
    trust: trustFor(args.documentType, ocrConfidence),
  };
}
