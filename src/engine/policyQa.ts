import type { SchemeConfig } from "./types";

export type PolicyIssue = {
  severity: "ERROR" | "WARN";
  message: string;
};

export function qaScheme(scheme: SchemeConfig): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  const fieldIds = new Set(scheme.applicationSchema.map((f) => f.id));
  const ruleIds = new Set<string>();

  for (const rule of scheme.eligibilityRules) {
    if (ruleIds.has(rule.id)) issues.push({ severity: "ERROR", message: `Duplicate rule ID ${rule.id}` });
    ruleIds.add(rule.id);
    if (rule.field && !fieldIds.has(rule.field) && !["institutionInTopClassList", "qsWorldRank", "incomeCertificateFromClassIx"].includes(rule.field)) {
      issues.push({
        severity: "ERROR",
        message: `Rule ${rule.id} requires ${rule.field}, but no application field can establish it.`,
      });
    }
    if (!rule.citation.sourceDocument) {
      issues.push({ severity: "ERROR", message: `Rule ${rule.id} has no source document.` });
    }
  }

  if (scheme.selectionModel.meritField && !fieldIds.has(scheme.selectionModel.meritField)) {
    issues.push({
      severity: "ERROR",
      message: `Selection ranks on ${scheme.selectionModel.meritField}, which is not captured.`,
    });
  }

  if (scheme.selectionModel.buckets) {
    const slots = scheme.selectionModel.buckets.reduce((n, b) => n + b.slots, 0);
    if (scheme.selectionModel.slots && slots !== scheme.selectionModel.slots) {
      issues.push({
        severity: "WARN",
        message: `Bucket slots sum to ${slots} but model slots are ${scheme.selectionModel.slots}. Check overlapping preference categories before publishing.`,
      });
    }
  }

  if (scheme.selectionModel.type !== "ELIGIBILITY_ONLY" && !scheme.selectionModel.tieBreakers?.length) {
    issues.push({ severity: "WARN", message: "Merit/committee models should declare tie-breakers." });
  }

  if (scheme.conflicts.length) {
    issues.push({
      severity: "WARN",
      message: `${scheme.conflicts.length} current-vs-old conflict(s) stored. Do not silently merge; latest dated amendment wins.`,
    });
  }

  return issues;
}
