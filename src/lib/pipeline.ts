import { evaluateEligibility } from "@/engine/eligibility";
import { consistencyChecks, routeHitl } from "@/engine/intelligence";
import { schemeByCode } from "@/schemes/registry";
import type { ApplicationRecord } from "./models";

export function recomputeApplication(app: ApplicationRecord) {
  const scheme = schemeByCode(app.schemeCode);
  app.eligibility = evaluateEligibility(scheme, app.facts);
  const findings = consistencyChecks(app.facts, app.documents);
  // Documents in a recovery path (retake / DigiLocker / assisted entry) are handled by that path.
  const readable = app.documents.filter((d) => !d.recovery);
  const ocrFloor = readable.length ? Math.min(...readable.map((d) => d.ocrConfidence)) : 1;
  const institutionPending =
    scheme.workflow.includes("INSTITUTION_VERIFICATION") &&
    app.facts.find((f) => f.field === "institutionVerified")?.value !== true;
  const hitl = routeHitl({
    ocrFloor,
    findings,
    missingEvidence: app.eligibility.outcome === "DEFICIENT",
    institutionPending: institutionPending && app.status === "INSTITUTION_VERIFICATION",
    policyException: app.eligibility.outcome === "REVIEW_REQUIRED",
  });
  const assisted = app.documents.filter((d) => d.recovery?.path === "ASSISTED_ENTRY" && d.recovery.status === "OPEN");
  if (assisted.length) {
    hitl.reasons.push(...assisted.map((d) => `Handwritten ${d.documentType.replaceAll("_", " ").toLowerCase()}: compare ${d.recovery!.typedFields?.length ?? 0} typed field(s) against the photo.`));
    if (hitl.level === "L0") hitl.level = "L1";
  }
  app.hitlLevel = hitl.level;
  app.hitlReasons = hitl.reasons;
  app.updatedAt = new Date().toISOString();
}
