import { evaluateEligibility } from "@/engine/eligibility";
import { consistencyChecks, routeHitl } from "@/engine/intelligence";
import { schemeByCode } from "@/schemes/registry";
import type { ApplicationRecord } from "./models";

export function recomputeApplication(app: ApplicationRecord) {
  const scheme = schemeByCode(app.schemeCode);
  app.eligibility = evaluateEligibility(scheme, app.facts);
  const findings = consistencyChecks(app.facts, app.documents);
  const ocrFloor = app.documents.length ? Math.min(...app.documents.map((d) => d.ocrConfidence)) : 1;
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
  app.hitlLevel = hitl.level;
  app.hitlReasons = hitl.reasons;
  app.updatedAt = new Date().toISOString();
}
