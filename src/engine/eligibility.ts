import type {
  EligibilityOutcome,
  EligibilityResult,
  EligibilityRule,
  EligibilityTrace,
  Fact,
  SchemeConfig,
} from "./types";

function factMap(facts: Fact[]) {
  const map = new Map<string, Fact>();
  for (const fact of facts) map.set(fact.field, fact);
  return map;
}

function stringify(value: unknown) {
  if (value === null || value === undefined || value === "") return "missing";
  return String(value);
}

function numeric(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

function evaluateRule(
  rule: EligibilityRule,
  facts: Map<string, Fact>,
): { passed: boolean; actual: string; expected: string } {
  const fact = facts.get(rule.field);
  const actualValue = fact?.value;
  const actual = stringify(actualValue);
  const expected = stringify(rule.value);

  switch (rule.operator) {
    case "eq":
      return { passed: actualValue === rule.value || String(actualValue) === String(rule.value), actual, expected };
    case "neq":
      return { passed: String(actualValue) !== String(rule.value), actual, expected: `not ${expected}` };
    case "lte": {
      const n = numeric(actualValue);
      const cap = numeric(rule.value);
      if (Number.isNaN(n)) return { passed: false, actual, expected: `<= ${expected}` };
      return { passed: n <= cap, actual, expected: `<= ${expected}` };
    }
    case "gte": {
      const n = numeric(actualValue);
      const floor = numeric(rule.value);
      if (Number.isNaN(n)) return { passed: false, actual, expected: `>= ${expected}` };
      return { passed: n >= floor, actual, expected: `>= ${expected}` };
    }
    case "in": {
      const list = (rule.value as Array<string | number>).map(String);
      return { passed: list.includes(String(actualValue)), actual, expected: list.join(" | ") };
    }
    case "notIn": {
      const list = (rule.value as Array<string | number>).map(String);
      return { passed: !list.includes(String(actualValue)), actual, expected: `not ${list.join(" | ")}` };
    }
    case "truthy": {
      const passed =
        actualValue === true ||
        actualValue === "true" ||
        actualValue === "yes" ||
        (typeof actualValue === "string" && actualValue.trim() !== "" && actualValue !== "false" && actualValue !== "no") ||
        (typeof actualValue === "number" && actualValue !== 0);
      return { passed, actual, expected: "present / true" };
    }
    case "falsy":
      return {
        passed: actualValue === false || actualValue === "false" || actualValue === "no" || actualValue === null,
        actual,
        expected: "false",
      };
    case "orphanIncomeExempt": {
      const orphan = facts.get("orphanStatus")?.value;
      if (orphan === true || orphan === "true" || orphan === "yes") {
        return { passed: true, actual: "orphan — income ceiling waived", expected: "orphan waiver" };
      }
      const income = numeric(facts.get("familyIncome")?.value);
      const cap = numeric(rule.value);
      if (Number.isNaN(income)) return { passed: false, actual: "missing income", expected: `<= ${expected} unless orphan` };
      return { passed: income <= cap, actual: String(income), expected: `<= ${cap} unless orphan` };
    }
    case "topClassExclusion": {
      const inList = facts.get("institutionInTopClassList")?.value;
      if (inList === true || inList === "true") {
        return { passed: false, actual: "institution is on Top Class list", expected: "not a Top Class identified institute" };
      }
      return { passed: true, actual: "not on Top Class list", expected: "not a Top Class identified institute" };
    }
    case "classIxIncomeReuse": {
      const cls = String(facts.get("classLevel")?.value ?? "");
      const reused = facts.get("incomeCertificateFromClassIx")?.value;
      if (cls === "X" && (reused === true || reused === "true")) {
        return { passed: true, actual: "Class IX income certificate reused for Class X", expected: "valid for IX and X" };
      }
      return evaluateRule({ ...rule, operator: "orphanIncomeExempt" }, facts);
    }
    case "qsRankingExemptMarks": {
      const qs = numeric(facts.get("qsWorldRank")?.value);
      if (!Number.isNaN(qs) && qs > 0 && qs <= 1000) {
        return { passed: true, actual: `QS rank ${qs} — marks criterion waived`, expected: "55% or QS top 1000" };
      }
      const marks = numeric(actualValue);
      if (Number.isNaN(marks)) return { passed: false, actual, expected: ">= 55 or QS top 1000" };
      return { passed: marks >= 55, actual, expected: ">= 55 or QS top 1000" };
    }
    default:
      return { passed: false, actual, expected: "unknown operator" };
  }
}

export function evaluateEligibility(scheme: SchemeConfig, facts: Fact[]): EligibilityResult {
  const map = factMap(facts);
  const traces: EligibilityTrace[] = scheme.eligibilityRules.map((rule) => {
    const result = evaluateRule(rule, map);
    return {
      ruleId: rule.id,
      description: rule.description,
      passed: result.passed,
      outcomeIfFailed: rule.failOutcome,
      actual: result.actual,
      expected: result.expected,
      citation: rule.citation,
    };
  });

  const failed = traces.filter((t) => !t.passed);
  const deficientFields = failed
    .filter((t) => t.outcomeIfFailed === "DEFICIENT")
    .map((t) => t.ruleId);

  let outcome: EligibilityOutcome = "ELIGIBLE";
  if (failed.some((t) => t.outcomeIfFailed === "INELIGIBLE")) outcome = "INELIGIBLE";
  else if (failed.some((t) => t.outcomeIfFailed === "REVIEW_REQUIRED")) outcome = "REVIEW_REQUIRED";
  else if (failed.some((t) => t.outcomeIfFailed === "DEFICIENT")) outcome = "DEFICIENT";

  return { outcome, traces, deficientFields };
}

export function computeEntitlement(
  scheme: SchemeConfig,
  facts: Fact[],
): { label: string; amount: number; breakdown: string[] } | null {
  const map = factMap(facts);
  const hosteller = map.get("hosteller")?.value === true || map.get("hosteller")?.value === "true";
  const disability = map.get("divyangjan")?.value === true || map.get("divyangjan")?.value === "true";

  if (scheme.code === "PRE_MATRIC") {
    const monthly = hosteller ? 525 : 225;
    const books = hosteller ? 1000 : 750;
    const disabilityMonthly = disability ? (hosteller ? 800 : 600) : 0;
    const amount = monthly * 10 + books + disabilityMonthly * 10;
    return {
      label: "Pre-Matric entitlement (10 months)",
      amount,
      breakdown: [
        `Maintenance ${monthly} × 10 = ${monthly * 10}`,
        `Books/ad-hoc grant ${books}`,
        disability ? `Disability allowance ${disabilityMonthly} × 10 = ${disabilityMonthly * 10}` : "No disability allowance",
      ],
    };
  }

  if (scheme.code === "POST_MATRIC") {
    const group = String(map.get("courseGroup")?.value ?? "II");
    const stipend: Record<string, { h: number; d: number }> = {
      I: { h: 1200, d: 550 },
      II: { h: 820, d: 530 },
      III: { h: 570, d: 300 },
      IV: { h: 380, d: 230 },
    };
    const rate = stipend[group] ?? stipend.II;
    const monthly = hosteller ? rate.h : rate.d;
    const fees = numeric(map.get("feeAmount")?.value);
    const fee = Number.isNaN(fees) ? 0 : fees;
    return {
      label: `Post-Matric Group ${group} entitlement`,
      amount: monthly * 10 + fee,
      breakdown: [
        `Stipend ${monthly} × 10 = ${monthly * 10}`,
        `Compulsory non-refundable fees ${fee}`,
        "Fee ceiling for private institutes applied at State fee-fixation, not invented here",
      ],
    };
  }

  if (scheme.code === "NFST") {
    return {
      label: "NFST PhD fellowship (current portal rates)",
      amount: 37000,
      breakdown: [
        "₹37,000/month JRF equivalent for first two years (portal, w.e.f. 1 Jan 2023)",
        "₹42,000/month thereafter for remaining three years",
        "Older 2021-25 PDF ₹25,000/₹28,000 is stored as a superseded conflict",
      ],
    };
  }

  if (scheme.code === "TOP_CLASS") {
    return {
      label: "Top Class components (eligibility-only)",
      amount: 0,
      breakdown: [
        "Tuition / admission / non-refundable fees to institution via PFMS (2023-24 amendment)",
        "Stipend / books / computer allowances to student",
        "No national merit rank; all eligible fresh students in the 265-list",
      ],
    };
  }

  if (scheme.code === "NOS") {
    return {
      label: "NOS award components",
      amount: 0,
      breakdown: [
        "Tuition plus maintenance, contingency, visa, insurance, travel",
        "Disbursement through Indian Missions / MEA — integration boundary only",
      ],
    };
  }

  return null;
}
