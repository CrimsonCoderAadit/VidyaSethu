"use server";

import { evaluateEligibility, computeEntitlement } from "@/engine/eligibility";
import { ingestDocument } from "@/engine/documents";
import { consistencyChecks, routeHitl } from "@/engine/intelligence";
import { runSelection } from "@/engine/selection";
import type { Fact, WorkflowStage } from "@/engine/types";
import { schemeByCode } from "@/schemes/registry";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE } from "./auth";
import { loadDb, mutateDb, resetDb } from "./db";
import type { UserRecord } from "./models";
import { recomputeApplication } from "./pipeline";
import { roleHome } from "./roles";

function audit(db: ReturnType<typeof loadDb>, actor: { id: string; name: string }, action: string, detail: string, applicationId?: string) {
  db.audit.unshift({
    id: `aud-${Date.now()}`,
    at: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    action,
    detail,
    applicationId,
  });
}

function notify(db: ReturnType<typeof loadDb>, userId: string, title: string, body: string) {
  db.notifications.unshift({
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    title,
    body,
    at: new Date().toISOString(),
    read: false,
  });
}

function notifyRole(db: ReturnType<typeof loadDb>, role: UserRecord["role"], title: string, body: string) {
  for (const u of db.users.filter((u) => u.role === role)) notify(db, u.id, title, body);
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const user = loadDb().users.find((u) => u.email === email && u.password === password);
  if (!user) redirect("/?error=unknown");
  (await cookies()).set(COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(roleHome(user.role));
}

export async function logoutAction() {
  (await cookies()).delete(COOKIE);
  redirect("/");
}

export async function createUserAction(formData: FormData) {
  const actorId = (await cookies()).get(COOKIE)?.value;
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "") as UserRecord["role"];
  const institutionId = String(formData.get("institutionId") ?? "").trim() || undefined;
  const stateCode = String(formData.get("stateCode") ?? "").trim().toUpperCase() || undefined;
  if (!name || !email || !role) redirect("/admin?error=missing");

  mutateDb((db) => {
    if (db.users.some((u) => u.email === email)) return;
    const actor = db.users.find((u) => u.id === actorId);
    const user: UserRecord = {
      id: `u-${Date.now().toString(36)}`,
      name,
      email,
      role,
      password: "demo",
      institutionId,
      stateCode,
    };
    db.users.push(user);
    if (actor) audit(db, actor, "CREATE_ACCOUNT", `Created ${role} account for ${name} (${email})`);
  });
  redirect("/admin");
}

export async function deleteUserAction(userId: string) {
  const actorId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const target = db.users.find((u) => u.id === userId);
    if (!target || target.id === actorId) return;
    db.users = db.users.filter((u) => u.id !== userId);
    const actor = db.users.find((u) => u.id === actorId);
    if (actor) audit(db, actor, "DELETE_ACCOUNT", `Removed ${target.role} account ${target.email}`);
  });
  redirect("/admin");
}

export async function resetDemoAction() {
  resetDb();
  redirect("/");
}

export async function submitApplicationAction(schemeCode: string, formData: FormData) {
  const db = loadDb();
  const sessionId = (await cookies()).get(COOKIE)?.value;
  const user = db.users.find((u) => u.id === sessionId);
  if (!user) redirect("/");
  const scheme = schemeByCode(schemeCode);
  const facts: Fact[] = scheme.applicationSchema.map((field) => {
    const raw = formData.get(field.id);
    let value: Fact["value"] = raw === null ? null : String(raw);
    if (field.type === "boolean") value = raw === "true" || raw === "on";
    if (field.type === "number" || field.type === "currency") value = raw ? Number(raw) : null;
    return { field: field.id, value, source: "APPLICANT", confidence: 1, verified: true };
  });

  const docs = scheme.requiredDocuments
    .filter((d) => d.mandatory || formData.get(`doc-${d.id}`))
    .map((d) =>
      ingestDocument({
        applicationId: "pending",
        documentType: d.id,
        fileName: `${d.id.toLowerCase()}.pdf`,
      }),
    );

  const eligibility = evaluateEligibility(scheme, facts);
  const findings = consistencyChecks(facts, docs);
  const hitl = routeHitl({
    ocrFloor: docs.length ? Math.min(...docs.map((x) => x.ocrConfidence)) : 1,
    findings,
    missingEvidence: eligibility.outcome === "DEFICIENT",
    institutionPending: scheme.workflow.includes("INSTITUTION_VERIFICATION"),
    policyException: eligibility.outcome === "REVIEW_REQUIRED",
  });

  const id = `${scheme.code.slice(0, 4)}-${Date.now().toString().slice(-6)}`;
  docs.forEach((d) => {
    d.applicationId = id;
  });

  const nextStage: WorkflowStage = scheme.workflow.includes("INSTITUTION_VERIFICATION")
    ? "INSTITUTION_VERIFICATION"
    : scheme.workflow.includes("STATE_VERIFICATION")
      ? "STATE_VERIFICATION"
      : "MOTA_SCRUTINY";

  mutateDb((store) => {
    store.applications.unshift({
      id,
      schemeCode: scheme.code,
      schemeVersion: scheme.version,
      academicYear: scheme.academicYear,
      applicantId: user.id,
      applicantName: String(facts.find((f) => f.field === "fullName")?.value ?? user.name),
      institutionName: String(formData.get("institutionName") ?? "") || undefined,
      stateCode: String(facts.find((f) => f.field === "domicileState")?.value ?? "") || undefined,
      status: nextStage,
      facts,
      documents: docs,
      eligibility,
      hitlLevel: hitl.level,
      hitlReasons: hitl.reasons,
      deficiencies: [],
      timeline: [
        { at: new Date().toISOString(), stage: "SUBMITTED", note: "Submitted by applicant", actor: user.name },
        { at: new Date().toISOString(), stage: nextStage, note: "Routed by scheme workflow", actor: "workflow-engine" },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    audit(store, user, "SUBMIT", `Submitted ${scheme.shortName} application ${id}`, id);
    notify(store, user.id, `${id} submitted`, `Eligibility preview: ${eligibility.outcome}. This is not a final award.`);
    if (nextStage === "INSTITUTION_VERIFICATION") {
      notifyRole(store, "INO", `${id} needs institution verification`, `${user.name}'s ${scheme.shortName} application is waiting on admission/programme confirmation.`);
    } else if (nextStage === "STATE_VERIFICATION") {
      notifyRole(store, "STATE", `${id} needs State/UT verification`, `${user.name}'s ${scheme.shortName} application is waiting on your desk.`);
    } else {
      notifyRole(store, "MOTA", `${id} ready for scrutiny`, `${user.name}'s ${scheme.shortName} application has no institution/state stage and is in your queue.`);
    }
  });
  redirect(`/applicant/applications/${id}`);
}

export async function officerDecisionAction(applicationId: string, decision: "APPROVED" | "REJECTED" | "DEFERRED", note: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    app.authorisedDecision = decision;
    app.officerNote = note;
    app.status = decision === "APPROVED" ? "AUTHORISED_DECISION" : decision === "REJECTED" ? "REJECTED" : app.status;
    app.isAppeal = false;
    app.updatedAt = new Date().toISOString();
    app.timeline.push({ at: app.updatedAt, stage: app.status, note: `${decision}: ${note}`, actor: user.name });
    if (decision === "APPROVED") {
      const scheme = schemeByCode(app.schemeCode);
      const entitlement = computeEntitlement(scheme, app.facts);
      db.awards.unshift({
        id: `awd-${applicationId}`,
        applicationId,
        schemeCode: app.schemeCode,
        status: "SANCTIONED",
        lifecycle: "AWARDED",
        components: entitlement?.breakdown ?? scheme.awardRules.map((r) => r.label),
        milestones: [
          { id: "m-join", label: "Joining / acceptance confirmed by applicant", status: "PENDING" },
          { id: "m-inst", label: "Institution / programme confirmation on record", status: "PENDING" },
          { id: "m-disb", label: "First disbursement acknowledged", status: "PENDING" },
        ],
        createdAt: app.updatedAt,
      });
      app.status = "AWARDED";
      notifyRole(db, "FINANCE", `${applicationId} sanctioned`, `${app.applicantName}'s ${app.schemeCode} award is ready for payment tracking.`);
    }
    audit(db, user, "DECISION", `${decision} ${applicationId}`, applicationId);
    notify(db, app.applicantId, `${applicationId} ${decision.toLowerCase()}`, note || "Authorised officer recorded a decision.");
  });
}

export async function confirmFactAction(applicationId: string, field: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    const fact = app.facts.find((f) => f.field === field);
    if (fact) {
      fact.verified = true;
      fact.source = "OFFICER";
      fact.confidence = 1;
    }
    recomputeApplication(app);
    audit(db, user, "CONFIRM_FACT", field, applicationId);
  });
}

export async function correctFactAction(applicationId: string, field: string, value: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    const fact = app.facts.find((f) => f.field === field);
    const predictedValue = fact ? String(fact.value ?? "") : "missing";
    const predictedSource = fact?.source ?? "APPLICANT";
    const parsed: Fact["value"] = value === "true" ? true : value === "false" ? false : Number.isFinite(Number(value)) && value.trim() !== "" && !Number.isNaN(Number(value)) && /^-?\d/.test(value) ? Number(value) : value;
    if (fact) {
      fact.value = parsed;
      fact.verified = true;
      fact.source = "OFFICER";
      fact.confidence = 1;
    } else {
      app.facts.push({ field, value: parsed, source: "OFFICER", confidence: 1, verified: true });
    }
    recomputeApplication(app);
    app.timeline.push({ at: new Date().toISOString(), stage: app.status, note: `Corrected ${field} to ${value}`, actor: user.name });
    audit(db, user, "CORRECT_FACT", `${field}=${value}`, applicationId);
    if (predictedSource === "OCR" && predictedValue !== value) {
      db.aiFeedback.unshift({
        id: `fb-${Date.now()}`,
        applicationId,
        field,
        predictedValue,
        correctedValue: value,
        officerId: user.id,
        officerName: user.name,
        reason: "Officer correction during scrutiny",
        modelVersion: "field-extractor-v1.8",
        at: new Date().toISOString(),
      });
    }
  });
}

export async function selectiveReverifyAction(applicationId: string, fieldsCsv: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  const fields = fieldsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    for (const field of fields) {
      const fact = app.facts.find((f) => f.field === field);
      if (fact) {
        fact.verified = false;
        fact.confidence = 0.5;
      }
      for (const doc of app.documents) {
        if (field in doc.extracted) {
          doc.ocrConfidence = Math.min(doc.ocrConfidence + 0.05, 0.99);
        }
      }
    }
    recomputeApplication(app);
    app.timeline.push({
      at: new Date().toISOString(),
      stage: app.status,
      note: `Selective re-verification of ${fields.join(", ")} only — other evidence left untouched.`,
      actor: user.name,
    });
    audit(db, user, "SELECTIVE_REVERIFY", fields.join(","), applicationId);
  });
}

export async function raiseAppealAction(applicationId: string, reason: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    app.status = "MOTA_SCRUTINY";
    app.isAppeal = true;
    app.appealReason = reason;
    app.timeline.push({ at: new Date().toISOString(), stage: "MOTA_SCRUTINY", note: `Appeal: ${reason}`, actor: user.name });
    audit(db, user, "APPEAL", reason, applicationId);
    notifyRole(db, "MOTA", `${applicationId} — appeal filed`, `${user.name} appealed the decision: ${reason}`);
  });
}

export async function requestDeficiencyAction(applicationId: string, reason: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    app.returnStage = app.status === "DEFICIENCY" ? app.returnStage : app.status;
    app.status = "DEFICIENCY";
    app.deficiencies.unshift({
      id: `def-${Date.now()}`,
      applicationId,
      reason,
      status: "OPEN",
      createdAt: new Date().toISOString(),
    });
    app.timeline.push({ at: new Date().toISOString(), stage: "DEFICIENCY", note: reason, actor: user.name });
    notify(db, app.applicantId, `Deficiency on ${applicationId}`, reason);
    audit(db, user, "DEFICIENCY", reason, applicationId);
  });
}

export async function resolveDeficiencyAction(applicationId: string) {
  mutateDb((db) => {
    const app = db.applications.find((a) => a.id === applicationId);
    if (!app) return;
    app.deficiencies.forEach((d) => {
      d.status = "RESOLVED";
      d.resolvedAt = new Date().toISOString();
    });
    // Return to whichever desk raised the deficiency (INO / State / MoTA),
    // not always MoTA — a correction the institution asked for should go
    // back to the institution, not skip straight past it.
    const next = app.returnStage ?? "MOTA_SCRUTINY";
    app.status = next;
    app.returnStage = undefined;
    app.timeline.push({ at: new Date().toISOString(), stage: next, note: "Applicant resubmitted after deficiency", actor: app.applicantName });
  });
}

export async function inoVerifyAction(applicationId: string, admit: boolean, note: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    const fact = app.facts.find((f) => f.field === "institutionVerified");
    if (fact) {
      fact.value = admit;
      fact.source = "INSTITUTION";
      fact.verified = true;
    } else {
      app.facts.push({ field: "institutionVerified", value: admit, source: "INSTITUTION", confidence: 1, verified: true });
    }
    const scheme = schemeByCode(app.schemeCode);
    app.eligibility = evaluateEligibility(scheme, app.facts);
    recomputeApplication(app);
    if (!admit) {
      app.returnStage = "INSTITUTION_VERIFICATION";
      app.deficiencies.unshift({
        id: `def-${Date.now()}`,
        applicationId,
        reason: note,
        status: "OPEN",
        createdAt: new Date().toISOString(),
      });
    }
    app.status = admit ? "MOTA_SCRUTINY" : "DEFICIENCY";
    app.timeline.push({ at: new Date().toISOString(), stage: app.status, note, actor: user.name });
    audit(db, user, "INO_VERIFY", note, applicationId);
    if (admit) {
      notifyRole(db, "MOTA", `${applicationId} forwarded by institution`, `${user.name} verified admission/programme details. Ready for scrutiny.`);
    } else {
      notify(db, app.applicantId, `${applicationId} — institution flagged an issue`, note);
    }
  });
}

export async function stateRecommendAction(applicationId: string, note: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    app.status = "AUTHORISED_DECISION";
    app.timeline.push({ at: new Date().toISOString(), stage: "AUTHORISED_DECISION", note, actor: user.name });
    audit(db, user, "STATE_RECOMMEND", note, applicationId);
  });
}

export async function committeeScoreAction(applicationId: string, score: number, note: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const app = db.applications.find((a) => a.id === applicationId);
    if (!user || !app) return;
    app.committeeScore = score;
    app.committeeNote = note;
    app.status = "AUTHORISED_DECISION";
    app.timeline.push({ at: new Date().toISOString(), stage: "COMMITTEE", note: `Score ${score}: ${note}`, actor: user.name });
    audit(db, user, "COMMITTEE", `Score ${score}`, applicationId);
    notifyRole(db, "MOTA", `${applicationId} — committee assessment recorded`, `Score ${score}: ${note}`);
  });
}

export async function runSelectionAction(schemeCode: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const scheme = schemeByCode(schemeCode);
    const eligible = db.applications.filter(
      (a) => a.schemeCode === schemeCode && a.eligibility?.outcome === "ELIGIBLE",
    );
    const run = runSelection(scheme, eligible);
    db.selectionRuns.unshift(run);
    if (user) audit(db, user, "SELECTION_RUN", `${scheme.code} ${run.id} (${eligible.length} eligible)`);
  });
}

export async function financeMarkPaidAction(awardId: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const award = db.awards.find((a) => a.id === awardId);
    if (!award) return;
    award.status = "PAID";
    const milestone = award.milestones.find((m) => m.id === "m-disb");
    if (milestone) {
      milestone.status = "DONE";
      milestone.at = new Date().toISOString();
    }
    notify(db, db.applications.find((a) => a.id === award.applicationId)?.applicantId ?? "", `${award.applicationId} — payment acknowledged`, "PFMS/Mission has acknowledged the first disbursement.");
    if (user) audit(db, user, "PAYMENT_ACK", `Marked ${awardId} paid`, award.applicationId);
  });
}

export async function financeMarkFailedAction(awardId: string, reason: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const award = db.awards.find((a) => a.id === awardId);
    if (!award) return;
    award.status = "FAILED";
    const app = db.applications.find((a) => a.id === award.applicationId);
    if (app) notify(db, app.applicantId, `${award.applicationId} — payment failed`, reason || "PFMS/Mission reported a failed transaction. Bank details may need correction.");
    if (user) audit(db, user, "PAYMENT_FAILED", reason || `Marked ${awardId} failed`, award.applicationId);
  });
}

export async function confirmJoiningAction(awardId: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const award = db.awards.find((a) => a.id === awardId);
    if (!user || !award) return;
    award.lifecycle = "ACTIVE";
    award.joinedAt = new Date().toISOString();
    const milestone = award.milestones.find((m) => m.id === "m-join");
    if (milestone) {
      milestone.status = "DONE";
      milestone.at = award.joinedAt;
    }
    audit(db, user, "CONFIRM_JOINING", `Applicant confirmed joining for ${awardId}`, award.applicationId);
    notifyRole(db, "MOTA", `${award.applicationId} — joining confirmed`, "The applicant has confirmed joining. Award is now active.");
  });
}

export async function verifyMilestoneAction(awardId: string, milestoneId: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const award = db.awards.find((a) => a.id === awardId);
    const milestone = award?.milestones.find((m) => m.id === milestoneId);
    if (!user || !award || !milestone) return;
    milestone.status = "DONE";
    milestone.at = new Date().toISOString();
    audit(db, user, "VERIFY_MILESTONE", milestone.label, award.applicationId);
  });
}

export async function requestRenewalAction(awardId: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const award = db.awards.find((a) => a.id === awardId);
    if (!user || !award) return;
    award.lifecycle = "RENEWAL_REVIEW";
    db.renewals.unshift({
      id: `ren-${Date.now()}`,
      awardId,
      applicationId: award.applicationId,
      requestedAt: new Date().toISOString(),
      status: "PENDING",
    });
    audit(db, user, "REQUEST_RENEWAL", `Renewal requested for ${awardId}`, award.applicationId);
    notifyRole(db, "MOTA", `${award.applicationId} — renewal requested`, "Applicant has requested renewal/continuation for the next cycle.");
  });
}

export async function decideRenewalAction(renewalId: string, decision: "APPROVED" | "DEFICIENT" | "REVIEW", note: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const renewal = db.renewals.find((r) => r.id === renewalId);
    if (!user || !renewal) return;
    renewal.status = decision;
    renewal.note = note;
    renewal.decidedAt = new Date().toISOString();
    const award = db.awards.find((a) => a.id === renewal.awardId);
    if (award) {
      award.lifecycle = decision === "APPROVED" ? "ACTIVE" : decision === "DEFICIENT" ? "RENEWAL_DUE" : "RENEWAL_REVIEW";
      const app = db.applications.find((a) => a.id === award.applicationId);
      if (app) notify(db, app.applicantId, `Renewal ${decision.toLowerCase()} for ${award.applicationId}`, note || "Renewal decision recorded.");
    }
    audit(db, user, "RENEWAL_DECISION", `${decision}: ${note}`, renewal.applicationId);
  });
}

export async function markNotificationsReadAction() {
  const userId = (await cookies()).get(COOKIE)?.value;
  mutateDb((db) => {
    for (const n of db.notifications) if (n.userId === userId) n.read = true;
  });
}

export async function advancePolicyStatusAction(schemeCode: string) {
  const userId = (await cookies()).get(COOKIE)?.value;
  const order: Array<"DRAFT" | "VALIDATED" | "TESTED" | "APPROVED" | "PUBLISHED"> = [
    "DRAFT",
    "VALIDATED",
    "TESTED",
    "APPROVED",
    "PUBLISHED",
  ];
  mutateDb((db) => {
    const user = db.users.find((u) => u.id === userId);
    const current = db.policyStatus[schemeCode] ?? "PUBLISHED";
    const idx = order.indexOf(current);
    const next = order[Math.min(idx + 1, order.length - 1)];
    db.policyStatus[schemeCode] = next;
    if (user) audit(db, user, "POLICY_STATUS", `${schemeCode}: ${current} → ${next}`, undefined);
  });
}
