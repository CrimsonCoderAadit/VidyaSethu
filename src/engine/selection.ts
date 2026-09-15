import type { ApplicationRecord } from "@/lib/models";
import type { RankedCandidate, SchemeConfig, SelectionRun } from "./types";

function merit(app: ApplicationRecord, field: string) {
  const value = app.facts.find((f) => f.field === field)?.value;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function flag(app: ApplicationRecord, field: string) {
  const value = app.facts.find((f) => f.field === field)?.value;
  return value === true || value === "true" || value === "yes" || value === "FEMALE";
}

function genderFemale(app: ApplicationRecord) {
  const g = String(app.facts.find((f) => f.field === "gender")?.value ?? "").toUpperCase();
  return g === "FEMALE" || g === "F";
}

function sortByMerit(apps: ApplicationRecord[], field: string) {
  return [...apps].sort((a, b) => {
    const diff = merit(b, field) - merit(a, field);
    if (diff !== 0) return diff;
    return a.applicantName.localeCompare(b.applicantName);
  });
}

export function runSelection(scheme: SchemeConfig, eligible: ApplicationRecord[]): SelectionRun {
  const id = `sel-${scheme.code}-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const model = scheme.selectionModel.type;

  if (model === "ELIGIBILITY_ONLY") {
    return {
      id,
      schemeId: scheme.schemeId,
      academicYear: scheme.academicYear,
      model,
      createdAt,
      candidates: eligible.map((app) => ({
        applicationId: app.id,
        applicantName: app.applicantName,
        meritScore: null,
        bucket: "ENTITLEMENT_POOL",
        rankInBucket: null,
        selected: true,
        reason: "Scheme is eligibility/entitlement only. No national merit rank is created.",
      })),
    };
  }

  if (scheme.code === "NFST") {
    return {
      id,
      schemeId: scheme.schemeId,
      academicYear: scheme.academicYear,
      model,
      createdAt,
      candidates: nfstMeritWithPreferences(eligible),
    };
  }

  if (scheme.code === "NOS") {
    return {
      id,
      schemeId: scheme.schemeId,
      academicYear: scheme.academicYear,
      model,
      createdAt,
      candidates: nosCommitteeBuckets(eligible),
    };
  }

  return {
    id,
    schemeId: scheme.schemeId,
    academicYear: scheme.academicYear,
    model,
    createdAt,
    candidates: eligible.map((app) => ({
      applicationId: app.id,
      applicantName: app.applicantName,
      meritScore: scheme.selectionModel.meritField ? merit(app, scheme.selectionModel.meritField) : null,
      bucket: null,
      rankInBucket: null,
      selected: false,
      reason: "Selection model is configured but this run requires authorised human confirmation.",
    })),
  };
}

function nfstMeritWithPreferences(eligible: ApplicationRecord[]): RankedCandidate[] {
  const ranked = sortByMerit(eligible, "mastersPercentage");
  const selected = new Set<string>();
  const results = new Map<string, RankedCandidate>();

  const place = (apps: ApplicationRecord[], bucket: string, slots: number) => {
    let rank = 0;
    for (const app of apps) {
      if (selected.has(app.id)) continue;
      if (rank >= slots) break;
      rank += 1;
      selected.add(app.id);
      results.set(app.id, {
        applicationId: app.id,
        applicantName: app.applicantName,
        meritScore: merit(app, "mastersPercentage"),
        bucket,
        rankInBucket: rank,
        selected: true,
        reason: `Filled against ${bucket} on Master's marks. Human/MoTA authorisation still required.`,
      });
    }
    return slots - rank;
  };

  const divyang = ranked.filter((a) => flag(a, "divyangjan"));
  const unusedDivyang = place(divyang, "DIVYANGJAN", 38);
  const pvtg = ranked.filter((a) => flag(a, "pvtg"));
  const unusedPvtg = place(pvtg, "PVTG", 25 + unusedDivyang);

  const femalesSelected = [...selected].filter((id) => {
    const app = ranked.find((a) => a.id === id);
    return app ? genderFemale(app) : false;
  }).length;
  const femaleSlotsLeft = Math.max(0, 225 - femalesSelected);
  const unusedFemale = place(ranked.filter(genderFemale), "FEMALE", femaleSlotsLeft);

  const premier = ranked.filter((a) => flag(a, "premierOfferIitIimIiserAiims"));
  place(premier, "PREMIER_OFFER_FROM_ST_OTHERS", 999);

  const othersSlots = 462 + unusedPvtg + unusedFemale;
  place(ranked, "ST_OTHERS", othersSlots);

  return ranked.map((app, index) => {
    const existing = results.get(app.id);
    if (existing) return existing;
    return {
      applicationId: app.id,
      applicantName: app.applicantName,
      meritScore: merit(app, "mastersPercentage"),
      bucket: "WAITLIST",
      rankInBucket: index + 1,
      selected: false,
      reason: "Eligible but outside 750-slot preference buckets on current Master's merit.",
    };
  });
}

function nosCommitteeBuckets(eligible: ApplicationRecord[]): RankedCandidate[] {
  const pvtg = eligible.filter((a) => flag(a, "pvtg"));
  const st = eligible.filter((a) => !flag(a, "pvtg"));
  const femaleTarget = Math.round(20 * 0.3);

  const tag = (apps: ApplicationRecord[], bucket: string, slots: number): RankedCandidate[] =>
    apps.map((app, index) => ({
      applicationId: app.id,
      applicantName: app.applicantName,
      meritScore: app.committeeScore ?? null,
      bucket,
      rankInBucket: index + 1,
      selected: Boolean(app.committeeScore) && index < slots,
      reason: app.committeeScore
        ? `Committee score ${app.committeeScore}. Bucket ${bucket} (${slots} slots). 30% female earmark (${femaleTarget}).`
        : "Dossier prepared. Expert committee must supply the subjective interview assessment. AI does not rank NOS.",
    }));

  return [...tag(pvtg, "PVTG", 3), ...tag(st, "ST", 17)];
}
