import type {
  DocumentRecord,
  EligibilityResult,
  Fact,
  HitlLevel,
  Role,
  SelectionRun,
  WorkflowStage,
} from "@/engine/types";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  institutionId?: string;
  stateCode?: string;
  /** Registered mobile; the WhatsApp/SMS bot identifies applicants by it. */
  mobile?: string;
  /** Preferred language for bot replies and alerts. */
  lang?: "en" | "hi" | "or";
};

export type DeficiencyRecord = {
  id: string;
  applicationId: string;
  reason: string;
  field?: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  resolvedAt?: string;
};

/** An outbound WhatsApp / SMS message. WhatsApp first; SMS is the fallback for feature phones. */
export type OutboxMessage = {
  id: string;
  userId: string;
  to: string;
  channel: "WHATSAPP" | "SMS";
  body: string;
  at: string;
  status: "QUEUED" | "SENT" | "DELIVERED";
  direction: "OUT" | "IN";
};

export type AuditEvent = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  applicationId?: string;
  detail: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
};

export type AwardMilestone = {
  id: string;
  label: string;
  status: "PENDING" | "DONE";
  note?: string;
  at?: string;
};

export type AwardLifecycle =
  | "AWARDED"
  | "JOINING_PENDING"
  | "ACTIVE"
  | "RENEWAL_DUE"
  | "RENEWAL_REVIEW"
  | "COMPLETED"
  | "TERMINATED";

export type AwardRecord = {
  id: string;
  applicationId: string;
  schemeCode: string;
  status: "SANCTIONED" | "PAYMENT_PENDING" | "PAID" | "FAILED" | "RENEWAL_DUE";
  lifecycle: AwardLifecycle;
  components: string[];
  milestones: AwardMilestone[];
  createdAt: string;
  joinedAt?: string;
};

export type RenewalRecord = {
  id: string;
  awardId: string;
  applicationId: string;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "DEFICIENT" | "REVIEW";
  note?: string;
  decidedAt?: string;
};

export type AiFeedbackRecord = {
  id: string;
  applicationId: string;
  field: string;
  predictedValue: string;
  correctedValue: string;
  officerId: string;
  officerName: string;
  reason: string;
  modelVersion: string;
  at: string;
};

export type PolicyStatus = "DRAFT" | "VALIDATED" | "TESTED" | "APPROVED" | "PUBLISHED";

export type WorkflowEvent = {
  at: string;
  stage: WorkflowStage;
  note: string;
  actor: string;
};

export type ApplicationRecord = {
  id: string;
  schemeCode: string;
  schemeVersion: string;
  academicYear: string;
  applicantId: string;
  applicantName: string;
  institutionName?: string;
  stateCode?: string;
  status: WorkflowStage;
  /** Stage to return to once an open deficiency is resolved — whichever desk raised it. */
  returnStage?: WorkflowStage;
  facts: Fact[];
  documents: DocumentRecord[];
  eligibility?: EligibilityResult;
  hitlLevel: HitlLevel;
  hitlReasons: string[];
  deficiencies: DeficiencyRecord[];
  timeline: WorkflowEvent[];
  officerNote?: string;
  committeeScore?: number;
  committeeNote?: string;
  authorisedDecision?: "APPROVED" | "REJECTED" | "DEFERRED";
  isAppeal?: boolean;
  appealReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  users: UserRecord[];
  applications: ApplicationRecord[];
  notifications: NotificationRecord[];
  audit: AuditEvent[];
  awards: AwardRecord[];
  selectionRuns: SelectionRun[];
  renewals: RenewalRecord[];
  aiFeedback: AiFeedbackRecord[];
  policyStatus: Record<string, PolicyStatus>;
  outbox: OutboxMessage[];
};
