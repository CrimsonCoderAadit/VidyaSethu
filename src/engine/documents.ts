import type { DocumentRecord, DocumentRecovery } from "./types";

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

/** A document pulled from DigiLocker: issuer-signed structured data, so trust A and no OCR step. */
export function ingestFromDigiLocker(args: {
  applicationId: string;
  documentType: string;
  uri: string;
  fields: DocumentRecord["extracted"];
}): DocumentRecord {
  return {
    id: `doc-${Math.random().toString(36).slice(2, 10)}`,
    applicationId: args.applicationId,
    documentType: args.documentType,
    fileName: `${args.uri}.xml`,
    quality: "PASS",
    classification: args.documentType,
    classificationConfidence: 1,
    extracted: args.fields,
    ocrConfidence: 1,
    trust: "A",
    source: "DIGILOCKER",
    digilockerUri: args.uri,
  };
}

/** What the camera/upload actually delivered. In production this comes from the on-device
 * blur/brightness check plus the OCR engine's confidence; the demo lets you pick it. */
export type CaptureCondition = "CLEAR" | "BLURRY" | "DARK" | "CRUMPLED" | "HANDWRITTEN";

const FIELD_LABEL: Record<string, string> = {
  fullName: "name",
  familyIncome: "annual income",
  stStatus: "ST status",
  domicileState: "state",
  mastersPercentage: "marks %",
};

/**
 * Complete OCR failure handling without a manual bottleneck at MoTA.
 *  - Unreadable photo of a DigiLocker-issued document → one-tap DigiLocker fetch instead (no officer).
 *  - Unreadable photo of anything else (bank passbook, proposal) → instant retake request with
 *    specific tips, back to the applicant before any officer sees the file.
 *  - Legible but handwritten → keep the photo, take the values the applicant already typed in the
 *    form, and give the officer a targeted side-by-side check of just those fields (L1, not L2).
 */
export function ingestWithCondition(args: {
  applicationId: string;
  documentType: string;
  fileName: string;
  condition: CaptureCondition;
  digilockerIssuable: boolean;
}): DocumentRecord {
  if (args.condition === "CLEAR") return ingestDocument(args);

  if (args.condition === "HANDWRITTEN") {
    const template = TEMPLATES[args.documentType] ?? {};
    const fields = Object.keys(template).filter((k) => k in FIELD_LABEL);
    const doc = ingestDocument({ ...args, ocrConfidence: 0.46, extractedOverride: {} });
    doc.recovery = {
      path: "ASSISTED_ENTRY",
      reason: "Handwritten certificate: printed-text OCR cannot read it reliably.",
      guidance: `Using the ${fields.map((f) => FIELD_LABEL[f]).join(", ") || "details"} you typed in the form. An officer compares only these against the photo.`,
      status: "OPEN",
      typedFields: fields,
    };
    return doc;
  }

  const quality: DocumentRecord["quality"] = args.condition === "CRUMPLED" ? "CUT_OFF" : args.condition === "DARK" ? "LOW_RES" : "BLURRY";
  const doc = ingestDocument({ ...args, qualityOverride: quality, ocrConfidence: 0.21, extractedOverride: {} });
  doc.recovery = args.digilockerIssuable
    ? {
        path: "DIGILOCKER",
        reason: `Photo unreadable (${quality.toLowerCase().replace("_", " ")}).`,
        guidance: "This certificate is issued in DigiLocker. Tap once to fetch the signed copy. No new photo needed.",
        status: "OPEN",
      }
    : {
        path: "RETAKE",
        reason: `Photo unreadable (${quality.toLowerCase().replace("_", " ")}).`,
        guidance:
          args.condition === "CRUMPLED"
            ? "Flatten the page under a book, place it on a dark surface, and fit all four corners in the frame."
            : args.condition === "DARK"
              ? "Move near a window or daylight; avoid flash glare. Hold the phone steady for 2 seconds."
              : "Hold the phone steady, tap the screen to focus on the text, and keep it 20–30 cm from the page.",
        status: "OPEN",
      };
  return doc;
}

export function openRecoveries(docs: DocumentRecord[]): DocumentRecovery[] {
  return docs.map((d) => d.recovery).filter((r): r is DocumentRecovery => !!r && r.status === "OPEN");
}
