export type Role =
  | "APPLICANT"
  | "INO"
  | "STATE"
  | "MOTA"
  | "COMMITTEE"
  | "FINANCE"
  | "ADMIN"
  | "AUDITOR";

export type EligibilityOutcome =
  | "ELIGIBLE"
  | "DEFICIENT"
  | "INELIGIBLE"
  | "REVIEW_REQUIRED";

export type SelectionModelType =
  | "ELIGIBILITY_ONLY"
  | "MERIT_RANKED"
  | "MERIT_WITH_PREFERENCES"
  | "MERIT_CUM_MEANS"
  | "WEIGHTED_SCORE"
  | "COMMITTEE_RANKED"
  | "QUOTA_BUCKETED";

export type HitlLevel = "L0" | "L1" | "L2" | "L3";

export type WorkflowStage =
  | "DRAFT"
  | "SUBMITTED"
  | "DOCUMENT_INTELLIGENCE"
  | "INSTITUTION_VERIFICATION"
  | "STATE_VERIFICATION"
  | "ELIGIBILITY"
  | "MOTA_SCRUTINY"
  | "DEFICIENCY"
  | "SELECTION"
  | "COMMITTEE"
  | "AUTHORISED_DECISION"
  | "AWARDED"
  | "REJECTED"
  | "RENEWAL";

export type Citation = {
  sourceDocument: string;
  sourcePage?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  supersedes?: string;
  note?: string;
};

export type FieldType =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "date"
  | "textarea"
  | "currency";

export type ApplicationField = {
  id: string;
  label: string;
  section: string;
  type: FieldType;
  required: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  evidenceDocument?: string;
};

export type RequiredDocument = {
  id: string;
  label: string;
  mandatory: boolean;
  help?: string;
};

export type RuleOperator =
  | "eq"
  | "neq"
  | "lte"
  | "gte"
  | "in"
  | "notIn"
  | "truthy"
  | "falsy"
  | "orphanIncomeExempt"
  | "topClassExclusion"
  | "classIxIncomeReuse"
  | "qsRankingExemptMarks";

export type EligibilityRule = {
  id: string;
  description: string;
  field: string;
  operator: RuleOperator;
  value?: string | number | boolean | Array<string | number>;
  failOutcome: EligibilityOutcome;
  citation: Citation;
};

export type QuotaBucket = {
  id: string;
  label: string;
  slots: number;
  predicate: Record<string, string | boolean | number>;
  overflowTo?: string;
};

export type SelectionModel = {
  type: SelectionModelType;
  combinedWith?: SelectionModelType[];
  meritField?: string;
  slots?: number;
  buckets?: QuotaBucket[];
  tieBreakers?: string[];
  committeeRequired?: boolean;
  humanFinalDecision: boolean;
  notes?: string;
  citation: Citation;
};

export type AwardComponent = {
  id: string;
  label: string;
  formula: string;
  citation: Citation;
};

export type SchemeConfig = {
  schemeId: string;
  code: string;
  name: string;
  shortName: string;
  academicYear: string;
  version: string;
  status: "DRAFT" | "VALIDATED" | "TESTED" | "APPROVED" | "PUBLISHED";
  implementation: string;
  selectionCharacter: string;
  applicationSchema: ApplicationField[];
  requiredDocuments: RequiredDocument[];
  eligibilityRules: EligibilityRule[];
  workflow: WorkflowStage[];
  selectionModel: SelectionModel;
  awardRules: AwardComponent[];
  renewalRules: string[];
  integrations: string[];
  conflicts: PolicyConflict[];
  officialSources: string[];
};

export type PolicyConflict = {
  id: string;
  topic: string;
  olderMaterial: string;
  currentSource: string;
  resolution: string;
  citation: Citation;
};

export type Fact = {
  field: string;
  value: string | number | boolean | null;
  source: "APPLICANT" | "OCR" | "DIGILOCKER" | "OFFICER" | "INSTITUTION" | "STATE";
  confidence: number;
  evidenceId?: string;
  verified: boolean;
};

/**
 * Evidence trust — separate from OCR confidence. A = trusted government
 * digital source, B = digitally signed/verified, C = institution-confirmed,
 * D = uploaded + automated checks, E = uploaded, needs human confirmation.
 */
export type EvidenceTrust = "A" | "B" | "C" | "D" | "E";

export type DocumentRecord = {
  id: string;
  applicationId: string;
  documentType: string;
  fileName: string;
  quality: "PASS" | "BLURRY" | "CUT_OFF" | "LOW_RES";
  classification: string;
  classificationConfidence: number;
  extracted: Record<string, string | number | boolean | null>;
  ocrConfidence: number;
  trust: EvidenceTrust;
};

export type EligibilityTrace = {
  ruleId: string;
  description: string;
  passed: boolean;
  outcomeIfFailed: EligibilityOutcome;
  actual: string;
  expected: string;
  citation: Citation;
};

export type EligibilityResult = {
  outcome: EligibilityOutcome;
  traces: EligibilityTrace[];
  deficientFields: string[];
};

export type RankedCandidate = {
  applicationId: string;
  applicantName: string;
  meritScore: number | null;
  bucket: string | null;
  rankInBucket: number | null;
  selected: boolean;
  reason: string;
};

export type SelectionRun = {
  id: string;
  schemeId: string;
  academicYear: string;
  model: SelectionModelType;
  createdAt: string;
  candidates: RankedCandidate[];
};
