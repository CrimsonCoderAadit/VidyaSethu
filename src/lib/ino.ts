import { evaluateEligibility } from "@/engine/eligibility";
import { schemeByCode } from "@/schemes/registry";
import { queueApplicantAlert } from "./bot";
import type { ApplicationRecord, Database, UserRecord } from "./models";
import { recomputeApplication } from "./pipeline";

function audit(db: Database, actor: { id: string; name: string }, action: string, detail: string, applicationId?: string) {
  db.audit.unshift({ id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, at: new Date().toISOString(), actorId: actor.id, actorName: actor.name, action, detail, applicationId });
}

function notify(db: Database, userId: string, title: string, body: string) {
  const target = db.users.find((u) => u.id === userId);
  if (target) queueApplicantAlert(db, target, title, body);
  db.notifications.unshift({ id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, userId, title, body, at: new Date().toISOString(), read: false });
}

/** Institution nodal officer confirms or flags an application. Shared by the online desk and offline batch sync. */
export function applyInoDecision(db: Database, user: UserRecord, app: ApplicationRecord, admit: boolean, note: string, via?: string) {
  const applicationId = app.id;
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
  app.timeline.push({ at: new Date().toISOString(), stage: app.status, note: via ? `${note} (${via})` : note, actor: user.name });
  audit(db, user, "INO_VERIFY", note, applicationId);
  if (admit) {
    for (const u of db.users.filter((x) => x.role === "MOTA")) notify(db, u.id, `${applicationId} forwarded by institution`, `${user.name} verified admission/programme details. Ready for scrutiny.`);
  } else {
    notify(db, app.applicantId, `${applicationId} — institution flagged an issue`, note);
  }
}
